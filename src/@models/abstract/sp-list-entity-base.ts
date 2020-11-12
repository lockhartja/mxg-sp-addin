import { SpEntityBase } from './sp-entity-base';
import { BzDataProp } from '../decorator';
import { SpMetadata } from '../complex/sharepoint-metadata';
import { DataType } from 'breeze-client';

export abstract class SpListEntityBase extends SpEntityBase {
    @BzDataProp({ isPartOfKey: true, dataType: DataType.Int16 })
    id?: number | string;

    @BzDataProp()
    modified?: Date;

    @BzDataProp()
    created?: Date;

    @BzDataProp()
    authorId?: string;

    @BzDataProp()
    editorId?: number;

    @BzDataProp({ isNullable: false, complexTypeName: '__metadata:#Global' })
    __metadata?: Partial<SpMetadata>;
}
