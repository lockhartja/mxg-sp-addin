import { Instantiable, SpEntities } from '@atypes';
import { SpEntityBase } from '@models/abstract';
import 'reflect-metadata';
import { getEntityTypeNameDict, SP_INTERNAL_NAME_DICT_KEY } from './decorator-utilities';

export const BzSpInternalName = <TClass extends SpEntityBase>(spInternalName: string): PropertyDecorator => (
    target: TClass,
    propertyKey: string
): void => {
    /** Shape of target object being created
     * var clientToServerDictionary = {
     *      'Customer:#Northwind.Models': {customerName: 'CompanyName', zip: 'PostalCode'},
     *      'Order:#Northwind.Models':    {freightCost: 'Freight'}
     *      undefined: {foo: 'Bar'} // translation for expected anonymous type property
     * };
     */
    const nameDictionary = getEntityTypeNameDict(target.constructor as Instantiable<SpEntityBase>);

    //There should be only one key per Entity
    nameDictionary[Object.keys(nameDictionary)[0]][propertyKey] = spInternalName;

    console.log(nameDictionary);

    Reflect.defineMetadata(SP_INTERNAL_NAME_DICT_KEY, nameDictionary, target);
};
