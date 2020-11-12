import { EntityShortNameByNamespace, SpEntityNamespaces, XtendedEntityMgr } from '@atypes';
import { CoreSharepointRepo } from './core-sharepoint-repo';
import { HttpClient } from '@angular/common/http';

export class RepoFactory<TNameSpace extends SpEntityNamespaces> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    private repoStore = {} as any;

    constructor(public entityManager: XtendedEntityMgr<TNameSpace>, private httpClient: HttpClient) {}

    private initializedRepo<TEntityShortName extends EntityShortNameByNamespace<TNameSpace>>(
        repoName: TEntityShortName
    ): CoreSharepointRepo<TNameSpace, TEntityShortName> {
        // const repoAlias = repoName.charAt(0).toUpperCase() + repoName.slice(1);

        const newRepo = new CoreSharepointRepo(repoName, this.httpClient, this.entityManager);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        this.repoStore[repoName] = newRepo;

        return newRepo;
    }

    getRepo<TEntityShortName extends EntityShortNameByNamespace<TNameSpace>>(
        entityName: TEntityShortName
    ): CoreSharepointRepo<TNameSpace, TEntityShortName> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (this.repoStore[entityName]) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
            return this.repoStore[entityName];
        }
        return this.initializedRepo(entityName);
    }
}
