"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiUrl } from '@/lib/api';
import { getActiveCompanyId, ACTIVE_COMPANY_CHANGED_EVENT, withActiveCompanyId } from '@/lib/companies';

type Transaction = { id: string; category: string; date: string; amount: number; type: 'INCOME' | 'EXPENSE' };

export default function TransactionsPreview() {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(() => getActiveCompanyId());

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl}/api${withActiveCompanyId('/finance', activeCompanyId)}`);
        if (!res.ok) return setRows([]);
        const data = await res.json();
        setRows(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [activeCompanyId]);

  useEffect(() => {
    function onChange() {
      setActiveCompanyId(getActiveCompanyId());
    }
    window.addEventListener(ACTIVE_COMPANY_CHANGED_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(ACTIVE_COMPANY_CHANGED_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Transaksi Terbaru</h3>
        <Link href="/dashboard/finance" className="btn-secondary text-xs">Lihat Semua</Link>
      </div>
      <div className="mt-3 space-y-2">
        {loading && <div className="text-sm text-slate-500">Memuat...</div>}
        {!loading && rows.length === 0 && <div className="text-sm text-slate-500">Tidak ada transaksi.</div>}
        {rows.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-semibold text-navy">{t.category}</p>
              <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('id-ID')}</p>
            </div>
            <div className={`text-sm font-semibold ${t.type === 'INCOME' ? 'text-emerald-700' : 'text-rose-700'}`}>
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(t.amount))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
