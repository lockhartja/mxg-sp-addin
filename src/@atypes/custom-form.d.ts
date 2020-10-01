import { FormGroup, FormControl } from '@angular/forms';

export type CustomFormControl<T> = { [key in keyof T]: FormControl };

export type CustomFormGroup = Omit<FormGroup, 'controls'>;

export type CustomAppFormGroup<T extends CustomFormControl<T>> = Omit<
    FormGroup,
    'controls'
> & {
    controls: CustomFormControl<T>;
};

export type AppFormGroup<T extends CustomFormControl<T>> = CustomFormGroup & {
    controls: CustomFormControl<T>;
};

export interface IAppFormGroup<T> extends CustomFormGroup {
    controls: CustomFormControl<T>;
}
