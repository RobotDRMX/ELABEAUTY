export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  stock: number;
  image_url: string;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface SearchResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchParams {
  query?: string;
  category?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
  minPrice?: number;
  maxPrice?: number;
}

export interface Category {
  name: string;
  count: number;
  icon: string;
}