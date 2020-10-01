import { EntityManager } from 'breeze-client';
import {
    GlobalRepoManagerExtended,
    SharepointEntityList,
    SelectedEntityKind,
    GetEntityType,
    GetSpEntityType,
    GetEntityInNamespace,
    AllEntityList,
    Instantiable,
    RepoReturn,
    XtendedEntityMgr,
    ReturnType,
    ReturnShortName,
    ToComplex,
} from '@atypes';
import { CoreSharepointRepo } from './core-sharepoint-repo';
import { CoreRepo } from './core-repo';
import { HttpClient } from '@angular/common/http';
import { SharepointEntity, SpBaseEntity } from '@models';

export class RepoFactory<TNameSpace extends AllEntityList['namespace']> {
    static repoStore: { [index: string]: ToComplex } = {};

    constructor(
        public entityManager: XtendedEntityMgr<TNameSpace>,
        private httpClient: HttpClient
    ) {}

    private initializedRepo<
        TEntity extends GetEntityInNamespace<TNameSpace, ReturnShortName>
    >(repoName: TEntity, useSpRepo = true) {
        let newRepo:
            | CoreRepo<TNameSpace, TEntity>
            | CoreSharepointRepo<TNameSpace, TEntity>;
        const repoAlias = repoName.charAt(0).toUpperCase() + repoName.slice(1);

        if (!useSpRepo) {
            newRepo = new CoreRepo(repoAlias as any, this.entityManager);
        } else {
            newRepo = new CoreSharepointRepo(
                repoAlias as any,
                this.httpClient,
                this.entityManager
            );
        }
        RepoFactory.repoStore[repoName] = newRepo;
        return newRepo;
    }

    getRepo<
        TEntitiesInNameSpace extends GetEntityInNamespace<
            TNameSpace,
            ReturnShortName
        >
    >(entityName: TEntitiesInNameSpace, useSpRepo = true) {
        if (RepoFactory.repoStore[entityName]) {
            return RepoFactory.repoStore[entityName] as RepoReturn<
                TEntitiesInNameSpace,
                TNameSpace
            >;
        }

        return this.initializedRepo(entityName, useSpRepo) as RepoReturn<
            TEntitiesInNameSpace,
            TNameSpace
        >;
    }
}
