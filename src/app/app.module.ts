import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { DEFAULT_FUSE_CONFIG } from '@config';
import { FuseModule } from '@fuse/fuse.module';
import { FuseSharedModule } from '@fuse/shared.module';
import { FuseProgressBarModule, FuseSidebarModule } from '@fuse/components';

import { AppComponent } from 'app/app.component';
import { LayoutModule } from 'app/layout/layout.module';
import { MaterialModule } from './material.module';
import { HomeModule } from './features/home/home.module';
import { DataAccessModule } from '@data';
import { AppRoutingModule } from './app-routes.module';
import { SpCtxRepoService } from '@data/repo-managers/sp-ctx-repo.service';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';

@NgModule({
    declarations: [AppComponent],
    imports: [
        AppRoutingModule,
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,

        TranslateModule.forRoot(),

        // Material
        MaterialModule,

        // Fuse modules
        FuseModule.forRoot(DEFAULT_FUSE_CONFIG),
        FuseProgressBarModule,
        FuseSharedModule,
        FuseSidebarModule,

        // App modules
        LayoutModule,
        DataAccessModule,
        HomeModule,
    ],
    providers: [
        {
            provide: APP_INITIALIZER,
            multi: true,
            deps: [SpCtxRepoService],
            useFactory: (spCtxRepo: SpCtxRepoService) => spCtxRepo.initializeApp(),
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
