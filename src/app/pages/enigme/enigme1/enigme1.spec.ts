import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Enigme1 } from './enigme1';

describe('Enigme1', () => {
  let component: Enigme1;
  let fixture: ComponentFixture<Enigme1>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Enigme1]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Enigme1);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
