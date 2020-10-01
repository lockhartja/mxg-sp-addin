import { ModelLibraryBackingStoreAdapter } from 'breeze-client/adapter-model-library-backing-store';
import { UriBuilderODataAdapter } from 'breeze-client/adapter-uri-builder-odata';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { config } from 'breeze-client';
import { AjaxHttpClientAdapter } from 'breeze-client/adapter-ajax-httpclient';
import { SpDataService } from './breeze-providers/sharepoint-dataservice';
import { DataServiceWebApiAdapter } from 'breeze-client/adapter-data-service-webapi';

@NgModule({
    declarations: [],
    imports: [CommonModule],
    exports: [],
    providers: [],
})
export class DataAccessModule {
    constructor(http: HttpClient) {
        ModelLibraryBackingStoreAdapter.register();
        UriBuilderODataAdapter.register();
        AjaxHttpClientAdapter.register(http);
        SpDataService.register();

        config.initializeAdapterInstance(
            'ajax',
            AjaxHttpClientAdapter.adapterName,
            true
        );

        // config.initializeAdapterInstance(
        //     'dataService',
        //     SpDataService.name,
        //     true
        // );
    }
}
