import { ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppRoutes } from '@atypes';
import { AppLoadGuardService } from './app-load-guard.servic';
import { HomeResolverService } from './features/home/home-resolver.service';
import { HomeComponent } from './features/home/home.component';

export const appRoutes: AppRoutes = [
    {
        path: 'home',
        component: HomeComponent,
        resolve: { userInfo: HomeResolverService },
    },
    {
        path: 'admin',
        loadChildren: () =>
            import('./features/admin/admin.module').then((m) => m.AdminModule),
        canLoad: [AppLoadGuardService],
    },
    {
        path: 'msm',
        loadChildren: () =>
            import('./features/metrics/metrics.module').then(
                (m) => m.MetricsModule
            ),
    },
    {
        path: '**',
        redirectTo: '/home',
    },
];

@NgModule({
    imports: [
        RouterModule.forRoot(appRoutes, {
            useHash: true,
            // enableTracing: true
        }),
    ],
    exports: [RouterModule],
})
export class AppRoutingModule {}
