import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../../models/product';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})

export class ProductService {

  // Django API  URL
  APIURL = environment.apiUrl + 'products/';

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

  getProductImage(product: any): string {
    if (product?.image_url && product.image_url !== '') {
      return product.image_url;
    }
  
    return `https://picsum.photos/300/300?random=${product?.id || 1}`;
  }
}
