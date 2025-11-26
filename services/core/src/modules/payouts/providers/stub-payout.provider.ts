import { PayoutBatch, PayoutLine } from '@prisma/client';
import { PayoutProviderAdapter, PayoutProviderResult } from './payout-provider.interface';

type StubOptions = {
  shouldFail?: boolean;
};

/**
 * Stub payout provider that simulates remote submission.
 * In production replace with Stripe/PayPal/Wise adapter.
 */
export class StubPayoutProvider implements PayoutProviderAdapter {
  constructor(private readonly options: StubOptions = {}) {}

  async submitBatch(batch: PayoutBatch, lines: PayoutLine[]): Promise<PayoutProviderResult> {
    if (this.options.shouldFail) {
      return {
        status: 'failed',
        providerBatchId: `stub-${batch.id}-fail`
      };
    }
    if (!lines.length) {
      return {
        status: 'failed',
        providerBatchId: `stub-${batch.id}-empty`
      };
    }

    // simulate async network call
    await new Promise((resolve) => setTimeout(resolve, 10));
    return {
      status: 'paid',
      providerBatchId: `stub-${batch.id}`,
      receiptUrl: `https://stub.example.com/receipt/${batch.id}`
    };
  }
}
