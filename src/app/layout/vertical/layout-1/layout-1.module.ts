import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FuseSidebarModule } from '@fuse/components';
import { FuseSharedModule } from '@fuse/shared.module';

import { ChatPanelModule } from 'app/layout/components/chat-panel/chat-panel.module';
import { FooterModule } from 'app/layout/components/footer/footer.module';
import { NavbarModule } from 'app/layout/components/navbar/navbar.module';
import { QuickPanelModule } from 'app/layout/components/quick-panel/quick-panel.module';
import { ToolbarModule } from 'app/layout/components/toolbar/toolbar.module';

import { VerticalLayout1Component } from 'app/layout/vertical/layout-1/layout-1.component';
import { DisplayContentModule } from 'app/layout/components/display-content/display-content.module';

@NgModule({
    declarations: [VerticalLayout1Component],
    imports: [
        RouterModule,

        FuseSharedModule,
        FuseSidebarModule,

        ChatPanelModule,
        DisplayContentModule,
        FooterModule,
        NavbarModule,
        QuickPanelModule,
        ToolbarModule,
    ],
    exports: [VerticalLayout1Component],
})
export class VerticalLayout1Module {}
