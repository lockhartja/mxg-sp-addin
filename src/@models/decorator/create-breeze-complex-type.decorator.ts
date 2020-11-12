import 'reflect-metadata';
import { initialSetupEntity, ENTITY_TYPE_DEF_KEY } from './decorator-utilities';
import { Instantiable, SpEntities } from '@atypes';
import { ComplexType } from 'breeze-client';
import { SpEntityBase } from '@models/abstract';

export const BzComplexEntity = <TClass extends Instantiable<SpEntityBase>>(constructor: TClass): void => {
    const entityType = initialSetupEntity(constructor);
    // entityType.isComplexType = true;
    Reflect.defineMetadata(ENTITY_TYPE_DEF_KEY, new ComplexType(entityType), constructor);
};
