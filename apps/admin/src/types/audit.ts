export type AdminAuditLog = {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  performedBy?: string | null;
  createdAt: string;
  meta?: Record<string, unknown> | null;
};

export type AdminAuditListResponse = {
  data: AdminAuditLog[];
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
};
