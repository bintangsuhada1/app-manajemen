'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, BarChart3, BriefcaseBusiness, Building2, CalendarClock, FileClock, Gauge, Receipt, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiUrl } from '@/lib/api';
import { ACTIVE_COMPANY_CHANGED_EVENT, COMPANIES_CHANGED_EVENT, COMPANY_DATA_CHANGED_EVENT, getActiveCompany, getActiveCompanyId, type Company, withActiveCompanyId } from '@/lib/companies';

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

const dashboardToneStyles: Record<DashboardTone, { icon: string; accent: string; glow: string; aura: string; dot: string }> = {
  navy: {
    icon: 'bg-gradient-to-br from-[#102343] to-navy text-white ring-white/50',
    accent: 'bg-gradient-to-r from-cyan-400 to-navy',
    glow: 'shadow-navy/10',
    aura: 'rgba(56,189,248,0.16)',
    dot: 'bg-cyan-400'
  },
  gold: {
    icon: 'bg-gradient-to-br from-amber-200 to-gold text-navy ring-amber-100',
    accent: 'bg-gradient-to-r from-amber-300 to-gold',
    glow: 'shadow-orange-200/70',
    aura: 'rgba(245,166,35,0.18)',
    dot: 'bg-amber-400'
  },
  emerald: {
    icon: 'bg-gradient-to-br from-emerald-50 to-cyan-50 text-emerald-700 ring-emerald-100',
    accent: 'bg-gradient-to-r from-emerald-400 to-cyan-400',
    glow: 'shadow-emerald-100',
    aura: 'rgba(16,185,129,0.16)',
    dot: 'bg-emerald-400'
  },
  rose: {
    icon: 'bg-gradient-to-br from-rose-50 to-orange-50 text-rose-700 ring-rose-100',
    accent: 'bg-gradient-to-r from-rose-400 to-orange-400',
    glow: 'shadow-rose-100',
    aura: 'rgba(239,68,68,0.16)',
    dot: 'bg-rose-400'
  },
  sky: {
    icon: 'bg-gradient-to-br from-sky-50 to-cyan-50 text-sky-700 ring-sky-100',
    accent: 'bg-gradient-to-r from-sky-400 to-cyan-400',
    glow: 'shadow-sky-100',
    aura: 'rgba(14,165,233,0.18)',
    dot: 'bg-sky-400'
  },
  slate: {
    icon: 'bg-gradient-to-br from-white to-slate-100 text-slate-700 ring-slate-200',
    accent: 'bg-gradient-to-r from-slate-300 to-slate-500',
    glow: 'shadow-slate-100',
    aura: 'rgba(148,163,184,0.14)',
    dot: 'bg-slate-400'
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

function getDeadlineVisual(daysLeft: number | null) {
  if (daysLeft === null) {
    return {
      card: 'border-slate-200 bg-white',
      badge: 'border-slate-200 bg-slate-50 text-slate-600',
      bar: 'bg-slate-400',
      label: 'Belum ada tanggal',
      width: '36%'
    };
  }
  if (daysLeft < 0) {
    return {
      card: 'border-rose-200 bg-rose-50',
      badge: 'border-rose-200 bg-white text-rose-700',
      bar: 'bg-rose-500',
      label: 'Overdue',
      width: '100%'
    };
  }
  if (daysLeft <= 7) {
    return {
      card: 'border-rose-200 bg-rose-50',
      badge: 'border-rose-200 bg-white text-rose-700',
      bar: 'bg-rose-500',
      label: `${daysLeft} hari`,
      width: '84%'
    };
  }
  if (daysLeft <= 14) {
    return {
      card: 'border-amber-200 bg-amber-50',
      badge: 'border-amber-200 bg-white text-amber-700',
      bar: 'bg-amber-500',
      label: `${daysLeft} hari`,
      width: '58%'
    };
  }
  return {
    card: 'border-emerald-200 bg-emerald-50',
    badge: 'border-emerald-200 bg-white text-emerald-700',
    bar: 'bg-emerald-500',
    label: `${daysLeft} hari`,
    width: '34%'
  };
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
    <div className={`group relative rounded-[28px] border border-white/65 bg-white/[0.70] shadow-[0_20px_64px_rgba(2,6,23,0.12),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-2xl ${styles.glow} transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-200/80 hover:bg-white/[0.84] hover:shadow-[0_28px_78px_rgba(2,6,23,0.16),0_0_30px_rgba(56,189,248,0.16)]`}>
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(135deg,rgba(255,255,255,0.62),transparent_36%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_13rem)] opacity-90" />
      <div className={`absolute inset-x-6 top-0 h-px ${styles.accent}`} />
      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{title}</p>
            <h3 className={`${emphasis ? 'text-2xl 2xl:text-[28px]' : 'text-[24px]'} money-value mt-2 break-words font-semibold leading-tight text-slate-950`}>{value}</h3>
            <p className="mt-2 inline-flex items-center gap-2 text-[11px] font-semibold text-slate-500"><span className={`h-1.5 w-1.5 rounded-full ${styles.dot} shadow-[0_0_12px_currentColor]`} />{note}</p>
          </div>
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl shadow-[0_12px_30px_rgba(2,6,23,0.14)] ring-1 transition-transform duration-200 group-hover:-rotate-3 ${styles.icon}`}>
            <Icon size={18} />
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
    <section className="relative min-w-0 rounded-[28px] border border-white/65 bg-white/[0.68] shadow-[0_24px_74px_rgba(2,6,23,0.13),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.13),transparent_18rem),linear-gradient(135deg,rgba(255,255,255,0.5),transparent_38%)]" />
      <div className="relative flex flex-wrap items-start justify-between gap-3 border-b border-white/60 bg-gradient-to-r from-white/68 to-slate-50/45 px-4 py-3.5 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#102343] to-navy text-cyan-200 shadow-[0_10px_24px_rgba(7,20,38,0.16)]">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-slate-950">{title}</h2>
            <p className="mt-0.5 text-[13px] font-normal text-slate-500">{description}</p>
          </div>
        </div>
        {action && <div className="min-w-0">{action}</div>}
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}

function DashboardEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-slate-300/80 bg-white/[0.56] p-5 text-center shadow-inner backdrop-blur-md">
      <div>
        <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-white/80 text-slate-500 shadow-sm backdrop-blur">
          <Gauge size={18} />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-950">{title}</p>
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
  const [refreshKey, setRefreshKey] = useState(0);
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
    function syncCompanyData(event: Event) {
      const companyId = (event as CustomEvent<{ companyId?: string | null }>).detail?.companyId;
      if (!companyId || companyId === activeCompanyId) setRefreshKey((key) => key + 1);
    }

    window.addEventListener(COMPANY_DATA_CHANGED_EVENT, syncCompanyData);
    return () => window.removeEventListener(COMPANY_DATA_CHANGED_EVENT, syncCompanyData);
  }, [activeCompanyId]);

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
  }, [activeCompanyId, refreshKey, router, token]);

  if (error) {
    return (
      <section className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-semibold text-rose-700 shadow-sm">
        {error}
      </section>
    );
  }

  if (!data) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
        <div className="h-4 w-44 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
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
    <section className="blueprint-panel mb-3 shadow-premium">
      <div className="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
        <div className="relative min-w-0 bg-[linear-gradient(135deg,#071426_0%,#0B2345_58%,#063044_100%)] p-4 text-white sm:p-5">
          <div className="absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(14,165,233,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,.14)_1px,transparent_1px)] [background-size:30px_30px]" />
          <div className="absolute inset-y-0 right-0 w-2/3 bg-[radial-gradient(circle_at_70%_20%,rgba(6,182,212,0.24),transparent_22rem),linear-gradient(135deg,rgba(14,165,233,0.14),rgba(245,158,11,0.08),rgba(255,255,255,0))]" />
          <div className="relative min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.18] bg-white/[0.12] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-cyan-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md">
              <BarChart3 size={14} />
              Operational Overview
            </div>
            <h1 className="mt-3 max-w-3xl break-words text-[20px] font-semibold leading-tight text-[#F8FAFC] sm:text-[24px]">
              Project & Financial Overview
            </h1>
            <p className="mt-2 max-w-2xl text-[12px] font-normal leading-5 text-[rgba(226,232,240,0.88)]">
              Pantau proyek, kas, invoice, dan deadline dalam satu tampilan operasional.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur ${overdueTone}`}>
                <AlertTriangle size={15} />
                {data.kpis.invoiceOverdue} invoice overdue
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/[0.18] bg-white/[0.12] px-3 py-1.5 text-xs font-semibold text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md">
                <BriefcaseBusiness size={15} />
                {data.kpis.activeProjects} proyek aktif
              </span>
            </div>
          </div>
        </div>
        <div className="relative min-w-0 border-t border-white/60 bg-white/[0.72] p-4 backdrop-blur-xl xl:border-l xl:border-t-0">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_14rem)]" />
          <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-500">Net Cashflow</p>
          <p className="money-value mt-2 break-words text-2xl font-semibold text-slate-950">{formatCurrency(netCash)}</p>
          <div className="mt-4 rounded-2xl border border-white/70 bg-white/[0.62] p-3.5 shadow-inner backdrop-blur-md">
            <div className="flex items-center justify-between gap-4 text-xs font-bold text-slate-500">
              <span>Kas Masuk</span>
              <span>{cashflowProgress}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80">
              <div className={`h-full rounded-full ${netCash >= 0 ? 'bg-gradient-to-r from-emerald-400 to-cyan-400' : 'bg-gradient-to-r from-rose-500 to-orange-400'}`} style={{ width: `${cashflowProgress}%` }} />
            </div>
          </div>
          <p className="mt-3 text-[13px] font-medium text-slate-600">Status: <span className={netCash >= 0 ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>{cashHealth}</span></p>
          </div>
        </div>
      </div>
    </section>

    <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <DashboardStatCard title="Proyek Aktif" value={data.kpis.activeProjects.toString()} note="Status berjalan" icon={BriefcaseBusiness} tone="navy" />
      <DashboardStatCard title="Customer" value={data.kpis.customers.toString()} note="Total customer" icon={Building2} tone="slate" />
      <DashboardStatCard title="Quotation Pending" value={data.kpis.pendingQuotes.toString()} note="Draft atau terkirim" icon={FileClock} tone="gold" />
      <DashboardStatCard title="Invoice Total" value={formatCurrency(data.kpis.invoiceTotal)} note="Tidak termasuk batal" icon={Receipt} tone="sky" emphasis />
    </div>

    <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <DashboardStatCard title="Invoice Overdue" value={data.kpis.invoiceOverdue.toString()} note="Lewat jatuh tempo" icon={CalendarClock} tone="rose" />
      <DashboardStatCard title="Kas Masuk" value={formatCurrency(data.kpis.income)} note="Seluruh transaksi" icon={TrendingUp} tone="emerald" emphasis />
      <DashboardStatCard title="Kas Keluar" value={formatCurrency(data.kpis.expense)} note="Seluruh transaksi" icon={TrendingDown} tone="rose" emphasis />
      <DashboardStatCard title="Saldo" value={formatCurrency(data.kpis.balance)} note="Kas masuk dikurangi keluar" icon={Wallet} tone="gold" emphasis />
    </div>

    <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-3">
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
          <div className="relative h-64 min-w-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_18rem),linear-gradient(180deg,rgba(15,23,42,0.02),rgba(255,255,255,0.28))] p-5 sm:h-72">
            <div className="pointer-events-none absolute inset-x-6 top-6 h-24 rounded-full bg-cyan-300/10 blur-3xl" />
            {chartHasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.88} />
                    </linearGradient>
                    <linearGradient id="dashboardExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FB7185" stopOpacity={0.92} />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={0.86} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 8" vertical={false} stroke="rgba(148,163,184,0.20)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }} tickFormatter={(value) => `${Number(value) / 1000000} jt`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(14,165,233,0.08)' }}
                    formatter={(value: unknown, name: string) => [formatCurrency(Number(value)), name]}
                    contentStyle={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.82)', background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(18px)', boxShadow: '0 22px 54px rgba(2, 6, 23, 0.18)', fontSize: 12 }}
                    labelStyle={{ color: '#0F172A', fontWeight: 600 }}
                  />
                  <Bar dataKey="in" name="Kas Masuk" fill="url(#dashboardIncome)" radius={[10, 10, 3, 3]} isAnimationActive animationDuration={900} />
                  <Bar dataKey="out" name="Kas Keluar" fill="url(#dashboardExpense)" radius={[10, 10, 3, 3]} isAnimationActive animationDuration={900} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <DashboardEmptyState title="Belum ada data keuangan" description="Grafik akan terisi otomatis setelah transaksi kas masuk atau keluar tercatat." />
            )}
          </div>
        </DashboardSectionCard>
      </div>

      <DashboardSectionCard title="Reminder Deadline" description="Prioritas jadwal terdekat." icon={CalendarClock}>
        <div className="space-y-3 p-4">
          {data.deadlines.length === 0 && <DashboardEmptyState title="Tidak ada deadline dekat" description="Proyek dengan tanggal akhir terdekat akan tampil di sini." />}
          {data.deadlines.map((deadline) => {
            const daysLeft = getDaysLeft(deadline.endDate);
            const visual = getDeadlineVisual(daysLeft);
            return (
              <div key={deadline.id} className={`rounded-2xl border p-3.5 text-[13px] shadow-[0_12px_30px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.68)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 ${visual.card} ${daysLeft !== null && daysLeft < 0 ? 'animate-pulse-subtle shadow-[0_18px_44px_rgba(239,68,68,0.18)]' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-navy">{deadline.code ? `${deadline.code} - ` : ''}{deadline.name}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{formatDate(deadline.endDate)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black ${visual.badge}`}>
                    {visual.label}
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full rounded-full ${visual.bar} shadow-[0_0_16px_currentColor]`} style={{ width: visual.width }} />
                </div>
              </div>
            );
          })}
        </div>
      </DashboardSectionCard>
    </div>
  </div>;
}
