import {
    DataType,
    EntityAspect,
    EntityManager,
    SaveResult,
    Entity,
    EntityAction,
} from 'breeze-client';
import {
    RelatedEntityShortName,
    IAppFormGroup,
    SharepointKnownNamespace,
    XtendedEntityType,
    XtendedEntity,
    XtendedEntityMgr,
} from '@atypes';
import * as _l from 'lodash';
import Swal, { SweetAlertOptions } from 'sweetalert2';
import { BzDataProp } from '../decorator/create-breeze-prop-data.decorator';

export abstract class SpBaseEntity implements XtendedEntity {
    readonly shortName: string;
    abstract readonly namespace: SharepointKnownNamespace;
    isSoftDeleted?: boolean;

    @BzDataProp({ isPartOfKey: true, dataType: DataType.Int16 })
    id?: number | string;

    entityAspect: EntityAspect;
    entityType: XtendedEntityType;

    applyFormChanges(formGroup: IAppFormGroup<Partial<this>>): void {
        const fgControls = formGroup.controls;
        const props = Object.getOwnPropertyNames(fgControls).filter(
            (prop) => prop in this
        );

        for (const prop in props) {
            if (this[prop] === fgControls[prop].value) {
                continue;
            }
            this[prop] === fgControls[prop].value;
        }
    }

    /**
     * Shortcut method for getting an Entity Type based
     * on related existing type.
     * Keeps us from creating an entity just to get ahold
     * of its entity type i.e. for form validation thats located
     * on the entity type.
     */
    getRelatedEntityType = <
        TRelatedEntity extends RelatedEntityShortName<this>
    >(
        relatedEntity: TRelatedEntity
    ): XtendedEntityType => {
        const relatedEntityName = _l.upperFirst(relatedEntity as any) as string;

        return this.entityType.metadataStore.getEntityType(
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

    async delete(
        withConfirmation = true,
        addMessage?: string,
        immediate = true
    ): Promise<boolean> {
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

    async save(entityMgr?: XtendedEntityMgr<any>): Promise<SaveResult | void> {
        /**
         * In case save is called after a deletion, pass in a reference to
         * the em before the item was deleted.
         */
        const emMgr = (entityMgr ||
            this.entityAspect.entityManager) as XtendedEntityMgr<any>;

        if (!emMgr) {
            throw new Error(
                'Unable to save entity, Cannot locate related manager!'
            );
        }

        if (this.entityAspect.entityState.isUnchanged()) {
            return;
        }

        emMgr.isSaving.next(true);

        const saveResult = await emMgr
            .saveChanges([(this as any) as Entity])
            .finally(() => {
                emMgr.isSaving.next(false);
            });
        return saveResult;
    }
}
