// export type CatalogCategory = {
//   id: string;
//   name: string;
//   description: string | null;
// };

// export type CatalogProduct = {
//   id: string;
//   name: string;
//   description: string | null;
//   price: number;
//   currency: string;
//   landingUrl: string;
//   imageUrl: string | null;
//   sku: string | null;
//   externalProductId: string | null;
//   categoryId: string | null;
//   category: CatalogCategory | null;
//   conversion?: string | null;
// };

// export type CatalogProductDetail = {
//   product: CatalogProduct | null;
//   variants: Array<{
//     id: string;
//     name: string;
//     price: number;
//     currency: string;
//     sku: string | null;
//     imageUrl: string | null;
//   }>;
// };

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
  filters?: {
    categories?: CatalogCategory[];
  };
};

























// 1. Shared Category Type
export interface CatalogCategory {
  id: string;
  name: string;
  description: string | null;
}

// 2. Main Product Type (Used in List & Detail)
export interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  price: number; // Calculated min price
  currency: string;
  landingUrl: string;
  imageUrl: string | null;
  sku: string | null;
  externalProductId: string | null;
  categoryId: string | null;
  category: CatalogCategory | null;
}

// 3. Variant Type (Specific to Detail View)
export interface ProductVariant {
  id: string;
  sku: string | null;
  volume: string | null; // e.g. "1 L", "4 L"
  mrp: number | null;
  promoPrice: number | null;
  dpl: number | null;
  imageUrl: string | null;
  landingUrl: string | null;
  isActive: boolean;
}

// 4. API Response for Single Product (Includes Variants)
export interface ProductDetailResponse {
  product: CatalogProduct;
  variants: ProductVariant[];
}

// 5. API Response for Catalog List
export interface CatalogListResponse {
  data: CatalogProduct[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
  filters: {
    categories: CatalogCategory[];
  };
}














// 1. Shared Category Type
export interface CatalogCategory {
  id: string;
  name: string;
  description: string | null;
}

// 2. Main Product Type (Used in List & Detail)
export interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  price: number; // Calculated min price
  currency: string;
  landingUrl: string;
  imageUrl: string | null;
  sku: string | null;
  externalProductId: string | null;
  categoryId: string | null;
  category: CatalogCategory | null;
}

// 3. Variant Type (Specific to Detail View)
export interface ProductVariant {
  id: string;
  sku: string | null;
  volume: string | null; // e.g. "1 L", "4 L"
  mrp: number | null;
  promoPrice: number | null;
  dpl: number | null;
  imageUrl: string | null;
  landingUrl: string | null;
  isActive: boolean;
}

// 4. API Response for Single Product (Includes Variants)
export interface ProductDetailResponse {
  product: CatalogProduct;
  variants: ProductVariant[];
}

// 5. API Response for Catalog List
export interface CatalogListResponse {
  data: CatalogProduct[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
  filters: {
    categories: CatalogCategory[];
  };
}