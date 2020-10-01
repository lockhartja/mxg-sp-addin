import { CoreRepo } from './core-repo';
import { SpBaseEntity } from '@models';
import {
    SharepointEntityList,
    EntityChildrenKind,
    Instantiable,
    AllEntityList,
    GetEntityInNamespace,
    ReturnShortName,
    GetEntityTypeFromShortName,
    XtendedEntityMgr,
    GetEntityInSpNamespace,
    CompatibilityFix,
    XtendedEntityQuery,
} from '@atypes';
import {
    Predicate,
    AndOrPredicate,
    EntityQuery,
    FilterQueryOp,
    QueryResult,
} from 'breeze-client';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export type SpChoiceCache<T> = {
    [index in keyof T]: {
        values: string[];
        editUri: string;
        type: string;
        defaultValue: string;
    };
};

export type SpChoiceResult = [string, string[]];

// export type ResolveEntity<
//     TNamespace extends SharepointEntityList['namespace']
// > = AllEntityList extends infer E
//     ? E extends AllEntityList
//         ? E['shortname'] extends TNamespace
//             ? SpBaseEntity extends infer U
//                 ? E extends U
//                     ? E
//                 :never
//             : never
//         : never
//     : never
//  : never ;

export class CoreSharepointRepo<
    TNamespace extends SharepointEntityList['namespace'],
    TEntityName extends SharepointEntityList['shortName'] = GetEntityInSpNamespace<
        TNamespace,
        ReturnShortName
    >,
    TEntity = GetEntityTypeFromShortName<TEntityName>
> extends CoreRepo<TNamespace, TEntityName, TEntity> {
    private commonHttpHeaders = {
        DataServiceVersion: '3.0',
        MaxDataServiceVersion: '3.0',
        Accept: 'application/json;odata=nometadata',
        'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': '',
    };

    private spChoiceFieldCache: SpChoiceCache<TEntity> = {} as any;

    constructor(
        entityName: TEntityName & string,
        private httpClient: HttpClient,
        protected entityManager: XtendedEntityMgr<TNamespace>
    ) {
        super(entityName, entityManager);
    }

    getAll(): Promise<TEntity[]> {
        const query = this.baseQuery('all');
        query.name = 'all';
        query.getAllWithMax = query.getAllWithMax || 4000;
        query.useSpBatchQuery = query.useSpBatchQuery || true;
        return super.executeQuery(query) as CompatibilityFix;
    }

    async updateSpChoiceFields(
        fieldName: keyof TEntity,
        values: string[]
    ): Promise<string[]> {
        const cachedSpChoiceData = this.spChoiceFieldCache[fieldName];

        const digest = await this.entityManager.dataService.getRequestDigest();

        const payload = {
            __metadata: { type: 'SP.FieldChoice' },
            Choices: {
                results: values,
            },
        };

        const updateHeaders = {
            'X-HTTP-METHOD': 'MERGE',
            'IF-MATCH': '*',
        };

        this.commonHttpHeaders['X-RequestDigest'] = digest;

        const requestHeaders = new HttpHeaders(
            Object.assign(updateHeaders, this.commonHttpHeaders)
        );

        const response = await this.httpClient
            .post(cachedSpChoiceData.editUri, payload, {
                headers: requestHeaders,
            })
            .toPromise();

        cachedSpChoiceData.values = values;
        return values;
    }

    spChoiceFields(
        fieldName: keyof TEntity,
        onlyCached?: boolean
    ): SpChoiceResult;

    spChoiceFields(
        fieldName: keyof TEntity,
        onlyCached?: boolean
    ): Promise<SpChoiceResult> | SpChoiceResult {
        let cached = this.spChoiceFieldCache[fieldName];

        if (onlyCached || cached) {
            if (!cached) {
                throw new Error(
                    'Cached data was demanded but not available on the client!'
                );
            }
            return [cached.defaultValue, cached.values];
        }

        const defaultResourceName = this.entityType.defaultResourceName;

        const fieldsResourceName = defaultResourceName.replace(
            '/items',
            '/fields'
        );

        const dp = this.entityType.dataProperties.find(
            (prop) => prop.name === fieldName
        );

        if (!dp) {
            throw new Error('Cannot find data property on entity type');
        }

        const predicate = Predicate.create(
            'EntityPropertyName',
            FilterQueryOp.Equals,
            dp.nameOnServer
        );

        const query = EntityQuery.from(fieldsResourceName)
            .where(predicate)
            .noTracking();

        let response: QueryResult;

        return (async () => {
            response = await this.entityManager.executeQuery(query);
            const spChoiceFieldData = response.results[0];

            cached = {
                values: spChoiceFieldData.Choices.results,
                editUri: spChoiceFieldData.__metadata.edit,
                type: spChoiceFieldData.__metadata.type,
                defaultValue: spChoiceFieldData.DefaultValue,
            };

            this.spChoiceFieldCache[fieldName as any] = cached;

            return [cached.defaultValue, cached.values] as SpChoiceResult;
        })();
    }

    queryFromSp<TEntity extends SharepointEntityList>(
        entity: Instantiable<TEntity>
    ): EntityQuery {
        return this.queryFrom(entity);
    }

    async where(predicate: Predicate | AndOrPredicate): Promise<TEntity[]> {
        const query = this.baseQuery().where(predicate) as XtendedEntityQuery;

        // query = predicate instanceof AndOrPredicate ? query.select('*') : query;

        query.useSpBatchQuery = true;

        const results = await this.executeQuery(query);

        return results as CompatibilityFix;
    }

    async whereWithChildren<
        TChild extends EntityChildrenKind<TEntity & SpBaseEntity>
    >(
        predicate: Predicate,
        childRepoService: CoreSharepointRepo<TNamespace>,
        childLookupKey: TChild
    ): Promise<{ parent: TEntity[]; children: TChild[] }> {
        const parent = ((await this.where(predicate)) as any) as SpBaseEntity[];

        const pIds = parent.map((et) => et.id).sort() as string[];

        const childPreds: Predicate[] = [];

        pIds.forEach((id) => {
            childPreds.push(
                childRepoService.makePredicate(childLookupKey as any, id)
            );
        });

        const cPredicate = Predicate.or(childPreds);

        const children = await childRepoService.where(cPredicate);

        return { parent, children } as any;
    }
}
