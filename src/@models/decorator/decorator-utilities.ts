import 'reflect-metadata';
import { Instantiable, XtendedEntityTypeConfig, SpEntities, IBzCustomNameDictionary } from '@atypes';
import { SpListEntityBase } from '../abstract/sp-list-entity-base';
import { Validator } from 'breeze-client';
import { DataPropertyConfig } from 'breeze-client/src/entity-metadata';
import _ from 'lodash';
import { SpEntityBase } from '@models/abstract';

export const ENTITY_TYPE_DEF_KEY = Symbol('EntityTypeDef');
export const ENTITY_TYPE_ID_KEY = Symbol('EntityId');
export const SP_INTERNAL_NAME_DICT_KEY = Symbol('SpInternalNameDict');
export const SHARED_PROP_KEY = Symbol('SharedPropKey');

/**
 * Utility function to retrieved properties from base classes that
 * intended to be shared among all subclasses. This function is meant
 * to be called from the create entity decorator, not on a base, non-entity
 * classes.
 */
export function loadParentProps<TClass extends SpEntityBase>(target: TClass): void {
    /**
     * Step 1: Get the Entity Type arguments from the current entity;
     */
    const currentEntityType = getEntityType(target);

    /**
     * Step 2: get the prototype of the current entity or null;
     */
    let proto = Object.getPrototypeOf(target) as TClass;

    /**
     * Step 3: if the current target has a proto start looping
     * over all the prototypes to find all hierarchical prototypes
     * with properties;
     */
    while (typeof proto !== 'object') {
        const protoEntityType = getEntityType(proto);

        if (_.isEmpty(protoEntityType)) {
            proto = Object.getPrototypeOf(proto) as TClass;
            continue;
        }

        if (protoEntityType.dataProperties?.length) {
            // Do not overwrite duplicate properties
            protoEntityType.dataProperties.forEach((dp) => {
                if (currentEntityType.dataProperties.some((cdp) => cdp.name === dp.name)) {
                    return;
                }
                currentEntityType.dataProperties.push(dp);
            });
        }

        if (protoEntityType.navigationProperties?.length) {
            // Do not overwrite navigationProperties properties
            protoEntityType.navigationProperties.forEach((np) => {
                if (currentEntityType.navigationProperties.some((cnp) => cnp.name === np.name)) {
                    return;
                }
                currentEntityType.navigationProperties.push(np);
            });
        }
        //TODO:  May need to get custom validators

        proto = Object.getPrototypeOf(proto) as TClass;
    }
}

/**
 * Utility function to retrieved internal name dictionary from base classes that
 * intended to be shared amoung all subclasses. This function is meant
 * to be called from the create entity decorator, not on a base, non-entity
 * classes.
 */
export function loadParentSpNameDict<TClass extends SpEntityBase>(target: TClass): void {
    /**
     * Step 1: Get the Entity Type arguments from the current entity;
     */
    const currentEntityTypeNameDict = getEntityTypeNameDict((target as unknown) as Instantiable<TClass>, true);

    /**
     * Step 2: get the prototype of the current entity or null;
     */
    let proto = Object.getPrototypeOf(target) as SpEntities;

    /**
     * Step 3: if the current target has a proto start looping
     * over all the prototypes to find all hierarchical prototypes
     * with properties;
     */
    while (typeof proto !== 'object') {
        const protoEntityTypeNameDict = getEntityTypeNameDict(proto, true);

        if (_.isEmpty(protoEntityTypeNameDict)) {
            proto = Object.getPrototypeOf(proto) as SpEntities;
            continue;
        }

        Object.assign(currentEntityTypeNameDict, protoEntityTypeNameDict);

        proto = Object.getPrototypeOf(proto) as SpEntities;
    }
}

/**
 * Utility function to share between the create-breeze-entity decorators
 * to apply common properties to the entity type.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function initialSetupEntity<TClass extends Instantiable<SpEntityBase>>(
    constructor: TClass
): Partial<XtendedEntityTypeConfig> {
    const entityType = getEntityType(constructor);

    const clazz = new constructor() as SpListEntityBase;

    entityType.shortName = clazz.shortName as string;

    entityType.namespace = clazz.namespace;

    return entityType;
}

/**
 * Utility function to get the Entity Type Config data from metadata; create a
 * blank object and assign it if it doesn't have metadata
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function getEntityType<TClass extends SpEntityBase | Function>(
    entityClass: TClass
): Partial<XtendedEntityTypeConfig> {
    if (Reflect.hasOwnMetadata(ENTITY_TYPE_DEF_KEY, entityClass)) {
        return Reflect.getOwnMetadata(ENTITY_TYPE_DEF_KEY, entityClass) as Partial<XtendedEntityTypeConfig>;
    }

    const entityTypeArgs: Partial<XtendedEntityTypeConfig> = {};

    Reflect.defineMetadata(ENTITY_TYPE_DEF_KEY, entityTypeArgs, entityClass);

    return entityTypeArgs;
}

/**
 * Utility function to get the Entity Type Config data from metadata; create a
 * blank object and assign it if it doesn't have metadata
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function getEntityTypeNameDict<TClass extends Instantiable<SpEntityBase>>(
    entityClass: TClass,
    isTopEntity = false
): IBzCustomNameDictionary {
    let spInternalNameDict: IBzCustomNameDictionary;

    if (Reflect.hasOwnMetadata(SP_INTERNAL_NAME_DICT_KEY, entityClass)) {
        spInternalNameDict = Reflect.getOwnMetadata(SP_INTERNAL_NAME_DICT_KEY, entityClass) as IBzCustomNameDictionary;
    } else {
        if (isTopEntity) {
            return;
        }
        spInternalNameDict = {};

        const clazz = new entityClass() as SpListEntityBase;

        spInternalNameDict[`${clazz.shortName as string}:#${clazz.namespace}`] = {};

        Reflect.defineMetadata(SP_INTERNAL_NAME_DICT_KEY, spInternalNameDict, entityClass);
    }
    return spInternalNameDict;
}

/**
 * Utility function to get the Entity Type Validator  data from metadata; create a
 * blank object and assign it if it doesn't have metadata
 */
export function getEntityValidators<TClass extends SpEntityBase>(entityClass: TClass): Record<string, string> {
    let spInternalNameDict: {
        [index: string]: string;
    };

    if (Reflect.hasOwnMetadata(SP_INTERNAL_NAME_DICT_KEY, entityClass)) {
        spInternalNameDict = Reflect.getOwnMetadata(
            SP_INTERNAL_NAME_DICT_KEY,
            entityClass
        ) as typeof spInternalNameDict;
    } else {
        spInternalNameDict = {};

        Reflect.defineMetadata(SP_INTERNAL_NAME_DICT_KEY, spInternalNameDict, entityClass);
    }

    return spInternalNameDict;
}

export const addDataValidator = (dataPropCfg: DataPropertyConfig, validator: Validator): void => {
    if (!validator) {
        return;
    }

    const valName = validator.name;

    dataPropCfg.validators = dataPropCfg.validators || [];

    const exists = dataPropCfg.validators.some((val) => val.name === valName);

    if (exists) {
        return;
    }

    dataPropCfg.validators.push(validator);
};
