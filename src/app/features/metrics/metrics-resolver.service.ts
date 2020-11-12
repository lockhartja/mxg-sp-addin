import { Injectable } from '@angular/core';
import { MetricsModule } from './metrics.module';
import { Resolve } from '@angular/router';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { XtendedFuseNavService } from '@atypes';
import { METRICS_NAV_CONFIG } from './metic-navigation';

@Injectable({
    providedIn: MetricsModule,
})
export class MetricResolver implements Resolve<any> {
    navService: XtendedFuseNavService;

    constructor(navService: FuseNavigationService) {
        this.navService = navService;
    }

    resolve(): void {
        this.navService.updateNavigationItem('msm_nav_config', {
            children: [METRICS_NAV_CONFIG],
        });
    }
}
