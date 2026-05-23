export interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    image_url: string;
    category: string;
  };
  quantity: number;
  size?: string;
  color?: string;
}