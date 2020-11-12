import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { fuseAnimations } from '@fuse/animations';
import Swal from 'sweetalert2';
import { CssRosterUploadComponent } from '../css-roster-upload/css-roster-upload.component';

@Component({
    selector: 'app-css-rosters',
    templateUrl: './css-rosters.component.html',
    styleUrls: ['./css-rosters.component.scss'],
    animations: fuseAnimations,
})
export class CssRostersComponent implements OnInit {
    constructor(private dialog: MatDialog) {}

    ngOnInit(): void {
        console.log('roster activated!');
    }

    uploadRoster(): void {
        const dialogRef = this.dialog.open(CssRosterUploadComponent, {
            width: '800vw',
            maxWidth: '800px',
            maxHeight: '800px',
            height: '600vh',
            disableClose: true,
            // position: {
            //     top: '0',
            //     left: '0'
            // },
            autoFocus: false,
        });
        dialogRef.afterClosed().subscribe((dialogResult: unknown) => {
            console.log(dialogResult);
        });
    }
}
