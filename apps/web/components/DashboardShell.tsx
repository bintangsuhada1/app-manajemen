'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarChart3, BriefcaseBusiness, Building2, ClipboardList, FileText, FolderOpen, Home, Menu, Receipt, Wallet, Boxes, LogOut, Users, X } from 'lucide-react';
import { canAccess, hashModuleMap, ModuleKey } from '@/lib/permissions';
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
  ['Manajemen User', '/dashboard#users', Users, 'users']
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
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

    setUser(sessionUser);
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const role = user.role;
    function guardHash() {
      const module = hashModuleMap[window.location.hash];
      if (module && !canAccess(role, module)) router.replace('/forbidden');
    }
    guardHash();
    window.addEventListener('hashchange', guardHash);
    return () => window.removeEventListener('hashchange', guardHash);
  }, [router, user]);

  function handleLogout() {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
    router.replace('/login');
  }

  if (!ready || !user) return null;

  const visibleMenu = menu.filter(([, , , module]) => canAccess(user.role, module));
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
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-gold font-black text-navy shadow-sm shadow-gold/30">J</div>
        <div className="min-w-0">
          <p className="truncate font-extrabold text-white">PT Jurti</p>
          <p className="text-xs font-medium text-slate-300">Management Suite</p>
        </div>
      </div>

      <nav className="mt-8 space-y-1">
        {visibleMenu.map(([label, href, Icon]) => (
          <Link
            key={label}
            href={href}
            onClick={() => setMobileNavOpen(false)}
            className="group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-slate-300 transition-colors group-hover:bg-gold group-hover:text-navy">
              <Icon size={17} />
            </span>
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto rounded-lg border border-white/10 bg-white/[0.04] p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-sm font-black text-white">{initials || 'U'}</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{user.name}</p>
            <p className="truncate text-xs font-medium text-slate-300">{user.role.replaceAll('_', ' ')}</p>
          </div>
        </div>
        <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white" onClick={handleLogout}>
          <LogOut size={17} />
          Keluar
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-soft">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-white/10 bg-navy p-5 text-white shadow-xl shadow-navy/20 lg:flex">
        {renderSidebar()}
      </aside>

      <div className={clsx('fixed inset-0 z-50 bg-slate-950/50 transition-opacity lg:hidden', mobileNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0')} onClick={() => setMobileNavOpen(false)} />
      <aside className={clsx('fixed inset-y-0 left-0 z-50 flex w-80 max-w-[86vw] flex-col bg-navy p-5 text-white shadow-2xl transition-transform lg:hidden', mobileNavOpen ? 'translate-x-0' : '-translate-x-full')}>
        <button className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-white hover:bg-white/10" onClick={() => setMobileNavOpen(false)} aria-label="Tutup navigasi">
          <X size={18} />
        </button>
        {renderSidebar()}
      </aside>

      <main className="lg:pl-72">
        <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button className="icon-button lg:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Buka navigasi">
                <Menu size={18} />
              </button>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-gold">Internal Dashboard</p>
                <h1 className="truncate text-lg font-black text-navy sm:text-xl">Manajemen Perusahaan Kontraktor</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-navy text-xs font-black text-white">{initials || 'U'}</div>
                <div className="hidden min-w-0 sm:block">
                  <p className="max-w-36 truncate text-sm font-bold text-navy">{user.name}</p>
                  <p className="text-[11px] font-semibold uppercase text-slate-500">{user.role.replaceAll('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
