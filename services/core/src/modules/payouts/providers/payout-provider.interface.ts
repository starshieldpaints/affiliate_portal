import { PayoutBatch, PayoutLine } from '@prisma/client';

export interface PayoutProviderResult {
  providerBatchId?: string;
  receiptUrl?: string;
  status: 'paid' | 'failed';
}

export interface PayoutProviderAdapter {
  submitBatch(batch: PayoutBatch, lines: PayoutLine[]): Promise<PayoutProviderResult>;
}

export const PAYOUT_PROVIDER = 'PAYOUT_PROVIDER';
