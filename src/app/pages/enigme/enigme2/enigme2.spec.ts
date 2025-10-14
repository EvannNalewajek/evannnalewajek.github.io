import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Enigme2 } from './enigme2';

describe('Enigme2', () => {
  let component: Enigme2;
  let fixture: ComponentFixture<Enigme2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Enigme2]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Enigme2);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
