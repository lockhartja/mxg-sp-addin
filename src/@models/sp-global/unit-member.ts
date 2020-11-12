import { SharepointTaxonomy } from '@models/complex';
import { BzDataProp, BzEntity, BzNavProp } from '@models/decorator';
import { DataService } from 'breeze-client';
import { SpListEntityBase } from '../abstract/sp-list-entity-base';

@BzEntity
export class UnitMember extends SpListEntityBase {
    readonly namespace = 'SP.Global';
    readonly shortName = 'UnitMember';

    @BzDataProp({ isNullable: false })
    dodIdNumber: string;

    @BzDataProp({ isNullable: false })
    firstName: string;

    @BzDataProp({ isNullable: false })
    lastName: string;

    @BzNavProp({ isScalar: false })
    rank: SharepointTaxonomy;

    @BzNavProp({ isScalar: false })
    unitAssigned: SharepointTaxonomy;

    @BzNavProp({ isScalar: false })
    officeSymbol: SharepointTaxonomy;

    dutyStatus: SharepointTaxonomy;

    @BzDataProp()
    dutyTitle: string;

    @BzDataProp()
    dateOfRank: Date;

    @BzDataProp()
    dutyStartDate: Date;

    @BzDataProp()
    primaryAfsc: string;

    @BzDataProp()
    dateArrivedStation: Date;

    @BzDataProp()
    activeMilitaryServiceDate: Date;

    @BzDataProp()
    endServiceDate: Date;

    lastSeen: Date;
}
