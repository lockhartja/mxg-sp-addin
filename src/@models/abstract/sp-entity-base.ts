import { EntityAspect, SaveResult, Entity } from 'breeze-client';
import {
    RelatedEntity,
    IAppFormGroup,
    XtendedEntityType,
    XtendedEntityMgr,
    PossibleNameSpace,
    SpEntities,
    Instantiable,
    EntityChildrenKind,
} from '@atypes';
import _ from 'lodash';
import Swal, { SweetAlertOptions } from 'sweetalert2';

export abstract class SpEntityBase implements Entity {
    readonly shortName: unknown;

    abstract readonly namespace: PossibleNameSpace;

    isSoftDeleted?: boolean;

    entityAspect: EntityAspect;
    entityType: XtendedEntityType;

    applyFormChanges(formGroup: IAppFormGroup<Partial<this>>): void {
        const fgControls = formGroup.controls;
        const props = (Object.getOwnPropertyNames(fgControls).filter(
            (prop) => prop in this
        ) as unknown) as Array<keyof this>;

        for (const prop of props) {
            if (this[prop] === fgControls[prop].value) {
                continue;
            }
            this[prop] === fgControls[prop].value;
        }
    }

    /**
     * Convenience method for creating child entities for a
     * given parent.
     */
    createChild = <TChild extends EntityChildrenKind<this>>(
        childType: TChild['shortName'],
        defaultProps?: Partial<TChild>
    ): TChild => {
        if (!this.entityAspect.entityManager) {
            throw new Error('Entity Manager is missing!');
        }

        const em = this.entityAspect.entityManager;

        // creates and attaches itself to the current em;
        const props = {};

        // Assigned this parent entity as one of the properties of the child;
        props[_.camelCase(this.shortName as string)] = this;

        Object.assign(props, defaultProps || {});

        const newEntity = em.createEntity(childType as string, props);

        return newEntity as TChild;
    };

    getRawKeys(): string[] {
        const keys = Object.keys(this);
        const ignoredKeys = ['entityType', 'entityAspect', '__metadata'];
        return keys.filter((key) => !ignoredKeys.includes(key));
    }

    /**
     * Shortcut method for getting an Entity Type based
     * on related existing type.
     * Keeps us from creating an entity just to get ahold
     * of its entity type i.e. for form validation thats located
     * on the entity type.
     */
    getRelatedEntityType = <TRelatedEntity extends RelatedEntity<this>>(
        relatedEntity: TRelatedEntity['shortName']
    ): XtendedEntityType => {
        const relatedEntityName = _.upperFirst(relatedEntity as string);

        return this.entityType.metadataStore.getAsEntityType(
            relatedEntityName
        ) as XtendedEntityType;
    };

    async cancelChanges(withConfirmation = true): Promise<boolean> {
        const etState = this.entityAspect.entityState;

        /**
         * Check if a non-new item has even been modified. If not
         * exit the operation successfully.
         */
        if (!etState.isAdded() && !etState.isModified()) {
            return true;
        }

        if (withConfirmation) {
            const alertCfg: SweetAlertOptions = {
                title: 'Chancel Changes?',
                icon: 'question',
                showCancelButton: true,
                showConfirmButton: true,
                cancelButtonText: 'No, continue editing',
                confirmButtonText: 'Yes, reject changes',
            };

            const result = await Swal.fire(alertCfg);

            if (result.dismiss === Swal.DismissReason.cancel) {
                return false;
            }
        }

        this.entityAspect.rejectChanges();
        return true;
    }

    async delete(withConfirmation = true, addMessage?: string, immediate = true): Promise<boolean> {
        /**
         * Need to get ahold of the entity manager before setting
         * a deletion action...it will be unavailable the deletion
         * command is called.
         */
        // const em = this.entityAspect.entityManager;
        if (withConfirmation) {
            const alertCfg: SweetAlertOptions = {
                title: 'Confirm Deletion?',
                text: addMessage || `Are you sure? This action is permanent.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!',
            };

            const result = await Swal.fire(alertCfg);

            if (result.dismiss === Swal.DismissReason.cancel) {
                return false;
            }
        }

        this.entityAspect.setDeleted();

        if (immediate) {
            await this.save();
        }

        return true;
    }

    async save(entityMgr?: XtendedEntityMgr<SpEntities['namespace']>): Promise<SaveResult | void> {
        /**
         * In case save is called after a deletion, pass in a reference to
         * the em before the item was deleted.
         */
        const emMgr = (entityMgr || this.entityAspect.entityManager) as XtendedEntityMgr<
            SpEntities['namespace']
        >;

        if (!emMgr) {
            throw new Error('Unable to save entity, Cannot locate related manager!');
        }

        if (this.entityAspect.entityState.isUnchanged()) {
            return;
        }

        emMgr.isSaving.next(true);

        const saveResult = await emMgr.saveChanges([this as Entity]).finally(() => {
            emMgr.isSaving.next(false);
        });
        return saveResult;
    }
}
