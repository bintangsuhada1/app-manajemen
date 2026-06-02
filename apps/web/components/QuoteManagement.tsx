'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Download, Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { downloadProtectedFile } from '@/lib/download';
import { apiUrl } from '@/lib/api';
import { ACTIVE_COMPANY_CHANGED_EVENT, getActiveCompanyId, notifyCompanyDataChanged, withActiveCompanyId } from '@/lib/companies';
import NumberInput from '@/components/NumberInput';
import RupiahInput from '@/components/RupiahInput';
import { formatRupiahDisplay, parseRupiah } from '@/lib/rupiah';

type NamedOption = { id: string; name: string };
type QuoteItem = {
  id?: string;
  description: string;
  unit: string;
  qty: number;
  unitPrice: string | number;
  total?: string | number;
};
type Quote = {
  id: string;
  number: string;
  title: string;
  status: string;
  subtotal: string | number;
  tax: string | number;
  discount: string | number;
  total: string | number;
  validUntil: string | null;
  notes: string | null;
  customerId: string | null;
  projectId: string | null;
  customer: NamedOption | null;
  project: NamedOption | null;
  items: QuoteItem[];
};
type Options = {
  customers: NamedOption[];
  projects: NamedOption[];
  statuses: string[];
};
type QuoteForm = {
  number: string;
  title: string;
  status: string;
  tax: string;
  discount: string;
  validUntil: string;
  notes: string;
  customerId: string;
  projectId: string;
  items: QuoteItem[];
};

const emptyItem = { description: '', unit: 'ls', qty: 1, unitPrice: 0 };
const emptyForm: QuoteForm = {
  number: '',
  title: '',
  status: 'DRAFT',
  tax: '0',
  discount: '0',
  validUntil: '',
  notes: '',
  customerId: '',
  projectId: '',
  items: [{ ...emptyItem }]
};

function formatCurrency(value: string | number) {
  return formatRupiahDisplay(value);
}

function statusLabel(status: string) {
  return status.replaceAll('_', ' ');
}

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : '';
}

export function QuoteManagement() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [options, setOptions] = useState<Options>({ customers: [], projects: [], statuses: [] });
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [form, setForm] = useState<QuoteForm>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(() => getActiveCompanyId());

  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const subtotal = form.items.reduce((sum, item) => sum + Number(item.qty || 0) * parseRupiah(item.unitPrice || 0), 0);
  const total = subtotal + parseRupiah(form.tax || 0) - parseRupiah(form.discount || 0);

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

  async function loadQuotes() {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await request<Quote[]>('/quotes');
      setQuotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat penawaran');
    } finally {
      setLoading(false);
    }
  }

  async function loadOptions() {
    if (!token) return;
    try {
      const data = await request<Options>('/quotes/options');
      setOptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat opsi penawaran');
    }
  }

  useEffect(() => {
    void loadQuotes();
    void loadOptions();
  }, [activeCompanyId, token]);

  useEffect(() => {
    function handleCompanyChange() {
      setSelectedQuote(null);
      setEditingQuote(null);
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
    setEditingQuote(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingQuote(null);
    setForm(emptyForm);
  }

  function openEditForm(quote: Quote) {
    setEditingQuote(quote);
    setForm({
      number: quote.number,
      title: quote.title,
      status: quote.status,
      tax: quote.tax.toString(),
      discount: quote.discount.toString(),
      validUntil: toDateInput(quote.validUntil),
      notes: quote.notes || '',
      customerId: quote.customerId || '',
      projectId: quote.projectId || '',
      items: quote.items.map((item) => ({
        description: item.description,
        unit: item.unit,
        qty: Number(item.qty),
        unitPrice: Number(item.unitPrice)
      }))
    });
    setIsFormOpen(true);
  }

  async function openDetail(quoteId: string) {
    try {
      setError('');
      const data = await request<Quote>(`/quotes/${quoteId}`);
      setSelectedQuote(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat detail penawaran');
    }
  }

  function updateItem(index: number, nextItem: Partial<QuoteItem>) {
    setForm({
      ...form,
      items: form.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...nextItem } : item)
    });
  }

  function addItem() {
    setForm({ ...form, items: [...form.items, { ...emptyItem }] });
  }

  function removeItem(index: number) {
    if (form.items.length === 1) return;
    setForm({ ...form, items: form.items.filter((_, itemIndex) => itemIndex !== index) });
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      tax: parseRupiah(form.tax || 0),
      discount: parseRupiah(form.discount || 0),
      validUntil: form.validUntil || null,
      notes: form.notes || null,
      customerId: form.customerId || null,
      projectId: form.projectId || null,
      items: form.items.map((item) => ({
        description: item.description,
        unit: item.unit,
        qty: Number(item.qty),
        unitPrice: parseRupiah(item.unitPrice)
      }))
    };

    try {
      await request<Quote>(editingQuote ? `/quotes/${editingQuote.id}` : '/quotes', {
        method: editingQuote ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      closeForm();
      await loadQuotes();
      notifyCompanyDataChanged(activeCompanyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan penawaran');
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuote(quote: Quote) {
    if (!window.confirm(`Hapus penawaran "${quote.number}"?`)) return;
    try {
      setError('');
      await request<{ ok: true }>(`/quotes/${quote.id}`, { method: 'DELETE' });
      if (selectedQuote?.id === quote.id) setSelectedQuote(null);
      await loadQuotes();
      notifyCompanyDataChanged(activeCompanyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus penawaran');
    }
  }

  return (
    <section id="penawaran" className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">Penawaran & RAB</h2>
        {!isFormOpen && (
          <button className="btn-primary inline-flex items-center gap-2" onClick={openCreateForm} disabled={!token}>
            <Plus size={16} /> Penawaran Baru
          </button>
        )}
      </div>

      {!token && <p className="mt-4 text-sm text-orange-700">Login dulu agar data penawaran dapat dimuat.</p>}
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {!isFormOpen && <div className="mt-4 grid gap-3">
        {loading && <div className="empty-state">Memuat penawaran...</div>}
        {!loading && quotes.length === 0 && <div className="empty-state">Belum ada penawaran.</div>}
        {quotes.map((quote) => (
          <div key={quote.id} className="data-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-950">{quote.number} - {quote.title}</p>
                <p className="text-[13px] text-slate-500">{quote.customer?.name || '-'}{quote.project ? ` | ${quote.project.name}` : ''}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="badge border-cyan-100 bg-cyan-50 text-cyan-700">{statusLabel(quote.status)}</span>
                  <span className="money-value text-xs font-semibold text-slate-700">{formatCurrency(quote.total)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="icon-button" title="Lihat detail" onClick={() => void openDetail(quote.id)}><Eye size={16} /></button>
                <button className="icon-button" title="Download PDF" onClick={() => void downloadProtectedFile(withActiveCompanyId(`/quotes/${quote.id}/pdf`, activeCompanyId), `penawaran-${quote.number}.pdf`, token, () => { window.localStorage.removeItem('token'); window.localStorage.removeItem('user'); router.replace('/login'); }, () => router.replace('/forbidden'))}><Download size={16} /></button>
                <button className="icon-button" title="Edit penawaran" onClick={() => openEditForm(quote)}><Pencil size={16} /></button>
                <button className="icon-button text-red-600 hover:bg-red-50" title="Hapus penawaran" onClick={() => void deleteQuote(quote)}><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>}

      {isFormOpen && (
        <section className="glass-surface mt-4 p-6">
          <form className="w-full space-y-6" onSubmit={submitForm}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="section-title">{editingQuote ? 'Edit Penawaran' : 'Tambah Penawaran'}</h3>
                <p className="section-description">Subtotal dihitung otomatis dari item pekerjaan.</p>
              </div>
              <button type="button" className="icon-button" onClick={closeForm} aria-label="Tutup form penawaran"><X size={16} /></button>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <input className="input" required placeholder="Nomor penawaran" value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} />
              <input className="input" required placeholder="Judul penawaran" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              <select className="input" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                {(options.statuses.length ? options.statuses : ['DRAFT']).map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
              </select>
              <input className="input" type="date" value={form.validUntil} onChange={(event) => setForm({ ...form, validUntil: event.target.value })} />
              <select className="input" value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })}>
                <option value="">Pilih pelanggan</option>
                {options.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
              </select>
              <select className="input" value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}>
                <option value="">Pilih proyek</option>
                {options.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-950">Item Pekerjaan</p>
                <button type="button" className="btn-secondary" onClick={addItem}>+ Item</button>
              </div>
              <div className="mt-3 grid gap-3">
                {form.items.map((item, index) => (
                  <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 lg:grid-cols-[minmax(220px,1fr)_90px_100px_160px_140px_auto]">
                    <input className="input" required placeholder="Deskripsi pekerjaan" value={item.description} onChange={(event) => updateItem(index, { description: event.target.value })} />
                    <input className="input" required placeholder="Satuan" value={item.unit} onChange={(event) => updateItem(index, { unit: event.target.value })} />
                    <NumberInput className="input" required value={item.qty} onChange={(val) => updateItem(index, { qty: Number(val || 0) })} allowDecimal />
                    <RupiahInput className="input" required placeholder="Harga satuan" value={item.unitPrice} onChange={(val) => updateItem(index, { unitPrice: val })} />
                    <div className="money-value grid content-center text-sm font-semibold text-slate-950">{formatCurrency(item.qty * parseRupiah(item.unitPrice))}</div>
                    <button type="button" className="icon-button text-red-600 hover:bg-red-50" onClick={() => removeItem(index)} disabled={form.items.length === 1}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <RupiahInput className="input" placeholder="Pajak" value={form.tax} onChange={(val) => setForm({ ...form, tax: val })} />
              <RupiahInput className="input" placeholder="Diskon" value={form.discount} onChange={(val) => setForm({ ...form, discount: val })} />
              <textarea className="input h-auto min-h-[140px] lg:col-span-2" rows={4} placeholder="Catatan" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </div>

            <div className="grid gap-2 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
              <div className="flex justify-between"><span>Pajak</span><strong>{formatCurrency(form.tax)}</strong></div>
              <div className="flex justify-between"><span>Diskon</span><strong>{formatCurrency(form.discount)}</strong></div>
              <div className="flex justify-between border-t pt-2 text-base text-navy"><span>Total</span><strong>{formatCurrency(total)}</strong></div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-4">
              <button type="button" className="btn-secondary" onClick={closeForm}>Batal</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Penawaran'}</button>
            </div>
          </form>
        </section>
      )}

      {selectedQuote && (
        <div className="modal-backdrop z-40">
          <div className="modal-card max-w-3xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gold">{selectedQuote.number}</p>
                <h3 className="text-xl font-semibold text-slate-950">{selectedQuote.title}</h3>
              </div>
              <button className="icon-button" onClick={() => setSelectedQuote(null)}><X size={16} /></button>
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              <p><span className="text-slate-500">Pelanggan:</span> {selectedQuote.customer?.name || '-'}</p>
              <p><span className="text-slate-500">Proyek:</span> {selectedQuote.project?.name || '-'}</p>
              <p><span className="text-slate-500">Status:</span> {statusLabel(selectedQuote.status)}</p>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="enterprise-table">
                <thead className="bg-slate-50 text-slate-500">
                  <tr><th>Pekerjaan</th><th>Satuan</th><th>Qty</th><th>Harga</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {selectedQuote.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.description}</td>
                      <td>{item.unit}</td>
                      <td>{item.qty}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>{formatCurrency(item.total || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 grid gap-2 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><strong>{formatCurrency(selectedQuote.subtotal)}</strong></div>
              <div className="flex justify-between"><span>Pajak</span><strong>{formatCurrency(selectedQuote.tax)}</strong></div>
              <div className="flex justify-between"><span>Diskon</span><strong>{formatCurrency(selectedQuote.discount)}</strong></div>
              <div className="flex justify-between border-t pt-2 text-base text-navy"><span>Total</span><strong>{formatCurrency(selectedQuote.total)}</strong></div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
