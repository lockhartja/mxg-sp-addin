import 'reflect-metadata';
import { SpEntities, Instantiable, XtendedEntityTypeCustom } from '@atypes';
import {
    initialSetupEntity,
    SP_INTERNAL_NAME_DICT_KEY,
    ENTITY_TYPE_DEF_KEY,
    loadParentProps,
    loadParentSpNameDict,
    ENTITY_TYPE_ID_KEY,
} from './decorator-utilities';

import { AutoGeneratedKeyType, EntityType } from 'breeze-client';
import _ from 'lodash';
import { SpEntityBase } from '@models/abstract';

export const BzEntity = <TClass extends Instantiable<SpEntityBase>>(constructor: TClass): void => {
    const entityType = initialSetupEntity(constructor);

    entityType.navigationProperties = entityType.navigationProperties ?? [];
    entityType.dataProperties = entityType.dataProperties ?? [];

    Reflect.defineMetadata(ENTITY_TYPE_DEF_KEY, entityType, constructor);

    loadParentProps((constructor as unknown) as SpEntityBase);
    loadParentSpNameDict((constructor as unknown) as SpEntityBase);

    //needed to reset properties that are reused by subclass;
    entityType.dataProperties.forEach((dp) => (dp.parentType = undefined));

    for (const propCfg of entityType.navigationProperties) {
        if (propCfg?.entityTypeName && !propCfg.entityTypeName.includes(':#')) {
            propCfg.entityTypeName += ':#' + entityType.namespace;
        }
    }

    for (const propCfg of entityType.dataProperties) {
        if (propCfg?.complexTypeName && !propCfg.complexTypeName.includes(':#')) {
            propCfg.complexTypeName += ':#' + entityType.namespace;
        }
    }

    const selectProps = entityType.dataProperties
        .filter((propCfg) => !propCfg.complexTypeName)
        .map((dataProp) => dataProp.name);

    entityType.custom = entityType.custom ?? ({} as Partial<XtendedEntityTypeCustom>);

    entityType.custom.defaultSelect = selectProps.join(',');

    // if (Reflect.hasOwnMetadata(SP_INTERNAL_NAME_DICT_KEY, constructor)) {
    //     const dictEntries = Reflect.getOwnMetadata(SP_INTERNAL_NAME_DICT_KEY, constructor) as {
    //         [index: string]: string;
    //     };

    //     const dictForEntityType = {};

    //     Object.keys(dictEntries).forEach((entryKey) => {
    //         const dictKey = `${entryKey}:#${entityType.namespace}`;
    //         const dictProp = dictEntries[entryKey];
    //         dictForEntityType[dictKey] = dictProp;
    //     });

    //     Reflect.defineMetadata(SP_INTERNAL_NAME_DICT_KEY, dictForEntityType, constructor);
    // }

    const idTypeKey = Reflect.getMetadata(ENTITY_TYPE_ID_KEY, constructor) as AutoGeneratedKeyType | undefined;

    if (idTypeKey) {
        Reflect.deleteMetadata(ENTITY_TYPE_ID_KEY, constructor);
        entityType.autoGeneratedKeyType = idTypeKey;
    } else {
        entityType.autoGeneratedKeyType = AutoGeneratedKeyType.Identity;
    }

    entityType.defaultResourceName = `_api/web/lists/getByTitle('${entityType.shortName}')/items`;

    Reflect.defineMetadata(ENTITY_TYPE_DEF_KEY, new EntityType(entityType), constructor);
};
