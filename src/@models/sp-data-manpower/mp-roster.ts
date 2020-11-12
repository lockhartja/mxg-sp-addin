import { BzNavProp } from '@models/decorator';
import { UnitMember } from '@models/sp-global';
import { SpListEntityBase } from '../abstract/sp-list-entity-base';

export class MpRoster extends SpListEntityBase {
    readonly namespace = 'SP.Data.Manning';
    readonly shortName = 'ManpowerRoster';

    unitMemberId: number;

    @BzNavProp({ isScalar: true })
    unitMember: UnitMember;

    personnelName: string;
    rank: string;
    pasCode: string;
    unitAssigned: string;
    officeSymbol: string;
    dutyStatus: string;
    dutyStatusOptions: Array<string>;
    missionCriticalFlag: boolean;
}
