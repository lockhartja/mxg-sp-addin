import { SpEntityBase } from '../abstract/sp-entity-base';
import { XtendedEntityTypeConfig, CustomAppFormGroup } from '@atypes';
import {
    Validators,
    ValidatorFn,
    AbstractControl,
    ValidationErrors,
    FormControl,
} from '@angular/forms';
import { Validator } from 'breeze-client';

export const makeFormValidator = (
    entityType: Partial<XtendedEntityTypeConfig>
) => (
    formGroup: CustomAppFormGroup<unknown>,
    targetEntity: SpEntityBase
): void => {
    const frmCntrlKeys = Object.keys(formGroup.controls);

    for (const cntrlKey of frmCntrlKeys) {
        const propValidators = entityType.custom?.formValidators?.propVal.get(
            cntrlKey
        );

        if (propValidators) {
            const formControl = formGroup.controls[cntrlKey] as FormControl;

            formControl.setValidators(propValidators);

            formControl.updateValueAndValidity({
                onlySelf: true,
                emitEvent: false,
            });
        }
    }

    if (entityType.custom?.formValidators?.entityVal.length && targetEntity) {
        const entityLevelValidators = entityType?.custom?.formValidators?.entityVal.map(
            (ev) => ev(targetEntity)
        );

        formGroup.setValidators(Validators.compose(entityLevelValidators));

        formGroup.updateValueAndValidity({
            onlySelf: true,
            emitEvent: false,
        });
    }
};

/**
 * Wraps a typical Breeze validator into a Form Control validator.
 * The standard Breeze validator is passed during the
 *  entity prop decorator and the resulting
 * Form validation function is stored in each individual data property
 * on the Breeze entity type.
 */
export const transformBreezePropValidatorToFormValidator = (
    validator: Validator
): ValidatorFn => (cntrl: AbstractControl): ValidationErrors | null => {
    const currentPropValue = cntrl.value as unknown;

    const validatorName = validator.name ?? validator.context?.propertyName;

    const result = validator.validate(currentPropValue, validator.context);

    return result ? { [validatorName]: result.errorMessage } : null;
};

/**
 * Wraps a typical Breeze validator into a Form Control validator.
 * The standard Breeze validator is passed during the
 *  entity prop decorator and the resulting
 * function will be called during the formgroup generation
 * so that the represented entity value and properities needed for validation
 * can be passed into the Form Validation function stored in each on the
 * Breeze entity type.
 */
export const transformBreezeEntityValidatorToFormValidator = (
    validator: Validator,
    requiredProps: string[]
) => (entity: SpEntityBase): ValidatorFn => (cntrl: AbstractControl) => {
    validator.context = validator.context || {};

    requiredProps.forEach((prop) => {
        const currentPropValue = cntrl.get(prop) as FormControl;

        if (!currentPropValue) {
            return;
        }

        validator.context[prop] = currentPropValue;
    });

    const result = validator.validate(entity, validator.context);

    return result ? { [`${validator.name}`]: result.errorMessage } : null;
};
