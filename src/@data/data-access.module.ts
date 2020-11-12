import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { EmServiceProviderFactory } from './em-service-factory/emServiceProviderFactory.service';
import { CentralRepositoryService } from 'app/app-central-repository.service';
import { EmServiceProviderConfig } from './em-service-factory/emServiceProviderConfig';
import { RepoFactory } from './repo-managers/repo-factory';
import { TermSet, SpMetadata, SharepointTaxonomy, RootTermStore } from '@models';
import { UnitMember } from '@models/sp-global';
import { UnitMemberIdentity } from '@models/sp-global/unit-member-identity';

@NgModule({
    declarations: [],
    imports: [CommonModule],
    exports: [],
    providers: [],
})
export class DataAccessModule {
    constructor(
        http: HttpClient,
        emFactory: EmServiceProviderFactory,
        centralRepo: CentralRepositoryService
    ) {
        const localGlobalConfig = new EmServiceProviderConfig('Global', [
            SpMetadata,
            SharepointTaxonomy,
            TermSet,
            RootTermStore,
        ]);

        const spGlobalConfig = new EmServiceProviderConfig('SP.Global', [
            UnitMember,
            UnitMemberIdentity,
        ]);

        const localConfigManager = emFactory.createManager(localGlobalConfig);
        const spConfigManager = emFactory.createManager(spGlobalConfig);

        const localRepoFactory = new RepoFactory(localConfigManager, http);
        const spGlobalRepoFactory = new RepoFactory(spConfigManager, http);

        centralRepo.registerRepo('Global', localRepoFactory);
        centralRepo.registerRepo('SP.Global', spGlobalRepoFactory);
    }
}
