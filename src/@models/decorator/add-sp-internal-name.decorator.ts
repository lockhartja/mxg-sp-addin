import 'reflect-metadata';
import {
    getEntityTypeNameDict,
    SP_INTERNAL_NAME_DICT_KEY,
} from './decorator-utilities';
import { DoNotCare } from '@atypes';

export const BzSpInternalName = (spInternalName: string): PropertyDecorator => (
    target: DoNotCare,
    propertyKey: string
): void => {
    const nameDictionary = getEntityTypeNameDict(target);
    nameDictionary[propertyKey] = spInternalName;
    Reflect.defineMetadata(SP_INTERNAL_NAME_DICT_KEY, nameDictionary, target);
};
