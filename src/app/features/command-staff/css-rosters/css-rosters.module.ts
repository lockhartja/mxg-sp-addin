import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CssRostersComponent } from './css-rosters.component';
import { AlphaRosterComponent } from './alpha/alpha.component';
import { MaterialModule } from 'app/material.module';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { CssRosterUploadComponent } from '../css-roster-upload/css-roster-upload.component';
import { AboutPortalModule } from 'app/layout/components/about-portal/about-portal.module';

@NgModule({
    declarations: [CssRostersComponent, CssRosterUploadComponent, AlphaRosterComponent],
    imports: [MaterialModule, CommonModule, NgxDatatableModule],
})
export class CssRostersModule {}
