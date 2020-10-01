import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppRoutes } from '@atypes';
import { AdminComponent } from './admin.component';

export const featureRoutes: AppRoutes = [
    {
        path: 'dashboard',
        component: AdminComponent,
    },
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
    },
];
@NgModule({
    imports: [RouterModule.forChild(featureRoutes)],
    exports: [RouterModule],
})
export class AdminRoutingModule {}
