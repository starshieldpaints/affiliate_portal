export type AdminUser = {
  id: string;
  email: string;
  role: 'admin';
  adminProfile?: {
    id: string;
    displayName: string | null;
    permissions: unknown;
    timezone: string | null;
  } | null;
};
