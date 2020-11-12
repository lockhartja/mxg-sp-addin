import { SpListEntityBase } from '../abstract/sp-list-entity-base';

export class UnitKpi extends SpListEntityBase {
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
