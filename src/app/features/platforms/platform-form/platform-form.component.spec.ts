import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatformFormComponent } from './platform-form.component';

describe('PlatformFormComponent', () => {
  let component: PlatformFormComponent;
  let fixture: ComponentFixture<PlatformFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlatformFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
