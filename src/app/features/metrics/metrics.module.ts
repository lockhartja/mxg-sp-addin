import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'app/material.module';
import { EmServiceProviderConfig, EmServiceProviderFactory, RepoFactory } from '@data';
import { HttpClient } from '@angular/common/http';
import { FuseNavigation } from '@fuse/types';

@NgModule({
    declarations: [],
    imports: [CommonModule, MaterialModule],
    exports: [],
})
export class MetricsModule {}
