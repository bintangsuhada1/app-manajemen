'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';
import { ACTIVE_COMPANY_CHANGED_EVENT, getActiveCompanyId, notifyCompanyDataChanged, withActiveCompanyId } from '@/lib/companies';

type Customer = {
  id: string;
  name: string;
  picName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  segment: string | null;
  status: string;
  notes: string | null;
};

type CustomerForm = {
  name: string;
  picName: string;
  phone: string;
  email: string;
  address: string;
  segment: string;
  status: string;
  notes: string;
};

const emptyForm: CustomerForm = {
  name: '',
  picName: '',
  phone: '',
  email: '',
  address: '',
  segment: '',
  status: 'PROSPECT',
  notes: ''
};
const statuses = ['PROSPECT', 'ACTIVE', 'INACTIVE'];

function statusLabel(status: string) {
  return status.replaceAll('_', ' ');
}

export function CustomerManagement() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
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

  async function loadCustomers(nextQuery = query) {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const suffix = nextQuery ? `?${new URLSearchParams({ q: nextQuery })}` : '';
      const data = await request<Customer[]>(`/customers${suffix}`);
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat pelanggan');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCustomers();
  }, [activeCompanyId, token]);

  useEffect(() => {
    function handleCompanyChange() {
      setEditingCustomer(null);
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
    setEditingCustomer(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  }

  function openEditForm(customer: Customer) {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      picName: customer.picName || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      segment: customer.segment || '',
      status: customer.status,
      notes: customer.notes || ''
    });
    setIsFormOpen(true);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      picName: form.picName || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      segment: form.segment || null,
      notes: form.notes || null
    };

    try {
      await request<Customer>(editingCustomer ? `/customers/${editingCustomer.id}` : '/customers', {
        method: editingCustomer ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      setIsFormOpen(false);
      await loadCustomers();
      notifyCompanyDataChanged(activeCompanyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan pelanggan');
    } finally {
      setSaving(false);
    }
  }

  async function deleteCustomer(customer: Customer) {
    if (!window.confirm(`Hapus pelanggan "${customer.name}"?`)) return;
    try {
      setError('');
      await request<{ ok: true }>(`/customers/${customer.id}`, { method: 'DELETE' });
      await loadCustomers();
      notifyCompanyDataChanged(activeCompanyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus pelanggan');
    }
  }

  return (
    <section id="crm" className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black text-navy">CRM Pelanggan</h2>
        <button className="btn-primary inline-flex items-center gap-2" onClick={openCreateForm} disabled={!token}>
          <Plus size={16} /> Pelanggan Baru
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <input className="input" placeholder="Cari pelanggan/prospek" value={query} onChange={(event) => setQuery(event.target.value)} />
        <button className="btn-dark" onClick={() => void loadCustomers(query)} disabled={!token}>Cari</button>
      </div>

      {!token && <p className="mt-4 text-sm text-orange-700">Login dulu agar data pelanggan dapat dimuat.</p>}
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-4 grid gap-3">
        {loading && <div className="rounded-xl border p-4 text-sm text-slate-500">Memuat pelanggan...</div>}
        {!loading && customers.length === 0 && <div className="rounded-xl border p-4 text-sm text-slate-500">Belum ada pelanggan.</div>}
        {customers.map((customer) => (
          <div key={customer.id} className="rounded-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-navy">{customer.name}</p>
                <p className="text-sm text-slate-500">{customer.picName || '-'}{customer.phone ? ` | ${customer.phone}` : ''}</p>
                <p className="mt-1 text-xs font-semibold text-gold">{statusLabel(customer.status)}{customer.segment ? ` | ${customer.segment}` : ''}</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg border p-2 text-slate-600 hover:bg-slate-50" title="Edit pelanggan" onClick={() => openEditForm(customer)}><Pencil size={16} /></button>
                <button className="rounded-lg border p-2 text-red-600 hover:bg-red-50" title="Hapus pelanggan" onClick={() => void deleteCustomer(customer)}><Trash2 size={16} /></button>
              </div>
            </div>
            {customer.notes && <p className="mt-2 text-sm text-slate-600">{customer.notes}</p>}
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <form className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6" onSubmit={submitForm}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-navy">{editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h3>
                <p className="text-sm text-slate-500">Data tersimpan langsung ke backend pelanggan.</p>
              </div>
              <button type="button" className="rounded-lg border p-2" onClick={() => setIsFormOpen(false)}><X size={16} /></button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input className="input" required placeholder="Nama pelanggan" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              <input className="input" placeholder="Nama PIC" value={form.picName} onChange={(event) => setForm({ ...form, picName: event.target.value })} />
              <input className="input" placeholder="Nomor telepon" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              <input className="input" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              <input className="input" placeholder="Segment" value={form.segment} onChange={(event) => setForm({ ...form, segment: event.target.value })} />
              <select className="input" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                {statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
              </select>
              <textarea className="input md:col-span-2" rows={3} placeholder="Alamat" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
              <textarea className="input md:col-span-2" rows={3} placeholder="Catatan" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="rounded-xl border px-5 py-3 font-semibold text-slate-600" onClick={() => setIsFormOpen(false)}>Batal</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Pelanggan'}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
