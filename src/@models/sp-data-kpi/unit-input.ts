import { SharepointEntity } from '../sp-global/sharepoint-entity';

export class UnitKpi extends SharepointEntity {
    readonly namespace = 'SP.Data.Kpi';
    readonly shortName = 'UntKpi';
    personnelName: string;
    rank: string;
    pasCode: string;
    unitAssigned: string;
    officeSymbol: string;
    dutyStatus: string;
    dutyStatusOptions: Array<string>;
    missionCriticalFlag: boolean;
}
