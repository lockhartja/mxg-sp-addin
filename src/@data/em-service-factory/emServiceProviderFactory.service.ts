import {
    EntityManager,
    DataService,
    NamingConvention,
    MetadataStore,
    EntityAction,
    SaveResult,
    EntityType,
} from 'breeze-client';
import '../breeze-providers/sharepoint-dataservice';
import { EmServiceProviderConfig } from './emServiceProviderConfig';
import {
    CustomNameConventionService,
    ICustomClientDict,
} from '../breeze-providers/custom-name-convention.service';
import { Injectable } from '@angular/core';
import { DataAccessModule } from '../data-access.module';
import {
    AllEntityList,
    XtendedDataService,
    XtendedEntityMgr,
    GetEntityInNamespace,
    RawEntity,
    XtendedPropChngEvtArgs,
    XtendedEntChngEvtArgs,
    ReturnShortName,
    CompatibilityFix,
    OnEntityChanges,
    SharepointNamespace,
    ObjectInitializer,
} from '@atypes';
import * as debounce from 'debounce-promise';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
    SharepointMetadata,
    SpBaseEntity,
    ENTITY_TYPE_DEF_KEY,
    SP_INTERNAL_NAME_DICT_KEY,
    MpRosterTest,
} from '@models';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import * as _m from 'moment';
import * as _l from 'lodash';

// List of models that are used across feature sets
const GlobalModels = [SharepointMetadata];

@Injectable({ providedIn: 'root' })
export class EmServiceProviderFactory {
    private metaStore: MetadataStore;
    private managerStore: {
        [index in SharepointNamespace]: XtendedEntityMgr<any>;
    } = {} as ObjectInitializer;

    private saveDebounce: (
        entityBundler: [SpBaseEntity][]
    ) => Promise<SaveResult>;

    constructor(
        private nameDictService: CustomNameConventionService,
        private http: HttpClient
    ) {
        this.initEmServiceProvider();
    }

    initEmServiceProvider(): void {
        const nameDictionaryService = this.nameDictService;

        const namingDictionary = {};

        nameDictionaryService
            .createNameDictionary(
                'spNameCov',
                NamingConvention.camelCase,
                namingDictionary
            )
            .setAsDefault();

        this.metaStore = new MetadataStore();

        GlobalModels.forEach((bzClass: any) => {
            const bzEntity = Reflect.getOwnMetadata(
                ENTITY_TYPE_DEF_KEY,
                bzClass
            );

            this.metaStore.addEntityType(bzEntity);

            this.metaStore.registerEntityTypeCtor(
                bzEntity.shortName,
                undefined,
                bzEntity.initFn as Function
            );

            const nameDict = Reflect.getOwnMetadata(
                SP_INTERNAL_NAME_DICT_KEY,
                bzClass
            ) as ICustomClientDict;

            if (nameDict) {
                this.nameDictService.updateDictionary(nameDict);
            }
        });
    }

    createManager<T extends SharepointNamespace>(
        mgrCfg: EmServiceProviderConfig<T>
    ): XtendedEntityMgr<T> {
        /**
         * if we have already register a namespace, i.e. SP.Global
         * reopen the metadata store and add the additional entity
         * then return previously created manager;
         */
        if (this.managerStore[mgrCfg.namespace]) {
            this.registerEntities(mgrCfg);
            return this.managerStore[mgrCfg.namespace];
        }

        const dataService = new DataService({
            serviceName: mgrCfg.serviceEnd,
            hasServerMetadata: false,
            adapterName: mgrCfg.adapterName,
        }) as XtendedDataService;

        this.registerEntities(mgrCfg);

        dataService.getRequestDigest = this.getRequestDigest(mgrCfg);

        dataService.odataAppEndpoint = mgrCfg.odataAppEnd;

        const em = new EntityManager({
            dataService,
            metadataStore: this.metaStore,
        }) as XtendedEntityMgr<any>;

        em.isSaving = new BehaviorSubject(false);

        em.onEntityStateChanged = this.onEntityStateChanged(em);

        em.onEntityPropertyChanged = this.onEntityPropertyChanged(em);

        this.managerStore[mgrCfg.namespace] = em;

        return em;
    }

    private registerEntities<T extends SharepointNamespace>(
        mgrCfg: EmServiceProviderConfig<T>
    ): void {
        mgrCfg.featureEntities.forEach((bzClass) => {
            const bzEntity = Reflect.getOwnMetadata(
                ENTITY_TYPE_DEF_KEY,
                bzClass
            );

            this.metaStore.addEntityType(bzEntity);

            this.metaStore.registerEntityTypeCtor(
                bzEntity.shortName,
                undefined,
                bzEntity.initFn as Function
            );

            const nameDict = Reflect.getOwnMetadata(
                SP_INTERNAL_NAME_DICT_KEY,
                bzClass
            ) as ICustomClientDict;

            if (nameDict) {
                this.nameDictService.updateDictionary(nameDict);
            }
        });
    }

    private onEntityStateChanged(em: EntityManager) {
        return <TNamespace extends AllEntityList['namespace']>(
            eNames: GetEntityInNamespace<TNamespace, ReturnShortName>[],
            unsubToken: Subject<any>
        ) => {
            const ecSub = new Subject<XtendedPropChngEvtArgs<any>>();

            const subscriptionToken = em.entityChanged.subscribe(
                (eventArgs: XtendedEntChngEvtArgs) => {
                    const etName = eventArgs.entity?.entityType.shortName;

                    if (
                        eventArgs.entityAction !==
                            EntityAction.EntityStateChange &&
                        !eNames.includes(etName as CompatibilityFix)
                    ) {
                        return;
                    }

                    ecSub.next(eventArgs.args);
                }
            );

            unsubToken.subscribe(() => {
                em.entityChanged.unsubscribe(subscriptionToken);
                ecSub.unsubscribe();
            });

            return ecSub;
        };
    }

    private onEntityPropertyChanged(em: EntityManager) {
        return <
            TNamespace extends AllEntityList['namespace'],
            TEntityName extends GetEntityInNamespace<
                TNamespace,
                ReturnShortName
            >,
            TProps extends Array<keyof RawEntity<OnEntityChanges<TEntityName>>>
        >(
            entityName: TEntityName,
            properties: TProps,
            unsubToken: Subject<any>
        ) => {
            const ecSub = new Subject<XtendedPropChngEvtArgs<any>>();

            const subscriptionToken = em.entityChanged.subscribe(
                (eventArgs: XtendedEntChngEvtArgs) => {
                    const evtArgsEtName =
                        eventArgs.entity?.entityType.shortName;

                    if (
                        eventArgs.entityAction !==
                            EntityAction.PropertyChange &&
                        entityName !== evtArgsEtName &&
                        !properties.includes(
                            eventArgs.args?.propertyName as any
                        )
                    ) {
                        return;
                    }

                    ecSub.next(eventArgs.args);
                }
            );

            unsubToken.subscribe(() => {
                em.entityChanged.unsubscribe(subscriptionToken);
                ecSub.unsubscribe();
            });

            return ecSub;
        };
    }

    // debounceSave(
    //   em: EntityManager
    // ): (entity: BreezeEntity) => Promise<SaveResult> {
    //   const saveDebounce = debounce(
    //     (contexts: [BreezeEntity][]) => {
    //       const entitiesToSave = _l.flatMap(contexts, x => x.map(c => c));
    //       return em.saveChanges(entitiesToSave as any[]);
    //     },
    //     1500,
    //     { accumulate: true }
    //   );
    //   return entity => saveDebounce(entity as any);
    // }

    getRequestDigest(
        mgrCfg: EmServiceProviderConfig<any>
    ): () => Promise<string> {
        let tokenExpireTime = _m();
        let digestToken = '';
        let tokenPromise: Promise<string>;

        return () => {
            const isExpired = _m().diff(tokenExpireTime, 'minute') > 5;

            if (digestToken && !isExpired) {
                return Promise.resolve(digestToken);
            }

            const headers = new HttpHeaders({
                'Content-Type': 'application/json;odata=minimalmetadata',
                Accept: 'application/json;odata=verbose',
            });

            if (tokenPromise) {
                return tokenPromise;
            }

            tokenPromise = this.http
                .post(mgrCfg.ctxEnd, undefined, { headers })
                .toPromise()
                .then((ctxResponse) => {
                    digestToken = (ctxResponse as any).d
                        .GetContextWebInformation.FormDigestValue;
                    const timeoutSeconds = (ctxResponse as any).d
                        .GetContextWebInformation.FormDigestTimeoutSeconds;

                    tokenExpireTime = _m().add(timeoutSeconds, 'second');
                    tokenPromise = undefined;
                    return digestToken;
                });
            return tokenPromise;
        };
    }
}
