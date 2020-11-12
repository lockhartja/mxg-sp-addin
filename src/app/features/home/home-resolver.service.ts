import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { XtendedFuseNavService } from '@atypes';
import { RepoFactory } from '@data';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { environment } from 'environments/environment';
import { loadPageContext } from 'sp-rest-proxy/dist/utils/env';
import * as globalNav from '../../app-global.navigation';

@Injectable({ providedIn: 'root' })
export class HomeResolverService implements Resolve<any> {
    constructor() {}

    async resolve(): Promise<any> {
        // const repo = this.repoFactory.getRepo('UnitManningPosition');
        // const unitData = repo.getAll();
        // return this.userContext;
    }
}
