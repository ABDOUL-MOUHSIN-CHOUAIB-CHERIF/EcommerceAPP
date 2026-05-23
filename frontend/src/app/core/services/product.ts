import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../../models/product';


@Injectable({
  providedIn: 'root'
})

export class ProductService {

  // Django API  URL
  APIURL = 'http://127.0.0.1:8000/api/products/';

  constructor(private http: HttpClient) {}

  // GET ALL PRODUCTS
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(
      `${this.APIURL}`
    );
  }

  // GET SINGLE PRODUCT
  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(
      `${this.APIURL}${id}/`
    );
  }

}
