export type AuthUser = {
  id: string;
  email: string;
  emailVerifiedAt?: string | null;
  role: 'affiliate' | 'admin';
  status?: string;
  affiliate?: {
    id: string;
    displayName: string | null;
    defaultReferralCode: string;
    phone?: string | null;
    phoneVerifiedAt?: string | null;
    kycStatus: string;
    payoutMethod: string | null;
    payoutDetails: Record<string, unknown> | null;
    panNumber: string | null;
    aadhaarNumber: string | null;
    panImageUrl: string | null;
    aadhaarFrontUrl: string | null;
    aadhaarBackUrl: string | null;
  } | null;
  adminProfile?: {
    id: string;
    displayName: string | null;
    permissions: unknown;
    timezone: string | null;
  } | null;
};
