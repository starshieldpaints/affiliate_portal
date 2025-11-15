export type CatalogCategory = {
  id: string;
  name: string;
  description: string | null;
};

export type CatalogProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  landingUrl: string;
  imageUrl: string | null;
  sku: string | null;
  externalProductId: string | null;
  categoryId: string | null;
  category: CatalogCategory | null;
  conversion?: string | null;
};

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
