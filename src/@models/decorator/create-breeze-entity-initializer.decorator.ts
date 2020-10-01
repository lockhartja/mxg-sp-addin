import 'reflect-metadata';
import { DoNotCare } from '@atypes';
import { ENTITY_TYPE_DEF_KEY, getEntityType } from './decorator-utilities';

export const BzEntityInitializer: MethodDecorator = <T>(
    target: DoNotCare,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T extends Function ? Function : never>
) => {
    const entityType = getEntityType(target);
    entityType.initFn = descriptor.value;
    Reflect.defineMetadata(ENTITY_TYPE_DEF_KEY, entityType, target);
};
