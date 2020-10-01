import { ENTITY_TYPE_DEF_KEY, getEntityType } from './decorator-utilities';
import { transformBreezePropValidatorToFormValidator } from './create-form-validator';
import { Validator } from 'breeze-client';
import { ValidationFn, ValidationContext } from 'breeze-client/src/validate';
import { ValidEntity } from '@atypes';

export const BzPropValidator = <T>(
    targetedProp: Extract<keyof T, string>
): MethodDecorator => <U>(
    entityClass: ValidEntity,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<
        U extends ValidationFn ? ValidationFn : never
    >
) => {
    const valCtx: ValidationContext = {
        propertyName: propertyKey,
        property: targetedProp,
    };

    if (!descriptor.value) {
        throw new Error('Decorator set on non-function property');
    }

    const breezeVal = new Validator(propertyKey, descriptor.value, valCtx);

    /** Register validator with Breeze */
    Validator.registerFactory(() => breezeVal, propertyKey);

    const currentEntity = getEntityType(entityClass);

    currentEntity.custom = currentEntity.custom ?? {};

    const formVal = currentEntity.custom.formValidators ?? {
        propVal: new Map(),
    };

    const propLevelValidator = transformBreezePropValidatorToFormValidator(
        breezeVal
    );

    if (formVal.propVal.has(propertyKey)) {
        const propVals = formVal.propVal.get(propertyKey);

        propVals.push(propLevelValidator);
    } else {
        formVal.propVal.set(propertyKey, [propLevelValidator]);
    }

    Reflect.defineMetadata(ENTITY_TYPE_DEF_KEY, currentEntity, entityClass);
};
