import {
    Entity,
    EntityKey,
    EntityType,
    MetadataStore,
    DataProperty,
    NavigationProperty,
    EntityManager,
    EntityChangedEventArgs,
    PropertyChangedEventArgs,
    DataService,
    EntityState,
    EntityQuery,
    MergeStrategy,
    SaveContext,
    SaveResult,
    MappingContext,
    SaveBundle,
    JsonResultsAdapter,
    StructuralObject,
} from 'breeze-client';

import {
    GetEntityProp,
    ISpQueryOptions,
    AllEntityList,
    GetEntityInNamespace,
    RawEntity,
    GetEntityTypeFromShortName,
    ReturnType,
    ReturnShortName,
} from './entity-extension';

import { ValidatorFn } from '@angular/forms';
import { DoNotCare, Instantiable, Unarray } from './utility';
import { SharepointEntity, SharepointMetadata, SpBaseEntity } from '@models';
import { BehaviorSubject, Subject } from 'rxjs';
import {
    DataPropertyConfig,
    EntityTypeConfig,
    NavigationPropertyConfig,
} from 'breeze-client/src/entity-metadata';
import { CustomAppFormGroup } from './custom-form';
import { CustomDataServiceUtils } from '@data';
import { EntitySibling } from './sharepoint';

export interface IBzNameDict {
    [index: string]: string;
}

export declare function decorateBzNavProp(
    reciprocalEntity: Instantiable<EntitySibling<SharepointEntity>>,
    config?: Partial<NavigationPropertyConfig>
): PropertyDecorator;

export declare function decorateBzDataProp(
    config?: Partial<DataPropertyConfig>
): PropertyDecorator;

export interface XtendedEntChngEvtArgs extends EntityChangedEventArgs {
    entity: XtendedEntity;
}

export interface XtendedDataService extends DataService {
    getRequestDigest(): Promise<string>;
    odataAppEndpoint: string;
}

export interface XtendedPropChngEvtArgs<TEntity extends SpBaseEntity>
    extends PropertyChangedEventArgs {
    entity: TEntity;
    propertyName: keyof TEntity & string;
}

export interface XtendedEntityTypeCustom {
    defaultSelect: string;
    formValidators: {
        propVal: Map<string, ValidatorFn[]>;
        entityVal: Array<(entity: SpBaseEntity) => ValidatorFn>;
    };
    /**
     * Sets up the entity type's validators for a given
     * form group's controls. Should be called only after
     * form group with all associate form controls have
     * been created.
     */
    setFormValidators(
        formGroup: CustomAppFormGroup<any>,
        targetEntity: SpBaseEntity
    ): void;
}

export interface XtendedEntityTypeConfig extends EntityTypeConfig {
    //isComplexType: boolean;
    dataProperties: DataProperty[];
    navigationProperties: NavigationProperty[];
    initFn: Function;
    custom: Partial<XtendedEntityTypeCustom>;
}

export type OnEntityChanges<
    TEntityName extends AllEntityList['shortName']
> = GetEntityTypeFromShortName<TEntityName>;

declare function xtendedUnwrapChngValues(
    entity: SharepointEntity,
    metadataStore: MetadataStore,
    transformFn: (dp: DataProperty, val: any) => any
): {
    __metadata: Partial<SharepointMetadata>;
};

declare function xtendedUnwrapInstance(
    structObj: StructuralObject,
    transformFn?: (dp: DataProperty, val: any) => any
): SharepointEntity;

export interface XtendedEntityMgr<TNamespace extends AllEntityList['namespace']>
    extends EntityManager {
    isSaving: BehaviorSubject<boolean>;
    dataService: XtendedDataService;
    helper: {
        unwrapInstance: typeof xtendedUnwrapInstance;
        unwrapOriginalValues: (
            target: StructuralObject,
            metadataStore: MetadataStore,
            transformFn?: (dp: DataProperty, val: any) => any
        ) => {};
        unwrapChangedValues: typeof xtendedUnwrapChngValues;
    };

    onEntityStateChanged<
        TEntityNames extends GetEntityInNamespace<TNamespace, ReturnShortName>[]
    >(
        entities: TEntityNames,
        unsubToken: Subject<any>
    ): Subject<XtendedPropChngEvtArgs<OnEntityChanges<Unarray<TEntityNames>>>>;

    onEntityPropertyChanged<
        TEntityName extends AllEntityList['shortName'],
        TProps extends Array<keyof RawEntity<OnEntityChanges<TEntityName>>>
    >(
        entityName: TEntityName,
        properties: TProps,
        unsubToken: Subject<any>
    ): Subject<XtendedPropChngEvtArgs<OnEntityChanges<TEntityName>>>;

    getEntities<TEntity extends GetEntityInNamespace<TNamespace, ReturnType>>(
        entityType?: XtendedEntityType | XtendedEntityType[],
        entityStates?: EntityState | EntityState[]
    ): TEntity[];

    getEntities<TEntity extends GetEntityInNamespace<TNamespace, ReturnType>>(
        entityTypeNames?: TEntity['shortName'] | Array<TEntity['shortName']>,
        entityStates?: EntityState | EntityState[]
    ): TEntity[];
}

export interface XtendedEntityType extends EntityType {
    shortName: AllEntityList['shortName'];
    __metadata: SharepointMetadata;
    custom: {
        defaultSelect?: string;
        formValidators?: {
            propVal: Map<string, ValidatorFn[]>;
            entityVal: Array<(entity: SpBaseEntity) => ValidatorFn>;
        };
        /**
         * Sets up the entity type's validators for a given
         * form group's controls. Should be called only after
         * form group with all associate form controls have
         * been created.
         */
        setFormValidators(
            formGroup: CustomAppFormGroup<any>,
            targetEntity: SpBaseEntity
        ): void;
    };
}

export interface XtendedEntity extends Entity {
    entityType: XtendedEntityType;
}

export interface XtendedEntityQuery extends EntityQuery {
    useSpBatchQuery: boolean;
    name: string;
    forceRefresh: boolean;
    getAllWithMax: number;
    spQueryOptions: ISpQueryOptions;
    _getToEntityType(
        metadataStore: MetadataStore,
        skipFromCheck: boolean
    ): XtendedEntityType;
}

export interface IPropChgEvtArgs<TEntity extends SpBaseEntity>
    extends PropertyChangedEventArgs {
    entity: TEntity;
}

export interface XtendedSaveContext extends SaveContext {
    tempKeys: EntityKey[];
    originalEntities: SharepointEntity[];
    saveResult: XtendedSaveResult;
    entityManager: XtendedEntityMgr<any>;
}

export interface XtendedSaveResult extends SaveResult {
    entitiesWithErrors: Entity[];
}

export interface XtendedSaveBundle extends SaveBundle {
    entities: SharepointEntity[];
}

export interface IHttpResultsData {
    results: any[];
    inlineCount: number;
    httpResponse: any;
}

export interface XtendedMappingCtx extends MappingContext {
    query: XtendedEntityQuery;
    entityManager: XtendedEntityMgr<DoNotCare>;
}

export interface SpSaveDataSvcInit {
    saveContext: XtendedSaveContext;
    saveBundle: XtendedSaveBundle;
    jsonResultAdapter: JsonResultsAdapter;
    customDataSvcUtils: CustomDataServiceUtils;
}

export type DataServiceSaveResultData = [boolean, boolean, SaveResult];

// declare module 'breeze-client/src/entity-metadata' {
//     interface EntityType {
//         custom?: Object;
//         _mappedPropertiesCount: number;
//     }
// export interface IBzHttpResponse {
//     config: any;
//     data: any[];
//     getHeaders: () => any;
//     status: number;
//     ngConfig: string;
//     spConfig: any;
//     statusText: string;
//     error: any;
//     response: any;
// }
//     // export interface HttpResponse {
//     //     saveContext: SaveContext;
//     // }
// }

// declare module 'breeze-client/src/entity-manager' {

//     export interface SaveResult {
//         entitiesWithErrors: Entity[];
//     }

//     /**
//      * For use by breeze plugin authors only. The class is for use in building a [[IDataServiceAdapter]] implementation.
//      * @adapter (see [[IDataServiceAdapter]])
//      * @hidden @internal
//      */
//     export interface EntityErrorFromServer {
//         entityTypeName: string;
//         keyValues: any[];

//         errorName: string;
//         errorMessage: string;
//         propertyName: string;
//     }

//     /**
//      * Shape of a save error returned from the server.
//      * For use by breeze plugin authors only. The class is for use in building a [[IDataServiceAdapter]] implementation.
//      * @adapter (see [[IDataServiceAdapter]])
//      * @hidden @internal
//      */
//     export interface SaveErrorFromServer extends ServerError {
//         entityErrors: EntityErrorFromServer[];
//     }
// }
