import { SpEntityBase } from '@models';
import {
    Instantiable,
    XtendedEntityMgr,
    XtendedEntityQuery,
    SpChoiceField,
    XtendedEntityType,
    RawEntity,
    PropertiesNotInType,
    SpEntityNamespaces,
    EntityShortNameByNamespace,
    EntityTypeByShortName,
    SpChoiceCache,
    EntityContainsQuery,
} from '@atypes';
import {
    Predicate,
    AndOrPredicate,
    EntityQuery,
    FilterQueryOp,
    SaveResult,
    EntityState,
    QueryResult,
} from 'breeze-client';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { differenceInMinutes } from 'date-fns';
import { CamlQueryBuilder } from '@models/utility/caml-query-builder';
import _ from 'lodash';
import { EmDataSource } from '@data/em-service-factory/emDataSource';
import { emProviderFactory } from 'app/features/admin/admin-services.module';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { BehaviorSubject } from 'rxjs';

interface IQueryAll {
    predicate: 'all';
}
export class CoreSharepointRepo<
    TNamespace extends SpEntityNamespaces,
    TEntityShortName extends EntityShortNameByNamespace<TNamespace>,
    TEntity extends EntityTypeByShortName<TEntityShortName> = EntityTypeByShortName<
        TEntityShortName
    >
> {
    entityType: XtendedEntityType;

    private commonHttpHeaders = {
        DataServiceVersion: '3.0',
        MaxDataServiceVersion: '3.0',
        Accept: 'application/json;odata=noMetadata',
        'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': '',
    };

    private predicateCache: WeakMap<Predicate | AndOrPredicate | IQueryAll, Date> = new WeakMap();

    private queriedAll: IQueryAll = {
        predicate: 'all',
    };
    private resourceName: string;

    private spChoiceFieldCache: SpChoiceCache<TEntity> = {} as SpChoiceCache<TEntity>;

    constructor(
        private entityName: TEntityShortName,
        private httpClient: HttpClient,
        protected entityManager: XtendedEntityMgr<TNamespace>
    ) {
        this.entityType = entityManager.metadataStore.getAsEntityType(
            entityName
        ) as XtendedEntityType;

        this.resourceName = this.entityType.defaultResourceName;
    }

    baseQuery(url?: string, toBaseType = true): XtendedEntityQuery {
        let query = EntityQuery.from(url || this.resourceName) as XtendedEntityQuery;

        if (!url) {
            query = query.select(this.entityType.custom.defaultSelect) as XtendedEntityQuery;
        }

        if (toBaseType) {
            query = query.toType(this.entityType) as XtendedEntityQuery;
        }

        /*
         * Breeze EntityQuery methods seems to clone query, make sure our custom
         * properties are the last to be added.
         */
        query.xtendedOptions = {};

        query.fromEntityType = this.entityType;

        return query;
    }

    createEntity(options?: Partial<RawEntity<TEntity>>, state = EntityState.Added): TEntity {
        return this.entityManager.createEntity(
            this.entityType.shortName,
            options,
            state
        ) as TEntity;
    }

    connectDataSource(
        paginator?: MatPaginator,
        sorter?: MatSort,
        dataFilter?: BehaviorSubject<
            [
                searchProps: Array<keyof RawEntity<EntityTypeByShortName<TEntityShortName>>>,
                searchValue: string
            ]
        >
    ): EmDataSource<TNamespace, TEntityShortName> {
        return this.entityManager.entityDataSource(this.entityName, paginator, sorter, dataFilter);
    }

    async getAll(): Promise<TEntity[]> {
        if (
            this.predicateCache.has(this.queriedAll) &&
            differenceInMinutes(new Date(), this.predicateCache.get(this.queriedAll)) < 6
        ) {
            return this.entityManager.getEntities(this.entityType) as TEntity[];
        }

        const query = this.baseQuery();
        query.xtendedOptions.getAllWithMax = 4000;
        const results = await this.executeQuery(query);

        if (!results.length) {
            return results;
        }

        this.predicateCache.set(this.queriedAll, new Date());

        return results;
    }

    getAllCached(): TEntity[] {
        return this.entityManager.getEntities(this.entityType) as TEntity[];
    }

    isEntityCached(property: PropertiesNotInType<TEntity, () => unknown>, value: unknown): boolean {
        return this.entityManager
            .getEntities(this.entityType)
            .some((et: TEntity) => et[property] === value);
    }

    makePredicate(
        property: PropertiesNotInType<TEntity, () => unknown>,
        condition: string | number,
        filter = FilterQueryOp.Equals
    ): Predicate {
        return Predicate.create(property, filter, condition);
    }

    async updateSpChoiceFields(
        fieldName: keyof TEntity,
        values: string[],
        requestDigest: string
    ): Promise<string[]> {
        const cachedSpChoiceData = this.spChoiceFieldCache[fieldName];

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

        this.commonHttpHeaders['X-RequestDigest'] = requestDigest;

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

    // spChoiceFields(
    //     fieldName: keyof TEntity,
    //     onlyCached?: boolean
    // ): SpChoiceField;

    async spChoiceFields(
        fieldName: keyof TEntity,
        onlyCached?: boolean
    ): Promise<[string, string[]]> {
        let cached = this.spChoiceFieldCache[fieldName];

        if (onlyCached || cached) {
            if (!cached) {
                throw new Error('Cached data was demanded but not available on the client!');
            }
            return [cached.defaultValue, cached.values];
        }

        const defaultResourceName = this.entityType.defaultResourceName;

        const fieldsResourceName = defaultResourceName.replace('/items', '/fields');

        const dp = this.entityType.dataProperties.find((prop) => prop.name === fieldName);

        if (!dp) {
            throw new Error('Cannot find data property on entity type');
        }

        const predicate = Predicate.create(
            'EntityPropertyName',
            FilterQueryOp.Equals,
            dp.nameOnServer
        );

        const query = EntityQuery.from(fieldsResourceName).where(predicate).noTracking();

        const response = await this.entityManager.executeQuery(query);

        const spChoiceFieldData = response.results[0] as SpChoiceField;

        cached = {
            values: spChoiceFieldData.Choices.results,
            editUri: spChoiceFieldData.__metadata.edit,
            type: spChoiceFieldData.__metadata.type,
            defaultValue: spChoiceFieldData.DefaultValue,
        };

        this.spChoiceFieldCache[fieldName] = cached;

        return [cached.defaultValue, cached.values];
    }

    queryFrom(entity: Instantiable<TEntity>): XtendedEntityQuery {
        const entityName = entity.name;
        const eType = this.entityManager.metadataStore.getAsEntityType(
            entityName
        ) as XtendedEntityType;

        const query = EntityQuery.from(eType.defaultResourceName)
            .toType(eType)
            .select(eType.custom.defaultSelect);
        query.dataService = this.entityManager.dataService;
        return query as XtendedEntityQuery;
    }

    queryFromSp(entity: Instantiable<TEntity>): EntityQuery {
        return this.queryFrom(entity);
    }

    async saveChangesForEntityType(): Promise<SaveResult | unknown> {
        const entities = (this.entityManager.getChanges(
            this.entityType
        ) as unknown) as SpEntityBase[];
        if (!entities.length) {
            return Promise.resolve(undefined);
        }
        entities.forEach((et) => {
            if (et.isSoftDeleted) {
                et.entityAspect.setDeleted();
            }
        });
        this.entityManager.isSaving.next(true);
        const results = await this.entityManager.saveChanges(entities).finally(() => {
            this.entityManager.isSaving.next(false);
        });
        return results;
    }

    // async where(predicate: Predicate | AndOrPredicate): Promise<TEntity[]> {
    //     const query = this.baseQuery().where(predicate) as XtendedEntityQuery;

    //     // query = predicate instanceof AndOrPredicate ? query.select('*') : query;

    //     query.useSpBatchQuery = true;

    //     const results = await this.executeQuery(query);

    //     return results;
    // }

    /**
     * Executes a query with a given where clause, will cache the predicate for a maximum of 6 minutes.
     * Caller will need to cache the predicate to ensure equality or cache will not work.
     * Optionally, the caller can handle caching internally and pass false as the second parameter.
     * @param predicate
     * @param cacheQuery
     */
    async where(predicate: Predicate | AndOrPredicate, cacheQuery = true): Promise<TEntity[]> {
        if (
            cacheQuery &&
            this.predicateCache.has(predicate) &&
            differenceInMinutes(new Date(), this.predicateCache.get(this.queriedAll)) < 6
        ) {
            return this.entityManager.getEntities(this.entityType) as TEntity[];
        }

        const query = this.baseQuery();

        query.wherePredicate = predicate;

        if (predicate instanceof AndOrPredicate) {
            query.selectClause = query.select('*').selectClause;
        }

        const results = await this.executeQuery(query);

        if (!results.length || !cacheQuery) {
            return results;
        }

        this.predicateCache.set(predicate, new Date());

        return results;
    }

    whereInCache(predicate?: Predicate): TEntity[] {
        if (!predicate) {
            return (this.entityManager.getEntities(this.entityType, [
                EntityState.Unchanged,
                EntityState.Added,
                EntityState.Modified,
            ]) as unknown) as TEntity[];
        }
        const query = this.baseQuery().where(predicate);
        return this.executeCacheQuery(query);
    }

    async whereInList(list: EntityContainsQuery<TEntity>[]): Promise<TEntity[]> {
        const camlQuery = new CamlQueryBuilder(this.entityType);

        const promisesToResolve: Array<() => Promise<QueryResult>> = [];

        list.forEach((listItem: EntityContainsQuery<TEntity>) => {
            const itemKey = Object.keys(listItem)[0];

            const listValues = listItem[itemKey] as Array<string | number>;

            camlQuery.addViewFields().openQuery().openWhere().openIn(itemKey).openValues();

            listValues.forEach((value, index) => {
                const recordCount = index + 1;
                camlQuery.addValue(value);

                /**
                 * SharePoint has a hard limit of 500 value items per In operator.
                 * Limit the list stack to multiples of 450
                 */
                if (recordCount % 450 === 0) {
                    //At limit close the query and restart another one
                    camlQuery.closeValues().closeIn().closeWhere().closeQuery();

                    /*
                     * Need to capture the query string at it's current point to provide
                     * later in the function call to execute query.
                     */
                    const queryString = camlQuery.queryString;

                    promisesToResolve.push(() => this.executeCamlQuery('getItems', queryString));

                    camlQuery.reset();

                    camlQuery.addViewFields().openQuery().openWhere().openIn(itemKey).openValues();
                }
            });

            camlQuery.closeValues().closeIn().closeWhere().closeQuery();

            const queryString = camlQuery.queryString;

            promisesToResolve.push(() => this.executeCamlQuery('getItems', queryString));

            camlQuery.reset();
        });

        const response = await Promise.all(promisesToResolve.map((camlPromise) => camlPromise()));

        const results = response.map((r) => r.results as TEntity[]);

        return _.flatMap(results, (x) => x);
    }

    // async whereWithChildren<TChild extends EntityChildrenKind<TEntity & SpEntityBase>>(
    //     predicate: Predicate,
    //     childRepoService: CoreSharepointRepo<TNamespace, TEntityName, TEntity>,
    //     childLookupKey: TChild
    // ): Promise<{ parent: TEntity[]; children: TChild[] }> {
    //     const parent = await this.where(predicate, 'unknown');

    //     // eslint-disable-next-line
    //     const pIds = parent.map((et: any) => et.id).sort() as string[];

    //     const childPreds: Predicate[] = [];

    //     pIds.forEach((id) => {
    //         // eslint-disable-next-line
    //         childPreds.push(childRepoService.makePredicate(childLookupKey as any, id));
    //     });

    //     const cPredicate = Predicate.or(childPreds);

    //     const children = (await childRepoService.where(cPredicate, 'unknown')) as TChild[];

    //     return { parent, children };
    // }

    async withId(key: number): Promise<TEntity> {
        const result = await this.entityManager.fetchEntityByKey(
            this.entityType.shortName,
            key,
            true
        );
        return (result.entity as unknown) as TEntity;
    }

    private preserveOptions(
        query: XtendedEntityQuery,
        cloneAction: () => EntityQuery
    ): XtendedEntityQuery {
        const customOptions = query.xtendedOptions;
        query = cloneAction.call(cloneAction) as XtendedEntityQuery;
        query.xtendedOptions = customOptions;
        return query;
    }

    private executeCacheQuery(query: EntityQuery): TEntity[] {
        const localCache = this.entityManager.executeQueryLocally(query);
        return (localCache as unknown) as TEntity[];
    }

    private async executeCamlQuery(endpoint: string, queryString: string): Promise<QueryResult> {
        const queryResourceName = this.resourceName.replace('/items', `/${endpoint}`);

        const query = this.baseQuery(queryResourceName);

        query.xtendedOptions.isCamlQuery = true;

        query.xtendedOptions.postData = queryString;

        return this.entityManager.executeQuery(query);
    }

    private async executeQuery(query: XtendedEntityQuery): Promise<TEntity[]> {
        const dataQueryResult = await this.entityManager.executeQuery(query);
        return dataQueryResult.results as TEntity[];
    }
}
