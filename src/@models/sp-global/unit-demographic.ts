import { BzDataProp, BzEntity } from '@models/decorator';
import { DataType } from 'breeze-client';
import { SharepointEntity } from './sharepoint-entity';

export type UnitDemographicType =
    | 'Pascode'
    | 'ProperName'
    | 'CommandIdentifier';

@BzEntity
export class UnitDemographic extends SharepointEntity {
    readonly namespace = 'SP.Global';
    readonly shortName = 'UnitDemographic';

    @BzDataProp({ isNullable: false })
    demographicData: string;

    @BzDataProp({ isNullable: false, dataType: DataType.String })
    demographicType: UnitDemographicType;

    @BzDataProp({ isNullable: false })
    unitName: string;
}
