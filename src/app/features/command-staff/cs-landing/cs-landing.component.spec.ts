import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CsLandingComponent } from './cs-landing.component';

describe('CsLandingComponent', () => {
  let component: CsLandingComponent;
  let fixture: ComponentFixture<CsLandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CsLandingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CsLandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
