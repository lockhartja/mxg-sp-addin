import { SharepointTaxonomy } from '@models/complex';

export class UnitRosterTypeBase {
    'FULL NAME' = 'FULL_NAME';
    'PRIVATE ID' = 'SSAN';
    RANK = 'GRADE';
}

export class UnitMemberRosterType extends UnitRosterTypeBase {
    'UNIT ASSIGNED' = 'ASSIGNED_PAS';
    'OFFICE SYMBOL' = 'OFFICE_SYMBOL';
    'DUTY TITLE' = 'DUTY_TITLE';
    RANK = 'GRADE';
    'RANK DATE' = 'DOR';
    'DUTY START' = 'DUTY_START_DATE';
    AFSC = 'PAFSC';
    'END SERVICE DATE' = 'DOS';
    ARRIVED = 'DATE_ARRIVED_STATION';

    // lastName =  string;
    // firstName =  string;
    // privateId =  string;
    // publicId =  string;
    // rank =  SharepointTaxonomy;
    // unitAssigned =  SharepointTaxonomy;
    // officeSymbol =  SharepointTaxonomy;
    // dutyTitle =  string;
    // dateOfRank =  Date;
    // dutyStartDate =  Date;
    // primaryAfsc =  SharepointTaxonomy;
    // dateArrivedStation =  Date;
    // activeMilitaryServiceDate =  Date;
    // endServiceDate =  Date;
}
