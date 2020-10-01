import {
    MpRoster,
    UnitKpi,
    SharepointMetadata,
    SharepointEntity,
    UnitManningPosition,
    MetadataLookup,
} from '@models';
import { UnitDemographic } from '@models/sp-global/unit-demographic';

export type SharepointKnownNamespace =
    | 'SP.Data.Kpi'
    | 'SP.Data.Aagt'
    | 'SP.Data.Manning'
    | 'SP.Global';

export type SharepointNamespace = SharepointEntityList['namespace'];

export type ValidEntity = (SharepointEntity | SharepointMetadata) | Function;

export interface INsSpGlobal {}

export type SharepointEntityList =
    | MpRoster
    | UnitKpi
    | UnitDemographic
    | UnitManningPosition;

export type EntitySibling<
    T extends SharepointEntity
> = SharepointEntityList extends infer E
    ? E extends SharepointEntityList
        ? E['namespace'] extends T['namespace']
            ? E
            : never
        : never
    : never;

export type Test3 = SharepointEntityList['namespace'];

export const tester: EntitySibling<UnitKpi>;

export type SpTermStores = 'afsc' | 'rank' | 'leaderRole' | 'org';

export type SpMetadataMap = Map<SpTermStores, ReadonlyArray<MetadataLookup>>;
