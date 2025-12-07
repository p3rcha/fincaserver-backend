/**
 * Tebex Headless API Types
 * Based on: https://docs.tebex.io/developers/headless-api/endpoints
 * 
 * These types define the structure of data returned by the Tebex API.
 */

// ============================================
// WEBSTORE
// ============================================

export interface TebexWebstore {
  id: number;
  description: string;
  name: string;
  webstore_url: string;
  currency: string;
  lang: string;
  logo: string | null;
  platform_type: string;
  platform_type_id: string;
  created_at: string;
}

export interface TebexPage {
  id: number;
  title: string;
  content: string;
  slug: string;
}

// ============================================
// CATEGORIES & PACKAGES
// ============================================

export interface TebexCategory {
  id: number;
  name: string;
  description: string;
  packages: TebexPackage[];
  order: number;
  parent?: TebexCategory | null;
}

export interface TebexPackage {
  id: number;
  name: string;
  description: string;
  type: 'single' | 'subscription' | 'both';
  disable_quantity: boolean;
  disable_gifting: boolean;
  expiration_date: string | null;
  created_at: string;
  updated_at: string;
  base_price: number;
  sales_price: number | null;
  total_price: number;
  currency: string;
  discount: number;
  image: string | null;
  category: TebexCategory | null;
}

// ============================================
// BASKETS
// ============================================

export interface TebexBasket {
  ident: string;
  complete: boolean;
  id: number;
  country: string;
  ip: string;
  username_id: number | null;
  username: string | null;
  cancel_url: string;
  complete_url: string;
  complete_auto_redirect: boolean;
  base_price: number;
  sales_tax: number;
  total_price: number;
  currency: string;
  packages: TebexBasketPackage[];
  coupons: TebexCoupon[];
  giftcards: TebexGiftCard[];
  creator_code: string | null;
  links: {
    checkout: string;
  };
}

export interface TebexBasketPackage {
  id: number;
  name: string;
  description: string;
  in_basket: {
    quantity: number;
    price: number;
    gift_username_id: number | null;
    gift_username?: string | null;
  };
}

// ============================================
// COUPONS & GIFT CARDS
// ============================================

export interface TebexCoupon {
  id: number;
  code: string;
  discount_type: 'percentage' | 'value';
  discount_amount: number;
  discount_percentage: number;
  start_date: string | null;
  expire_date: string | null;
  basket_type: string;
  minimum: number;
  username: string | null;
  note: string;
}

export interface TebexGiftCard {
  id: number;
  code: string;
  balance: {
    starting: number;
    remaining: number;
    currency: string;
  };
}

// ============================================
// PROMOTIONS
// ============================================

export interface TebexSale {
  id: number;
  name: string;
  discount_type: 'percentage' | 'value';
  discount_amount: number;
  discount_percentage: number;
  start_date: string;
  expire_date: string;
  effective?: {
    type: string;
    packages: number[];
    categories: number[];
  };
}

// ============================================
// CREATOR CODES
// ============================================

export interface TebexCreatorCode {
  code: string;
  percentage: number;
}

// ============================================
// API RESPONSES
// ============================================

export interface TebexApiResponse<T> {
  data: T;
}

export interface TebexApiError {
  error: string;
  message?: string;
  status?: number;
}

// Response type helpers
export type TebexWebstoreResponse = TebexApiResponse<TebexWebstore>;
export type TebexPagesResponse = TebexApiResponse<TebexPage[]>;
export type TebexCategoriesResponse = TebexApiResponse<TebexCategory[]>;
export type TebexCategoryResponse = TebexApiResponse<TebexCategory>;
export type TebexPackagesResponse = TebexApiResponse<TebexPackage[]>;
export type TebexPackageResponse = TebexApiResponse<TebexPackage>;
export type TebexBasketResponse = TebexApiResponse<TebexBasket>;
export type TebexSalesResponse = TebexApiResponse<TebexSale[]>;

// ============================================
// REQUEST BODIES
// ============================================

export interface CreateBasketBody {
  complete_url: string;
  cancel_url: string;
  complete_auto_redirect?: boolean;
}

export interface AddPackageToBasketBody {
  package_id: number;
  quantity?: number;
  type?: 'single' | 'subscription';
  variable_data?: Record<string, string>;
}

export interface GiftPackageBody {
  package_id: number;
  target_username_id: string;
}

export interface UpdateQuantityBody {
  quantity: number;
}

export interface ApplyCouponBody {
  coupon_code: string;
}

export interface ApplyGiftCardBody {
  card_number: string;
}

export interface ApplyCreatorCodeBody {
  creator_code: string;
}

