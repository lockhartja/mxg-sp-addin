import { NgModule } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EmServiceProviderFactory } from '@data';
import { MaterialModule } from 'app/material.module';
import { CentralRepositoryService } from 'app/app-central-repository.service';

@NgModule({
    declarations: [],
    imports: [MaterialModule],
    exports: [],
    providers: [],
})
export class CssServiceModule {
    constructor(
        emFactory: EmServiceProviderFactory,
        centralRepo: CentralRepositoryService,
        httpClient: HttpClient
    ) {
        // const config = new EmServiceProviderConfig('SP.Global', []);
        // const mgr = emFactory.createManager(config);
        // const repoFactory = new RepoFactory(mgr, httpClient);
        // centralRepo.registerRepo('SP.Global', repoFactory);
    }
}
