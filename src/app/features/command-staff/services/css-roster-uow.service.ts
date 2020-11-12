import { Injectable } from '@angular/core';
import { RepoFactory } from '@data';
import { SpCtxRepoService } from '@data/repo-managers/sp-ctx-repo.service';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { UnitMemberIdentity } from '@models';
import { CentralRepositoryService } from 'app/app-central-repository.service';
import { Predicate } from 'breeze-client';
import { CssServiceModule } from './command-staff-services.module';

@Injectable({
    providedIn: CssServiceModule,
})
export class CssRosterUowService {
    spGlobalRepoFactory: RepoFactory<'SP.Global'>;
    globalRepoFactory: RepoFactory<'Global'>;

    private getAllUnitMemberPredicate: Predicate;

    constructor(
        centralRepoService: CentralRepositoryService,
        private fuseProgress: FuseProgressBarService,
        private spoCtx: SpCtxRepoService
    ) {
        this.spGlobalRepoFactory = centralRepoService.getFactory('SP.Global');
        this.globalRepoFactory = centralRepoService.getFactory('Global');
    }

    /**
     * Assumes the Ids have already been normalized for processing i.e., all dashes removed.
     * @param ids
     */
    async getMemberIdentiferByPrivateId(normalizedIds: string[]): Promise<UnitMemberIdentity[]> {
        const memberIdentifierRepo = this.spGlobalRepoFactory.getRepo('UnitMemberIdentity');

        let localKnownMemberIds = memberIdentifierRepo.getAllCached();

        const missingIdsOnLocal = normalizedIds.filter(
            (codeId) => !localKnownMemberIds.some((memberId) => memberId.privateId === codeId)
        );

        if (!missingIdsOnLocal.length) {
            return memberIdentifierRepo
                .getAllCached()
                .filter((entity) => entity.entityAspect.entityState.isAdded());
        }

        const remoteKnownMemberIds = await this.loaderWrapPromise(
            memberIdentifierRepo.whereInList([{ privateId: missingIdsOnLocal }])
        );

        localKnownMemberIds = localKnownMemberIds.concat(remoteKnownMemberIds);

        const memberIdsToCreate = normalizedIds.filter(
            (eId) => !localKnownMemberIds.some((mId) => mId.privateId === eId)
        );

        if (memberIdsToCreate.length) {
            memberIdsToCreate.forEach((privateId) =>
                memberIdentifierRepo.createEntity({ privateId })
            );
        }

        return memberIdentifierRepo
            .getAllCached()
            .filter((entity) => entity.entityAspect.entityState.isAdded());
    }

    getUnitMembers(): void {
        const unitMemberRepo = this.spGlobalRepoFactory.getRepo('UnitMember');
        const managedMetadataRepo = this.globalRepoFactory.getRepo('TermSet');
        console.log(managedMetadataRepo.getAllCached());
        const isGlobalAdminOrCssGroupAdmin = this.spoCtx.my.groups.some(
            (group) => group === 'sma-css-group' || group === 'sma-global-admin'
        );

        if (isGlobalAdminOrCssGroupAdmin) {
        }
    }

    private loaderWrapPromise<T>(promise: Promise<T>): Promise<T> {
        this.fuseProgress.show();
        this.fuseProgress.setMode('indeterminate');
        promise.finally(() => {
            this.fuseProgress.hide();
        });
        return promise;
    }
}
