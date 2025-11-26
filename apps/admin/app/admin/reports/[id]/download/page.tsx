'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ReportDownloadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const reportId = params?.id;

  useEffect(() => {
    if (!reportId) return;
    (async () => {
      const res = await fetch(`/admin/reports/${reportId}/download`, {
        method: 'GET',
        credentials: 'include'
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      router.replace('/admin/reports');
    })();
  }, [reportId, router]);

  return (
    <div className="flex h-screen items-center justify-center text-sm text-slate-500">
      Preparing download...
    </div>
  );
}
