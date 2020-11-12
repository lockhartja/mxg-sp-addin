import {
    MpRoster,
    UnitKpi,
    SpMetadata,
    TermSet,
    SharepointTaxonomy,
    MpRosterTest,
    SpEntityBase,
} from '@models';
import { UnitManningPosition, UnitMember } from '@models/sp-global';
import { UnitMemberIdentity } from '@models/sp-global/unit-member-identity';
import { UnitDemographic } from '@models/sp-global/unit-demographic';
import { SpUserPermissionGroup } from './sharepoint-entity';

export type PossibleNameSpace =
    | 'Global'
    | 'SP.Data.Kpi'
    | 'SP.Data.Agat'
    | 'SP.Data.Manning'
    | 'SP.Data.Css'
    | 'SP.Global';

export type SpLists =
    | TermSet
    | SharepointTaxonomy
    | MpRoster
    | MpRosterTest
    | UnitMemberIdentity
    | UnitMember
    | UnitKpi
    | UnitDemographic
    | UnitManningPosition;

export type EntityContainsQuery<TEntity> = {
    [index in keyof Partial<TEntity>]: Array<TEntity[index]>;
};

// export type EntitySibling<
//     T extends SpListEntityBase
// > = SharepointEntityList extends infer E
//     ? E extends SharepointEntityList
//         ? E['namespace'] extends T['namespace']
//             ? E
//             : never
//         : never
//     : never;

// export type ParentEntity<
//     T extends SpListEntityBase
// > = SharepointEntityList extends infer E
//     ? E extends SharepointEntityList
//         ? E['shortName'] extends T['shortName']
//             ? E
//             : never
//         : never
//     : never;

export type SpTermStores =
    | 'afsc-structure'
    | 'rank-structure'
    | 'leadership-structure'
    | 'org-structure';

export interface ISharePointUserGroupResponse {
    AllowMembersEditMembership: boolean;
    AllowRequestToJoinLeave: boolean;
    AutoAcceptRequestToJoinLeave: boolean;
    Description: string;
    Id: number;
    IsHiddenInUI: boolean;
    LoginName: string;
    OnlyAllowMembersViewMembership: boolean;
    OwnerTitle: string;
    PrincipalType: number;
    RequestToJoinLeaveEmailSetting: string;
    Title: SpUserPermissionGroup;
}

export interface ISharePointUserResponse {
    Email: string;
    Expiration: string;
    Groups: ISharePointUserGroupResponse[];
    Id: number;
    IsEmailAuthenticationGuestUser: boolean;
    IsHiddenInUI: boolean;
    IsShareByEmailGuestUser: boolean;
    IsSiteAdmin: boolean;
    LoginName: string;
    PrincipalType: number;
    Title: string;
    UserId: {
        NameId: string;
        NameIdIssuer: string;
    };
    UserPrincipalName: string;
}

export interface SpChoiceField {
    Choices: { results: string[] };
    __metadata: SpMetadata;
    DefaultValue: string;
}
