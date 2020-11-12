import { Component, Input, OnInit } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';

@Component({
    selector: 'app-about-portal',
    templateUrl: './about-portal.component.html',
    styleUrls: ['./about-portal.component.scss'],
    animations: fuseAnimations,
})
export class AboutPortalComponent {
    @Input()
    portalName: string;

    showAddForm = false;
}
