import { SpListEntityBase } from '@models/abstract';
import { BzDataProp, BzEntity } from '@models/decorator';
import { SpMetadata } from './sharepoint-metadata';

@BzEntity
export class SharepointTaxonomy extends SpListEntityBase {
    readonly shortName = 'SharepointTaxonomy';
    readonly namespace = 'Global';

    @BzDataProp({ isNullable: false, complexTypeName: '__metadata:Global' })
    __metadata: Partial<SpMetadata>;

    @BzDataProp()
    label: string;

    @BzDataProp()
    termGuid: string;

    @BzDataProp()
    wssId: string;
}
