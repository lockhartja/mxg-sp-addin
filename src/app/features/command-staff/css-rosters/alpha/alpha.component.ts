import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { CssUowService } from '../../services/command-staff-uow.service';

@Component({
    selector: 'app-alpha-roster',
    templateUrl: './alpha.component.html',
    styleUrls: ['./alpha.component.scss'],
})
export class AlphaRosterComponent implements OnInit {
    rows: unknown[];
    loadingIndicator: boolean;
    reorderable: boolean;

    private _unsubscribeAll = new Subject();

    constructor(private uowService: CssUowService) {}

    ngOnInit(): void {
        this.loadingIndicator = true;
        this.rows = [];
    }
}
