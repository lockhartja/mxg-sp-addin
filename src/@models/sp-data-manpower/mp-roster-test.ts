import { SpListEntityBase } from '../abstract';

export class MpRosterTest extends SpListEntityBase {
    readonly namespace = 'SP.Data.Kpi';
    readonly shortName = 'MpRosterTest';
    personnelName: string;
    rank: string;
    pasCode: string;
    unitAssigned: string;
    officeSymbol: string;
    dutyStatus: string;
    dutyStatusOptions: Array<string>;
    missionCriticalFlag: boolean;
}
