import {
    Entity,
    EntityType,
    MetadataStore,
    DataProperty,
    NavigationProperty,
    EntityManager,
    EntityChangedEventArgs,
    PropertyChangedEventArgs,
    DataService,
    EntityQuery,
    SaveContext,
    SaveResult,
    MappingContext,
    SaveBundle,
    HttpResponse,
    QueryResult,
} from 'breeze-client';

import {
    RawEntity,
    SpEntityNamespaces,
    SpEntityShortNames,
    EntityShortNameByNamespace,
    EntityTypeByShortName,
} from './sharepoint-entity';

import { ValidatorFn } from '@angular/forms';
import { SpListEntityBase, SpMetadata, SpEntityBase } from '@models';
import { BehaviorSubject, Subject } from 'rxjs';
import { EntityTypeConfig } from 'breeze-client/src/entity-metadata';
import { CustomAppFormGroup } from './custom-form';
import { PossibleNameSpace } from './sharepoint-list';
import { IBatchInternalRequest } from './odata';
import { HttpHeaders, HttpRequest, HttpResponse as NgResponse } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { EmDataSource } from '@data/em-service-factory/emDataSource';

export interface XtendedEntityChngEvtArgs<TEntityShortName extends SpEntityShortNames>
    extends EntityChangedEventArgs {
    entity: EntityTypeByShortName<TEntityShortName>;
    args?: XtendedPropChngEvtArgs<TEntityShortName>;
}

export interface XtendedPropChngEvtArgs<TEntityShortName extends SpEntityShortNames>
    extends PropertyChangedEventArgs {
    entity: EntityTypeByShortName<TEntityShortName>;
    propertyName: keyof RawEntity<EntityTypeByShortName<TEntityShortName>> & string;
}
export interface XtendedBreezeHttpResponse extends HttpResponse {
    config: HttpRequest<unknown>;
    headers: HttpHeaders;
    statusText: string;
    response: NgResponse<unknown>;
}

export interface XtendedDataServiceOpts {
    odataAppEndpoint: string;
    serviceNameSpace: PossibleNameSpace;
}

export interface XtendedDataService extends DataService {
    xtendedOptions?: XtendedDataServiceOpts;
    serviceName: PossibleNameSpace;
}

/**
 * Used only during save operations to capture the contentID
 * in batch requests.
 */
export interface XtendedEntity extends SpListEntityBase {
    contentId: string;
    resolveResponse: (
        this: SpListEntityBase,
        saveResult: XtendedSaveResult,
        status: 'success' | 'fail',
        rawEntity?: SpListEntityBase
    ) => void;
}

export interface XtendedEntityTypeCustom {
    defaultSelect: string;
    formValidators: {
        propVal: Map<string, ValidatorFn[]>;
        entityVal: Array<(entity: SpEntityBase) => ValidatorFn>;
    };
    /**
     * Sets up the entity type's validators for a given
     * form group's controls. Should be called only after
     * form group with all associate form controls have
     * been created.
     */
    setFormValidators(formGroup: CustomAppFormGroup<unknown>, targetEntity: SpEntityBase): void;
}

export interface XtendedEntityTypeConfig extends EntityTypeConfig {
    dataProperties: DataProperty[];
    navigationProperties: NavigationProperty[];
    initFn: unknown;
    custom: Partial<XtendedEntityTypeCustom>;
}

export interface XtendedEntityMgr<TNamespace extends SpEntityNamespaces> extends EntityManager {
    isSaving: BehaviorSubject<boolean>;

    dataService: XtendedDataService;

    // entityTypeDataSource<TEntityShortName extends EntityShortNameByNamespace<TNamespace>>(
    //     entity: TEntityShortName
    // ): EmDataSource<TNamespace, EntityShortNameByNamespace<TNamespace>>

    entityDataSource<TEntityShortName extends EntityShortNameByNamespace<TNamespace>>(
        entityName: TEntityShortName,
        paginator?: MatPaginator,
        sorter?: MatSort,
        dataFilter?: BehaviorSubject<
            [
                searchProps: Array<keyof RawEntity<EntityTypeByShortName<TEntityShortName>>>,
                searchValue: string
            ]
        >
    ): EmDataSource<TNamespace, TEntityShortName>;

    onEntityStateChanged<TEntityShortName extends EntityShortNameByNamespace<TNamespace>>(
        entities: TEntityShortName[],
        unsubToken: Subject<never>
    ): Subject<XtendedPropChngEvtArgs<TEntityShortName>>;

    onEntityPropertyChanged<
        TEntityShortName extends EntityShortNameByNamespace<TNamespace>,
        TEntityProps extends Array<keyof RawEntity<EntityTypeByShortName<TEntityShortName>>>
    >(
        entityName: TEntityShortName,
        propNames: TEntityProps,
        unsubToken: Subject<never>
    ): Subject<XtendedPropChngEvtArgs<TEntityShortName>>;

    // onEntityPropertyChanged<
    //     TEntityShortName extends EntityShortNameByNamespace<TNamespace>,
    //     TEntityProps extends Array<keyof RawEntity<EntityTypeByShortName<TEntityShortName>>>
    // >(
    //     entityName: TEntityShortName,
    //     properties: TEntityProps,
    //     unsubToken: Subject<unknown>
    // ): Subject<XtendedPropChngEvtArgs<TEntityShortName>>;
}

export declare class XtendedEntityType extends EntityType {
    shortName: SpEntityShortNames;

    __metadata: SpMetadata;

    custom: {
        defaultSelect?: string;
        formValidators?: {
            propVal: Map<string, ValidatorFn[]>;
            entityVal: Array<(entity: SpEntityBase) => ValidatorFn>;
        };
        /**
         * Sets up the entity type's validators for a given
         * form group's controls. Should be called only after
         * form group with all associate form controls have
         * been created.
         */
        setFormValidators(formGroup: CustomAppFormGroup<unknown>, targetEntity: SpEntityBase): void;
    };

    createEntity(
        initialValues?: {
            [index in keyof RawEntity<
                EntityTypeByShortName<this['shortName']>
            >]: EntityTypeByShortName<this['shortName']>[index];
        }
    ): EntityTypeByShortName<this['shortName']>;
}

export interface XtendedEntityQueryOpts {
    name?: string;
    useSpBatchQuery?: boolean;
    isCamlQuery?: boolean;
    forceRefresh?: boolean;
    getAllWithMax?: number;
    // JSON-stringified Custom string to query as part of sharepoint post operations
    postData?: string;
}

export interface XtendedEntityQuery extends EntityQuery {
    xtendedOptions?: XtendedEntityQueryOpts;
    _getToEntityType(metadataStore: MetadataStore, skipFromCheck: boolean): XtendedEntityType;
}

export interface IPropChgEvtArgs<TEntity extends SpEntityBase> extends PropertyChangedEventArgs {
    entity: TEntity;
}

export interface XtendedSaveContext extends SaveContext {
    dataService: XtendedDataService;
}

export interface XtendedSaveResult extends SaveResult {
    entitiesWithErrors: Entity[];
}

export interface XtendedSaveBundle extends SaveBundle {
    entities: SpListEntityBase[];
}

export interface IBreezeVisitNodeResult {
    entityType: XtendedEntityType;
    passThru: boolean;
    node: unknown;
    ignore: boolean;
}

export interface XtendedMappingCtx extends MappingContext {
    query: XtendedEntityQuery;
    entityManager: XtendedEntityMgr<undefined>;
    dataService: XtendedDataService;
    /**
     * Used only for internal batch querying by executeBatchQuery method.
     */
    internalBatchRequest?: IBatchInternalRequest;
}

export interface XtendedQueryResult extends QueryResult {
    error?: unknown;
}

export type DataServiceSaveResultData = [boolean, boolean, SaveResult];

export interface IEntityError {
    ErrorName: string;
    EntityTypeName: string;
    PropertyName: string;
    ErrorMessage: string;
    KeyValues: unknown;
}

export interface IDotNetError {
    Message?: string;
    ExceptionMessage?: string;
    EntityErrors?: IEntityError[];
    Errors?: IEntityError[];
    InnerException?: IDotNetError;
}

export interface IBzCustomNameDictionary {
    [index: string]: { [index: string]: string };
}
