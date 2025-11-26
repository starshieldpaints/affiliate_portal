export type AdminOrderItem = {
  id: string;
  name: string | null;
  sku: string | null;
  quantity: number;
  unitPriceNet: number;
  lineTotalNet: number;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  externalId?: string | null;
  affiliateId: string | null;
  couponCode?: string | null;
  storeId?: string | null;
  amount: number;
  currency: string;
  status: string;
  paymentStatus?: string | null;
  risk?: string | null;
  createdAt: string;
  placedAt?: string | null;
  manualOverride?: boolean;
  items?: AdminOrderItem[];
};

export type AdminOrdersListResponse = {
  data: AdminOrder[];
  meta: { page: number; pageSize: number; total: number };
};
