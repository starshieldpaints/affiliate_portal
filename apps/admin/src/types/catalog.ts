export type AdminProduct = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  sku?: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string | null } | null;
  landingUrl?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
};

export type CreateAdminProductPayload = {
  name: string;
  price: number;
  currency: string;
  description?: string | null;
  categoryId?: string | null;
  sku?: string | null;
  landingUrl?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
};
