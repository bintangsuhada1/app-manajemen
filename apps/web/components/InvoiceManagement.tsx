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
type InvoiceItem = {
  id?: string;
  description: string;
  unit: string;
  qty: number;
  unitPrice: string | number;
  total?: string | number;
};
type Invoice = {
  id: string;
  number: string;
  title: string;
  status: string;
  subtotal: string | number;
  tax: string | number;
  total: string | number;
  paidAmount: string | number;
  dueDate: string | null;
  customerId: string | null;
  projectId: string | null;
  customer: NamedOption | null;
  project: NamedOption | null;
  items: InvoiceItem[];
};
type Options = {
  customers: NamedOption[];
  projects: NamedOption[];
  statuses: string[];
};
type InvoiceForm = {
  number: string;
  title: string;
  status: string;
  tax: string;
  paidAmount: string;
  dueDate: string;
  customerId: string;
  projectId: string;
  items: InvoiceItem[];
};

const emptyItem = { description: '', unit: 'ls', qty: 1, unitPrice: 0 };
const emptyForm: InvoiceForm = {
  number: '',
  title: '',
  status: 'DRAFT',
  tax: '0',
  paidAmount: '0',
  dueDate: '',
  customerId: '',
  projectId: '',
  items: [{ ...emptyItem }]
};

function formatCurrency(value: string | number) {
  return formatRupiahDisplay(value);
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value));
}

function statusLabel(status: string) {
  return status.replaceAll('_', ' ');
}

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : '';
}

function paymentStatus(invoice: Pick<Invoice, 'paidAmount' | 'total' | 'status'>) {
  if (invoice.status === 'PAID') return 'Lunas';
  if (invoice.status === 'CANCELLED') return 'Dibatalkan';
  const paid = Number(invoice.paidAmount || 0);
  const total = Number(invoice.total || 0);
  if (paid <= 0) return 'Belum dibayar';
  if (paid >= total) return 'Lunas';
  return 'Sebagian';
}

export function InvoiceManagement() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [options, setOptions] = useState<Options>({ customers: [], projects: [], statuses: [] });
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [form, setForm] = useState<InvoiceForm>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(() => getActiveCompanyId());

  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const subtotal = form.items.reduce((sum, item) => sum + Number(item.qty || 0) * parseRupiah(item.unitPrice || 0), 0);
  const total = subtotal + parseRupiah(form.tax || 0);

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

  async function loadInvoices() {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await request<Invoice[]>('/invoices');
      setInvoices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat invoice');
    } finally {
      setLoading(false);
    }
  }

  async function loadOptions() {
    if (!token) return;
    try {
      const data = await request<Options>('/invoices/options');
      setOptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat opsi invoice');
    }
  }

  useEffect(() => {
    void loadInvoices();
    void loadOptions();
  }, [activeCompanyId, token]);

  useEffect(() => {
    function handleCompanyChange() {
      setSelectedInvoice(null);
      setEditingInvoice(null);
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
    setEditingInvoice(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  }

  function openEditForm(invoice: Invoice) {
    setEditingInvoice(invoice);
    setForm({
      number: invoice.number,
      title: invoice.title,
      status: invoice.status,
      tax: invoice.tax.toString(),
      paidAmount: invoice.paidAmount.toString(),
      dueDate: toDateInput(invoice.dueDate),
      customerId: invoice.customerId || '',
      projectId: invoice.projectId || '',
      items: invoice.items.map((item) => ({
        description: item.description,
        unit: item.unit,
        qty: Number(item.qty),
        unitPrice: Number(item.unitPrice)
      }))
    });
    setIsFormOpen(true);
  }

  async function openDetail(invoiceId: string) {
    try {
      setError('');
      const data = await request<Invoice>(`/invoices/${invoiceId}`);
      setSelectedInvoice(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat detail invoice');
    }
  }

  function updateItem(index: number, nextItem: Partial<InvoiceItem>) {
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
      paidAmount: parseRupiah(form.paidAmount || 0),
      dueDate: form.dueDate || null,
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
      await request<Invoice>(editingInvoice ? `/invoices/${editingInvoice.id}` : '/invoices', {
        method: editingInvoice ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      setIsFormOpen(false);
      await loadInvoices();
      notifyCompanyDataChanged(activeCompanyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan invoice');
    } finally {
      setSaving(false);
    }
  }

  async function deleteInvoice(invoice: Invoice) {
    if (!window.confirm(`Hapus invoice "${invoice.number}"?`)) return;
    try {
      setError('');
      await request<{ ok: true }>(`/invoices/${invoice.id}`, { method: 'DELETE' });
      if (selectedInvoice?.id === invoice.id) setSelectedInvoice(null);
      await loadInvoices();
      notifyCompanyDataChanged(activeCompanyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus invoice');
    }
  }

  return (
    <section id="invoice" className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-navy">Invoice</h2>
          <p className="mt-1 text-sm text-slate-500">Due date, status, dan pembayaran.</p>
        </div>
        <button className="btn-primary inline-flex items-center gap-2" onClick={openCreateForm} disabled={!token}>
          <Plus size={16} /> Invoice Baru
        </button>
      </div>

      {!token && <p className="mt-4 text-sm text-orange-700">Login dulu agar data invoice dapat dimuat.</p>}
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-4 grid gap-3">
        {loading && <div className="rounded-xl border p-4 text-sm text-slate-500">Memuat invoice...</div>}
        {!loading && invoices.length === 0 && <div className="rounded-xl border p-4 text-sm text-slate-500">Belum ada invoice.</div>}
        {invoices.map((invoice) => (
          <div key={invoice.id} className="rounded-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-navy">{invoice.number} - {invoice.title}</p>
                <p className="text-sm text-slate-500">{invoice.customer?.name || '-'}{invoice.project ? ` | ${invoice.project.name}` : ''}</p>
                <p className="mt-1 text-xs font-semibold text-gold">{statusLabel(invoice.status)} | {paymentStatus(invoice)} | {formatCurrency(invoice.total)}</p>
                <p className="mt-1 text-xs text-slate-500">Jatuh tempo: {formatDate(invoice.dueDate)}</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg border p-2 text-slate-600 hover:bg-slate-50" title="Lihat detail" onClick={() => void openDetail(invoice.id)}><Eye size={16} /></button>
                <button className="rounded-lg border p-2 text-slate-600 hover:bg-slate-50" title="Download PDF" onClick={() => void downloadProtectedFile(withActiveCompanyId(`/invoices/${invoice.id}/pdf`, activeCompanyId), `invoice-${invoice.number}.pdf`, token, () => { window.localStorage.removeItem('token'); window.localStorage.removeItem('user'); router.replace('/login'); }, () => router.replace('/forbidden'))}><Download size={16} /></button>
                <button className="rounded-lg border p-2 text-slate-600 hover:bg-slate-50" title="Edit invoice" onClick={() => openEditForm(invoice)}><Pencil size={16} /></button>
                <button className="rounded-lg border p-2 text-red-600 hover:bg-red-50" title="Hapus invoice" onClick={() => void deleteInvoice(invoice)}><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <form className="card max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6" onSubmit={submitForm}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-navy">{editingInvoice ? 'Edit Invoice' : 'Tambah Invoice'}</h3>
                <p className="text-sm text-slate-500">Pembayaran ditampilkan dari total dan nilai yang sudah dibayar.</p>
              </div>
              <button type="button" className="rounded-lg border p-2" onClick={() => setIsFormOpen(false)}><X size={16} /></button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input className="input" required placeholder="Nomor invoice" value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} />
              <input className="input" required placeholder="Judul invoice" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              <select className="input" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                {(options.statuses.length ? options.statuses : ['DRAFT']).map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
              </select>
              <input className="input" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
              <select className="input" value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })}>
                <option value="">Pilih pelanggan</option>
                {options.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
              </select>
              <select className="input" value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}>
                <option value="">Pilih proyek</option>
                {options.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between">
                <p className="font-bold text-navy">Item Invoice</p>
                <button type="button" className="rounded-xl border px-4 py-2 text-sm font-semibold text-navy" onClick={addItem}>+ Item</button>
              </div>
              <div className="mt-3 grid gap-3">
                {form.items.map((item, index) => (
                  <div key={index} className="grid gap-3 rounded-xl border p-3 md:grid-cols-[1fr_90px_100px_140px_120px_auto]">
                    <input className="input" required placeholder="Deskripsi item" value={item.description} onChange={(event) => updateItem(index, { description: event.target.value })} />
                    <input className="input" required placeholder="Satuan" value={item.unit} onChange={(event) => updateItem(index, { unit: event.target.value })} />
                    <NumberInput className="input" required value={item.qty} onChange={(val) => updateItem(index, { qty: Number(val || 0) })} allowDecimal />
                    <RupiahInput className="input" required placeholder="Harga satuan" value={item.unitPrice} onChange={(val) => updateItem(index, { unitPrice: val })} />
                    <div className="grid content-center text-sm font-semibold text-navy">{formatCurrency(item.qty * parseRupiah(item.unitPrice))}</div>
                    <button type="button" className="rounded-lg border p-2 text-red-600 hover:bg-red-50" onClick={() => removeItem(index)} disabled={form.items.length === 1}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <RupiahInput className="input" placeholder="Pajak" value={form.tax} onChange={(val) => setForm({ ...form, tax: val })} />
              <RupiahInput className="input" placeholder="Sudah dibayar" value={form.paidAmount} onChange={(val) => setForm({ ...form, paidAmount: val })} />
            </div>

            <div className="mt-5 grid gap-2 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
              <div className="flex justify-between"><span>Pajak</span><strong>{formatCurrency(form.tax)}</strong></div>
              <div className="flex justify-between border-t pt-2 text-base text-navy"><span>Total</span><strong>{formatCurrency(total)}</strong></div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="rounded-xl border px-5 py-3 font-semibold text-slate-600" onClick={() => setIsFormOpen(false)}>Batal</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Invoice'}</button>
            </div>
          </form>
        </div>
      )}

      {selectedInvoice && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/45 p-4">
          <div className="card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gold">{selectedInvoice.number}</p>
                <h3 className="text-2xl font-black text-navy">{selectedInvoice.title}</h3>
              </div>
              <button className="rounded-lg border p-2" onClick={() => setSelectedInvoice(null)}><X size={16} /></button>
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              <p><span className="text-slate-500">Pelanggan:</span> {selectedInvoice.customer?.name || '-'}</p>
              <p><span className="text-slate-500">Proyek:</span> {selectedInvoice.project?.name || '-'}</p>
              <p><span className="text-slate-500">Status:</span> {statusLabel(selectedInvoice.status)}</p>
              <p><span className="text-slate-500">Payment status:</span> {paymentStatus(selectedInvoice)}</p>
              <p><span className="text-slate-500">Jatuh tempo:</span> {formatDate(selectedInvoice.dueDate)}</p>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr><th className="p-3">Item</th><th>Satuan</th><th>Qty</th><th>Harga</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item, index) => (
                    <tr key={index} className="border-t border-slate-100">
                      <td className="p-3">{item.description}</td>
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
              <div className="flex justify-between"><span>Subtotal</span><strong>{formatCurrency(selectedInvoice.subtotal)}</strong></div>
              <div className="flex justify-between"><span>Pajak</span><strong>{formatCurrency(selectedInvoice.tax)}</strong></div>
              <div className="flex justify-between"><span>Sudah dibayar</span><strong>{formatCurrency(selectedInvoice.paidAmount)}</strong></div>
              <div className="flex justify-between border-t pt-2 text-base text-navy"><span>Total</span><strong>{formatCurrency(selectedInvoice.total)}</strong></div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
