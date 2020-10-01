import 'reflect-metadata';
import {
    DoNotCare,
    Instantiable,
    XtendedEntityTypeConfig,
    IBzNameDict,
} from '@atypes';
import { SharepointEntity } from '../sp-global/sharepoint-entity';
import { Validator } from 'breeze-client';
import { DataPropertyConfig } from 'breeze-client/src/entity-metadata';
import * as _l from 'lodash';
import { ValidEntity } from '@atypes';

export const ENTITY_TYPE_DEF_KEY = Symbol('EntityTypeDef');
export const SP_INTERNAL_NAME_DICT_KEY = Symbol('SpInternalNameDict');
export const SHARED_PROP_KEY = Symbol('SharedPropKey');

/**
 * Utility function to retrieved properties from base classes that
 * intended to be shared amoung all subclasses. This function is meant
 * to be called from the create entity decorator, not on a base, non-entity
 * classes.
 */
export function loadParentProps(target: DoNotCare): void {
    /**
     * Step 1: Get the Entity Type arguments from the cureent entity;
     */
    const currentEntityType = getEntityType(target);

    /**
     * Step 2: get the prototype of the current entity or null;
     */
    let proto = Object.getPrototypeOf(target);

    /**
     * Step 3: if the current target has a proto start looping
     * over all the prototypes to find all hierarchical prototypes
     * with properties;
     */
    while (typeof proto !== 'object') {
        const protoEntityType = getEntityType(proto);

        if (_l.isEmpty(protoEntityType)) {
            proto = Object.getPrototypeOf(proto);
            continue;
        }

        if (protoEntityType.dataProperties?.length) {
            currentEntityType.dataProperties = currentEntityType.dataProperties.concat(
                protoEntityType.dataProperties
            );
        }

        if (protoEntityType.navigationProperties?.length) {
            currentEntityType.navigationProperties = currentEntityType.navigationProperties.concat(
                protoEntityType.navigationProperties
            );
        }
        //TODO:  May need to get custom validators

        proto = Object.getPrototypeOf(proto);
    }
}

/**
 * Utility function to retrieved internal name dictionary from base classes that
 * intended to be shared amoung all subclasses. This function is meant
 * to be called from the create entity decorator, not on a base, non-entity
 * classes.
 */
export function loadParentSpNameDict(target: DoNotCare): void {
    /**
     * Step 1: Get the Entity Type arguments from the cureent entity;
     */
    const currentEntityTypeNameDict = getEntityTypeNameDict(target);

    /**
     * Step 2: get the prototype of the current entity or null;
     */
    let proto = Object.getPrototypeOf(target);

    /**
     * Step 3: if the current target has a proto start looping
     * over all the prototypes to find all hierarchical prototypes
     * with properties;
     */
    while (typeof proto !== 'object') {
        const protoEntityTypeNameDict = getEntityTypeNameDict(proto);

        if (_l.isEmpty(protoEntityTypeNameDict)) {
            proto = Object.getPrototypeOf(proto);
            continue;
        }

        Object.assign(currentEntityTypeNameDict, protoEntityTypeNameDict);

        proto = Object.getPrototypeOf(proto);
    }
}

/**
 * Utility function to share between the create-breeze-entity decorators
 * to apply common properties to the entity type.
 */
export function initialSetupEntity(
    constructor: Instantiable<ValidEntity>
): Partial<XtendedEntityTypeConfig> {
    const entityType = getEntityType(constructor);

    const clazz = new constructor() as SharepointEntity;

    entityType.shortName = clazz.shortName;

    entityType.namespace = clazz.namespace;

    return entityType;
}

/**
 * Utility function to get the Entity Type Config data from metadata; create a
 * blank object and assign it if it doesn't have metadata
 */
export function getEntityType(
    entityClass: ValidEntity | Instantiable<ValidEntity>
): Partial<XtendedEntityTypeConfig> {
    if (Reflect.hasOwnMetadata(ENTITY_TYPE_DEF_KEY, entityClass)) {
        return Reflect.getOwnMetadata(ENTITY_TYPE_DEF_KEY, entityClass);
    }

    const entityTypeArgs: Partial<XtendedEntityTypeConfig> = {};

    Reflect.defineMetadata(ENTITY_TYPE_DEF_KEY, entityTypeArgs, entityClass);

    return entityTypeArgs;
}

/**
 * Utility function to get the Entity Type Config data from metadata; create a
 * blank object and assign it if it doesn't have metadata
 */
export function getEntityTypeNameDict(entityClass: ValidEntity): IBzNameDict {
    let spInternalNameDict: {
        [index: string]: string;
    };

    if (Reflect.hasOwnMetadata(SP_INTERNAL_NAME_DICT_KEY, entityClass)) {
        spInternalNameDict = Reflect.getOwnMetadata(
            SP_INTERNAL_NAME_DICT_KEY,
            entityClass
        );
    } else {
        spInternalNameDict = {};

        Reflect.defineMetadata(
            SP_INTERNAL_NAME_DICT_KEY,
            spInternalNameDict,
            entityClass
        );
    }

    return spInternalNameDict;
}

/**
 * Utility function to get the Entity Type Validator  data from metadata; create a
 * blank object and assign it if it doesn't have metadata
 */
export function getEntityValidators(entityClass: ValidEntity): IBzNameDict {
    let spInternalNameDict: {
        [index: string]: string;
    };

    if (Reflect.hasOwnMetadata(SP_INTERNAL_NAME_DICT_KEY, entityClass)) {
        spInternalNameDict = Reflect.getOwnMetadata(
            SP_INTERNAL_NAME_DICT_KEY,
            entityClass
        );
    } else {
        spInternalNameDict = {};

        Reflect.defineMetadata(
            SP_INTERNAL_NAME_DICT_KEY,
            spInternalNameDict,
            entityClass
        );
    }

    return spInternalNameDict;
}

export const addDataValidator = (
    dataPropCfg: DataPropertyConfig,
    validator: Validator
): void => {
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
