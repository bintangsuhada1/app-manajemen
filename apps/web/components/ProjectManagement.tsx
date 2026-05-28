'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Archive, CalendarDays, Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';
import { ACTIVE_COMPANY_CHANGED_EVENT, getActiveCompanyId, notifyCompanyDataChanged, withActiveCompanyId } from '@/lib/companies';
import NumberInput from '@/components/NumberInput';
import RupiahInput from '@/components/RupiahInput';
import { parseRupiah } from '@/lib/rupiah';

type UserOption = { id: string; name: string; role: string };
type CustomerOption = { id: string; name: string };
type ProjectMember = { id: string; position: string | null; user: UserOption & { email: string } };
type Project = {
  id: string;
  code: string | null;
  name: string;
  location: string | null;
  description: string | null;
  status: string;
  budget: string | number | null;
  contractValue: string | number | null;
  progress: number;
  startDate: string | null;
  endDate: string | null;
  customerId: string | null;
  customer: CustomerOption | null;
  members: ProjectMember[];
  _count?: {
    members: number;
    quotes: number;
    invoices: number;
    dailyReports: number;
    documents: number;
    transactions: number;
    materialMovements: number;
  };
};

type Options = {
  customers: CustomerOption[];
  users: UserOption[];
  statuses: string[];
};

type ProjectForm = {
  code: string;
  name: string;
  location: string;
  description: string;
  status: string;
  budget: string;
  contractValue: string;
  progress: string;
  startDate: string;
  endDate: string;
  customerId: string;
  picUserId: string;
};

const emptyForm: ProjectForm = {
  code: '',
  name: '',
  location: '',
  description: '',
  status: 'SURVEY',
  budget: '',
  contractValue: '',
  progress: '0',
  startDate: '',
  endDate: '',
  customerId: '',
  picUserId: ''
};

function getPic(project: Project) {
  return project.members.find((member) => member.position === 'PIC')?.user || null;
}

function formatCurrency(value: string | number | null) {
  if (value === null || value === undefined || value === '') return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value));
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value));
}

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : '';
}

function statusLabel(status: string) {
  return status.replaceAll('_', ' ');
}

function isSafeToDelete(project: Project) {
  if (!project._count) return false;
  const { members, quotes, invoices, dailyReports, documents, transactions, materialMovements } = project._count;
  return members === 0 && quotes === 0 && invoices === 0 && dailyReports === 0 && documents === 0 && transactions === 0 && materialMovements === 0;
}

export function ProjectManagement() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [options, setOptions] = useState<Options>({ customers: [], users: [], statuses: [] });
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(() => getActiveCompanyId());

  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const user = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(window.localStorage.getItem('user') || '{}');
    } catch {
      return null;
    }
  }, []);
  const userRole = user?.role;

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${apiUrl}/api${withActiveCompanyId(path, activeCompanyId)}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {})
      }
    });
    if (!response.ok) {
      if (response.status === 401) {
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('user');
        router.replace('/login');
      }
      if (response.status === 403) router.replace('/forbidden');
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.message || 'Permintaan gagal diproses');
    }
    return response.json();
  }

  async function loadProjects(nextQuery = query, nextStatus = statusFilter) {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (nextQuery) params.set('q', nextQuery);
      if (nextStatus) params.set('status', nextStatus);
      const suffix = params.toString() ? `?${params}` : '';
      const data = await request<Project[]>(`/projects${suffix}`);
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat proyek');
    } finally {
      setLoading(false);
    }
  }

  async function loadOptions() {
    if (!token) return;
    try {
      const data = await request<Options>('/projects/options');
      setOptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat opsi proyek');
    }
  }

  useEffect(() => {
    void loadProjects();
    void loadOptions();
  }, [activeCompanyId, token]);

  useEffect(() => {
    function handleCompanyChange() {
      setSelectedProject(null);
      setEditingProject(null);
      setActiveCompanyId(getActiveCompanyId());
    }

    window.addEventListener(ACTIVE_COMPANY_CHANGED_EVENT, handleCompanyChange);
    window.addEventListener('storage', handleCompanyChange);
    return () => {
      window.removeEventListener(ACTIVE_COMPANY_CHANGED_EVENT, handleCompanyChange);
      window.removeEventListener('storage', handleCompanyChange);
    };
  }, []);

  function openCreateForm() {
    setEditingProject(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  }

  function openEditForm(project: Project) {
    setEditingProject(project);
    setForm({
      code: project.code || '',
      name: project.name,
      location: project.location || '',
      description: project.description || '',
      status: project.status,
      budget: project.budget?.toString() || '',
      contractValue: project.contractValue?.toString() || '',
      progress: project.progress.toString(),
      startDate: toDateInput(project.startDate),
      endDate: toDateInput(project.endDate),
      customerId: project.customerId || '',
      picUserId: getPic(project)?.id || ''
    });
    setIsFormOpen(true);
  }

  async function openDetail(projectId: string) {
    try {
      setError('');
      const data = await request<Project>(`/projects/${projectId}`);
      setSelectedProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat detail proyek');
    }
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      code: form.code || null,
      location: form.location || null,
      description: form.description || null,
        budget: form.budget ? parseRupiah(form.budget) : null,
        contractValue: form.contractValue ? parseRupiah(form.contractValue) : null,
      progress: Number(form.progress || 0),
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      customerId: form.customerId || null,
      picUserId: form.picUserId || null
    };

    try {
      await request<Project>(editingProject ? `/projects/${editingProject.id}` : '/projects', {
        method: editingProject ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      setIsFormOpen(false);
      await loadProjects();
      notifyCompanyDataChanged(activeCompanyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan proyek');
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject(project: Project) {
    const isSafe = isSafeToDelete(project);
    const actionLabel = isSafe ? 'Hapus' : 'Batalkan';
    if (!window.confirm(`${actionLabel} proyek "${project.name}"? Jika dibatalkan, status akan berubah menjadi BATAL.`)) return;
    try {
      setError('');
      const res = await request<{ ok: boolean; message: string; action: string }>(`/projects/${project.id}`, { method: 'DELETE' });
      if (res.message) alert(res.message);
      if (selectedProject?.id === project.id) setSelectedProject(null);
      await loadProjects();
      notifyCompanyDataChanged(activeCompanyId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Gagal ${actionLabel.toLowerCase()} proyek`;
      setError(msg);
      alert(msg);
    }
  }

  return (
    <section id="proyek" className="page-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">Manajemen Proyek</h2>
          <p className="section-description">Filter status, progress, nilai kontrak, deadline, dan PIC.</p>
        </div>
        <button className="btn-primary inline-flex items-center gap-2" onClick={openCreateForm} disabled={!token}>
          <Plus size={16} /> Proyek Baru
        </button>
      </div>

      <div className="filter-bar md:grid-cols-[1fr_210px_auto]">
        <input
          className="input"
          placeholder="Cari nama, kode, atau lokasi proyek"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">Semua status</option>
          {options.statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
        </select>
        <button className="btn-dark" onClick={() => void loadProjects(query, statusFilter)} disabled={!token}>Terapkan</button>
      </div>

      {!token && <p className="p-4 text-sm text-orange-700">Login dulu agar data proyek dari backend dapat dimuat.</p>}
      {error && <p className="border-b border-red-100 bg-red-50 p-3.5 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th>Proyek</th>
              <th>Lokasi</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Nilai Kontrak</th>
              <th>Deadline</th>
              <th>PIC</th>
              <th className="pr-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-slate-500" colSpan={8}>Memuat proyek...</td></tr>}
            {!loading && projects.length === 0 && <tr><td className="p-4 text-slate-500" colSpan={8}>Belum ada proyek.</td></tr>}
            {projects.map((project) => {
              const pic = getPic(project);
              return (
                <tr key={project.id} className="align-top">
                  <td>
                    <p className="font-bold text-navy">{project.name}</p>
                    <p className="text-xs text-slate-500">{project.code || 'Tanpa kode'}</p>
                  </td>
                  <td>{project.location || '-'}</td>
                  <td><span className="badge border-blue-100 bg-blue-50 text-blue-700">{statusLabel(project.status)}</span></td>
                  <td>{project.progress}%</td>
                  <td>{formatCurrency(project.contractValue)}</td>
                  <td>{formatDate(project.endDate)}</td>
                  <td>{pic?.name || '-'}</td>
                  <td className="pr-4">
                    <div className="flex justify-end gap-2">
                      <button className="icon-button" title="Lihat detail" onClick={() => void openDetail(project.id)}><Eye size={16} /></button>
                      <button className="icon-button" title="Edit proyek" onClick={() => openEditForm(project)}><Pencil size={16} /></button>
                      {(userRole === 'SUPER_ADMIN' || userRole === 'DIREKTUR') && (
                        <button
                          className={`icon-button ${isSafeToDelete(project) ? 'text-red-600 hover:bg-red-50' : 'text-amber-600 hover:bg-amber-50'}`}
                          title={isSafeToDelete(project) ? 'Hapus proyek' : 'Batalkan proyek (Arsipkan)'}
                          onClick={() => void deleteProject(project)}
                        >
                          {isSafeToDelete(project) ? <Trash2 size={16} /> : <Archive size={16} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="modal-backdrop">
          <form className="modal-card max-w-3xl" onSubmit={submitForm}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="section-title">{editingProject ? 'Edit Proyek' : 'Tambah Proyek'}</h3>
                <p className="section-description">Data tersimpan langsung ke backend proyek.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setIsFormOpen(false)}><X size={16} /></button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input className="input" placeholder="Kode proyek" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
              <input className="input" required placeholder="Nama proyek" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              <input className="input" placeholder="Lokasi" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
              <select className="input" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                {(options.statuses.length ? options.statuses : ['SURVEY']).map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
              </select>
              <RupiahInput className="input" placeholder="Budget" value={form.budget} onChange={(val) => setForm({ ...form, budget: val })} />
              <RupiahInput className="input" placeholder="Nilai kontrak" value={form.contractValue} onChange={(val) => setForm({ ...form, contractValue: val })} />
              <input className="input" type="number" min="0" max="100" placeholder="Progress (%)" value={form.progress} onChange={(event) => setForm({ ...form, progress: event.target.value })} />
              <select className="input" value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })}>
                <option value="">Pilih pelanggan</option>
                {options.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
              </select>
              <label className="grid gap-2 text-sm text-slate-500">
                Mulai
                <input className="input" type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
              </label>
              <label className="grid gap-2 text-sm text-slate-500">
                Deadline
                <input className="input" type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
              </label>
              <select className="input md:col-span-2" value={form.picUserId} onChange={(event) => setForm({ ...form, picUserId: event.target.value })}>
                <option value="">Pilih PIC</option>
                {options.users.map((user) => <option key={user.id} value={user.id}>{user.name} - {user.role}</option>)}
              </select>
              <textarea className="input md:col-span-2" rows={4} placeholder="Deskripsi proyek" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)}>Batal</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Proyek'}</button>
            </div>
          </form>
        </div>
      )}

      {selectedProject && (
        <div className="modal-backdrop z-40">
          <div className="modal-card max-w-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gold">{selectedProject.code || 'Tanpa kode'}</p>
                <h3 className="text-xl font-semibold text-slate-950">{selectedProject.name}</h3>
              </div>
              <button className="icon-button" onClick={() => setSelectedProject(null)}><X size={16} /></button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div><p className="text-xs text-slate-500">Status</p><p className="font-semibold text-navy">{statusLabel(selectedProject.status)}</p></div>
              <div><p className="text-xs text-slate-500">Progress</p><p className="font-semibold text-navy">{selectedProject.progress}%</p></div>
              <div><p className="text-xs text-slate-500">Nilai Kontrak</p><p className="font-semibold text-navy">{formatCurrency(selectedProject.contractValue)}</p></div>
              <div><p className="text-xs text-slate-500">PIC</p><p className="font-semibold text-navy">{getPic(selectedProject)?.name || '-'}</p></div>
              <div><p className="text-xs text-slate-500">Pelanggan</p><p className="font-semibold text-navy">{selectedProject.customer?.name || '-'}</p></div>
              <div><p className="text-xs text-slate-500">Lokasi</p><p className="font-semibold text-navy">{selectedProject.location || '-'}</p></div>
              <div className="md:col-span-2">
                <p className="text-xs text-slate-500">Jadwal</p>
                <p className="inline-flex items-center gap-2 font-semibold text-navy"><CalendarDays size={16} /> {formatDate(selectedProject.startDate)} - {formatDate(selectedProject.endDate)}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-slate-500">Deskripsi</p>
                <p className="text-slate-700">{selectedProject.description || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
