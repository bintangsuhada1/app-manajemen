'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, BriefcaseBusiness, Building2, CalendarClock, FileClock, Receipt, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { KpiCard } from '@/components/KpiCard';
import { apiUrl } from '@/lib/api';

type Deadline = {
  id: string;
  code: string | null;
  name: string;
  endDate: string | null;
};

type DashboardData = {
  kpis: {
    activeProjects: number;
    customers: number;
    pendingQuotes: number;
    invoiceTotal: number;
    invoiceOverdue: number;
    income: number;
    expense: number;
    balance: number;
  };
  chart: Array<{ month: number; income: number; expense: number }>;
  deadlines: Deadline[];
};

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value));
}

function getDaysLeft(value: string | null) {
  if (!value) return null;
  const dueDate = new Date(value);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  return Math.ceil((startOfDueDate.getTime() - startOfToday.getTime()) / 86400000);
}

export function DashboardAnalytics() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const authHeaders = useMemo(() => token ? { Authorization: `Bearer ${token}` } : undefined, [token]);

  useEffect(() => {
    async function loadDashboard() {
      if (!token) return;
      try {
        const response = await fetch(`${apiUrl}/api/analytics/dashboard`, { headers: authHeaders });
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
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          setError(payload?.message || 'Gagal memuat analytics');
          return;
        }
        setData(await response.json());
      } catch {
        setError('Tidak dapat terhubung ke server analytics.');
      }
    }
    void loadDashboard();
  }, [authHeaders, router, token]);

  if (error) {
    return <section className="card p-5 text-sm text-red-700">{error}</section>;
  }

  if (!data) {
    return <section className="card p-5 text-sm text-slate-500">Memuat analytics...</section>;
  }

  const chart = data.chart.map((row) => ({
    month: monthLabels[row.month - 1],
    in: row.income,
    out: row.expense
  }));
  const netCash = data.kpis.income - data.kpis.expense;
  const hasCashActivity = data.kpis.income > 0 || data.kpis.expense > 0;
  const cashHealth = !hasCashActivity ? 'Belum ada transaksi' : netCash >= 0 ? 'Sehat' : 'Perlu perhatian';
  const cashflowProgress = hasCashActivity ? Math.round((data.kpis.income / (data.kpis.income + data.kpis.expense)) * 100) : 0;
  const overdueTone = data.kpis.invoiceOverdue > 0 ? 'text-rose-700 bg-rose-50 border-rose-100' : 'text-emerald-700 bg-emerald-50 border-emerald-100';

  return <>
    <section className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
      <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
        <div className="p-5 sm:p-6">
          <p className="text-xs font-bold uppercase text-gold">Ringkasan Operasional</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-navy sm:text-3xl">Kontrol proyek, kas, dan tagihan dalam satu layar</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Pantau kesehatan bisnis hari ini dari status proyek, pipeline invoice, arus kas, dan deadline yang mendekat.</p>
            </div>
            <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${overdueTone}`}>
              {data.kpis.invoiceOverdue} invoice overdue
            </span>
          </div>
        </div>
        <div className="border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0">
          <p className="text-sm font-bold text-slate-500">Net cashflow</p>
          <p className="mt-2 text-2xl font-black text-navy">{formatCurrency(netCash)}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className={`h-full rounded-full ${netCash >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${cashflowProgress}%` }} />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-600">Status: <span className={netCash >= 0 ? 'text-emerald-700' : 'text-rose-700'}>{cashHealth}</span></p>
        </div>
      </div>
    </section>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard title="Proyek Aktif" value={data.kpis.activeProjects.toString()} note="Status berjalan" icon={BriefcaseBusiness} tone="blue" />
      <KpiCard title="Customer" value={data.kpis.customers.toString()} note="Total customer" icon={Building2} tone="slate" />
      <KpiCard title="Quotation Pending" value={data.kpis.pendingQuotes.toString()} note="Draft atau terkirim" icon={FileClock} tone="gold" />
      <KpiCard title="Invoice Total" value={formatCurrency(data.kpis.invoiceTotal)} note="Tidak termasuk batal" icon={Receipt} tone="blue" />
      <KpiCard title="Invoice Overdue" value={data.kpis.invoiceOverdue.toString()} note="Lewat jatuh tempo" icon={CalendarClock} tone="rose" />
      <KpiCard title="Kas Masuk" value={formatCurrency(data.kpis.income)} note="Seluruh transaksi" icon={TrendingUp} tone="emerald" />
      <KpiCard title="Kas Keluar" value={formatCurrency(data.kpis.expense)} note="Seluruh transaksi" icon={TrendingDown} tone="rose" />
      <KpiCard title="Saldo" value={formatCurrency(data.kpis.balance)} note="Kas masuk dikurangi keluar" icon={Wallet} tone="slate" />
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <section id="analitik" className="card overflow-hidden lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-orange-50 text-gold">
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-navy">Grafik Keuangan</h2>
              <p className="text-sm text-slate-500">Kas masuk dan keluar per bulan.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="inline-flex items-center gap-2 text-emerald-700"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Kas Masuk</span>
            <span className="inline-flex items-center gap-2 text-rose-700"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" />Kas Keluar</span>
          </div>
        </div>
        <div className="h-80 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(value) => `${Number(value) / 1000000} jt`} />
              <Tooltip
                cursor={{ fill: '#F8FAFC' }}
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)' }}
              />
              <Bar dataKey="in" name="Kas Masuk" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="out" name="Kas Keluar" fill="#F43F5E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-sky-50 text-sky-700">
              <CalendarClock size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-navy">Reminder Deadline</h2>
              <p className="text-sm text-slate-500">Prioritas jadwal terdekat.</p>
            </div>
          </div>
        </div>
        <div className="space-y-3 p-5">
          {data.deadlines.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm font-medium text-slate-500">Tidak ada deadline dekat.</div>}
          {data.deadlines.map((deadline) => {
            const daysLeft = getDaysLeft(deadline.endDate);
            const urgent = daysLeft !== null && daysLeft <= 7;
            return (
              <div key={deadline.id} className={`rounded-lg border p-3 text-sm ${urgent ? 'border-rose-100 bg-rose-50' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-navy">{deadline.code ? `${deadline.code} - ` : ''}{deadline.name}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{formatDate(deadline.endDate)}</p>
                  </div>
                  {daysLeft !== null && (
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${urgent ? 'bg-white text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                      {daysLeft < 0 ? 'Lewat' : `${daysLeft} hari`}
                    </span>
                  )}
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full rounded-full ${urgent ? 'bg-rose-500' : 'bg-sky-500'}`} style={{ width: urgent ? '84%' : '48%' }} />
                </div>
              </div>
            );
          })}
            </div>
      </section>
    </div>
  </>;
}
