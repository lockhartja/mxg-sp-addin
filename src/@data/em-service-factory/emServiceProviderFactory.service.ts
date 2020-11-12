import { ModelLibraryBackingStoreAdapter } from 'breeze-client/adapter-model-library-backing-store';
import { UriBuilderODataAdapter } from 'breeze-client/adapter-uri-builder-odata';
import { AjaxHttpClientAdapter } from 'breeze-client/adapter-ajax-httpclient';
import {
    EntityManager,
    DataService,
    NamingConvention,
    MetadataStore,
    EntityAction,
} from 'breeze-client';
import { SpDataService } from '../breeze-providers/sharepoint.dataservice';
import { EmServiceProviderConfig } from './emServiceProviderConfig';
import { CustomNameConventionService } from '../breeze-providers/custom-name-convention.service';
import { Injectable, Injector } from '@angular/core';
import {
    XtendedDataService,
    XtendedEntityMgr,
    RawEntity,
    XtendedPropChngEvtArgs,
    XtendedEntityType,
    SpEntities,
    EntityShortNameByNamespace,
    EntityTypeByShortName,
    XtendedEntityChngEvtArgs,
    SpEntityNamespaces,
    IBzCustomNameDictionary,
    XtendedDataServiceOpts,
} from '@atypes';
import { Subject, BehaviorSubject } from 'rxjs';
import { ENTITY_TYPE_DEF_KEY, SP_INTERNAL_NAME_DICT_KEY } from '@models';
import { HttpClient } from '@angular/common/http';
import _ from 'lodash';
import { EmDataSource } from './emDataSource';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Injectable({ providedIn: 'root' })
export class EmServiceProviderFactory {
    private isInitialized = false;
    private metaStore: MetadataStore;
    private managerStore: {
        [index in SpEntityNamespaces]: XtendedEntityMgr<index>;
    } = {} as {
        [index in SpEntityNamespaces]: XtendedEntityMgr<index>;
    };

    constructor(
        private nameDictService: CustomNameConventionService,
        injector: Injector,
        private http: HttpClient
    ) {
        ModelLibraryBackingStoreAdapter.register();
        UriBuilderODataAdapter.register();
        AjaxHttpClientAdapter.register(this.http);
        SpDataService.injector = injector;
        SpDataService.register();

        const nameDictionaryService = this.nameDictService;

        const namingDictionary = {};

        nameDictionaryService
            .createNameDictionary('spNameCov', NamingConvention.camelCase, namingDictionary)
            .setAsDefault();

        this.metaStore = new MetadataStore();
    }

    createManager<TNamespace extends SpEntityNamespaces>(
        mgrCfg: EmServiceProviderConfig<TNamespace>
    ): XtendedEntityMgr<TNamespace> {
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

        dataService.xtendedOptions = {} as XtendedDataServiceOpts;

        dataService.xtendedOptions.serviceNameSpace = mgrCfg.namespace;

        dataService.xtendedOptions.odataAppEndpoint = mgrCfg.odataAppEnd;

        const em = new EntityManager({
            dataService,
            metadataStore: this.metaStore,
        }) as XtendedEntityMgr<TNamespace>;

        em.isSaving = new BehaviorSubject(false);

        em.onEntityStateChanged = this.onEntityStateChanged(em);

        em.onEntityPropertyChanged = this.onEntityPropertyChanged(em);

        em.entityDataSource = this.eManagerDataSource(em);

        this.managerStore[mgrCfg.namespace] = em;

        return em;
    }

    private registerEntities<T extends SpEntities['namespace']>(
        mgrCfg: EmServiceProviderConfig<T>
    ): void {
        mgrCfg.featureEntities.forEach((bzClass) => {
            //Order matters -- needed to update name dictionary before adding entity types.
            const nameDict = Reflect.getOwnMetadata(
                SP_INTERNAL_NAME_DICT_KEY,
                bzClass
            ) as IBzCustomNameDictionary;

            if (!_.isEmpty(nameDict)) {
                this.nameDictService.updateDictionary(nameDict);
            }

            const bzEntityType = Reflect.getOwnMetadata(
                ENTITY_TYPE_DEF_KEY,
                bzClass
            ) as XtendedEntityType;

            this.metaStore.addEntityType(bzEntityType);

            // Let's not add a Ctor to a complex type, keeps from the prototype chain clean.
            if (bzEntityType.isComplexType) {
                this.metaStore.registerEntityTypeCtor(bzEntityType.shortName, undefined, undefined);
            } else {
                this.metaStore.registerEntityTypeCtor(
                    bzEntityType.shortName,
                    bzClass,
                    bzEntityType.initFn
                );
            }

            // if (!bzEntityType.isComplexType) {
            //     // eslint-disable-next-line no-debugger
            //     bzEntityType.custom.defaultSelect = bzEntityType.dataProperties
            //         .filter((dp) => dp.isDataProperty && !dp.isUnmapped && !dp.isComplexProperty)
            //         .map((dp) => dp.nameOnServer)
            //         .join(',');
            // }

            Reflect.deleteMetadata(ENTITY_TYPE_DEF_KEY, bzClass);
            Reflect.deleteMetadata(SP_INTERNAL_NAME_DICT_KEY, bzClass);
        });
    }

    private eManagerDataSource<TNamespace extends SpEntityNamespaces>(
        em: XtendedEntityMgr<TNamespace>
    ) {
        return <TEntityShortName extends EntityShortNameByNamespace<TNamespace>>(
            eName: TEntityShortName,
            matPaginator?: MatPaginator,
            matSort?: MatSort,
            dataFilter?: BehaviorSubject<
                [
                    searchProps: Array<keyof RawEntity<EntityTypeByShortName<TEntityShortName>>>,
                    searchValue: string
                ]
            >
        ) => new EmDataSource(em, eName, matPaginator, matSort, dataFilter);
    }

    private onEntityStateChanged<TNamespace extends SpEntityNamespaces>(
        em: XtendedEntityMgr<TNamespace>
    ) {
        return <TEntityShortName extends EntityShortNameByNamespace<TNamespace>>(
            eNames: TEntityShortName[],
            unsubToken: Subject<never>
        ): Subject<XtendedPropChngEvtArgs<TEntityShortName>> => {
            const ecSub = new Subject<XtendedPropChngEvtArgs<TEntityShortName>>();

            const subscriptionToken = em.entityChanged.subscribe(
                (eventArgs: XtendedEntityChngEvtArgs<TEntityShortName>) => {
                    const etName = eventArgs.entity?.entityType.shortName as TEntityShortName;

                    if (
                        eventArgs.entityAction !== EntityAction.EntityStateChange &&
                        !eNames.includes(etName)
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

    private onEntityPropertyChanged<TNamespace extends SpEntityNamespaces>(
        em: XtendedEntityMgr<TNamespace>
    ) {
        return <
            TEntityShortName extends EntityShortNameByNamespace<TNamespace>,
            TProps extends Array<keyof RawEntity<EntityTypeByShortName<TEntityShortName>>>
        >(
            entityName: TEntityShortName,
            properties: TProps,
            unsubToken: Subject<never>
        ) => {
            const ecSub = new Subject<XtendedPropChngEvtArgs<TEntityShortName>>();

            const subscriptionToken = em.entityChanged.subscribe(
                (eventArgs: XtendedEntityChngEvtArgs<TEntityShortName>) => {
                    const evtArgsEtName = eventArgs.entity?.entityType.shortName;

                    if (
                        eventArgs.entityAction !== EntityAction.PropertyChange &&
                        entityName !== evtArgsEtName &&
                        !properties.includes(eventArgs.args?.propertyName)
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
}
