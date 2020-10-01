import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { XtendedFuseNavService } from '@atypes';
import { RepoFactory } from '@data';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { SharePointUser } from '@models';
import { environment } from 'environments/environment';
import { loadPageContext } from 'sp-rest-proxy/dist/utils/env';
import * as globalNav from '../../app-global-navigation';

@Injectable({ providedIn: 'root' })
export class HomeResolverService implements Resolve<SharePointUser> {
    userContext: SharePointUser = {} as any;

    constructor(private repoFactory: RepoFactory<'SP.Global'>) {}

    async resolve(): Promise<SharePointUser> {
        const repo = this.repoFactory.getRepo('UnitManningPosition');
        const unitData = repo.getAll();
        return this.userContext;
    }
}
