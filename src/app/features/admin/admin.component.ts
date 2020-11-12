import { Component, OnInit } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';

@Component({
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss'],
    animations: fuseAnimations,
})
export class AdminComponent implements OnInit {
    userName = 'Lockhart, Johnny';
    constructor(private _fuseSidebarService: FuseSidebarService) {}

    ngOnInit(): void {}

    toggleSidebar(name): void {
        this._fuseSidebarService.getSidebar(name).toggleOpen();
    }
}
