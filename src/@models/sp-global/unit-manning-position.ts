import { BzDataProp, BzEntity } from '@models/decorator';
import { SharepointEntity } from './sharepoint-entity';

@BzEntity
export class UnitManningPosition extends SharepointEntity {
    readonly namespace = 'SP.Global';
    readonly shortName = 'UnitManningPosition';

    @BzDataProp({ isNullable: false })
    positionNumber: string;

    @BzDataProp({ isNullable: false })
    officeSymbol: string;

    @BzDataProp({ isNullable: false })
    specialityCode: string;

    @BzDataProp({ isNullable: false })
    specialityPrefix: string;

    @BzDataProp({ isNullable: false })
    requiredGrade: string;

    @BzDataProp({ isNullable: false })
    securityAccessLevel: number;

    @BzDataProp({ isNullable: false })
    personnelReliabilityCode: string;

    @BzDataProp({ isNullable: false })
    rankCategory: string;

    @BzDataProp({ isNullable: false })
    fundingType: string;
}
