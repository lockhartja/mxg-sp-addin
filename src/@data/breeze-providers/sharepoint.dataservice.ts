import { config, AbstractDataServiceAdapter, SaveResult } from 'breeze-client';
import { ChangeRequestInterceptorCtor } from 'breeze-client/src/interface-registry';
import {
    XtendedMappingCtx,
    XtendedSaveContext,
    XtendedSaveBundle,
    XtendedQueryResult,
    XtendedEntityMgr,
} from '@atypes';
import { Injectable, Injector } from '@angular/core';
import { SharePointQueryService } from './sharepoint-query.service';
import { SaveBundleBuilder } from '@models/utility/save-bundle-builder';
import { SharePointSaveService } from './sharepoint-save.datacontext';
import { SpJsonResultsAdapterService } from './sp-jra.service';

class StartUp {
    constructor() {
        return SpDataService.injector.get(SpDataService);
    }
}

@Injectable({ providedIn: 'root' })
export class SpDataService extends AbstractDataServiceAdapter {
    static injector: Injector;

    name = 'spDataService';

    changeRequestInterceptor: ChangeRequestInterceptorCtor;

    constructor(
        private queryService: SharePointQueryService,
        private saveService: SharePointSaveService,
        public jsonResultsAdapter: SpJsonResultsAdapterService
    ) {
        super();
    }

    static register(): void {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config.registerAdapter('dataService', StartUp as any);
        config.initializeAdapterInstance('dataService', 'spDataService', true);
    }

    executeQuery(mappingContext: XtendedMappingCtx): Promise<XtendedQueryResult> {
        /**
         * Breezejs creates a new instance of the Dataservice containing only known
         * properties...all custom properties are stripped...so we overwrite the new
         * dataservice with the original custom created during the entityManager initiation
         * phase see breezeClient.js line ~1677
         */
        mappingContext.dataService.xtendedOptions = mappingContext.entityManager.dataService.xtendedOptions;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.queryService.processQuery(mappingContext);
    }

    fetchMetadata(): Promise<void> {
        throw new Error('Not Implemented For Sharepoint API -- MAKE YOUR OWN!');
    }

    saveChanges(saveContext: XtendedSaveContext, saveBundle: XtendedSaveBundle): Promise<SaveResult> {
        //see the entityQuery rationale for this line.
        saveContext.dataService.xtendedOptions = (saveContext.entityManager as XtendedEntityMgr<
            never
        >).dataService.xtendedOptions;

        const builtBundle = new SaveBundleBuilder(saveContext, saveBundle, this.jsonResultsAdapter);

        return this.saveService.processSave(builtBundle);
    }
}
