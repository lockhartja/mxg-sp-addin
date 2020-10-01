import { SharepointEntity } from '../sp-global/sharepoint-entity';

export class MpRoster extends SharepointEntity {
    readonly namespace = 'SP.Data.Manning';
    readonly shortName = 'MpRoster';
    personnelName: string;
    rank: string;
    pasCode: string;
    unitAssigned: string;
    officeSymbol: string;
    dutyStatus: string;
    dutyStatusOptions: Array<string>;
    missionCriticalFlag: boolean;
}
