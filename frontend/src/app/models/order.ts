 import { Product } from './product';
export interface Order {
  id: number;
  user: number;
  total_price: string;
  created_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  order: number;
  product: number;
  quantity: number;
  price: string;
  product_details?: Product;  // Optional: when you join product data
}