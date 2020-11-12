import { Injectable } from '@angular/core';
import { CanLoad } from '@angular/router';
import { AppRoute, XtendedFuseNavService } from '@atypes';
import { SpCtxRepoService } from '@data/repo-managers/sp-ctx-repo.service';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';

@Injectable({
    providedIn: 'root',
})
export class AppLoadGuardService implements CanLoad {
    private navService: XtendedFuseNavService;
    constructor(private spCtxRepo: SpCtxRepoService, navService: FuseNavigationService) {
        this.navService = navService;
    }

    canLoad(route: AppRoute): boolean {
        const path = route.path;

        switch (path) {
            case 'admin':
                return this.spCtxRepo.my.groups.includes('sma-global-admin');
        }

        return true;
    }

    private prepAdmin(): boolean {
        if (!this.spCtxRepo.my.groups.includes('sma-global-admin')) {
            return false;
        }

        const gotDigestToken = this.spCtxRepo.setDigestTokenForSite('SP.Global');
    }
}
