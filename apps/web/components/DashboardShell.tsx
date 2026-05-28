'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Activity, BarChart3, Bell, BriefcaseBusiness, Building2, ClipboardList, FileText, FolderOpen, Home, Menu, Receipt, Wallet, Boxes, LogOut, Settings, Users, X, Zap } from 'lucide-react';
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
  ['Proyek', '/dashboard#proyek', BriefcaseBusiness, 'projects'],
  ['Pelanggan', '/dashboard#crm', Building2, 'customers'],
  ['Penawaran', '/dashboard#penawaran', FileText, 'quotes'],
  ['Invoice', '/dashboard#invoice', Receipt, 'invoices'],
  ['Keuangan', '/dashboard#keuangan', Wallet, 'finance'],
  ['Laporan Harian', '/dashboard#laporan', ClipboardList, 'reports'],
  ['Material', '/dashboard#material', Boxes, 'materials'],
  ['Dokumen', '/dashboard#dokumen', FolderOpen, 'documents'],
  ['Analitik', '/dashboard#analitik', BarChart3, 'analytics'],
  ['Manajemen User', '/dashboard#users', Users, 'users'],
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
    function guardHash() {
      setCurrentHash(window.location.hash);
      const module = hashModuleMap[window.location.hash];
      if (module && !canAccess(role, module)) router.replace('/forbidden');
    }
    guardHash();
    window.addEventListener('hashchange', guardHash);
    return () => window.removeEventListener('hashchange', guardHash);
  }, [router, user]);

  useEffect(() => {
    function syncHash() {
      setCurrentHash(window.location.hash);
    }
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

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
    <>
      <div className="flex items-center gap-3 px-1">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold text-sm font-semibold text-navy shadow-sm shadow-gold/30">J</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{activeCompany.name}</p>
          <p className="text-[11px] font-medium text-slate-300">Management Suite</p>
        </div>
      </div>

      <nav className="mt-7 space-y-1">
        {visibleMenu.map(([label, href, Icon]) => {
          const isActive = href.includes('#') ? currentHash && href.endsWith(currentHash) : pathname === href && !currentHash;
          return (
            <Link
              key={label}
              href={href}
              onClick={() => setMobileNavOpen(false)}
              className={clsx(
                'group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-[13px] font-medium transition-all',
                isActive ? 'bg-white/[0.09] text-white' : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              )}
            >
              <span className={clsx('absolute left-0 top-2 bottom-2 w-0.5 rounded-full transition-opacity', isActive ? 'bg-gold opacity-100' : 'opacity-0')} />
              <span className={clsx('grid h-7 w-7 place-items-center rounded-lg transition-colors', isActive ? 'bg-gold text-navy' : 'bg-white/5 text-slate-300 group-hover:bg-white/10 group-hover:text-cyan-200')}>
                <Icon size={15} />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-xs font-black text-white">{initials || 'U'}</div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-white">{user.name}</p>
            <p className="truncate text-[11px] font-medium text-slate-300">{user.role.replaceAll('_', ' ')}</p>
          </div>
        </div>
        <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-[13px] font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white" onClick={handleLogout}>
          <LogOut size={15} />
          Keluar
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,42,77,0.06),transparent_32rem),#F8FAFC]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/10 bg-[#071426] p-4 text-white shadow-xl shadow-navy/10 lg:flex">
        {renderSidebar()}
      </aside>

      <div className={clsx('fixed inset-0 z-50 bg-slate-950/50 transition-opacity lg:hidden', mobileNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0')} onClick={() => setMobileNavOpen(false)} />
      <aside className={clsx('fixed inset-y-0 left-0 z-50 flex w-80 max-w-[86vw] flex-col bg-[#071426] p-4 text-white shadow-2xl transition-transform lg:hidden', mobileNavOpen ? 'translate-x-0' : '-translate-x-full')}>
        <button className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-white hover:bg-white/10" onClick={() => setMobileNavOpen(false)} aria-label="Tutup navigasi">
          <X size={18} />
        </button>
        {renderSidebar()}
      </aside>

      <main className="min-w-0 lg:pl-64">
        <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 px-4 py-2.5 backdrop-blur-xl lg:px-6">
          <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button className="icon-button lg:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Buka navigasi">
                <Menu size={18} />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-500">
                  <span>PT Jurti</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-cyan-700">{currentLabel}</span>
                </div>
                <div className="mt-0.5 flex min-w-0 items-center gap-2">
                  <h1 className="truncate text-[17px] font-semibold text-slate-950 sm:text-lg">{activeCompany.name}</h1>
                  <span className="hidden items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 sm:inline-flex">
                    <Activity size={12} />
                    Online
                  </span>
                </div>
                <p className="truncate text-[11px] font-medium text-slate-500">{activeCompany.type || 'Operational Company Context'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-medium text-slate-600 md:flex">
                <Zap size={14} className="text-amber-500" />
                Operations Control
              </div>
              <button className="icon-button hidden sm:inline-grid" title="Notifikasi operasional" aria-label="Notifikasi operasional">
                <Bell size={15} />
              </button>
              <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-navy text-xs font-semibold text-white">{initials || 'U'}</div>
                <div className="hidden min-w-0 sm:block">
                  <p className="max-w-36 truncate text-[13px] font-semibold text-slate-950">{user.name}</p>
                  <p className="text-[11px] font-medium uppercase tracking-[0.03em] text-slate-500">{user.role.replaceAll('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1320px] px-4 py-4 sm:px-5 lg:px-6 lg:py-5">{children}</div>
      </main>
    </div>
  );
}
