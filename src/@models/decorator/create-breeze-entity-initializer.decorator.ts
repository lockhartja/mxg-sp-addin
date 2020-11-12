import { Instantiable, SpEntities } from '@atypes';
import { SpEntityBase } from '@models/abstract';
import 'reflect-metadata';
import { ENTITY_TYPE_DEF_KEY, getEntityType } from './decorator-utilities';

export const BzEntityInitializer: MethodDecorator = <TClass extends Instantiable<SpEntityBase>>(
    target: TClass,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<unknown>
) => {
    const entityType = getEntityType(target);
    entityType.initFn = descriptor.value;
    Reflect.defineMetadata(ENTITY_TYPE_DEF_KEY, entityType, target);
};
