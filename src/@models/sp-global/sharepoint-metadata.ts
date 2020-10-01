import { ComplexType } from 'breeze-client';
import { SharepointKnownNamespace, SharepointNamespace } from '@atypes';
import { BzComplexEntity, BzDataProp } from '../decorator';

@BzComplexEntity
export class SharepointMetadata {
    readonly shortName = '__metadata';
    readonly namespace: SharepointKnownNamespace = 'SP.Global';

    @BzDataProp()
    id: string;
    @BzDataProp()
    uri: string;
    @BzDataProp()
    etag: string;
    @BzDataProp()
    type: string;
}
