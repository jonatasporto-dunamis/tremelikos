export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          phone: string | null;
          whatsapp: string | null;
          timezone: string;
          minimum_order: number;
          address: string | null;
          city: string;
          state: string;
          zip_code: string | null;
          logo_url: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      business_hours: {
        Row: {
          id: string;
          store_id: string;
          weekday: number;
          opens_at: string | null;
          closes_at: string | null;
          closed: boolean;
        };
      };
      sections: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          slug: string;
          description: string | null;
          position: number;
          active: boolean;
          created_at: string;
        };
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          slug: string;
          description: string | null;
          base_price: number;
          active: boolean;
          available: boolean;
          featured: boolean;
          badge: string | null;
          sku: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      section_products: {
        Row: {
          id: string;
          section_id: string;
          product_id: string;
          position: number;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          path: string;
          alt_text: string | null;
          position: number;
          is_cover: boolean;
          created_at: string;
        };
      };
      promotions: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          type: 'fixed_percent' | 'fixed_amount' | 'product_price';
          value: number;
          starts_at: string | null;
          ends_at: string | null;
          weekdays: number[];
          priority: number;
          active: boolean;
          created_at: string;
        };
      };
      coupons: {
        Row: {
          id: string;
          store_id: string;
          code: string;
          type: 'fixed_percent' | 'fixed_amount';
          value: number;
          minimum_order: number;
          starts_at: string | null;
          ends_at: string | null;
          max_uses: number | null;
          current_uses: number;
          active: boolean;
          created_at: string;
        };
      };
    };
  };
}

export type Product = Database['public']['Tables']['products']['Row'];
export type Section = Database['public']['Tables']['sections']['Row'];
export type Store = Database['public']['Tables']['stores']['Row'];
export type Promotion = Database['public']['Tables']['promotions']['Row'];
export type Coupon = Database['public']['Tables']['coupons']['Row'];
