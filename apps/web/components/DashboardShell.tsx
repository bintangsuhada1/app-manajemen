'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarChart3, Bell, BriefcaseBusiness, Building2, ClipboardList, FileText, FolderOpen, Home, Menu, Receipt, Wallet, Boxes, LogOut, Settings, Users, X } from 'lucide-react';
import { canAccess, hashModuleMap, ModuleKey } from '@/lib/permissions';
import { ACTIVE_COMPANY_CHANGED_EVENT, COMPANIES_CHANGED_EVENT, fetchCompanies, getActiveCompany, type Company } from '@/lib/companies';
import clsx from 'clsx';

type SessionUser = {
  id?: string;
  name: string;
  email?: string;
  role: string;
};

type TokenPayload = {
  id?: string;
  name?: string;
  role?: string;
  exp?: number;
};

const menu: Array<[string, string, typeof Home, ModuleKey]> = [
  ['Dashboard', '/dashboard', Home, 'dashboard'],
  ['Proyek', '/dashboard/projects', BriefcaseBusiness, 'projects'],
  ['Pelanggan', '/dashboard/customers', Building2, 'customers'],
  ['Penawaran', '/dashboard/quotes', FileText, 'quotes'],
  ['Invoice', '/dashboard/invoices', Receipt, 'invoices'],
  ['Keuangan', '/dashboard/finance', Wallet, 'finance'],
  ['Laporan Harian', '/dashboard/daily-reports', ClipboardList, 'reports'],
  ['Material', '/dashboard/materials', Boxes, 'materials'],
  ['Dokumen', '/dashboard/documents', FolderOpen, 'documents'],
  ['Analitik', '/dashboard/analytics', BarChart3, 'analytics'],
  ['Manajemen User', '/dashboard/users', Users, 'users'],
  ['Pengaturan', '/dashboard/settings', Settings, 'settings']
];

function decodeToken(token: string): TokenPayload | null {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(window.atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function readSessionUser(tokenPayload: TokenPayload) {
  try {
    const storedUser = window.localStorage.getItem('user');
    if (storedUser) return JSON.parse(storedUser) as SessionUser;
  } catch {
    // Fallback to token payload below.
  }
  if (!tokenPayload.name || !tokenPayload.role) return null;
  return { id: tokenPayload.id, name: tokenPayload.name, role: tokenPayload.role };
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [activeCompany, setActiveCompany] = useState<Company>(() => getActiveCompany());
  const [ready, setReady] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState('');

  useEffect(() => {
    const token = window.localStorage.getItem('token');
    const payload = token ? decodeToken(token) : null;
    const isExpired = payload?.exp ? payload.exp * 1000 <= Date.now() : true;

    if (!token || !payload || isExpired) {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
      router.replace('/login');
      return;
    }

    const sessionUser = readSessionUser(payload);
    if (!sessionUser) {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
      router.replace('/login');
      return;
    }

    if (sessionUser.role === 'SUPER_ADMIN' || sessionUser.role === 'DIREKTUR') {
      void fetchCompanies(token).then(() => setActiveCompany(getActiveCompany())).catch(() => setActiveCompany(getActiveCompany()));
    } else {
      setActiveCompany(getActiveCompany());
    }
    setUser(sessionUser);
    setReady(true);
  }, [router]);

  useEffect(() => {
    function syncActiveCompany() {
      setActiveCompany(getActiveCompany());
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
    if (!user) return;
    const role = user.role;
    // ensure role can access current pathname
    const found = menu.find(([, href, , module]) => {
      if (href === '/dashboard') return pathname === '/dashboard';
      return pathname.startsWith(href);
    });
    if (found && !canAccess(role, found[3])) router.replace('/forbidden');
  }, [router, user, pathname]);

  function handleLogout() {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
    window.localStorage.removeItem('session');
    window.sessionStorage.clear();
    router.replace('/login');
  }

  if (!ready || !user) return null;

  const visibleMenu = menu.filter(([, , , module]) => canAccess(user.role, module));
  const currentMenu = visibleMenu.find(([, href]) => {
    if (href.includes('#')) return currentHash && href.endsWith(currentHash);
    return pathname === href && !currentHash;
  }) || visibleMenu.find(([, href]) => pathname === href) || visibleMenu[0];
  const currentLabel = currentMenu?.[0] || 'Dashboard';
  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const renderSidebar = () => (
    <div className="sidebar-shell custom-scrollbar flex h-full min-h-0 flex-col">
      <div className="shrink-0 rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-3xl bg-gradient-to-br from-amber-200 to-gold text-[15px] font-semibold text-navy shadow-[0_14px_28px_rgba(245,158,11,0.22)]">J</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{activeCompany.name}</p>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-cyan-100/80">Industrial Intelligence</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-menu custom-scrollbar my-5 min-h-0 flex-1 space-y-2 overflow-y-auto rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-3 pr-2 shadow-[0_18px_44px_rgba(7,20,38,0.16)] backdrop-blur-md">
        {visibleMenu.map(([label, href, Icon]) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={label}
              href={href}
              onClick={() => setMobileNavOpen(false)}
              className={clsx(
                'group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-[13px] font-medium transition-all duration-200',
                isActive ? 'bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_12px_28px_rgba(0,0,0,0.14)]' : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
              )}
            >
              <span className={clsx('absolute left-0 top-3 bottom-3 w-1.5 rounded-full transition-all', isActive ? 'bg-gradient-to-b from-cyan-300 to-gold opacity-100' : 'opacity-0')} />
              <span className={clsx('grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition-all duration-200', isActive ? 'bg-gradient-to-br from-amber-200 to-gold text-navy shadow-[0_8px_18px_rgba(245,158,11,0.24)]' : 'bg-white/5 text-slate-300 group-hover:bg-white/10 group-hover:text-cyan-200')}>
                <Icon size={16} />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer shrink-0 rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-3xl bg-white/[0.12] text-sm font-semibold text-white ring-1 ring-white/10">{initials || 'U'}</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-[11px] font-medium text-slate-300">{user.role.replaceAll('_', ' ')}</p>
          </div>
        </div>
        <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-[13px] font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white" onClick={handleLogout}>
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.10),transparent_30rem),radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_26rem),#F4F7FB]">
      <aside className="fixed inset-y-0 left-0 hidden h-screen w-60 overflow-hidden border-r border-white/10 bg-[linear-gradient(180deg,#071426_0%,#0B1730_58%,#06111F_100%)] p-5 text-white shadow-[18px_0_50px_rgba(7,20,38,0.18)] lg:flex lg:flex-col">
        {renderSidebar()}
      </aside>

      <div className={clsx('fixed inset-0 z-50 bg-slate-950/50 transition-opacity lg:hidden', mobileNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0')} onClick={() => setMobileNavOpen(false)} />
      <aside className={clsx('fixed inset-y-0 left-0 z-50 flex h-screen w-80 max-w-[86vw] flex-col overflow-hidden bg-[linear-gradient(180deg,#071426,#0B1730)] p-4 text-white shadow-2xl transition-transform lg:hidden', mobileNavOpen ? 'translate-x-0' : '-translate-x-full')}>
        <button className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-white hover:bg-white/10" onClick={() => setMobileNavOpen(false)} aria-label="Tutup navigasi">
          <X size={18} />
        </button>
        <div className="mt-12 min-h-0 flex-1">
          {renderSidebar()}
        </div>
      </aside>

      <main className="min-h-screen min-w-0 overflow-x-hidden lg:pl-60">
        <div className="sticky top-0 z-40 border-b border-white/70 bg-white/[0.82] px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:px-6">
          <div className="flex w-full max-w-none items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button className="icon-button lg:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Buka navigasi">
                <Menu size={18} />
              </button>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-500">
                  <span>PT Jurti</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-cyan-700">{currentLabel}</span>
                </div>
                <div className="mt-1 flex min-w-0 items-center gap-2">
                  <h1 className="truncate text-[19px] font-semibold text-slate-950 sm:text-[20px]">{activeCompany.name}</h1>
                </div>
                <p className="truncate text-[12px] font-medium text-slate-500">{activeCompany.type || 'Operational Intelligence Dashboard'}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button className="icon-button hidden sm:inline-grid" title="Notifikasi operasional" aria-label="Notifikasi operasional">
                <Bell size={15} />
              </button>
              <div className="flex items-center gap-2.5 rounded-2xl border border-white/70 bg-white/[0.76] px-2.5 py-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-md">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#102343] to-navy text-xs font-semibold text-white shadow-sm">{initials || 'U'}</div>
                <div className="hidden min-w-0 sm:block">
                  <p className="max-w-36 truncate text-[13px] font-semibold text-slate-950">{user.name}</p>
                  <p className="text-[11px] font-medium uppercase tracking-[0.03em] text-slate-500">{user.role.replaceAll('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-none space-y-6 px-5 py-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
