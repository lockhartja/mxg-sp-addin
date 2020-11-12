// https://medium.com/jspoint/introduction-to-reflect-metadata-package-and-its-ecmascript-proposal-8798405d7d88

import 'reflect-metadata';
import { Instantiable, XtendedEntityTypeCustom } from '@atypes';
import { DataProperty, DataType, Validator } from 'breeze-client/';
import { getEntityType, addDataValidator, ENTITY_TYPE_DEF_KEY } from './decorator-utilities';

import { makeFormValidator } from './create-form-validator';
import { ValidatorFn } from '@angular/forms';
import { DataPropertyConfig } from 'breeze-client/src/entity-metadata';
import { SpEntityBase } from '@models/abstract';

export const BzDataProp = <TClass extends SpEntityBase>(config: Partial<DataPropertyConfig> = {}) => (
    target: TClass,
    propertyKey: string
): void => {
    const entityTypeDef = getEntityType(target.constructor);

    entityTypeDef.dataProperties = entityTypeDef.dataProperties ?? [];

    config.name = propertyKey;

    const dataProp = new DataProperty(config);

    entityTypeDef.dataProperties.push(dataProp);

    dataProp.isComplexProperty = !!config.complexTypeName;

    if (!config.dataType && !dataProp.isComplexProperty) {
        const designType = Reflect.getOwnMetadata('design:type', target, propertyKey) as { name: string };

        const propDataType = designType.name;

        switch (propDataType.toLowerCase()) {
            case 'string':
                dataProp.dataType = DataType.String;
                break;
            case 'number':
                dataProp.dataType = DataType.Int16;
                break;
            case 'boolean':
                dataProp.dataType = DataType.Boolean;
                break;
            case 'date':
                dataProp.dataType = DataType.DateTime;
                break;
            default:
                throw new Error(`Datatype ${propDataType} unknown or missing on Entity`);
        }
    }

    entityTypeDef.custom = entityTypeDef.custom ?? ({} as Partial<XtendedEntityTypeCustom>);

    entityTypeDef.custom.formValidators = entityTypeDef.custom.formValidators ?? {
        entityVal: [],
        propVal: new Map<string, ValidatorFn[]>(),
    };

    entityTypeDef.custom.setFormValidators = entityTypeDef.custom.setFormValidators ?? makeFormValidator(entityTypeDef);

    /** Set required Validator for non-nullable types */
    if (!dataProp.isNullable) {
        addDataValidator(dataProp, Validator.required());
    }

    /** Set maxLength Validator  types */
    if (dataProp.maxLength != null && dataProp.dataType === DataType.String) {
        addDataValidator(dataProp, Validator.maxLength({ maxLength: config.maxLength }));
    }

    /**
     * Look at each of the non-string data types
     * and discover if there are any Breeze validator based
     * solely on the datatype. i.e. int16 validator in a
     * range of numbers. if they exists and haven't alread
     * been added push them into the data property validators.
     */
    if (dataProp.dataType !== DataType.String && !dataProp.isComplexProperty) {
        const dt = dataProp.dataType as DataType;
        if (dt.validatorCtor) {
            addDataValidator(dataProp, dt.validatorCtor());
        }
    }

    Reflect.defineMetadata(ENTITY_TYPE_DEF_KEY, entityTypeDef, target);
};
