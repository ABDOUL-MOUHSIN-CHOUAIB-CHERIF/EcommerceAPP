import { TestBed } from '@angular/core/testing';

import { CartRefresh } from './cart-refresh';

describe('CartRefresh', () => {
  let service: CartRefresh;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartRefresh);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
