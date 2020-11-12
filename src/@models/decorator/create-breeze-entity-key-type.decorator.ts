import 'reflect-metadata';
import { Instantiable, SpEntities } from '@atypes';
import { ENTITY_TYPE_ID_KEY } from './decorator-utilities';
import { AutoGeneratedKeyType } from 'breeze-client';
import { SpEntityBase } from '@models/abstract';

export const BzEntityKey = <TClass extends Instantiable<SpEntityBase>>(idKey: AutoGeneratedKeyType) => (
    constructor: TClass
): void => {
    Reflect.defineMetadata(ENTITY_TYPE_ID_KEY, idKey, constructor);
};