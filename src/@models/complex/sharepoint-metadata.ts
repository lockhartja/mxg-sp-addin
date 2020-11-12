import { SpEntityBase } from '@models/abstract';
import { BzComplexEntity, BzDataProp } from '../decorator';

@BzComplexEntity
export class SpMetadata extends SpEntityBase {
    readonly shortName = '__metadata';
    readonly namespace = 'Global';

    @BzDataProp()
    id: string;
    @BzDataProp()
    edit?: string;
    uri: string;
    @BzDataProp()
    etag: string;
    @BzDataProp()
    type: string;
}
