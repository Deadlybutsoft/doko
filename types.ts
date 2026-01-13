export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  image: string;
  rating: number;
  reviews: number;
  isNew: boolean;
  dietary: DietaryTag[];
  description: string;
  popularity: number; // 0-100 score
  dateAdded: string; // ISO Date
}

export enum Category {
  VEGETABLES = 'Vegetables',
  FRUITS = 'Fruits',
  PANTRY = 'Pantry',
  DAIRY = 'Dairy',
  SNACKS = 'Snacks',
  OTHER = 'Other'
}

export enum DietaryTag {
  ORGANIC = 'Organic',
  VEGAN = 'Vegan',
  GLUTEN_FREE = 'Gluten-Free',
  KETO = 'Keto',
  NON_GMO = 'Non-GMO'
}

export interface CartItem extends Product {
  quantity: number;
}

export type SortOption = 'featured' | 'price-low' | 'price-high' | 'newest' | 'popularity';

export interface FilterState {
  category: string;
  minPrice: number;
  maxPrice: number;
  dietary: string[];
}

export type OrderStatus = 'Processing' | 'Shipped' | 'Delivered';

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
}
export interface Recipe {
  objectID: string;
  title: string;
  ingredients: string[];
  ingredients_text: string;
  instructions: string;
  image: string;
}
