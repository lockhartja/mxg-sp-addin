import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { fuseAnimations } from '@fuse/animations';
import { UnitMemberRosterType, UnitRosterTypeBase, UnitMemberIdentity } from '@models';
import { parse, ParseConfig, ParseResult } from 'papaparse';
import { Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { CssRosterUowService } from '../services/css-roster-uow.service';
import { SpCtxRepoService } from '@data/repo-managers/sp-ctx-repo.service';

type RosterTypes = 'alpha' | 'loss' | 'gain' | 'duty';

@Component({
    templateUrl: './css-roster-upload.component.html',
    styleUrls: ['./css-roster-upload.component.scss'],
    animations: [fuseAnimations],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CssRosterUploadComponent implements OnInit {
    hasRosterType = false;
    isQuerying = true;
    fileName = '';
    newMemberIdentifiers: { name: string; privateId: string }[] = [];
    pagedNewMemberIdentifiers: { name: string; privateId: string }[] = [];
    rosterDataFields: {
        fieldName: string;
        defaultName: string;
        overrideName: string;
    }[] = [];
    rosterFileFormControl = new FormControl();
    rosterTypeFormControl = new FormControl();
    step1FormGroup: FormGroup;
    step2DisplayColumns = ['fieldName', 'defaultName', 'overrideName'];
    step2FormGroup: FormGroup;
    step3DisplayColumns = ['name', 'privateId', 'publicId'];
    step3FormGroup: FormGroup;

    private isRosterDirty = false;
    private formattedRosterData: Record<string, string>[] = [];
    private rosterNameKeyField: string;
    private rosterIdKeyField: string;
    private typeOfRoster: RosterTypes;
    private unsubscribe = new Subject();

    constructor(
        private dialogRef: MatDialogRef<CssRosterUploadComponent>,
        private formBuilder: FormBuilder,
        private cssUowService: CssRosterUowService,
        private changeDetectionRef: ChangeDetectorRef,
        private spoCtxRepo: SpCtxRepoService
    ) {}

    ngOnInit(): void {
        this.rosterFileFormControl = this.formBuilder.control('', Validators.required);
        this.rosterTypeFormControl = this.formBuilder.control('', Validators.required);

        this.step1FormGroup = this.formBuilder.group({
            rosterFile: this.rosterFileFormControl,
            rosterType: this.rosterTypeFormControl,
        });

        this.step2FormGroup = this.formBuilder.group({ ini: new FormControl() });
        this.step3FormGroup = this.formBuilder.group({ ini: new FormControl() });

        this.rosterTypeFormControl.valueChanges
            .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
            .subscribe((rosterType: RosterTypes) => {
                this.isRosterDirty = true;
                this.fileName = '';
                this.formattedRosterData = [];
                this.rosterDataFields = [];
                this.setRosterDataFields(rosterType);
            });

        this.reconcileChanges();
    }

    async parseUpload(files: FileList): Promise<void> {
        const config: ParseConfig = { encoding: 'utf8' };
        const rosterFile = files[0];

        /**
         * Catch if new file selection is canceled and
         * we already have a file
         */
        if (!rosterFile && this.fileName) {
            return;
        }

        this.fileName = rosterFile.name;

        switch (this.typeOfRoster) {
            case 'alpha':
                await this.parseAlpha(files[0], config);
        }

        this.isRosterDirty = true;
    }

    step2AdjustColumnNames(): void {
        this.rosterDataFields.forEach((rdf) => {
            const requiredFieldName = rdf.fieldName as keyof UnitRosterTypeBase;

            switch (requiredFieldName) {
                case 'PRIVATE ID':
                    this.rosterIdKeyField = rdf.overrideName || rdf.defaultName;
                    break;
                case 'FULL NAME':
                    this.rosterNameKeyField = rdf.overrideName || rdf.defaultName;
                    break;
            }
        });
    }

    step3PageEvent($event: PageEvent): void {
        const startIndex = $event.pageIndex * $event.pageSize;
        const endIndex = startIndex + $event.pageSize;
        this.pagedNewMemberIdentifiers = this.newMemberIdentifiers.slice(startIndex, endIndex);
    }

    stepChanged(selectionEvent: StepperSelectionEvent): void {
        selectionEvent.previouslySelectedIndex === 1 && this.step2AdjustColumnNames();
        selectionEvent.selectedIndex === 2 && this.isRosterDirty && this.resolveAllPrivateIds();
    }

    private configCallback(
        file: File,
        csvConfig: ParseConfig
    ): Promise<[ParseResult<unknown>, File]> {
        const configPromise = new Promise((resolve, reject) => {
            csvConfig.complete = (results: ParseResult<unknown>, file?: File) => {
                try {
                    resolve([results, file]);
                } catch (e) {
                    console.error(e);
                    reject(e);
                }
            };

            parse(file, csvConfig);
        });

        return configPromise as Promise<[ParseResult<unknown>, File]>;
    }

    private async parseAlpha(file: File, commonConfig: ParseConfig): Promise<void> {
        const rosterResult = await this.configCallback(file, commonConfig);

        const rosterData = rosterResult[0].data;

        const extraneousInformation = ['for official use only', 'as of', 'the information herein'];

        const rowData = rosterData.filter(
            (rd: string[]) =>
                !extraneousInformation.some((eInfo) => rd[0].toLowerCase().startsWith(eInfo))
        );

        const headerRow = rowData.shift() as string[];

        rowData.forEach((frd: string[]) => {
            const personRecord: Record<string, string> = {} as Record<string, string>;

            for (let t = 0; t < headerRow.length; t++) {
                const header = headerRow[t];
                personRecord[header] = frd[t];
            }

            this.formattedRosterData.push(personRecord);
        });
    }

    private reconcileChanges(): void {
        const unitMembers = this.cssUowService.getUnitMembers();
    }

    private async resolveAllPrivateIds(): Promise<void> {
        const privateIds = this.formattedRosterData.map((frd) =>
            UnitMemberIdentity.encodeOneId(
                frd[this.rosterIdKeyField].split('-').join(''),
                this.spoCtxRepo.salter
            )
        );

        try {
            this.isQuerying = true;

            const newMemberIds = await this.cssUowService.getMemberIdentiferByPrivateId(privateIds);

            const unknownMembers = this.formattedRosterData
                .filter((frd) =>
                    newMemberIds.some(
                        (memberIdentifier) =>
                            memberIdentifier.privateId ===
                            UnitMemberIdentity.encodeOneId(
                                frd[this.rosterIdKeyField].split('-').join(''),
                                this.spoCtxRepo.salter
                            )
                    )
                )
                .map((frd, index) => {
                    this.step3FormGroup.addControl(
                        `publicId${index}`,
                        new FormControl('', Validators.required)
                    );
                    // this.step3FormGroup.addControl(
                    //     `email${index}`,
                    //     new FormControl('', Validators.required)
                    // );

                    return {
                        privateId: frd[this.rosterIdKeyField],
                        name: frd[this.rosterNameKeyField],
                    };
                });

            this.newMemberIdentifiers = unknownMembers;
            this.pagedNewMemberIdentifiers = unknownMembers.slice(0, 5);
            this.isRosterDirty = false;
        } catch (e) {
            console.error(e);
        } finally {
            this.isQuerying = false;
            this.changeDetectionRef.markForCheck();
        }
    }

    private setRosterDataFields(rosterType: RosterTypes): void {
        this.hasRosterType = !!rosterType;
        this.typeOfRoster = rosterType;
        let activeRosterTemplate: unknown;

        switch (rosterType) {
            case 'alpha':
                activeRosterTemplate = new UnitMemberRosterType();
        }

        if (!activeRosterTemplate) {
            return;
        }

        Object.keys(activeRosterTemplate).forEach((key, index) => {
            this.step2FormGroup.addControl(`overrideName-${index}`, new FormControl(''));
            this.rosterDataFields.push({
                fieldName: key,
                defaultName: activeRosterTemplate[key] as string,
                overrideName: '',
            });
        });
    }
}
