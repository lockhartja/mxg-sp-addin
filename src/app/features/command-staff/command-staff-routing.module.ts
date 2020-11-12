import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CsLandingComponent } from './cs-landing/cs-landing.component';
import { CssRostersComponent } from './css-rosters/css-rosters.component';

const featureRoutes: Routes = [
    {
        path: 'css-about',
        component: CsLandingComponent,
    },
    {
        path: 'css-rosters',
        component: CssRostersComponent,
    },
    {
        path: '',
        redirectTo: 'css/css-about',
        pathMatch: 'full',
    },
];

@NgModule({
    imports: [RouterModule.forChild(featureRoutes)],
    exports: [RouterModule],
})
export class CssRoutingModule {}
