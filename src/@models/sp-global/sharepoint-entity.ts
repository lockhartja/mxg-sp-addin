import * as _l from 'lodash';
import { SpBaseEntity } from './base-entity';
import { EntityChildShortName, SelectedEntityKind } from '@atypes';
import { BzDataProp } from '../decorator';
import { SharepointMetadata } from './sharepoint-metadata';

export abstract class SharepointEntity extends SpBaseEntity {
    @BzDataProp()
    modified?: Date;

    @BzDataProp()
    created?: Date;

    @BzDataProp()
    authorId?: number;

    @BzDataProp()
    editorId?: number;

    @BzDataProp({ isNullable: false, complexTypeName: '__metadata:SP.Global' })
    // tslint:disable-next-line: variable-name
    __metadata?: Partial<SharepointMetadata>;

    /**
     * Convenience method for creating child entities for a
     * given parent.
     */
    createChild = <TChild extends EntityChildShortName<this>>(
        childType: TChild,
        defaultProps?: Partial<SelectedEntityKind<TChild>>
    ): SelectedEntityKind<TChild> => {
        if (!this.entityAspect.entityManager) {
            throw new Error('Entity Manager is missing!');
        }
        let em = this.entityAspect.entityManager;
        // creates and attaches itself to the current em;
        const props = {};
        // Assigned this parent entity as one of the properties of the child;
        props[_l.camelCase(this.shortName)] = this;
        // Need to fix the naming of the entityType. Breezejs expects PascalCase;
        const childTypeName = _l.upperFirst(childType as any) as string;
        Object.assign(props, defaultProps || {});
        const newEntity = em.createEntity(childTypeName, props);
        return (newEntity as any) as SelectedEntityKind<TChild>;
    };
}
