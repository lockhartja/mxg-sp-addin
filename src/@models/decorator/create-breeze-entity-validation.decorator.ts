import { getEntityType } from './decorator-utilities';
import { transformBreezeEntityValidatorToFormValidator } from './create-form-validator';
import { Validator } from 'breeze-client';
import { ValidationFn } from 'breeze-client/src/validate';
import { ValidEntity } from '@atypes';

export const BzEntityValidator = <T>(
    requiredProps: Extract<keyof T, string>[],
): MethodDecorator => <U>(
    entityClass: ValidEntity,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<
        U extends ValidationFn ? ValidationFn : never
    >,
) => {
    const breezeVal = new Validator(propertyKey, descriptor.value);

    /** Register validator with Breeze */
    Validator.registerFactory(() => breezeVal, propertyKey);

    const currentEntity = getEntityType(entityClass);

    currentEntity.custom.formValidators.entityVal =
        currentEntity.custom.formValidators.entityVal || [];

    const entityLevelValidator = transformBreezeEntityValidatorToFormValidator(
        breezeVal,
        requiredProps,
    );

    currentEntity.custom.formValidators.entityVal.push(entityLevelValidator);
};
