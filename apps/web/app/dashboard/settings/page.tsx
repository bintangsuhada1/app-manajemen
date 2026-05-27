'use client';

import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CheckCircle2, Edit3, LogOut, Plus, Settings, ShieldCheck, Trash2, UserRound, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DashboardShell } from '@/components/DashboardShell';
import { DEFAULT_COMPANY_ID, companies as defaultCompanies, getActiveCompany, getCompanies, saveCompanies, setActiveCompany } from '@/lib/companies';
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

function SettingsSection({
  title,
  description,
  icon: Icon,
  children
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm shadow-slate-200/70">
      <div className="flex items-center gap-3 border-b border-slate-200/80 bg-gradient-to-r from-white to-slate-50 px-5 py-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-navy text-gold">
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-black text-navy">{title}</h2>
          <p className="text-sm font-medium text-slate-500">{description}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
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

  useEffect(() => {
    setCompanyList(getCompanies());
    setActiveCompanyState(getActiveCompany());
    try {
      const storedUser = window.localStorage.getItem('user');
      setUser(storedUser ? JSON.parse(storedUser) : null);
    } catch {
      setUser(null);
    }
  }, []);

  function chooseCompany(companyId: string) {
    setActiveCompanyState(setActiveCompany(companyId));
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

  function persistCompanyList(nextCompanies: Company[]) {
    const savedCompanies = saveCompanies(nextCompanies);
    setCompanyList(savedCompanies);
    setActiveCompanyState(getActiveCompany());
    return savedCompanies;
  }

  function submitCompanyForm(event: FormEvent<HTMLFormElement>) {
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
      setCompanyError('Jenis Usaha / Bidang wajib diisi.');
      return;
    }
    if (!nextCompany.id) {
      setCompanyError('Kode Perusahaan / ID wajib diisi.');
      return;
    }

    const duplicate = companyList.some((company) => company.id === nextCompany.id && company.id !== editingCompanyId);
    if (duplicate) {
      setCompanyError('Kode Perusahaan / ID sudah dipakai. Gunakan kode lain.');
      return;
    }

    const nextCompanies = editingCompanyId
      ? companyList.map((company) => company.id === editingCompanyId ? nextCompany : company)
      : [...companyList, nextCompany];
    persistCompanyList(nextCompanies);

    if (editingCompanyId && activeCompany.id === editingCompanyId) {
      setActiveCompanyState(setActiveCompany(nextCompany.id));
    }

    closeCompanyForm();
  }

  function deleteCompany(company: Company) {
    if (!window.confirm(`Hapus perusahaan "${company.name}"?`)) return;

    const nextCompanies = companyList.filter((item) => item.id !== company.id);
    if (activeCompany.id === company.id) {
      const fallbackCompany = company.id === DEFAULT_COMPANY_ID && !nextCompanies.some((item) => item.id === DEFAULT_COMPANY_ID)
        ? defaultCompanies.find((item) => item.id === DEFAULT_COMPANY_ID)
        : null;
      const savedCompanies = persistCompanyList(fallbackCompany ? [fallbackCompany, ...nextCompanies] : nextCompanies);
      setCompanyList(savedCompanies);
      setActiveCompanyState(setActiveCompany(DEFAULT_COMPANY_ID));
      return;
    }
    persistCompanyList(nextCompanies);
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

  return (
    <DashboardShell>
      <div className="mb-6 overflow-hidden rounded-lg border border-navy/10 bg-white shadow-premium">
        <div className="bg-navy p-6 text-white sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase text-gold">
            <Settings size={14} />
            Pengaturan Suite
          </div>
          <h1 className="mt-5 text-3xl font-black leading-tight">Pengaturan perusahaan dan sesi pengguna</h1>
          <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-200">
            Atur perusahaan aktif untuk tampilan dashboard, kelola profil dasar, dan keluar dari sesi aplikasi.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <SettingsSection
            title="Pilih / Switch Perusahaan"
            description="Perusahaan aktif disimpan lokal untuk konteks tampilan aplikasi."
            icon={Building2}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {companyList.map((company) => {
                const isActive = activeCompany.id === company.id;
                return (
                  <div
                    key={company.id}
                    className={`rounded-lg border p-4 transition-all ${isActive ? 'border-gold bg-orange-50/50 shadow-sm shadow-orange-100' : 'border-slate-200 bg-white hover:border-gold/50 hover:shadow-sm'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-black text-navy">{company.name}</h3>
                        <p className="mt-1 text-sm font-medium text-slate-500">{company.type}</p>
                      </div>
                      {isActive && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-black text-navy">
                          <CheckCircle2 size={13} />
                          Aktif
                        </span>
                      )}
                    </div>
                    <button
                      className={isActive ? 'btn-dark mt-5 w-full' : 'btn-primary mt-5 w-full'}
                      onClick={() => chooseCompany(company.id)}
                      disabled={isActive}
                    >
                      {isActive ? 'Sedang Digunakan' : 'Gunakan Perusahaan Ini'}
                    </button>
                  </div>
                );
              })}
            </div>
          </SettingsSection>

          <SettingsSection
            title="Manajemen Perusahaan"
            description="Struktur ini disiapkan untuk integrasi multi-company ke backend."
            icon={ShieldCheck}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-600">{companyList.length} perusahaan tersedia.</p>
              <button className="btn-primary inline-flex items-center gap-2" onClick={openCreateCompanyForm}>
                <Plus size={17} />
                Tambah Perusahaan
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {companyList.map((company) => {
                const isActive = activeCompany.id === company.id;
                return (
                  <div key={company.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-navy">{company.name}</p>
                        <p className="mt-1 text-sm font-medium text-slate-500">{company.type}</p>
                        <p className="mt-2 text-xs font-bold uppercase text-slate-400">{company.id}</p>
                      </div>
                      {isActive && <span className="shrink-0 rounded-full bg-gold px-2.5 py-1 text-xs font-black text-navy">Aktif</span>}
                    </div>
                    {(company.address || company.phone || company.email || company.website) && (
                      <div className="mt-3 space-y-1 text-xs font-medium text-slate-500">
                        {company.address && <p>{company.address}</p>}
                        {company.phone && <p>{company.phone}</p>}
                        {company.email && <p>{company.email}</p>}
                        {company.website && <p>{company.website}</p>}
                      </div>
                    )}
                    {company.notes && <p className="mt-3 rounded-lg bg-white p-3 text-xs font-medium leading-5 text-slate-500">{company.notes}</p>}
                    <div className="mt-4 flex gap-2">
                      <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-navy transition-colors hover:border-gold/60 hover:bg-orange-50" onClick={() => openEditCompanyForm(company)}>
                        <Edit3 size={15} />
                        Edit
                      </button>
                      <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-rose-100 bg-white px-3 py-2.5 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-50" onClick={() => deleteCompany(company)}>
                        <Trash2 size={15} />
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
          <SettingsSection title="Profil Pengguna" description="Data sesi yang sedang aktif." icon={UserRound}>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Nama</p>
              <p className="mt-1 font-black text-navy">{user?.name || '-'}</p>
              <p className="mt-4 text-xs font-bold uppercase text-slate-500">Email</p>
              <p className="mt-1 break-words text-sm font-semibold text-slate-700">{user?.email || '-'}</p>
              <p className="mt-4 text-xs font-bold uppercase text-slate-500">Role</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{user?.role?.replaceAll('_', ' ') || '-'}</p>
            </div>
          </SettingsSection>

          <SettingsSection title="Logout" description="Akhiri sesi login di perangkat ini." icon={LogOut}>
            <p className="text-sm font-medium leading-6 text-slate-600">
              Token, data user, dan session storage akan dihapus. Setelah logout, dashboard akan meminta login ulang.
            </p>
            <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-3 font-bold text-white shadow-sm shadow-rose-100 transition-colors hover:bg-rose-700" onClick={handleLogout}>
              <LogOut size={18} />
              Logout
            </button>
          </SettingsSection>
        </div>
      </div>

      {isCompanyFormOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
          <form className="w-full max-w-4xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-premium" onSubmit={submitCompanyForm}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-navy px-5 py-4 text-white">
              <div>
                <p className="text-xs font-bold uppercase text-gold">{editingCompanyId ? 'Edit Perusahaan' : 'Tambah Perusahaan'}</p>
                <h2 className="mt-1 text-xl font-black">{editingCompanyId ? companyForm.name || 'Edit data perusahaan' : 'Data perusahaan baru'}</h2>
              </div>
              <button type="button" className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-white hover:bg-white/10" onClick={closeCompanyForm} aria-label="Tutup form perusahaan">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-5">
              {companyError && <div className="mb-4 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{companyError}</div>}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Nama Perusahaan</span>
                  <input className="input" required value={companyForm.name} onChange={(event) => setCompanyForm({ ...companyForm, name: event.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Jenis Usaha / Bidang</span>
                  <input className="input" required value={companyForm.type} onChange={(event) => setCompanyForm({ ...companyForm, type: event.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Kode Perusahaan / ID</span>
                  <input className="input" required value={companyForm.id} onChange={(event) => setCompanyForm({ ...companyForm, id: event.target.value.trim().toLowerCase() })} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Nomor Telepon</span>
                  <input className="input" value={companyForm.phone} onChange={(event) => setCompanyForm({ ...companyForm, phone: event.target.value })} />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Alamat</span>
                  <input className="input" value={companyForm.address} onChange={(event) => setCompanyForm({ ...companyForm, address: event.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Email</span>
                  <input className="input" type="email" value={companyForm.email} onChange={(event) => setCompanyForm({ ...companyForm, email: event.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Website</span>
                  <input className="input" value={companyForm.website} onChange={(event) => setCompanyForm({ ...companyForm, website: event.target.value })} />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Catatan</span>
                  <textarea className="input min-h-28" value={companyForm.notes} onChange={(event) => setCompanyForm({ ...companyForm, notes: event.target.value })} />
                </label>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button type="button" className="rounded-lg border border-slate-200 bg-white px-5 py-3 font-bold text-slate-600 transition-colors hover:bg-slate-100" onClick={closeCompanyForm}>
                Batal
              </button>
              <button className="btn-primary">
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardShell>
  );
}
