import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestPayment } from './test-payment';

describe('TestPayment', () => {
  let component: TestPayment;
  let fixture: ComponentFixture<TestPayment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestPayment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestPayment);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
