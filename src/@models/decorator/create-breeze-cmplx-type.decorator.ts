import 'reflect-metadata';
import { initialSetupEntity, ENTITY_TYPE_DEF_KEY } from './decorator-utilities';
import { Instantiable, ValidEntity } from '@atypes';
import * as _l from 'lodash';
import { ComplexType } from 'breeze-client';

export const BzComplexEntity = (
    constructor: Instantiable<ValidEntity>
): void => {
    const entityType = initialSetupEntity(constructor);
    // entityType.isComplexType = true;
    Reflect.defineMetadata(
        ENTITY_TYPE_DEF_KEY,
        new ComplexType(entityType),
        constructor
    );
};
