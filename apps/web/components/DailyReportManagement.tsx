'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';
import { ACTIVE_COMPANY_CHANGED_EVENT, getActiveCompanyId, notifyCompanyDataChanged, withActiveCompanyId } from '@/lib/companies';

type ProjectOption = { id: string; name: string };
type TechnicianOption = { id: string; name: string; role: string };
type Photo = { id: string; path: string; caption: string | null };
type DailyReport = {
  id: string;
  date: string;
  projectId: string;
  technicianId: string;
  workDescription: string;
  obstacle: string | null;
  progressNote: string | null;
  status: string;
  project: ProjectOption;
  technician: TechnicianOption;
  photos: Photo[];
};
type Options = {
  projects: ProjectOption[];
  technicians: TechnicianOption[];
};
type ReportForm = {
  date: string;
  projectId: string;
  technicianId: string;
  workDescription: string;
  obstacle: string;
  progressNote: string;
  status: string;
};

const today = new Date().toISOString().slice(0, 10);
const emptyForm: ReportForm = {
  date: today,
  projectId: '',
  technicianId: '',
  workDescription: '',
  obstacle: '',
  progressNote: '',
  status: 'SUBMITTED'
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value));
}

export function DailyReportManagement() {
  const router = useRouter();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [options, setOptions] = useState<Options>({ projects: [], technicians: [] });
  const [filters, setFilters] = useState({ projectId: '', technicianId: '', from: '', to: '' });
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [form, setForm] = useState<ReportForm>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(() => getActiveCompanyId());

  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;

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

  function filterQuery() {
    const params = new URLSearchParams();
    if (filters.projectId) params.set('projectId', filters.projectId);
    if (filters.technicianId) params.set('technicianId', filters.technicianId);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    return params.toString() ? `?${params}` : '';
  }

  async function loadReports() {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await request<DailyReport[]>(`/reports${filterQuery()}`);
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  }

  async function loadOptions() {
    if (!token) return;
    try {
      const data = await request<Options>('/reports/options');
      setOptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat opsi laporan');
    }
  }

  useEffect(() => {
    void loadReports();
    void loadOptions();
  }, [activeCompanyId, token]);

  useEffect(() => {
    function handleCompanyChange() {
      setSelectedReport(null);
      setEditingReport(null);
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
    setEditingReport(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  }

  function openEditForm(report: DailyReport) {
    setEditingReport(report);
    setForm({
      date: report.date.slice(0, 10),
      projectId: report.projectId,
      technicianId: report.technicianId,
      workDescription: report.workDescription,
      obstacle: report.obstacle || '',
      progressNote: report.progressNote || '',
      status: report.status
    });
    setIsFormOpen(true);
  }

  async function openDetail(reportId: string) {
    try {
      setError('');
      const data = await request<DailyReport>(`/reports/${reportId}`);
      setSelectedReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat detail laporan');
    }
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      obstacle: form.obstacle || null,
      progressNote: form.progressNote || null
    };
    try {
      await request<DailyReport>(editingReport ? `/reports/${editingReport.id}` : '/reports', {
        method: editingReport ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      setIsFormOpen(false);
      await loadReports();
      notifyCompanyDataChanged(activeCompanyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan laporan');
    } finally {
      setSaving(false);
    }
  }

  async function deleteReport(report: DailyReport) {
    if (!window.confirm(`Hapus laporan tanggal ${formatDate(report.date)}?`)) return;
    try {
      setError('');
      await request<{ ok: true }>(`/reports/${report.id}`, { method: 'DELETE' });
      if (selectedReport?.id === report.id) setSelectedReport(null);
      await loadReports();
      notifyCompanyDataChanged(activeCompanyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus laporan');
    }
  }

  return (
    <section id="laporan" className="card mt-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
        <div>
          <h2 className="text-xl font-black text-navy">Laporan Harian Teknisi</h2>
          <p className="text-sm text-slate-500">Pekerjaan, kendala, progres, dan dokumentasi.</p>
        </div>
        <button className="btn-primary inline-flex items-center gap-2" onClick={openCreateForm} disabled={!token}>
          <Plus size={16} /> Laporan Baru
        </button>
      </div>

      <div className="grid gap-3 border-b border-slate-200 p-5 md:grid-cols-2 lg:grid-cols-4">
        <select className="input" value={filters.projectId} onChange={(event) => setFilters({ ...filters, projectId: event.target.value })}>
          <option value="">Semua proyek</option>
          {options.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <select className="input" value={filters.technicianId} onChange={(event) => setFilters({ ...filters, technicianId: event.target.value })}>
          <option value="">Semua teknisi</option>
          {options.technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.name}</option>)}
        </select>
        <input className="input" type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
        <input className="input" type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
        <button className="btn-dark lg:col-span-4" onClick={() => void loadReports()} disabled={!token}>Terapkan Filter</button>
      </div>

      {!token && <p className="p-5 text-sm text-orange-700">Login dulu agar laporan dapat dimuat.</p>}
      {error && <p className="border-b border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr><th className="p-4">Tanggal</th><th>Teknisi</th><th>Proyek</th><th>Pekerjaan</th><th>Dokumentasi</th><th>Status</th><th className="pr-4 text-right">Aksi</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-slate-500" colSpan={7}>Memuat laporan...</td></tr>}
            {!loading && reports.length === 0 && <tr><td className="p-4 text-slate-500" colSpan={7}>Belum ada laporan.</td></tr>}
            {reports.map((report) => (
              <tr key={report.id} className="border-t border-slate-100 align-top">
                <td className="p-4">{formatDate(report.date)}</td>
                <td className="font-semibold text-navy">{report.technician.name}</td>
                <td>{report.project.name}</td>
                <td>{report.workDescription}</td>
                <td>{report.photos.length} foto</td>
                <td>{report.status}</td>
                <td className="pr-4">
                  <div className="flex justify-end gap-2">
                    <button className="rounded-lg border p-2 text-slate-600 hover:bg-slate-50" title="Lihat detail" onClick={() => void openDetail(report.id)}><Eye size={16} /></button>
                    <button className="rounded-lg border p-2 text-slate-600 hover:bg-slate-50" title="Edit laporan" onClick={() => openEditForm(report)}><Pencil size={16} /></button>
                    <button className="rounded-lg border p-2 text-red-600 hover:bg-red-50" title="Hapus laporan" onClick={() => void deleteReport(report)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <form className="card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6" onSubmit={submitForm}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-navy">{editingReport ? 'Edit Laporan' : 'Tambah Laporan'}</h3>
                <p className="text-sm text-slate-500">Data laporan tersimpan langsung ke backend.</p>
              </div>
              <button type="button" className="rounded-lg border p-2" onClick={() => setIsFormOpen(false)}><X size={16} /></button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input className="input" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
              <input className="input" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} />
              <select className="input" required value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}>
                <option value="">Pilih proyek</option>
                {options.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
              <select className="input" required value={form.technicianId} onChange={(event) => setForm({ ...form, technicianId: event.target.value })}>
                <option value="">Pilih teknisi</option>
                {options.technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.name} - {technician.role}</option>)}
              </select>
              <textarea className="input md:col-span-2" required rows={4} placeholder="Pekerjaan dilakukan" value={form.workDescription} onChange={(event) => setForm({ ...form, workDescription: event.target.value })} />
              <textarea className="input md:col-span-2" rows={3} placeholder="Kendala" value={form.obstacle} onChange={(event) => setForm({ ...form, obstacle: event.target.value })} />
              <textarea className="input md:col-span-2" rows={3} placeholder="Progress / catatan" value={form.progressNote} onChange={(event) => setForm({ ...form, progressNote: event.target.value })} />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="rounded-xl border px-5 py-3 font-semibold text-slate-600" onClick={() => setIsFormOpen(false)}>Batal</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Laporan'}</button>
            </div>
          </form>
        </div>
      )}

      {selectedReport && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/45 p-4">
          <div className="card w-full max-w-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gold">{formatDate(selectedReport.date)}</p>
                <h3 className="text-2xl font-black text-navy">{selectedReport.project.name}</h3>
              </div>
              <button className="rounded-lg border p-2" onClick={() => setSelectedReport(null)}><X size={16} /></button>
            </div>
            <div className="mt-5 grid gap-4">
              <div><p className="text-xs text-slate-500">Teknisi</p><p className="font-semibold text-navy">{selectedReport.technician.name}</p></div>
              <div><p className="text-xs text-slate-500">Pekerjaan dilakukan</p><p className="text-slate-700">{selectedReport.workDescription}</p></div>
              <div><p className="text-xs text-slate-500">Kendala</p><p className="text-slate-700">{selectedReport.obstacle || '-'}</p></div>
              <div><p className="text-xs text-slate-500">Progress / catatan</p><p className="text-slate-700">{selectedReport.progressNote || '-'}</p></div>
              <div><p className="text-xs text-slate-500">Dokumentasi</p><p className="text-slate-700">{selectedReport.photos.length} foto</p></div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
