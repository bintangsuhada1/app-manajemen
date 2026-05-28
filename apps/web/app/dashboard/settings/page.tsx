'use client';

import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock3,
  Edit3,
  FileCheck2,
  Leaf,
  LogOut,
  Mail,
  MonitorSmartphone,
  Phone,
  Plus,
  Settings,
  Shield,
  ShieldCheck,
  Store,
  Trash2,
  UserRound,
  X,
  Zap
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DashboardShell } from '@/components/DashboardShell';
import {
  DEFAULT_COMPANY_ID,
  companies as defaultCompanies,
  createCompany as createCompanyRequest,
  deleteCompany as deleteCompanyRequest,
  fetchCompanies,
  getActiveCompany,
  getCompanies,
  setActiveCompany,
  updateCompany as updateCompanyRequest
} from '@/lib/companies';
import type { Company } from '@/lib/companies';

type SessionUser = {
  name?: string;
  email?: string;
  role?: string;
};

type CompanyForm = {
  id: string;
  name: string;
  type: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  notes: string;
};

const emptyCompanyForm: CompanyForm = {
  id: '',
  name: '',
  type: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  notes: ''
};

const cardSurface = 'rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/60 backdrop-blur-sm';

function getCompanyIcon(company: Company) {
  const text = `${company.name} ${company.type}`.toLowerCase();
  if (text.includes('listrik') || text.includes('kelistrikan') || text.includes('kontraktor')) return Zap;
  if (text.includes('slo') || text.includes('nidi')) return FileCheck2;
  if (text.includes('restoran') || text.includes('wisata') || text.includes('kuliner') || text.includes('mangrove')) return Leaf;
  return Store;
}

function getCompanyVisual(company: Company) {
  const text = `${company.name} ${company.type}`.toLowerCase();
  if (text.includes('listrik') || text.includes('kelistrikan') || text.includes('kontraktor')) {
    return {
      accent: 'from-sky-500 to-blue-700',
      soft: 'bg-sky-50 text-sky-700',
      ring: 'ring-sky-500/20',
      active: 'border-sky-300 shadow-sky-100/80',
      bar: 'bg-sky-500'
    };
  }
  if (text.includes('slo') || text.includes('nidi')) {
    return {
      accent: 'from-[#F5A623] to-amber-600',
      soft: 'bg-amber-50 text-amber-700',
      ring: 'ring-amber-500/20',
      active: 'border-[#F5A623] shadow-orange-100',
      bar: 'bg-[#F5A623]'
    };
  }
  if (text.includes('restoran') || text.includes('wisata') || text.includes('kuliner') || text.includes('mangrove')) {
    return {
      accent: 'from-emerald-500 to-teal-700',
      soft: 'bg-emerald-50 text-emerald-700',
      ring: 'ring-emerald-500/20',
      active: 'border-emerald-300 shadow-emerald-100',
      bar: 'bg-emerald-500'
    };
  }
  return {
    accent: 'from-slate-600 to-slate-900',
    soft: 'bg-slate-100 text-slate-700',
    ring: 'ring-slate-500/20',
    active: 'border-slate-300 shadow-slate-100',
    bar: 'bg-slate-500'
  };
}

function getInitials(name: string | undefined) {
  return (name || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function SettingsSection({
  title,
  description,
  icon: Icon,
  action,
  children
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`${cardSurface} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 bg-gradient-to-r from-white/95 to-slate-50 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#071426] text-cyan-200 shadow-sm">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-slate-950">{title}</h2>
            <p className="mt-0.5 text-[13px] font-normal text-slate-500">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function DashboardSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [companyList, setCompanyList] = useState<Company[]>(defaultCompanies);
  const [activeCompany, setActiveCompanyState] = useState<Company>(defaultCompanies[0]);
  const [companyForm, setCompanyForm] = useState<CompanyForm>(emptyCompanyForm);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [isCompanyFormOpen, setIsCompanyFormOpen] = useState(false);
  const [companyError, setCompanyError] = useState('');
  const [toast, setToast] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;

  useEffect(() => {
    setCurrentTime(new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()));
    try {
      const storedUser = window.localStorage.getItem('user');
      setUser(storedUser ? JSON.parse(storedUser) : null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    async function loadCompanies() {
      if (!token) return;
      try {
        const companies = await fetchCompanies(token);
        setCompanyList(companies);
        setActiveCompanyState(getActiveCompany());
      } catch (error) {
        if (error instanceof Response && error.status === 401) {
          window.localStorage.removeItem('token');
          window.localStorage.removeItem('user');
          router.replace('/login');
          return;
        }
        if (error instanceof Response && error.status === 403) {
          router.replace('/forbidden');
          return;
        }
        setCompanyError('Gagal memuat data perusahaan dari server.');
        setCompanyList(getCompanies());
        setActiveCompanyState(getActiveCompany());
      }
    }

    void loadCompanies();
  }, [router, token]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()));
    }, 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function showToast(message: string) {
    setToast(message);
  }

  function chooseCompany(companyId: string) {
    const company = setActiveCompany(companyId);
    setActiveCompanyState(company);
    showToast(`${company.name} sekarang aktif.`);
  }

  function openCreateCompanyForm() {
    setEditingCompanyId(null);
    setCompanyForm(emptyCompanyForm);
    setCompanyError('');
    setIsCompanyFormOpen(true);
  }

  function openEditCompanyForm(company: Company) {
    setEditingCompanyId(company.id);
    setCompanyForm({
      id: company.id,
      name: company.name,
      type: company.type,
      address: company.address || '',
      phone: company.phone || '',
      email: company.email || '',
      website: company.website || '',
      notes: company.notes || ''
    });
    setCompanyError('');
    setIsCompanyFormOpen(true);
  }

  function closeCompanyForm() {
    setIsCompanyFormOpen(false);
    setCompanyError('');
    setEditingCompanyId(null);
    setCompanyForm(emptyCompanyForm);
  }

  async function parseCompanyError(response: Response, fallback: string) {
    const payload = await response.json().catch(() => null);
    return payload?.message || fallback;
  }

  async function submitCompanyForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextCompany: Company = {
      id: companyForm.id.trim(),
      name: companyForm.name.trim(),
      type: companyForm.type.trim(),
      address: companyForm.address.trim() || undefined,
      phone: companyForm.phone.trim() || undefined,
      email: companyForm.email.trim() || undefined,
      website: companyForm.website.trim() || undefined,
      notes: companyForm.notes.trim() || undefined
    };

    if (!nextCompany.name) {
      setCompanyError('Nama Perusahaan wajib diisi.');
      return;
    }
    if (!nextCompany.type) {
      setCompanyError('Jenis Usaha wajib diisi.');
      return;
    }
    if (!nextCompany.id) {
      setCompanyError('Kode Perusahaan wajib diisi.');
      return;
    }

    try {
      const savedCompany = editingCompanyId
        ? await updateCompanyRequest(token, editingCompanyId, nextCompany)
        : await createCompanyRequest(token, nextCompany);
      const companies = await fetchCompanies(token);
      setCompanyList(companies);

      if (editingCompanyId && activeCompany.id === editingCompanyId) {
        setActiveCompanyState(setActiveCompany(savedCompany.id));
      }

      showToast(editingCompanyId ? 'Perusahaan berhasil diperbarui.' : 'Perusahaan baru berhasil ditambahkan.');
      closeCompanyForm();
    } catch (error) {
      if (error instanceof Response && error.status === 401) {
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('user');
        router.replace('/login');
        return;
      }
      if (error instanceof Response && error.status === 403) {
        router.replace('/forbidden');
        return;
      }
      if (error instanceof Response) {
        setCompanyError(await parseCompanyError(error, 'Gagal menyimpan perusahaan.'));
        return;
      }
      setCompanyError('Gagal menyimpan perusahaan.');
    }
  }

  async function deleteCompany(company: Company) {
    if (!window.confirm(`Hapus perusahaan "${company.name}"?`)) return;

    try {
      await deleteCompanyRequest(token, company.id);
      const companies = await fetchCompanies(token);
      setCompanyList(companies);
      if (activeCompany.id === company.id) {
        setActiveCompanyState(setActiveCompany(DEFAULT_COMPANY_ID));
        showToast('Perusahaan dihapus. Perusahaan aktif dipindahkan ke PT Jurti Agung Mulia.');
        return;
      }
      showToast('Perusahaan berhasil dihapus.');
    } catch (error) {
      if (error instanceof Response && error.status === 401) {
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('user');
        router.replace('/login');
        return;
      }
      if (error instanceof Response && error.status === 403) {
        router.replace('/forbidden');
        return;
      }
      if (error instanceof Response) {
        setCompanyError(await parseCompanyError(error, 'Perusahaan tidak bisa dihapus.'));
        return;
      }
      setCompanyError('Perusahaan tidak bisa dihapus.');
    }
  }

  function handleLogout() {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
    window.localStorage.removeItem('session');
    window.sessionStorage.removeItem('token');
    window.sessionStorage.removeItem('user');
    window.sessionStorage.removeItem('session');
    window.sessionStorage.clear();
    router.replace('/login');
  }

  const ActiveIcon = getCompanyIcon(activeCompany);
  const activeVisual = getCompanyVisual(activeCompany);
  const userInitials = getInitials(user?.name);

  return (
    <DashboardShell>
      <div className="relative min-h-screen overflow-hidden rounded-2xl bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] p-0">
        <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(14,165,233,.075)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,.06)_1px,transparent_1px)] [background-size:32px_32px]" />
        {toast && (
          <div className="fixed right-4 top-20 z-[60] max-w-sm rounded-2xl border border-emerald-100 bg-white/95 px-4 py-3 text-sm font-bold text-emerald-700 shadow-[0_18px_40px_rgba(2,6,23,0.12)] backdrop-blur-sm">
            {toast}
          </div>
        )}

        <div className="blueprint-panel relative mb-5 shadow-premium">
          <div className="relative overflow-hidden bg-[#071426] p-5 text-white">
            <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(14,165,233,.22)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,.18)_1px,transparent_1px)] [background-size:28px_28px]" />
            <div className="absolute inset-x-0 bottom-0 h-1 bg-[#F5A623]" />
            <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-cyan-200">
                  <Settings size={14} />
                  Active Company
                </div>
                <h1 className="mt-3 text-[24px] font-semibold leading-tight text-[#F8FAFC] sm:text-[28px]">Pengaturan Perusahaan</h1>
                <p className="mt-2 max-w-2xl text-[13px] font-normal leading-5 text-[rgba(226,232,240,0.88)]">
                  Kelola perusahaan aktif, profil pengguna, dan akses sistem.
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5 text-xs font-semibold">
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-slate-100">
                    <Clock3 size={14} />
                    {currentTime || 'Memuat waktu...'}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-xl border border-[#F5A623]/30 bg-[#F5A623]/15 px-3 py-1.5 text-[#F5A623]">
                    <CheckCircle2 size={14} />
                    Active Company
                  </span>
                  <span className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-slate-100">
                    {activeCompany.type}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/12 p-4 shadow-sm backdrop-blur-md">
                <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#F5A623]">Perusahaan Aktif</p>
                <p className="mt-2 truncate text-lg font-semibold text-white">{activeCompany.name}</p>
                <p className="mt-1 text-sm font-medium text-slate-200">{activeCompany.type}</p>
                <div className="mt-3 rounded-xl border border-white/15 bg-white/10 p-3 text-xs font-medium text-slate-200">
                  Kode perusahaan: <span className="font-semibold text-white">{activeCompany.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className={`${cardSurface} relative mb-6 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(2,6,23,0.09)]`}>
          <div className={`absolute inset-x-0 top-0 h-1 ${activeVisual.bar}`} />
          <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#F5A623]/10 blur-2xl" />
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${activeVisual.accent} text-white shadow-[0_16px_32px_rgba(2,6,23,0.16)]`}>
                    <ActiveIcon size={27} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-2xl font-black text-[#06142E]">{activeCompany.name}</h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F5A623] px-2.5 py-1 text-xs font-black text-[#06142E]">
                        <CheckCircle2 size={13} />
                        Aktif
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-500">{activeCompany.type}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold uppercase text-slate-400">Kode: {activeCompany.id}</span>
                      <span className={`rounded-xl px-3 py-1.5 text-xs font-bold ${activeVisual.soft}`}>Kategori Bisnis</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-3 border-t border-slate-200/70 bg-slate-50/80 p-5 lg:border-l lg:border-t-0">
              <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#06142E] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F5A623] hover:bg-orange-50 active:scale-[0.98]" onClick={() => openEditCompanyForm(activeCompany)}>
                <Edit3 size={16} />
                Edit Perusahaan
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#06142E] px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0B2148] active:scale-[0.98]" onClick={() => router.push('/dashboard')}>
                <ArrowUpRight size={16} />
                Lihat Dashboard
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <SettingsSection
              title="Pilih / Switch Perusahaan"
              description="Ganti konteks perusahaan aktif untuk tampilan dashboard."
              icon={Building2}
            >
              {companyList.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-[#F4F7FB] p-6 text-center">
                  <p className="font-black text-[#06142E]">Belum ada perusahaan</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">Tambahkan perusahaan untuk mulai memakai switch company.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {companyList.map((company) => {
                    const isActive = activeCompany.id === company.id;
                    const Icon = getCompanyIcon(company);
                    const visual = getCompanyVisual(company);
                    return (
                      <div
                        key={company.id}
                        className={`relative overflow-hidden rounded-2xl border bg-white/90 p-4 shadow-[0_10px_30px_rgba(2,6,23,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(2,6,23,0.09)] ${isActive ? `${visual.active} ring-2 ${visual.ring}` : 'border-slate-200/80 hover:border-[#F5A623]/70'}`}
                      >
                        <div className={`absolute inset-x-0 top-0 h-1 ${visual.bar}`} />
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 gap-3">
                            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${visual.accent} text-white shadow-sm`}>
                              <Icon size={22} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="truncate text-base font-black text-[#06142E]">{company.name}</h3>
                              <p className="mt-1 text-sm font-medium text-slate-500">{company.type}</p>
                            </div>
                          </div>
                          {isActive && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F5A623] px-2.5 py-1 text-xs font-black text-[#06142E]">
                              <CheckCircle2 size={13} />
                              Aktif
                            </span>
                          )}
                        </div>
                        <button
                          className={isActive ? 'mt-5 w-full rounded-xl bg-[#06142E] px-4 py-2.5 text-sm font-bold text-white active:scale-[0.98]' : 'mt-5 w-full rounded-xl bg-[#F5A623] px-4 py-2.5 text-sm font-black text-[#06142E] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-400 active:scale-[0.98]'}
                          onClick={() => chooseCompany(company.id)}
                          disabled={isActive}
                        >
                          {isActive ? 'Sedang Digunakan' : 'Gunakan Perusahaan Ini'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </SettingsSection>

            <SettingsSection
              title="Manajemen Perusahaan"
              description="Tambah, perbarui, dan rapikan data perusahaan."
              icon={ShieldCheck}
              action={(
                <button className="inline-flex items-center gap-2 rounded-2xl bg-[#F5A623] px-4 py-3 text-sm font-black text-[#06142E] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-400" onClick={openCreateCompanyForm}>
                  <Plus size={17} />
                  Tambah Perusahaan
                </button>
              )}
            >
              <div className="grid gap-3 md:grid-cols-2">
                {companyList.map((company) => {
                  const Icon = getCompanyIcon(company);
                  const visual = getCompanyVisual(company);
                  const isActive = activeCompany.id === company.id;
                  return (
                    <div key={company.id} className="group relative rounded-2xl border border-slate-200/70 bg-[#F4F7FB]/90 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F5A623]/70 hover:bg-white hover:shadow-[0_12px_36px_rgba(2,6,23,0.07)]">
                      <div className={`absolute inset-x-4 top-0 h-px ${visual.bar} opacity-70`} />
                      <div className="flex items-start gap-3">
                        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${visual.soft} shadow-sm`}>
                          <Icon size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-black text-[#06142E]">{company.name}</p>
                              <p className="mt-1 text-sm font-medium text-slate-500">{company.type}</p>
                            </div>
                            {isActive && <span className="shrink-0 rounded-full bg-[#F5A623] px-2 py-1 text-[11px] font-black text-[#06142E]">Aktif</span>}
                          </div>
                          <p className="mt-2 text-xs font-bold uppercase text-slate-400">Kode: {company.id}</p>
                          {(company.email || company.phone) && (
                            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                              {company.email && <span className="inline-flex items-center gap-1"><Mail size={13} />{company.email}</span>}
                              {company.phone && <span className="inline-flex items-center gap-1"><Phone size={13} />{company.phone}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button title="Edit perusahaan" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-[#06142E] transition-all duration-200 hover:border-[#F5A623] hover:bg-orange-50 active:scale-[0.98]" onClick={() => openEditCompanyForm(company)}>
                          <Edit3 size={14} />
                          Edit
                        </button>
                        <button title="Hapus perusahaan" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-black text-rose-700 transition-all duration-200 hover:border-rose-200 hover:bg-rose-50 active:scale-[0.98]" onClick={() => deleteCompany(company)}>
                          <Trash2 size={14} />
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SettingsSection>
          </div>

          <div className="space-y-6">
            <SettingsSection title="Profil Pengguna" description="Identitas sesi yang sedang aktif." icon={UserRound}>
              <div className="rounded-2xl border border-slate-200/70 bg-[#F4F7FB]/90 p-5 shadow-[0_10px_30px_rgba(2,6,23,0.04)]">
                <div className="flex items-center gap-4">
                  <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#06142E] to-slate-700 text-lg font-black text-white shadow-[0_16px_30px_rgba(6,20,46,0.2)]">
                    {userInitials}
                    <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black text-[#06142E]">{user?.name || '-'}</p>
                    <p className="mt-1 inline-flex rounded-xl bg-[#F5A623]/15 px-2.5 py-1 text-xs font-black text-amber-700">{user?.role?.replaceAll('_', ' ') || '-'}</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3 rounded-2xl bg-white p-4 text-sm">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Email</p>
                    <p className="mt-1 break-words font-semibold text-slate-700">{user?.email || '-'}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">Session Status</p>
                      <p className="mt-1 inline-flex items-center gap-2 font-bold text-emerald-700"><CheckCircle2 size={15} />Aktif</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">Security</p>
                      <p className="mt-1 inline-flex items-center gap-2 font-bold text-slate-700"><Shield size={15} />Protected</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">Last Login</p>
                      <p className="mt-1 font-semibold text-slate-700">{currentTime || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">Device</p>
                      <p className="mt-1 inline-flex items-center gap-2 font-semibold text-slate-700"><MonitorSmartphone size={15} />Web Session</p>
                    </div>
                  </div>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection title="Logout" description="Akhiri akses dari perangkat ini." icon={LogOut}>
              <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
                <p className="text-sm font-medium leading-6 text-slate-600">
                  Logout akan menghapus token dan session lokal. Gunakan setelah selesai mengakses sistem bersama.
                </p>
                <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-5 py-2.5 font-black text-rose-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-600 hover:text-white active:scale-[0.98]" onClick={handleLogout}>
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </SettingsSection>
          </div>
        </div>

        {isCompanyFormOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
            <form className="settings-modal-enter w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" onSubmit={submitCompanyForm}>
              <div className="relative overflow-hidden border-b border-slate-200 bg-[#06142E] px-5 py-5 text-white">
                <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(245,166,35,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(245,166,35,.18)_1px,transparent_1px)] [background-size:26px_26px]" />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-[#F5A623]">{editingCompanyId ? 'Edit Perusahaan' : 'Tambah Perusahaan'}</p>
                    <h2 className="mt-1 text-xl font-black">{editingCompanyId ? companyForm.name || 'Edit data perusahaan' : 'Data perusahaan baru'}</h2>
                  </div>
                  <button type="button" className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 text-white transition-colors hover:bg-white/10" onClick={closeCompanyForm} aria-label="Tutup form perusahaan">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="max-h-[75vh] overflow-y-auto bg-[#F4F7FB] p-5">
                {companyError && <div className="mb-4 rounded-2xl border border-rose-100 bg-white p-3 text-sm font-bold text-rose-700">{companyError}</div>}

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Nama Perusahaan</span>
                    <input className="input rounded-2xl" required value={companyForm.name} onChange={(event) => setCompanyForm({ ...companyForm, name: event.target.value })} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Jenis Usaha</span>
                    <input className="input rounded-2xl" required value={companyForm.type} onChange={(event) => setCompanyForm({ ...companyForm, type: event.target.value })} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Kode Perusahaan</span>
                    <input className="input rounded-2xl" required value={companyForm.id} onChange={(event) => setCompanyForm({ ...companyForm, id: event.target.value.trim().toLowerCase() })} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Telepon</span>
                    <input className="input rounded-2xl" value={companyForm.phone} onChange={(event) => setCompanyForm({ ...companyForm, phone: event.target.value })} />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Alamat</span>
                    <input className="input rounded-2xl" value={companyForm.address} onChange={(event) => setCompanyForm({ ...companyForm, address: event.target.value })} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Email</span>
                    <input className="input rounded-2xl" type="email" value={companyForm.email} onChange={(event) => setCompanyForm({ ...companyForm, email: event.target.value })} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Website</span>
                    <input className="input rounded-2xl" value={companyForm.website} onChange={(event) => setCompanyForm({ ...companyForm, website: event.target.value })} />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Catatan</span>
                    <textarea className="input min-h-28 rounded-2xl" value={companyForm.notes} onChange={(event) => setCompanyForm({ ...companyForm, notes: event.target.value })} />
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4">
                <button type="button" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-black text-slate-600 transition-all duration-200 hover:bg-slate-100" onClick={closeCompanyForm}>
                  Batal
                </button>
                <button className="rounded-2xl bg-[#F5A623] px-5 py-3 font-black text-[#06142E] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-400">
                  Simpan Perusahaan
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes settings-modal-enter {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .settings-modal-enter {
          animation: settings-modal-enter 180ms ease-out;
        }
      `}</style>
    </DashboardShell>
  );
}
