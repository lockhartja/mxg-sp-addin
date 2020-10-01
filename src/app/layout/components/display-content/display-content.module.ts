import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FuseSharedModule } from '@fuse/shared.module';
import { DisplayContentComponent } from './display-content.component';

@NgModule({
    declarations: [DisplayContentComponent],
    imports: [RouterModule, FuseSharedModule],
    exports: [DisplayContentComponent],
})
export class DisplayContentModule {}
