import { NgModule } from '@angular/core';

import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { MaterialModule } from 'app/material.module';
import { AdminComponent } from './admin.component';
import { AdminRoutingModule } from './admin-routing.module';
import { AppAdminKeyFileComponent } from './admin-key-file/admin-key-file.component';
import { AdminServicesModule } from './admin-services.module';
import { CommonModule } from '@angular/common';

@NgModule({
    declarations: [AdminComponent, AppAdminKeyFileComponent],
    imports: [
        CommonModule,
        AdminServicesModule,
        MaterialModule,
        AdminRoutingModule,
        NgxDatatableModule,
    ],
    exports: [],
    providers: [],
})
export class AdminModule {}
