import { NgModule } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
    EmServiceProviderConfig,
    EmServiceProviderFactory,
    RepoFactory,
} from '@data';
import { MaterialModule } from 'app/material.module';

export function emProviderFactory() {
    const config = new EmServiceProviderConfig('SP.Global', []);

    return (emFactory: EmServiceProviderFactory, httpClient: HttpClient) => {
        const mgr = emFactory.createManager(config);
        return new RepoFactory(mgr, httpClient);
    };
}

@NgModule({
    declarations: [],
    imports: [MaterialModule],
    exports: [],
    providers: [
        {
            provide: RepoFactory,
            useFactory: emProviderFactory(),
            deps: [EmServiceProviderFactory, HttpClient],
        },
    ],
})
export class AdminServicesModule {}
