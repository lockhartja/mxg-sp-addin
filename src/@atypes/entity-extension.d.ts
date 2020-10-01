import { Entity, DataType, EntityManager } from 'breeze-client';
import { SpBaseEntity, SharepointEntity, SharepointMetadata } from '@models';
import { MpRoster } from '@models';
import { SharepointEntityList, SharepointKnownNamespace } from './sharepoint';
import { Instantiable } from './utility';
import {
    CoreSharepointRepo,
    CoreRepo,
    EmServiceProviderFactory,
    RepoFactory,
} from '@data';
import { HttpClient } from '@angular/common/http';

export interface ISoftDeletable {
    wasSoftDeleted: boolean;
}

export type ModuleEmFactory = () => (
    emFactory: EmServiceProviderFactory,
    httpClient: HttpClient
) => RepoFactory<any>;

export type AllEntityList = SharepointEntityList;

export type ExtraBareEntityProps =
    | 'entityType'
    | 'entityAspect'
    | 'entityDefinition'
    | '$typeName';

export type RawEntity<T> = Partial<
    Pick<T, Exclude<keyof T, keyof Entity | ExtraBareEntityProps>>
>;

export interface ISpQueryOptions {
    $filter?: string;
    $orderby?: string;
    $skip?: number;
    $top?: number;
    $select?: string;
    $inlinecount?: string;
    $expand?: string;
}

export type GetEntityType<
    T extends AllEntityList['shortName']
> = AllEntityList extends infer E
    ? E extends AllEntityList
        ? E['shortName'] extends T
            ? E
            : never
        : never
    : never;

export type GetSpEntityType<
    T extends SharepointEntityList['shortName']
> = SharepointEntityList extends infer E
    ? E extends SharepointEntityList
        ? E['shortName'] extends T
            ? E
            : never
        : never
    : never;

export type GetEntityProp<
    T extends AllEntityList['shortName']
> = AllEntityList extends infer E
    ? E extends AllEntityList
        ? E['shortName'] extends T
            ? keyof E
            : never
        : never
    : never;

// https://github.com/Microsoft/TypeScript/wiki/What's-new-in-TypeScript#keyof-and-lookup-types
export type EntityChildrenKind<T extends SpBaseEntity> = Extract<
    { [P in keyof T]: T[P] extends Array<infer U> ? U : never }[keyof T],
    SpBaseEntity
>;

export type RelatedEntityKind<T extends SpBaseEntity> = Extract<
    { [P in keyof T]: T[P] extends Array<infer U> ? U : T[P] }[keyof T],
    SpBaseEntity
>;

export type SelectedEntityKind<T extends SpBaseEntity['shortName']> = Extract<
    SharepointEntityList,
    { shortname: T }
>;

export type EntityChildShortName<T extends SpBaseEntity> = EntityChildrenKind<
    T
>['shortName'];

export type RelatedEntityShortName<T extends SpBaseEntity> = RelatedEntityKind<
    T
>['shortName'];

export interface IEntityStateChange<
    TShortName extends AllEntityList['shortName']
> {
    entityAction: 'EntityState';
}

export type GlobalRepoManagerExtended<T extends AllEntityList> =
    | AllEntityList
    | T;

export type XntityKey<
    TEntityShortName extends AllEntityList['shortName']
> = AllEntityList extends infer E
    ? E extends AllEntityList
        ? E['shortName'] extends TEntityShortName
            ? Record<TEntityShortName, E>
            : never
        : never
    : never;

export type ReturnType = true;
export type ReturnShortName = false;

export type GetEntityInNamespace<
    U extends AllEntityList['namespace'],
    T extends ReturnType | ReturnShortName
> = AllEntityList extends infer E
    ? E extends AllEntityList
        ? E['namespace'] extends U
            ? T extends ReturnShortName
                ? E['shortName']
                : E
            : never
        : never
    : never;

export type GetEntityInSpNamespace<
    U extends SharepointEntityList['namespace'],
    T extends ReturnType | ReturnShortName
> = SharepointEntityList extends infer E
    ? E extends SharepointEntityList
        ? E['namespace'] extends U
            ? T extends false
                ? E['shortName']
                : E
            : never
        : never
    : never;

export type GetEntityTypeFromShortName<
    U extends AllEntityList['shortName']
> = AllEntityList extends infer E
    ? E extends AllEntityList
        ? E['shortName'] extends U
            ? E
            : never
        : never
    : never;

export type RepoReturn<
    T extends AllEntityList['shortName'],
    U extends AllEntityList['namespace']
> = GetEntityTypeFromShortName<T> extends SharepointEntityList
    ? CoreSharepointRepo<U, T>
    : CoreRepo<U, T>;
