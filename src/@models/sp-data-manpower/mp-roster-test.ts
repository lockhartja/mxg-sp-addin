import { SharepointEntity } from '../sp-global';

export class MpRosterTest extends SharepointEntity {
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
