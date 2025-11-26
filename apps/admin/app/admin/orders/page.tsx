'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../src/lib/api';
import { OrdersTable, OrderRow } from '../../../src/components/orders/OrdersTable';
import { RefundModal } from '../../../src/components/orders/RefundModal';

const pageSize = 10;

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'all' | 'paid' | 'pending' | 'refunded'>('all');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total?: number; totalPages?: number }>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refundOrder, setRefundOrder] = useState<string | null>(null);

  const load = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<{ data: any[]; meta?: { total?: number; totalPages?: number } }>(
          '/admin/orders',
          {
            status: status !== 'all' ? status : undefined,
            page,
            pageSize
          }
        );
        const rows =
          res.data?.map((o) => ({
            id: o.id,
            externalOrderId: o.externalOrderId,
            placedAt: o.placedAt ? new Date(o.placedAt) : null,
            total: o.totalNet ? Number(o.totalNet) : null,
            currency: o.currency ?? 'USD',
            paymentStatus: o.paymentStatus,
            attributionType: o.attributions?.[0]?.model ?? null
          })) ?? [];
        setOrders(rows);
        setMeta(res.meta ?? {});
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    },
    [status, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = meta.totalPages ?? Math.ceil((meta.total ?? orders.length) / pageSize) || 1;

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as any);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
          >
            <option value="all">All statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <OrdersTable
          data={orders}
          loading={loading}
          error={error ?? undefined}
          onRetry={load}
          onSelect={(o) => setRefundOrder(o.id)}
        />

        <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-50 dark:border-white/10"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-50 dark:border-white/10"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <RefundModal
        open={!!refundOrder}
        orderId={refundOrder}
        onClose={() => setRefundOrder(null)}
        onSubmitted={load}
      />
    </>
  );
}
