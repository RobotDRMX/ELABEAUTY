export interface Offer {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  cta_label?: string;
  cta_link?: string;
  badge?: string;
  tag?: string;
  start_date: string;
  end_date: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
