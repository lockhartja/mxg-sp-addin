import { SharepointEntity } from './sharepoint-entity';

export class UnitMember extends SharepointEntity {
    readonly namespace = 'SP.Global';
    readonly shortName = 'UnitMember';

    dodIdNumber: string;
    firstName: string;
    lastName: string;
    rank: string;
    officeSymbol: string;
    dutyTitle: string;
    dateOfRank: Date;
    dutyStartDate: Date;
    primaryAfsc: string;
    dateArrivedStation: Date;
    activeMilitaryServiceDate: Date;
    endServiceDate: Date;
}
