import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Enigme } from './enigme';

describe('Enigme', () => {
  let component: Enigme;
  let fixture: ComponentFixture<Enigme>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Enigme]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Enigme);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
