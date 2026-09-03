export interface CartItem {
  id: string;
  product: import('@/types/database').Product;
  quantity: number;
  observations?: string;
  removedIngredients?: string[];
  extras?: Array<{ name: string; price: number }>;
}
