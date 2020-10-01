import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'app/material.module';
import {
    EmServiceProviderConfig,
    EmServiceProviderFactory,
    RepoFactory,
} from '@data';
import { HttpClient } from '@angular/common/http';
import { ModuleEmFactory } from '@atypes';
import { FuseNavigation } from '@fuse/types';

export const emProviderFactory: ModuleEmFactory = () => {
    const emConfig = new EmServiceProviderConfig('SP.Global', [], '');
    return (emFactory, httpClient) => {
        const entityMgr = emFactory.createManager(emConfig);
        return new RepoFactory(entityMgr, httpClient);
    };
};

@NgModule({
    declarations: [],
    imports: [CommonModule, MaterialModule],
    exports: [],
    providers: [
        {
            provide: RepoFactory,
            useFactory: emProviderFactory(),
            deps: [EmServiceProviderFactory, HttpClient],
        },
    ],
})
export class MetricsModule {}
