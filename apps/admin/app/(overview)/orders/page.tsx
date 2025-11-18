const orders = [
  {
    id: 'ORD-54210',
    customer: 'Masked #98F2',
    affiliate: 'Alex Carter',
    total: '$489.00',
    status: 'Paid',
    attribution: 'Last Click',
    risk: 'Low'
  },
  {
    id: 'ORD-54188',
    customer: 'Masked #77AD',
    affiliate: 'Mira Solis',
    total: '$329.00',
    status: 'Refunded',
    attribution: 'Coupon',
    risk: 'Medium'
  },
  {
    id: 'ORD-54162',
    customer: 'Masked #64BH',
    affiliate: 'Orion Labs',
    total: '$249.00',
    status: 'Paid',
    attribution: 'Manual Override',
    risk: 'Review'
  }
];

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Orders & Refunds</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Attribution Stream</h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          All orders are ingested idempotently via webhooks. Attribute by last click or coupon and
          handle manual overrides with a full audit trail.
        </p>
      </header>
      <div className="overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/60 shadow-lg shadow-black/20">
        <table className="min-w-full divide-y divide-slate-800/70 text-sm text-slate-200">
          <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-6 py-4 text-left font-medium">Order</th>
              <th className="px-6 py-4 text-left font-medium">Affiliate</th>
              <th className="px-6 py-4 text-left font-medium">Total</th>
              <th className="px-6 py-4 text-left font-medium">Status</th>
              <th className="px-6 py-4 text-left font-medium">Attribution</th>
              <th className="px-6 py-4 text-left font-medium">Risk</th>
              <th className="px-6 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-brand/10">
                <td className="px-6 py-4">
                  <p className="font-semibold text-white">{order.id}</p>
                  <p className="text-xs text-slate-400">{order.customer}</p>
                </td>
                <td className="px-6 py-4 text-xs text-slate-300">{order.affiliate}</td>
                <td className="px-6 py-4 text-xs text-slate-300">{order.total}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      order.status === 'Paid'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-300">{order.attribution}</td>
                <td className="px-6 py-4 text-xs text-brand">{order.risk}</td>
                <td className="px-6 py-4 text-right text-xs">
                  <button className="rounded-full border border-slate-700/70 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-brand hover:text-brand">
                    View timeline
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
