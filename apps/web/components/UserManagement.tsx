'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Key, X, Check, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type UserForm = {
  name: string;
  email: string;
  role: string;
  phone: string;
  isActive: boolean;
  password?: string;
};

const emptyForm: UserForm = {
  name: '',
  email: '',
  role: 'ADMIN',
  phone: '',
  isActive: true,
  password: ''
};

const roles = [
  'SUPER_ADMIN',
  'DIREKTUR',
  'PROJECT_MANAGER',
  'ADMIN',
  'KEUANGAN',
  'TEKNISI',
  'MARKETING'
];

function roleLabel(role: string) {
  return role.replaceAll('_', ' ');
}

export function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const authHeaders = useMemo(() => token ? { Authorization: `Bearer ${token}` } : undefined, [token]);

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${apiUrl}/api${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
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

  async function loadUsers() {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = await request<User[]>('/users');
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar user');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  function openCreateForm() {
    setEditingUser(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  }

  function openEditForm(user: User) {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      isActive: user.isActive
    });
    setIsFormOpen(true);
  }

  function openPasswordForm(user: User) {
    setEditingUser(user);
    setNewPassword('');
    setIsPasswordOpen(true);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      name: form.name,
      email: form.email,
      role: form.role,
      phone: form.phone || null,
      isActive: form.isActive,
      ...(editingUser ? {} : { password: form.password })
    };

    try {
      if (editingUser) {
        await request<User>(`/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setSuccess(`User "${form.name}" berhasil diperbarui.`);
      } else {
        await request<User>('/users', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setSuccess(`User "${form.name}" berhasil ditambahkan.`);
      }
      setIsFormOpen(false);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan user');
    } finally {
      setSaving(false);
    }
  }

  async function submitPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUser) return;
    if (newPassword.length < 8) {
      setError('Password minimal harus terdiri dari 8 karakter');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await request<{ ok: boolean }>(`/users/${editingUser.id}/password`, {
        method: 'PUT',
        body: JSON.stringify({ password: newPassword })
      });
      setSuccess(`Password untuk user "${editingUser.name}" berhasil direset.`);
      setIsPasswordOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mereset password');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="users" className="card mt-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
        <div>
          <h2 className="text-xl font-black text-navy">Manajemen Akun Pengguna</h2>
          <p className="text-sm text-slate-500">Kelola kredensial, peran/role internal perusahaan, dan hak akses aplikasi.</p>
        </div>
        <button className="btn-primary inline-flex items-center gap-2" onClick={openCreateForm} disabled={!token}>
          <Plus size={16} /> User Baru
        </button>
      </div>

      {error && <p className="border-b border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {success && <p className="border-b border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-4">Nama Lengkap</th>
              <th>Alamat Email</th>
              <th>Role Internal</th>
              <th>No. WhatsApp</th>
              <th>Status Akun</th>
              <th className="pr-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-slate-500" colSpan={6}>Memuat daftar user...</td></tr>}
            {!loading && users.length === 0 && <tr><td className="p-4 text-slate-500" colSpan={6}>Belum ada user terdaftar.</td></tr>}
            {!loading && users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100 align-middle">
                <td className="p-4 font-bold text-navy">{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-navy">
                    {roleLabel(u.role)}
                  </span>
                </td>
                <td>{u.phone || '-'}</td>
                <td>
                  {u.isActive ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <Check size={14} className="text-emerald-500" /> Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
                      <XCircle size={14} className="text-rose-500" /> Nonaktif
                    </span>
                  )}
                </td>
                <td className="pr-4">
                  <div className="flex justify-end gap-2">
                    <button 
                      className="rounded-lg border p-2 text-slate-600 hover:bg-slate-50" 
                      title="Reset password" 
                      onClick={() => openPasswordForm(u)}
                    >
                      <Key size={16} />
                    </button>
                    <button 
                      className="rounded-lg border p-2 text-slate-600 hover:bg-slate-50" 
                      title="Edit data user" 
                      onClick={() => openEditForm(u)}
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <form className="card max-h-[90vh] w-full max-w-xl overflow-y-auto p-6" onSubmit={submitForm}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-navy">{editingUser ? 'Edit Detail User' : 'Tambah User Baru'}</h3>
                <p className="text-sm text-slate-500">Isi data akun internal perusahaan dengan benar.</p>
              </div>
              <button type="button" className="rounded-lg border p-2" onClick={() => setIsFormOpen(false)}><X size={16} /></button>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="block text-sm font-semibold text-slate-700">
                Nama Lengkap
                <input 
                  className="input mt-1" 
                  required 
                  placeholder="Nama lengkap user" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Alamat Email
                <input 
                  className="input mt-1" 
                  type="email"
                  required 
                  placeholder="name@ptjurti.com" 
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })} 
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Peran (Role)
                  <select 
                    className="input mt-1" 
                    value={form.role} 
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    {roles.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                  </select>
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Nomor WhatsApp
                  <input 
                    className="input mt-1" 
                    placeholder="Contoh: 628xxxxxxxxxx" 
                    value={form.phone} 
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                  />
                </label>
              </div>

              {!editingUser && (
                <label className="block text-sm font-semibold text-slate-700">
                  Kata Sandi Awal
                  <input 
                    className="input mt-1" 
                    type="password"
                    required 
                    placeholder="Minimal 8 karakter" 
                    value={form.password} 
                    onChange={(e) => setForm({ ...form, password: e.target.value })} 
                  />
                </label>
              )}

              {editingUser && (
                <label className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-slate-300 text-gold focus:ring-gold"
                    checked={form.isActive} 
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })} 
                  />
                  Akun aktif (bisa digunakan untuk login)
                </label>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="rounded-xl border px-5 py-3 font-semibold text-slate-600" onClick={() => setIsFormOpen(false)}>Batal</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan User'}</button>
            </div>
          </form>
        </div>
      )}

      {isPasswordOpen && editingUser && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <form className="card w-full max-w-md p-6" onSubmit={submitPasswordReset}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-navy">Reset Password User</h3>
                <p className="text-sm text-slate-500">Ubah password untuk user: <span className="font-bold text-navy">{editingUser.name}</span></p>
              </div>
              <button type="button" className="rounded-lg border p-2" onClick={() => setIsPasswordOpen(false)}><X size={16} /></button>
            </div>

            <div className="mt-5">
              <label className="block text-sm font-semibold text-slate-700">
                Password Baru
                <input 
                  className="input mt-1" 
                  type="password"
                  required 
                  placeholder="Minimal 8 karakter" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="rounded-xl border px-5 py-3 font-semibold text-slate-600" onClick={() => setIsPasswordOpen(false)}>Batal</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Mereset...' : 'Reset Password'}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
