'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, BarChart3, BriefcaseBusiness, Building2, CalendarClock, FileClock, Gauge, Receipt, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiUrl } from '@/lib/api';
import { ACTIVE_COMPANY_CHANGED_EVENT, COMPANIES_CHANGED_EVENT, getActiveCompany, getActiveCompanyId, type Company, withActiveCompanyId } from '@/lib/companies';

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
type DashboardTone = 'navy' | 'gold' | 'emerald' | 'rose' | 'sky' | 'slate';

const dashboardToneStyles: Record<DashboardTone, { icon: string; accent: string; glow: string }> = {
  navy: {
    icon: 'bg-navy text-white ring-navy/10',
    accent: 'bg-navy',
    glow: 'shadow-navy/10'
  },
  gold: {
    icon: 'bg-gold text-navy ring-gold/30',
    accent: 'bg-gold',
    glow: 'shadow-orange-200/70'
  },
  emerald: {
    icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    accent: 'bg-emerald-500',
    glow: 'shadow-emerald-100'
  },
  rose: {
    icon: 'bg-rose-50 text-rose-700 ring-rose-100',
    accent: 'bg-rose-500',
    glow: 'shadow-rose-100'
  },
  sky: {
    icon: 'bg-sky-50 text-sky-700 ring-sky-100',
    accent: 'bg-sky-500',
    glow: 'shadow-sky-100'
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700 ring-slate-200',
    accent: 'bg-slate-500',
    glow: 'shadow-slate-100'
  }
};

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

function DashboardStatCard({
  title,
  value,
  note,
  icon: Icon,
  tone = 'navy',
  emphasis = false
}: {
  title: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone?: DashboardTone;
  emphasis?: boolean;
}) {
  const styles = dashboardToneStyles[tone];

  return (
    <div className={`group relative overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm ${styles.glow} transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-premium`}>
      <div className={`absolute inset-x-0 top-0 h-1 ${styles.accent}`} />
      <div className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-slate-500">{title}</p>
            <h3 className={`${emphasis ? 'text-2xl 2xl:text-3xl' : 'text-2xl'} mt-2 break-words font-black text-navy`}>{value}</h3>
            <p className="mt-2 text-xs font-semibold text-slate-500">{note}</p>
          </div>
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ring-1 ${styles.icon}`}>
            <Icon size={21} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSectionCard({
  title,
  description,
  icon: Icon,
  children,
  action
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm shadow-slate-200/80">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 bg-gradient-to-r from-white to-slate-50 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-navy text-gold shadow-sm">
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-navy">{title}</h2>
            <p className="mt-0.5 text-sm font-medium text-slate-500">{description}</p>
          </div>
        </div>
        {action && <div className="min-w-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function DashboardEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-44 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
      <div>
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-lg bg-white text-slate-500 shadow-sm">
          <Gauge size={20} />
        </div>
        <p className="mt-3 text-sm font-bold text-navy">{title}</p>
        <p className="mt-1 max-w-xs text-xs font-medium leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export function DashboardAnalytics() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [activeCompany, setActiveCompany] = useState<Company>(() => getActiveCompany());
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(() => getActiveCompanyId());
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;

  useEffect(() => {
    function syncActiveCompany() {
      setActiveCompany(getActiveCompany());
      setActiveCompanyId(getActiveCompanyId());
    }

    window.addEventListener(ACTIVE_COMPANY_CHANGED_EVENT, syncActiveCompany);
    window.addEventListener(COMPANIES_CHANGED_EVENT, syncActiveCompany);
    window.addEventListener('storage', syncActiveCompany);
    return () => {
      window.removeEventListener(ACTIVE_COMPANY_CHANGED_EVENT, syncActiveCompany);
      window.removeEventListener(COMPANIES_CHANGED_EVENT, syncActiveCompany);
      window.removeEventListener('storage', syncActiveCompany);
    };
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      if (!token) return;
      try {
        const response = await fetch(`${apiUrl}/api${withActiveCompanyId('/analytics/dashboard', activeCompanyId)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
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
  }, [activeCompanyId, router, token]);

  if (error) {
    return (
      <section className="rounded-lg border border-rose-100 bg-rose-50 p-5 text-sm font-semibold text-rose-700 shadow-sm">
        {error}
      </section>
    );
  }

  if (!data) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
        <div className="h-4 w-44 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-lg bg-slate-100" />)}
        </div>
      </section>
    );
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
  const overdueTone = data.kpis.invoiceOverdue > 0 ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  const chartHasData = chart.some((row) => row.in > 0 || row.out > 0);

  return <div className="min-w-0">
    <section className="mb-6 overflow-hidden rounded-lg border border-navy/10 bg-white shadow-premium">
      <div className="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
        <div className="relative min-w-0 overflow-hidden bg-navy p-5 text-white sm:p-8">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[linear-gradient(135deg,rgba(245,165,36,0.18),rgba(255,255,255,0))]" />
          <div className="relative min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase text-gold">
              <BarChart3 size={14} />
              Ringkasan Operasional
            </div>
            <h1 className="mt-5 max-w-3xl break-words text-2xl font-black leading-tight sm:text-3xl">
              Command center operasional {activeCompany.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-200">
              Pantau proyek aktif, invoice, posisi kas, dan tenggat terdekat dalam satu tampilan yang ringkas untuk keputusan harian.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${overdueTone}`}>
                <AlertTriangle size={15} />
                {data.kpis.invoiceOverdue} invoice overdue
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-slate-100">
                <BriefcaseBusiness size={15} />
                {data.kpis.activeProjects} proyek aktif
              </span>
            </div>
          </div>
        </div>
        <div className="min-w-0 border-t border-slate-200 bg-white p-5 sm:p-6 xl:border-l xl:border-t-0">
          <p className="text-xs font-bold uppercase text-slate-500">Net cashflow</p>
          <p className="mt-3 break-words text-2xl font-black text-navy 2xl:text-3xl">{formatCurrency(netCash)}</p>
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4 text-xs font-bold text-slate-500">
              <span>Kas Masuk</span>
              <span>{cashflowProgress}%</span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div className={`h-full rounded-full ${netCash >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${cashflowProgress}%` }} />
            </div>
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-600">Status: <span className={netCash >= 0 ? 'text-emerald-700' : 'text-rose-700'}>{cashHealth}</span></p>
        </div>
      </div>
    </section>

    <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <DashboardStatCard title="Proyek Aktif" value={data.kpis.activeProjects.toString()} note="Status berjalan" icon={BriefcaseBusiness} tone="navy" />
      <DashboardStatCard title="Customer" value={data.kpis.customers.toString()} note="Total customer" icon={Building2} tone="slate" />
      <DashboardStatCard title="Quotation Pending" value={data.kpis.pendingQuotes.toString()} note="Draft atau terkirim" icon={FileClock} tone="gold" />
      <DashboardStatCard title="Invoice Total" value={formatCurrency(data.kpis.invoiceTotal)} note="Tidak termasuk batal" icon={Receipt} tone="sky" emphasis />
    </div>

    <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <DashboardStatCard title="Invoice Overdue" value={data.kpis.invoiceOverdue.toString()} note="Lewat jatuh tempo" icon={CalendarClock} tone="rose" />
      <DashboardStatCard title="Kas Masuk" value={formatCurrency(data.kpis.income)} note="Seluruh transaksi" icon={TrendingUp} tone="emerald" emphasis />
      <DashboardStatCard title="Kas Keluar" value={formatCurrency(data.kpis.expense)} note="Seluruh transaksi" icon={TrendingDown} tone="rose" emphasis />
      <DashboardStatCard title="Saldo" value={formatCurrency(data.kpis.balance)} note="Kas masuk dikurangi keluar" icon={Wallet} tone="gold" emphasis />
    </div>

    <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-3">
      <div id="analitik" className="min-w-0 xl:col-span-2">
        <DashboardSectionCard
          title="Grafik Keuangan"
          description="Kas masuk dan keluar per bulan."
          icon={BarChart3}
          action={(
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
              <span className="inline-flex items-center gap-2 text-emerald-700"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Kas Masuk</span>
              <span className="inline-flex items-center gap-2 text-rose-700"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" />Kas Keluar</span>
            </div>
          )}
        >
          <div className="h-72 min-w-0 p-4 sm:h-80">
            {chartHasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(value) => `${Number(value) / 1000000} jt`} />
                  <Tooltip
                    cursor={{ fill: '#F8FAFC' }}
                    formatter={(value: unknown, name: string) => [formatCurrency(Number(value)), name]}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)' }}
                  />
                  <Bar dataKey="in" name="Kas Masuk" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="out" name="Kas Keluar" fill="#F43F5E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <DashboardEmptyState title="Belum ada data keuangan" description="Grafik akan terisi otomatis setelah transaksi kas masuk atau keluar tercatat." />
            )}
          </div>
        </DashboardSectionCard>
      </div>

      <DashboardSectionCard title="Reminder Deadline" description="Prioritas jadwal terdekat." icon={CalendarClock}>
        <div className="space-y-3 p-5">
          {data.deadlines.length === 0 && <DashboardEmptyState title="Tidak ada deadline dekat" description="Proyek dengan tanggal akhir terdekat akan tampil di sini." />}
          {data.deadlines.map((deadline) => {
            const daysLeft = getDaysLeft(deadline.endDate);
            const urgent = daysLeft !== null && daysLeft <= 7;
            return (
              <div key={deadline.id} className={`rounded-lg border p-4 text-sm shadow-sm transition-colors ${urgent ? 'border-rose-100 bg-rose-50' : 'border-slate-200 bg-white hover:border-gold/40'}`}>
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
      </DashboardSectionCard>
    </div>
  </div>;
}
