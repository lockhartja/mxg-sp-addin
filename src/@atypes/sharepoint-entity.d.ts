import { Entity } from 'breeze-client';
import { TermSet, SpEntityBase, SpListEntityBase, SpMetadata, RootTermStore } from '@models';
import { SpLists } from './sharepoint-list';

export interface ISoftDeletable {
    wasSoftDeleted: boolean;
}

export type SpUserPermissionGroup =
    | 'sma-user'
    | 'sma-metric-user'
    /**
     * Restricts css app to local unit only
     * to the user primary unit code
     */
    | 'sma-css-unit'
    /**
     * Grants access to all unit css
     * rosters for the group
     */
    | 'sma-css-group'
    /**
     * App God Mode
     */
    | 'sma-global-admin'
    | 'sma-secmgr-user';

export type SpEntities = SpLists | RootTermStore | TermSet | SpMetadata;
export type SpEntityShortNames = SpEntities['shortName'];
export type SpEntityNamespaces = SpEntities['namespace'];

// export type ModuleEmFactory = () => (
//     emFactory: EmServiceProviderFactory,
//     httpClient: HttpClient
// ) => RepoFactory<AllEntityList['namespace']>;

export type ExtraBareEntityProps = 'entityDefinition' | '$typeName';

export type RawEntity<T> = Partial<Pick<T, Exclude<keyof T, keyof Entity | ExtraBareEntityProps>>>;

// export interface ISpQueryOptions {
//     $filter?: string;
//     $orderby?: string;
//     $skip?: number;
//     $top?: number;
//     $select?: string;
//     $inlinecount?: string;
//     $expand?: string;
// }

export type EntityTypeByShortName<
    TShortName extends SpEntityShortNames
> = SpEntities extends infer TEntityType
    ? TEntityType extends SpEntities
        ? TEntityType['shortName'] extends TShortName
            ? TEntityType
            : never
        : never
    : never;

export type EntityTypesByNamespace<
    TNamespace extends SpEntityNamespaces
> = SpEntities extends infer TEntityTypes
    ? TEntityTypes extends SpEntities
        ? TEntityTypes['namespace'] extends TNamespace
            ? TEntityTypes
            : never
        : never
    : never;

export type EntityShortNameByNamespace<
    TNamespace extends SpEntityNamespaces
> = SpEntities extends infer TEntityTypes
    ? TEntityTypes extends SpEntities
        ? TEntityTypes['namespace'] extends TNamespace
            ? TEntityTypes['shortName']
            : never
        : never
    : never;

export interface ISpContextResponse {
    FormDigestTimeoutSeconds: string;
    FormDigestValue: string;
}

export type SpChoiceCache<T> = {
    [index in keyof T]: {
        values: string[];
        editUri: string;
        type: string;
        defaultValue: string;
    };
};

// interface IRepoPromiseCache {
//     [index: string]: Promise<unknown>;
// }

// https://github.com/Microsoft/TypeScript/wiki/What's-new-in-TypeScript#keyof-and-lookup-types
export type EntityChildrenKind<T extends SpEntityBase> = Extract<
    { [P in keyof T]: T[P] extends Array<infer U> ? U : never }[keyof T],
    SpEntityBase
>;

// export type RelatedEntityKind<T extends SpEntityBase> = Extract<
//     { [P in keyof T]: T[P] extends Array<infer U> ? U : T[P] }[keyof T],
//     SpEntityBase
// >;

export type RelatedEntity<TEntity extends SpEntityBase> = Extract<
    {
        [Prop in keyof TEntity]: TEntity[Prop] extends Array<infer U> ? U : TEntity[Prop];
    }[keyof TEntity],
    SpListEntityBase
>;

// export type SelectedEntityKind<T extends SpEntityBase['shortName']> = Extract<
//     SharepointEntityList,
//     { shortName: T }
// >;

// export type EntityChildShortName<
//     T extends SpListEntityBase
// > = EntityChildrenKind<T>['shortName'];

// export type RelatedEntityShortName<T extends SpEntityBase> = RelatedEntityKind<
//     T
// >['shortName'];

// export type XntityKey<
//     TEntityShortName extends AllEntityList['shortName']
// > = AllEntityList extends infer E
//     ? E extends AllEntityList
//         ? E['shortName'] extends TEntityShortName
//             ? Record<TEntityShortName, E>
//             : never
//         : never
//     : never;

// export type ReturnType = true;
// export type ReturnShortName = false;

// export type GetEntityInNamespace<
//     U extends AllEntityList['namespace'],
//     T extends ReturnType | ReturnShortName
// > = AllEntityList extends infer E
//     ? E extends AllEntityList
//         ? E['namespace'] extends U
//             ? T extends ReturnShortName
//                 ? E['shortName']
//                 : E
//             : never
//         : never
//     : never;

export interface _spPageContextInfoXtended extends _spPageContextInfo {
    __webAbsoluteUrl: string;
    __siteAbsoluteUrl: string;
}
