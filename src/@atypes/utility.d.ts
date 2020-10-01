import {
    DataPropertyConfig,
    NavigationPropertyConfig,
} from 'breeze-client/src/entity-metadata';
import { SharepointEntity, SharepointMetadata } from '@models';
import { Routes, Route } from '@angular/router';

export type Instantiable<T> = new (...args: any[]) => T;

export interface IInstatiable {
    new (...args: any[]);
}

export type AppEndpoints = 'dashboard' | 'admin' | 'home' | 'msm' | '' | '**';

export interface AppRoute extends Route {
    path?: AppEndpoints;
}

export type AppRoutes = AppRoute[];

export interface ISharedConfig {
    propName: string;
    propConfig: DataPropertyConfig | NavigationPropertyConfig;
}

// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
export type Unarray<T> = T extends Array<infer U> ? U : T;

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type PropertiesInType<T, K> = {
    [P in keyof T]: T[P] extends K ? P : never;
}[keyof T];

export type PropertiesNotInType<T, K> = {
    [P in keyof T]: T[P] extends K ? never : P;
}[keyof T];

export type ObjectInitializer = {} extends undefined ? Object : never;

/**
 * Alias for any type to better capture why
 * the any type was used.
 */
export type ToComplex = any;
export type DoNotCare = any;
export type FixLater = any;
export type CompatibilityFix = any;
// export type NonMethodMembers<T> = Pick<T, Exclude<keyof T, MethodMembers<T>>>;
