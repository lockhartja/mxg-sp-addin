import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { XtendedFuseNavService } from '@atypes';
import { RepoFactory } from '@data';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { CentralRepositoryService } from 'app/app-central-repository.service';
import { CssServiceModule } from './command-staff-services.module';

@Injectable({
    providedIn: CssServiceModule,
})
export class CssUowService implements Resolve<unknown> {
    navService: XtendedFuseNavService;
    globalRepoFactory: RepoFactory<'SP.Global'>;

    constructor(navService: FuseNavigationService, centralRepo: CentralRepositoryService) {
        this.navService = navService;
        this.globalRepoFactory = centralRepo.getFactory('SP.Global');
    }

    async resolve(): Promise<void> {
        const x = await this.globalRepoFactory.getRepo('UnitDemographic').getAll();
    }
}
