import { SpBaseEntity } from '../sp-global/base-entity';
import { XtendedEntityTypeConfig, CustomAppFormGroup } from '@atypes';
import {
    Validators,
    ValidatorFn,
    AbstractControl,
    ValidationErrors,
} from '@angular/forms';
import { Validator } from 'breeze-client';
import * as _m from 'moment';

export const makeFormValidator = (
    entityType: Partial<XtendedEntityTypeConfig>,
) => (formGroup: CustomAppFormGroup<any>, targetEntity: SpBaseEntity): void => {
    const frmCntrlKeys = Object.keys(formGroup.controls);

    for (const cntrlKey of frmCntrlKeys) {
        const propValidators = entityType.custom?.formValidators?.propVal.get(
            cntrlKey,
        );

        if (propValidators) {
            formGroup.controls[cntrlKey].setValidators(propValidators);

            formGroup.controls[cntrlKey].updateValueAndValidity({
                onlySelf: true,
                emitEvent: false,
            });
        }
    }

    if (entityType.custom?.formValidators?.entityVal.length && targetEntity) {
        const entityLevelValidators = entityType?.custom?.formValidators?.entityVal.map(
            (ev) => ev(targetEntity),
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
    validator: Validator,
): ValidatorFn => (cntrl: AbstractControl): ValidationErrors | null => {
    let currentPropValue = cntrl.value;
    const validatorName = validator.name ?? validator.context?.propertyName;

    /**
     * Mat-Date Picker uses momentjs dates in form controls,
     */
    if (_m.isMoment(currentPropValue ?? null)) {
        currentPropValue = (cntrl.value as _m.Moment).toDate();
    }

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
    requiredProps: string[],
) => (entity: SpBaseEntity): ValidatorFn => (cntrl: AbstractControl) => {
    validator.context = validator.context || {};

    requiredProps.forEach((prop) => {
        let currentPropValue = cntrl.get(prop)?.value;

        /**
         * Mat-Date Picker uses momentjs dates in form controls,
         */
        if (_m.isMoment(currentPropValue ?? null)) {
            currentPropValue = (cntrl.value as _m.Moment).toDate();
        }

        validator.context[prop] = currentPropValue;
    });

    const result = validator.validate(entity, validator.context);

    return result ? { [`${validator.name}`]: result.errorMessage } : null;
};
