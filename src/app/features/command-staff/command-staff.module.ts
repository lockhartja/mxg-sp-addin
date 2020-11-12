import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'app/material.module';
import { CssRoutingModule } from './command-staff-routing.module';
import { CssServiceModule } from './services/command-staff-services.module';
import { CssRostersModule } from './css-rosters/css-rosters.module';
import { CsLandingComponent } from './cs-landing/cs-landing.component';
import { AboutPortalModule } from 'app/layout/components';

@NgModule({
    declarations: [CsLandingComponent],
    imports: [
        CommonModule,
        CssRoutingModule,
        CssServiceModule,
        CssRostersModule,
        AboutPortalModule,
        MaterialModule,
    ],
})
export class CommandStaffModule {}
