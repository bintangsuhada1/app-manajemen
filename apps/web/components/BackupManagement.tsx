'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

export function BackupManagement() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<'export' | 'import' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const authHeaders = useMemo(() => token ? { Authorization: `Bearer ${token}` } : undefined, [token]);

  function handleAuth(response: Response) {
    if (response.status === 401) {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
      router.replace('/login');
      return true;
    }
    if (response.status === 403) {
      router.replace('/forbidden');
      return true;
    }
    return false;
  }

  async function exportBackup() {
    setLoading('export');
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${apiUrl}/api/backups/export`, { headers: authHeaders });
      if (handleAuth(response)) return;
      if (!response.ok) throw new Error('Gagal membuat backup');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pt-jurti-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      setSuccess('Backup berhasil diunduh.');
    } catch {
      setError('Gagal membuat backup.');
    } finally {
      setLoading(null);
    }
  }

  async function importBackup() {
    if (!file) {
      setError('Pilih file backup JSON terlebih dahulu.');
      return;
    }
    if (!window.confirm('Restore akan mengganti seluruh data saat ini. Lanjutkan import backup?')) return;
    setLoading('import');
    setError('');
    setSuccess('');
    try {
      const payload = JSON.parse(await file.text());
      const response = await fetch(`${apiUrl}/api/backups/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeaders || {})
        },
        body: JSON.stringify(payload)
      });
      if (handleAuth(response)) return;
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || 'Gagal import backup');
      setSuccess('Restore backup berhasil.');
      setFile(null);
    } catch (err) {
      setError(err instanceof SyntaxError ? 'Format file backup tidak valid.' : 'Gagal import backup.');
    } finally {
      setLoading(null);
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    setError('');
    setSuccess('');
    setFile(event.target.files?.[0] || null);
  }

  return (
    <section className="card mt-6 p-5">
      <h2 className="text-xl font-black text-navy">Backup & Restore</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn-primary inline-flex items-center gap-2" onClick={() => void exportBackup()} disabled={!token || loading !== null}>
          <Download size={16} /> {loading === 'export' ? 'Membuat backup...' : 'Download Backup JSON'}
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <input className="input" type="file" accept="application/json,.json" onChange={onFileChange} disabled={loading !== null} />
        <button className="btn-dark inline-flex items-center justify-center gap-2" onClick={() => void importBackup()} disabled={!token || loading !== null}>
          <Upload size={16} /> {loading === 'import' ? 'Mengimpor...' : 'Restore / Import'}
        </button>
      </div>
      {file && <p className="mt-3 text-sm text-slate-500">File dipilih: {file.name}</p>}
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}
    </section>
  );
}
