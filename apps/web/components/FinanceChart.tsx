'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiUrl } from '@/lib/api';

type ChartRow = { month: number; income: number; expense: number };
const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function FinanceChart() {
  const router = useRouter();
  const [year, setYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState<ChartRow[]>([]);
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const authHeaders = useMemo(() => token ? { Authorization: `Bearer ${token}` } : undefined, [token]);

  useEffect(() => {
    async function loadChart() {
      if (!token) return;
      const response = await fetch(`${apiUrl}/api/finance/chart?year=${year}`, { headers: authHeaders });
      if (response.status === 401) {
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('user');
        router.replace('/login');
        return;
      }
      if (response.status === 403) {
        router.replace('/forbidden');
        return;
      }
      if (!response.ok) return;
      setRows(await response.json());
    }
    void loadChart();
  }, [authHeaders, router, token, year]);

  const data = rows.map((row) => ({ month: monthLabels[row.month - 1], in: row.income, out: row.expense }));
  const hasData = data.some((row) => row.in > 0 || row.out > 0);

  return (
    <section id="analitik" className="card p-0 lg:col-span-2">
      <div className="section-header">
        <div>
          <h2 className="section-title">Grafik Keuangan</h2>
          <p className="section-description">Pemasukan dan pengeluaran per bulan.</p>
        </div>
        <select className="input max-w-40" value={year} onChange={(event) => setYear(Number(event.target.value))}>
          {[year - 1, year, year + 1].map((value) => <option key={value}>{value}</option>)}
        </select>
      </div>
      <div className="h-72 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_18rem)] p-4">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="financeIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.88} />
                </linearGradient>
                <linearGradient id="financeExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FB7185" stopOpacity={0.92} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0.86} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" vertical={false} stroke="rgba(148,163,184,0.28)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(value) => `${Number(value) / 1000000} jt`} />
              <Tooltip
                cursor={{ fill: 'rgba(14,165,233,0.08)' }}
                contentStyle={{ borderRadius: 16, border: '1px solid rgba(226,232,240,0.88)', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(14px)', boxShadow: '0 18px 44px rgba(15, 23, 42, 0.12)', fontSize: 12 }}
                labelStyle={{ color: '#0F172A', fontWeight: 600 }}
              />
              <Bar dataKey="in" name="Pemasukan" fill="url(#financeIncome)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="out" name="Pengeluaran" fill="url(#financeExpense)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center rounded-2xl border border-dashed border-slate-300/80 bg-white/[0.56] text-center text-sm text-slate-500 backdrop-blur-md">
            Grafik akan tampil setelah transaksi tercatat.
          </div>
        )}
      </div>
    </section>
  );
}
