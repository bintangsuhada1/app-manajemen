'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';
import { ACTIVE_COMPANY_CHANGED_EVENT, getActiveCompanyId, notifyCompanyDataChanged, withActiveCompanyId } from '@/lib/companies';
import RupiahInput from '@/components/RupiahInput';
import { formatRupiahDisplay, parseRupiah } from '@/lib/rupiah';

type ProjectOption = { id: string; name: string };
type Transaction = {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  category: string;
  description: string | null;
  amount: string | number;
  projectId: string | null;
  project: ProjectOption | null;
};
type Options = {
  projects: ProjectOption[];
  categories: string[];
  types: string[];
};
type Summary = { income: number; expense: number; balance: number };
type TransactionForm = {
  type: 'INCOME' | 'EXPENSE';
  date: string;
  category: string;
  description: string;
  amount: string;
  projectId: string;
};

const today = new Date().toISOString().slice(0, 10);
const emptyForm: TransactionForm = { type: 'INCOME', date: today, category: '', description: '', amount: '', projectId: '' };
const emptySummary = { income: 0, expense: 0, balance: 0 };

function formatCurrency(value: string | number) {
  return formatRupiahDisplay(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value));
}

export function FinanceManagement() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [options, setOptions] = useState<Options>({ projects: [], categories: [], types: [] });
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [form, setForm] = useState<TransactionForm>(emptyForm);
  const [filters, setFilters] = useState({ from: '', to: '', category: '', type: '' });
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
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.category) params.set('category', filters.category);
    if (filters.type) params.set('type', filters.type);
    return params.toString() ? `?${params}` : '';
  }

  async function loadTransactions() {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const suffix = filterQuery();
      const [rows, totals] = await Promise.all([
        request<Transaction[]>(`/finance${suffix}`),
        request<Summary>(`/finance/summary${suffix}`)
      ]);
      setTransactions(rows);
      setSummary(totals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat transaksi');
    } finally {
      setLoading(false);
    }
  }

  async function loadOptions() {
    if (!token) return;
    try {
      const data = await request<Options>('/finance/options');
      setOptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat opsi transaksi');
    }
  }

  useEffect(() => {
    void loadTransactions();
    void loadOptions();
  }, [activeCompanyId, token]);

  useEffect(() => {
    function handleCompanyChange() {
      setEditingTransaction(null);
      setActiveCompanyId(getActiveCompanyId());
    }

    window.addEventListener(ACTIVE_COMPANY_CHANGED_EVENT, handleCompanyChange);
    window.addEventListener('storage', handleCompanyChange);
    return () => {
      window.removeEventListener(ACTIVE_COMPANY_CHANGED_EVENT, handleCompanyChange);
      window.removeEventListener('storage', handleCompanyChange);
    };
  }, []);

  function openCreateForm(type: 'INCOME' | 'EXPENSE') {
    setEditingTransaction(null);
    setForm({ ...emptyForm, type });
    setIsFormOpen(true);
  }

  function openEditForm(transaction: Transaction) {
    setEditingTransaction(transaction);
    setForm({
      type: transaction.type,
      date: transaction.date.slice(0, 10),
      category: transaction.category,
      description: transaction.description || '',
      amount: transaction.amount.toString(),
      projectId: transaction.projectId || ''
    });
    setIsFormOpen(true);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      companyId: activeCompanyId,
      description: form.description || null,
      amount: parseRupiah(form.amount),
      projectId: form.projectId || null
    };
    try {
      await request<Transaction>(editingTransaction ? `/finance/${editingTransaction.id}` : '/finance', {
        method: editingTransaction ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      setIsFormOpen(false);
      await loadTransactions();
      await loadOptions();
      notifyCompanyDataChanged(activeCompanyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan transaksi');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTransaction(transaction: Transaction) {
    if (!window.confirm(`Hapus transaksi "${transaction.category}"?`)) return;
    try {
      setError('');
      await request<{ ok: true }>(`/finance/${transaction.id}`, { method: 'DELETE' });
      await loadTransactions();
      await loadOptions();
      notifyCompanyDataChanged(activeCompanyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus transaksi');
    }
  }

  return (
    <section id="keuangan" className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-navy">Keuangan</h2>
          <p className="mt-1 text-sm text-slate-500">Kas masuk, kas keluar, dan saldo.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={() => openCreateForm('INCOME')} disabled={!token}><Plus size={16} className="inline" /> Kas Masuk</button>
          <button className="btn-dark" onClick={() => openCreateForm('EXPENSE')} disabled={!token}><Plus size={16} className="inline" /> Kas Keluar</button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm md:grid-cols-3">
        <div><p className="text-slate-500">Pemasukan</p><p className="font-bold text-navy">{formatCurrency(summary.income)}</p></div>
        <div><p className="text-slate-500">Pengeluaran</p><p className="font-bold text-navy">{formatCurrency(summary.expense)}</p></div>
        <div><p className="text-slate-500">Saldo</p><p className="font-bold text-navy">{formatCurrency(summary.balance)}</p></div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input className="input" type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
        <input className="input" type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
        <select className="input" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
          <option value="">Semua kategori</option>
          {options.categories.map((category) => <option key={category}>{category}</option>)}
        </select>
        <select className="input" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
          <option value="">Semua tipe</option>
          <option value="INCOME">INCOME</option>
          <option value="EXPENSE">EXPENSE</option>
        </select>
      </div>
      <button className="btn-dark mt-3 w-full" onClick={() => void loadTransactions()} disabled={!token}>Terapkan Filter</button>

      {!token && <p className="mt-4 text-sm text-orange-700">Login dulu agar data transaksi dapat dimuat.</p>}
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <div className="max-h-80 overflow-y-auto">
          <div className="grid gap-0 divide-y divide-slate-200">
            {loading && <div className="p-4 text-sm text-slate-500">Memuat transaksi...</div>}
            {!loading && transactions.length === 0 && <div className="p-4 text-sm text-slate-500">Belum ada transaksi.</div>}
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-navy">{transaction.category}</p>
                    <p className="text-xs text-slate-500">{transaction.type} | {formatDate(transaction.date)}</p>
                    <p className="text-xs text-slate-500">{transaction.project?.name || 'Tanpa proyek'}</p>
                    {transaction.description && <p className="mt-1 text-xs text-slate-600">{transaction.description}</p>}
                    <p className="mt-1 text-sm font-semibold text-gold">{formatCurrency(transaction.amount)}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button className="rounded-lg border p-2 text-slate-600 hover:bg-slate-100" title="Edit transaksi" onClick={() => openEditForm(transaction)}><Pencil size={16} /></button>
                    <button className="rounded-lg border p-2 text-red-600 hover:bg-red-50" title="Hapus transaksi" onClick={() => void deleteTransaction(transaction)}><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <form className="card w-full max-w-2xl p-6" onSubmit={submitForm}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-navy">{editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}</h3>
                <p className="text-sm text-slate-500">Catatan kas tersimpan langsung ke backend.</p>
              </div>
              <button type="button" className="rounded-lg border p-2" onClick={() => setIsFormOpen(false)}><X size={16} /></button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <select className="input" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as 'INCOME' | 'EXPENSE' })}>
                <option value="INCOME">INCOME</option>
                <option value="EXPENSE">EXPENSE</option>
              </select>
              <input className="input" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
              <input className="input" required placeholder="Kategori" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
              <RupiahInput className="input" required placeholder="Nominal" value={form.amount} onChange={(val) => setForm({ ...form, amount: val })} />
              <select className="input md:col-span-2" value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}>
                <option value="">Tanpa proyek</option>
                {options.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
              <textarea className="input md:col-span-2" rows={3} placeholder="Deskripsi" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="rounded-xl border px-5 py-3 font-semibold text-slate-600" onClick={() => setIsFormOpen(false)}>Batal</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Transaksi'}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
