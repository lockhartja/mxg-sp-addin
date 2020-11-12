import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CssRostersComponent } from './css-rosters.component';

describe('CssRostersComponent', () => {
    let component: CssRostersComponent;
    let fixture: ComponentFixture<CssRostersComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CssRostersComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CssRostersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        void expect(component).toBeTruthy();
    });
});
