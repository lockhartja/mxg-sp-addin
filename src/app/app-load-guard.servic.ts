import { Injectable } from '@angular/core';
import { CanLoad } from '@angular/router';
import { AppRoute, XtendedFuseNavItem, XtendedFuseNavService } from '@atypes';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { AppSpCtxService } from './app-sp-context.service';

@Injectable({
    providedIn: 'root',
})
export class AppLoadGuardService implements CanLoad {
    private navService: XtendedFuseNavService;
    constructor(
        private appInitializer: AppSpCtxService,
        navService: FuseNavigationService
    ) {
        this.navService = navService;
    }

    canLoad(route: AppRoute) {
        const path = route.path;

        switch (path) {
            case 'admin':
                return this.appInitializer.userContext.groups.includes(
                    'sm-global-admin'
                );
        }

        return true;
    }
}
