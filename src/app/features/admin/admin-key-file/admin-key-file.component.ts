import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { AdminUowService } from '../admin-uow.service';

@Component({
    selector: 'app-admin-key-file',
    templateUrl: './admin-key-file.component.html',
    styleUrls: ['./admin-key-file.component.scss'],
})
export class AppAdminKeyFileComponent implements OnInit {
    rows: any[];
    loadingIndicator: boolean;
    reorderable: boolean;

    private _unsubscribeAll = new Subject();

    constructor(private uowService: AdminUowService) {}

    ngOnInit(): void {
        this.loadingIndicator = true;
        const testrows = this.uowService.getSpKey();
        console.table(testrows);
        this.rows = [];
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
}
