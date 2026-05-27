'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Download, Eye, Plus, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

type ProjectOption = { id: string; name: string };
type Uploader = { id: string; name: string; email: string };
type DocumentItem = {
  id: string;
  title: string;
  category: string;
  fileName: string;
  mimeType: string | null;
  size: number | null;
  projectId: string | null;
  project: ProjectOption | null;
  uploadedBy: Uploader;
  createdAt: string;
};
type Options = { projects: ProjectOption[]; categories: string[]; mimeTypes: string[] };
type UploadForm = { title: string; category: string; projectId: string; file: File | null };

const emptyForm: UploadForm = { title: '', category: 'GENERAL', projectId: '', file: null };

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value));
}

function formatBytes(value: number | null) {
  if (!value) return '-';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentManagement() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [options, setOptions] = useState<Options>({ projects: [], categories: [], mimeTypes: [] });
  const [filters, setFilters] = useState({ projectId: '', category: '', mimeType: '' });
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [form, setForm] = useState<UploadForm>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const authHeaders = useMemo(() => token ? { Authorization: `Bearer ${token}` } : undefined, [token]);

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${apiUrl}/api${path}`, {
      ...init,
      headers: {
        ...(authHeaders || {}),
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
    if (filters.category) params.set('category', filters.category);
    if (filters.mimeType) params.set('mimeType', filters.mimeType);
    return params.toString() ? `?${params}` : '';
  }

  async function loadDocuments() {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setDocuments(await request<DocumentItem[]>(`/documents${filterQuery()}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat dokumen');
    } finally {
      setLoading(false);
    }
  }

  async function loadOptions() {
    if (!token) return;
    try {
      setOptions(await request<Options>('/documents/options'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat opsi dokumen');
    }
  }

  useEffect(() => {
    void loadDocuments();
    void loadOptions();
  }, []);

  async function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.file) return;
    setSaving(true);
    setError('');
    const body = new FormData();
    body.append('file', form.file);
    body.append('title', form.title || form.file.name);
    body.append('category', form.category);
    if (form.projectId) body.append('projectId', form.projectId);

    try {
      await request<DocumentItem>('/documents/upload', { method: 'POST', body });
      setIsFormOpen(false);
      setForm(emptyForm);
      await loadDocuments();
      await loadOptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengupload dokumen');
    } finally {
      setSaving(false);
    }
  }

  async function openDetail(documentId: string) {
    try {
      setError('');
      setSelectedDocument(await request<DocumentItem>(`/documents/${documentId}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat detail dokumen');
    }
  }

  async function deleteDocument(document: DocumentItem) {
    if (!window.confirm(`Hapus dokumen "${document.title}"?`)) return;
    try {
      setError('');
      await request<{ ok: true }>(`/documents/${document.id}`, { method: 'DELETE' });
      if (selectedDocument?.id === document.id) setSelectedDocument(null);
      await loadDocuments();
      await loadOptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus dokumen');
    }
  }

  async function openFile(document: DocumentItem) {
    try {
      const response = await fetch(`${apiUrl}/api/documents/${document.id}/file`, { headers: authHeaders });
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
        setError('Gagal membuka file');
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setError('Gagal membuka file');
    }
  }

  return (
    <section id="dokumen" className="card mt-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
        <div>
          <h2 className="text-xl font-black text-navy">Dokumen & Dokumentasi Proyek</h2>
          <p className="text-sm text-slate-500">Dokumen perusahaan, dokumen proyek, dan foto proyek.</p>
        </div>
        <button className="btn-primary inline-flex items-center gap-2" onClick={() => setIsFormOpen(true)} disabled={!token}>
          <Plus size={16} /> Upload Dokumen
        </button>
      </div>

      <div className="grid gap-3 border-b border-slate-200 p-5 md:grid-cols-3">
        <select className="input" value={filters.projectId} onChange={(event) => setFilters({ ...filters, projectId: event.target.value })}>
          <option value="">Semua proyek</option>
          {options.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <select className="input" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
          <option value="">Semua kategori</option>
          {options.categories.map((category) => <option key={category}>{category}</option>)}
        </select>
        <select className="input" value={filters.mimeType} onChange={(event) => setFilters({ ...filters, mimeType: event.target.value })}>
          <option value="">Semua tipe file</option>
          {options.mimeTypes.map((mimeType) => <option key={mimeType}>{mimeType}</option>)}
        </select>
        <button className="btn-dark md:col-span-3" onClick={() => void loadDocuments()} disabled={!token}>Terapkan Filter</button>
      </div>

      {!token && <p className="p-5 text-sm text-orange-700">Login dulu agar dokumen dapat dimuat.</p>}
      {error && <p className="border-b border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr><th className="p-4">Dokumen</th><th>Kategori</th><th>Proyek</th><th>Tipe</th><th>Ukuran</th><th>Upload</th><th className="pr-4 text-right">Aksi</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-slate-500" colSpan={7}>Memuat dokumen...</td></tr>}
            {!loading && documents.length === 0 && <tr><td className="p-4 text-slate-500" colSpan={7}>Belum ada dokumen.</td></tr>}
            {documents.map((document) => (
              <tr key={document.id} className="border-t border-slate-100">
                <td className="p-4"><p className="font-bold text-navy">{document.title}</p><p className="text-xs text-slate-500">{document.fileName}</p></td>
                <td>{document.category}</td>
                <td>{document.project?.name || 'Perusahaan'}</td>
                <td>{document.mimeType || '-'}</td>
                <td>{formatBytes(document.size)}</td>
                <td>{formatDate(document.createdAt)}</td>
                <td className="pr-4">
                  <div className="flex justify-end gap-2">
                    <button className="rounded-lg border p-2 text-slate-600 hover:bg-slate-50" title="Detail" onClick={() => void openDetail(document.id)}><Eye size={16} /></button>
                    <button className="rounded-lg border p-2 text-slate-600 hover:bg-slate-50" title="Preview / download" onClick={() => void openFile(document)}><Download size={16} /></button>
                    <button className="rounded-lg border p-2 text-red-600 hover:bg-red-50" title="Hapus dokumen" onClick={() => void deleteDocument(document)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <form className="card w-full max-w-2xl p-6" onSubmit={submitUpload}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-navy">Upload Dokumen</h3>
                <p className="text-sm text-slate-500">Gunakan kategori `PHOTO` untuk foto dokumentasi proyek.</p>
              </div>
              <button type="button" className="rounded-lg border p-2" onClick={() => setIsFormOpen(false)}><X size={16} /></button>
            </div>
            <div className="mt-5 grid gap-4">
              <input className="input" placeholder="Judul dokumen" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              <input className="input" required placeholder="Kategori, contoh GENERAL / PROJECT / PHOTO" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
              <select className="input" value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}>
                <option value="">Dokumen perusahaan</option>
                {options.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
              <input className="input" type="file" required onChange={(event) => setForm({ ...form, file: event.target.files?.[0] || null })} />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="rounded-xl border px-5 py-3 font-semibold text-slate-600" onClick={() => setIsFormOpen(false)}>Batal</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Mengupload...' : 'Upload'}</button>
            </div>
          </form>
        </div>
      )}

      {selectedDocument && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/45 p-4">
          <div className="card w-full max-w-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gold">{selectedDocument.category}</p>
                <h3 className="text-2xl font-black text-navy">{selectedDocument.title}</h3>
              </div>
              <button className="rounded-lg border p-2" onClick={() => setSelectedDocument(null)}><X size={16} /></button>
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              <p><span className="text-slate-500">File:</span> {selectedDocument.fileName}</p>
              <p><span className="text-slate-500">Proyek:</span> {selectedDocument.project?.name || 'Perusahaan'}</p>
              <p><span className="text-slate-500">Tipe:</span> {selectedDocument.mimeType || '-'}</p>
              <p><span className="text-slate-500">Ukuran:</span> {formatBytes(selectedDocument.size)}</p>
              <p><span className="text-slate-500">Uploader:</span> {selectedDocument.uploadedBy.name}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
