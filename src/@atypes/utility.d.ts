import { HttpHeaders } from '@angular/common/http';
import { Route } from '@angular/router';
import { QueryResult } from 'breeze-client';
import { DataPropertyConfig, NavigationPropertyConfig } from 'breeze-client/src/entity-metadata';
import { PossibleNameSpace } from './sharepoint-list';

declare module '*.json' {
    const value: unknown;
    export default value;
}

export type KnownHttpHeaders =
    | 'DataServiceVersion'
    | 'Accept'
    | 'Content-Type'
    | 'X-Http-Method'
    | 'Content-Id'
    | 'X-RequestDigest'
    | 'Content-Length'
    | 'If-Match';

export type KnownHttpMethods = 'GET' | 'POST' | 'DELETE' | 'MERGE';

export type Instantiable<T> = new (...args: unknown[]) => T;

export interface IDeffer {
    promise: Promise<QueryResult>;
    resolve: (value?: unknown) => void;
    reject: (error?: unknown) => void;
}

export type AppEndpoints =
    | ''
    | 'dashboard'
    | 'css'
    | 'css/css-rosters'
    | 'css/css-about'
    | 'admin'
    | 'home'
    | 'msm'
    | '**';

export interface AppRoute extends Route {
    path?: AppEndpoints;
}

export type AppRoutes = AppRoute[];

export interface ISharedConfig {
    propName: string;
    propConfig: DataPropertyConfig | NavigationPropertyConfig;
}

// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
export type Unarray<T> = T extends Array<infer U> ? U : never;

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type PropertiesInType<T, K> = {
    [P in keyof T]: T[P] extends K ? P : never;
}[keyof T];

export type PropertiesNotInType<T, K> = {
    [P in keyof T]: T[P] extends K ? never : P;
}[keyof T];

export type SpDigestTokenCache = {
    [index in PossibleNameSpace]: {
        token: string;
        expires: number;
    };
};
