// https://medium.com/jspoint/introduction-to-reflect-metadata-package-and-its-ecmascript-proposal-8798405d7d88

import 'reflect-metadata';
import { decorateBzNavProp, DoNotCare } from '@atypes';
import { NavigationProperty } from 'breeze-client';
import { ENTITY_TYPE_DEF_KEY, getEntityType } from './decorator-utilities';

export const BzNavProp: typeof decorateBzNavProp = (
    reciprocalEntity,
    config = {}
) => (target: DoNotCare, propertyKey: string): void => {
    let entityTypeDef = getEntityType(target);

    entityTypeDef.navigationProperties =
        entityTypeDef.navigationProperties || [];

    entityTypeDef.navigationProperties.push(new NavigationProperty(config));

    const relatedEntityName = reciprocalEntity.name;

    console.log(relatedEntityName);

    config.entityTypeName = relatedEntityName;

    config.associationName = config.isScalar
        ? `${relatedEntityName}_${target.constructor.name}`
        : `${target.constructor.name}_${relatedEntityName}`;

    if (config.isScalar) {
        config.foreignKeyNames = config.foreignKeyNames || [propertyKey + 'Id'];
    }

    Reflect.defineMetadata(ENTITY_TYPE_DEF_KEY, entityTypeDef, target);
};
