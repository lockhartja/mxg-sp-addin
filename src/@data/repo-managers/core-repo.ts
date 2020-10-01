import {
    EntityType,
    EntityState,
    EntityQuery,
    FilterQueryOp,
    Predicate,
    AndOrPredicate,
    SaveResult,
} from 'breeze-client';
import * as _m from 'moment';
import { SpBaseEntity } from '@models';
import {
    AllEntityList,
    RawEntity,
    PropertiesNotInType,
    Instantiable,
    GetEntityInNamespace,
    ReturnShortName,
    XtendedEntityType,
    GetEntityTypeFromShortName,
    XtendedEntityMgr,
    DoNotCare,
    CompatibilityFix,
    XtendedEntityQuery,
} from '@atypes';

interface IRepoPredicateCache {
    [index: string]: _m.Moment;
}

interface IRepoPromiseCache {
    [index: string]: Promise<any>;
}

export class CoreRepo<
    TNamespace extends AllEntityList['namespace'],
    TEntityName extends AllEntityList['shortName'] = GetEntityInNamespace<
        TNamespace,
        ReturnShortName
    >,
    TEntity = GetEntityTypeFromShortName<TEntityName>
> {
    protected resourceName: string;
    protected predicateCache: IRepoPredicateCache = {};
    protected promiseCache: IRepoPromiseCache = {};
    entityType: XtendedEntityType;

    constructor(
        entityName: TEntityName & string,
        protected entityManager: XtendedEntityMgr<TNamespace>
    ) {
        this.entityType = entityManager.metadataStore.getAsEntityType(
            entityName
        ) as XtendedEntityType;

        this.resourceName = this.entityType.defaultResourceName;
    }

    async getAll(spQuery: XtendedEntityQuery): Promise<TEntity[]> {
        const freshTimeLimit = 6;

        const cachedTime = this.predicateCache.all;

        const timeSinceLastServerQuery = cachedTime
            ? this.minutesSinceLastServerQuery(cachedTime)
            : freshTimeLimit + 1;

        if (timeSinceLastServerQuery < 5) {
            return this.entityManager.getEntities<CompatibilityFix>(
                this.entityType
            );
        }

        if (this.promiseCache.all) {
            return this.promiseCache.all;
        }

        this.promiseCache.all = new Promise(async (resolve, reject) => {
            try {
                const query = this.baseQuery('all') as XtendedEntityQuery;
                const results = await this.executeQuery(spQuery || query);
                resolve(results);
            } catch (error) {
                console.log(error);
                reject(error);
            } finally {
                this.promiseCache.all = undefined;
            }
        });
        return this.promiseCache.all;
    }

    baseQuery(qName?: string, toBaseType = true): XtendedEntityQuery {
        let query = EntityQuery.from(this.resourceName) as XtendedEntityQuery;

        if (qName) {
            query.name = qName;
        }

        query = query.select(
            this.entityType.custom.defaultSelect
        ) as XtendedEntityQuery;

        if (!toBaseType) {
            return query;
        }
        query = query.toType(this.entityType) as XtendedEntityQuery;
        query.fromEntityType = this.entityType;
        return query;
    }

    create(options?: RawEntity<TEntity>): TEntity {
        return this.entityManager.createEntity(
            this.entityType.shortName,
            options
        ) as DoNotCare;
    }

    protected async executeQuery(
        query: XtendedEntityQuery
    ): Promise<TEntity[]> {
        const dataQueryResult = await this.entityManager.executeQuery(query);

        if (query.name) {
            this.predicateCache[query.name] = _m();
        }
        return dataQueryResult.results;
    }

    protected executeCacheQuery(query: EntityQuery): TEntity[] {
        const localCache = this.entityManager.executeQueryLocally(query);
        return localCache;
    }

    isEntityCached(id: number): boolean {
        return this.entityManager
            .getEntities(this.entityType)
            .some((et) => et.id === id);
    }

    makePredicate(
        property: PropertiesNotInType<TEntity, Function>,
        condition: string | number,
        filter = FilterQueryOp.Equals
    ): Predicate {
        return Predicate.create(property, filter, condition);
    }

    // makeAnyPredicate<T>(property: keyof T, condition: string | number, filter = FilterQueryOp.Equals): Predicate {
    //   return this.makeAnyPredicate
    // }

    private minutesSinceLastServerQuery(cachedTime: _m.Moment) {
        return _m.duration(cachedTime.diff(_m())).abs().asMinutes();
    }

    queryFrom<TEntity extends AllEntityList>(
        entity: Instantiable<TEntity>
    ): XtendedEntityQuery {
        const entityName = entity.name;
        const eType = this.entityManager.metadataStore.getEntityType(
            entityName
        ) as EntityType;

        const query = EntityQuery.from(eType.defaultResourceName)
            .toType(eType)
            .select((eType.custom as any).defaultSelect);

        return query as XtendedEntityQuery;
    }

    async withId(key: number): Promise<TEntity> {
        const result = await this.entityManager.fetchEntityByKey(
            this.entityType.shortName,
            key,
            true
        );
        return result.entity as CompatibilityFix;
    }

    async where(
        predicate: Predicate | AndOrPredicate,
        queryName: string
    ): Promise<TEntity[]> {
        const freshTimeLimit = 6;

        const cachedTime = this.predicateCache[queryName];

        const timeSinceLastServerQuery = cachedTime
            ? this.minutesSinceLastServerQuery(cachedTime)
            : freshTimeLimit + 1;

        let query = this.baseQuery(queryName).where(predicate);

        query = predicate instanceof AndOrPredicate ? query.select('*') : query;

        if (timeSinceLastServerQuery < 5) {
            return Promise.resolve(this.executeCacheQuery(query));
        }

        const results = await this.executeQuery(query as XtendedEntityQuery);

        return results;
    }

    whereInCache(queryName: string, predicate?: Predicate): TEntity[] {
        if (!predicate) {
            return this.entityManager.getEntities(this.entityType, [
                EntityState.Unchanged,
                EntityState.Added,
                EntityState.Modified,
            ]) as CompatibilityFix;
        }
        const query = this.baseQuery().where(predicate);
        return this.executeCacheQuery(query);
    }

    async saveChangesForEntityType(): Promise<SaveResult> {
        const entities = (this.entityManager.getChanges(
            this.entityType
        ) as any) as SpBaseEntity[];
        if (!entities.length) {
            return Promise.resolve(undefined);
        }
        entities.forEach((et) => {
            if (et.isSoftDeleted) {
                et.entityAspect.setDeleted();
            }
        });
        this.entityManager.isSaving.next(true);
        const results = await this.entityManager
            .saveChanges(entities as any)
            .finally(() => {
                this.entityManager.isSaving.next(false);
            });
        return results;
    }
}
