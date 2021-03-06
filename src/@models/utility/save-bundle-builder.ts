import {
    IBatchInternalRequest,
    XtendedEntity,
    XtendedSaveBundle,
    XtendedSaveContext,
    XtendedSaveResult,
} from '@atypes';
import { SpJsonResultsAdapterService } from '@data/breeze-providers/sp-jra.service';
import { SpListEntityBase } from '@models/abstract';
import { AutoGeneratedKeyType, DataProperty } from 'breeze-client';

export class SaveBundleBuilder {
    mode: 'single' | 'batch';
    isLargeBundle = false;
    status: 'pass' | 'fail';
    requestConfigs: IBatchInternalRequest[] = [];
    saveResult: XtendedSaveResult;

    private entities: XtendedEntity[];

    constructor(
        public saveContext: XtendedSaveContext,
        public saveBundle: XtendedSaveBundle,
        private spJra: SpJsonResultsAdapterService
    ) {
        this.mode = saveBundle.entities.length === 1 ? 'single' : 'batch';
        this.isLargeBundle = saveBundle.entities.length > 150;
        this.entities = saveBundle.entities as XtendedEntity[];
        this.initiateBundle().validateResourceName().prepCreations().prepUpdates().prepDeletes();
    }

    resolveBundle(rBundleConfig: { contentId: string; statusCode: number; data: unknown }[]): this {
        rBundleConfig
            .map((config) => {
                if (config.statusCode >= 400) {
                    return;
                }
                return config;
            })
            .forEach((config) => {
                const rawEntity = this.spJra.extractSaveResults(config.data as string) as SpListEntityBase;
                const status = config.statusCode < 400 ? 'success' : 'fail';
                const targetEntity = this.entities.find((entity) => entity.contentId === config.contentId);
                targetEntity.resolveResponse(this.saveResult, status, rawEntity);
            });
        return this;
    }

    private initiateBundle(): this {
        this.saveResult = {
            entities: [],
            entitiesWithErrors: [],
            keyMappings: [],
            deletedKeys: [],
        };
        return this;
    }

    private initRequestConfig(entity: XtendedEntity): IBatchInternalRequest {
        const { entityManager: em, dataService: ds } = this.saveContext;

        const rawEntity = em.helper.unwrapInstance(entity, this.spJra.transformValue) as SpListEntityBase;

        const headers = Object.assign({}, this.spJra.defaultHeaders);
        headers['Content-Id'] = `${entity.contentId}`;
        headers['Content-Type'] = 'application/json;odata=minimalMetadata';

        const config = {} as IBatchInternalRequest;
        config.internalUri = ds.qualifyUrl(entity.entityType.defaultResourceName);
        config.contentId = entity.contentId;
        config.data = rawEntity;

        return config;
    }

    // private markContentId(): this {
    //     this.entities.forEach((entity, index) => (entity.contentId = index + 1));
    //     return this;
    // }

    private prepCreations(): this {
        const entities = this.entities.filter((e) => e.entityAspect.entityState.isAdded());

        entities
            .filter((entity) => entity.entityType.autoGeneratedKeyType === AutoGeneratedKeyType.Identity)
            .forEach((entity) => {
                entity.resolveResponse = this.resolveCreate.bind(entity, this.saveResult) as () => void;
            });

        const configs = entities.map((entity) => {
            const config = this.initRequestConfig(entity);

            const rawEntity = config.data as XtendedEntity;

            rawEntity.__metadata = {
                type: this.spJra.clientTypeNameToServer(entity.shortName as string),
            };

            config.method = 'POST';

            return config;
        });

        this.requestConfigs = this.requestConfigs.concat(...configs);

        return this;
    }

    private prepDeletes(): this {
        const entities = this.entities.filter((e) => e.entityAspect.entityState.isDeleted());

        const configs = entities.map((entity) => {
            entity.resolveResponse = this.resolveDelete.bind(entity, this.saveResult) as () => void;
            const config = this.initRequestConfig(entity);
            config.headers['If-Match'] = '*';
            config.method = 'DELETE';
            const rawEntity = config.data as XtendedEntity;
            config.internalUri = rawEntity.__metadata.uri;
            return config;
        });

        this.requestConfigs = this.requestConfigs.concat(...configs);
        return this;
    }

    private prepUpdates(): this {
        const entities = this.entities.filter((e) => e.entityAspect.entityState.isModified());

        const { entityManager: em } = this.saveContext;

        const configs = entities.map((entity) => {
            entity.resolveResponse = this.resolveUpdate.bind(entity, this.saveResult) as () => void;

            const config = this.initRequestConfig(entity);
            config.headers['If-Match'] = '*';
            config.method = 'MERGE';
            config.data = em.helper.unwrapChangedValues(entity, em.metadataStore, this.spJra.normalizeSaveValue);

            const rawEntity = config.data as XtendedEntity;

            rawEntity.__metadata = {
                type: this.spJra.clientTypeNameToServer(entity.shortName as string),
            };

            return config;
        });

        this.requestConfigs = this.requestConfigs.concat(...configs);

        return this;
    }

    private resolveCreate(
        this: SpListEntityBase,
        saveResult: XtendedSaveResult,
        status: 'success' | 'fail',
        rawEntity?: SpListEntityBase
    ): void {
        const etKey = this.entityAspect.getKey();

        saveResult.keyMappings.push({
            entityTypeName: this.shortName as string,
            tempValue: etKey.values,
            realValue: this.entityType.getEntityKeyFromRawEntity(rawEntity, DataProperty.getRawValueFromServer),
        });

        saveResult.entities.push(rawEntity);
    }

    private resolveDelete(this: SpListEntityBase, saveResult: XtendedSaveResult, status: 'success' | 'fail'): void {
        saveResult.deletedKeys.push({
            entityTypeName: this.shortName as string,
            keyValues: [this.entityAspect.getKey()],
        });

        saveResult.entities.push(this);
    }

    private resolveUpdate(
        this: SpListEntityBase,
        saveResult: XtendedSaveResult,
        status: 'success' | 'fail',
        rawEntity: SpListEntityBase
    ): void {
        saveResult.entities.push(rawEntity);
    }

    private validateResourceName(): this {
        const allValid = this.entities.every((entity) => entity.entityType.defaultResourceName);

        if (allValid) {
            return this;
        }

        const badEntity = this.entities.find((entity) => entity.entityType.defaultResourceName);

        throw new Error(`Missing resource name for type: ${badEntity.shortName as string}`);
    }
}
