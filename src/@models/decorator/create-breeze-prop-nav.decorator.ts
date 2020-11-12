// https://medium.com/jspoint/introduction-to-reflect-metadata-package-and-its-ecmascript-proposal-8798405d7d88

import 'reflect-metadata';

import { NavigationProperty } from 'breeze-client';
import { ENTITY_TYPE_DEF_KEY, getEntityType } from './decorator-utilities';
import { NavigationPropertyConfig } from 'breeze-client/src/entity-metadata';
import { Instantiable, SpEntities } from '@atypes';
import { SpEntityBase } from '@models/abstract';

export const BzNavProp = <TClass extends SpEntityBase>(
    config: Partial<NavigationPropertyConfig> = {}
) => (target: TClass, propertyKey: string): void => {
    const entityTypeDef = getEntityType(target.constructor);

    entityTypeDef.navigationProperties = entityTypeDef.navigationProperties ?? [];

    const designType = Reflect.getOwnMetadata('design:type', target, propertyKey) as {
        name: string;
    };

    config.name = propertyKey;

    //Be careful the designType for array<T> is 'array' not T;
    config.entityTypeName = config.entityTypeName || designType.name;

    config.associationName =
        config.associationName ||
        (config.isScalar
            ? `${config.entityTypeName}_${target.constructor.name}`
            : `${target.constructor.name}_${config.entityTypeName}`);

    if (config.isScalar) {
        config.foreignKeyNames = config.foreignKeyNames || [`${propertyKey}Id`];
    }

    entityTypeDef.navigationProperties.push(new NavigationProperty(config));

    Reflect.defineMetadata(ENTITY_TYPE_DEF_KEY, entityTypeDef, target);
};
