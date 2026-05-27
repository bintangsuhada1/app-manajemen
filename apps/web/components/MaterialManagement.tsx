'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';
import NumberInput from '@/components/NumberInput';

type ProjectOption = { id: string; name: string };
type Movement = {
  id: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  qty: string | number;
  note: string | null;
  createdAt: string;
  project: ProjectOption | null;
};
type Material = {
  id: string;
  sku: string | null;
  name: string;
  category: string | null;
  unit: string;
  stock: string | number;
  minStock: string | number;
  averagePrice: string | number;
  movements: Movement[];
};
type Options = { projects: ProjectOption[]; categories: string[] };
type MaterialForm = {
  sku: string;
  name: string;
  category: string;
  unit: string;
  stock: string;
  minStock: string;
  averagePrice: string;
};
type MovementForm = {
  materialId: string;
  projectId: string;
  type: 'IN' | 'OUT';
  qty: string;
  note: string;
};

const emptyMaterialForm: MaterialForm = { sku: '', name: '', category: '', unit: 'pcs', stock: '0', minStock: '0', averagePrice: '0' };
const emptyMovementForm: MovementForm = { materialId: '', projectId: '', type: 'IN', qty: '', note: '' };

function formatNumber(value: string | number) {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(Number(value || 0));
}

export function MaterialManagement() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [options, setOptions] = useState<Options>({ projects: [], categories: [] });
  const [filters, setFilters] = useState({ query: '', category: '' });
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [materialForm, setMaterialForm] = useState<MaterialForm>(emptyMaterialForm);
  const [movementForm, setMovementForm] = useState<MovementForm>(emptyMovementForm);
  const [isMaterialFormOpen, setIsMaterialFormOpen] = useState(false);
  const [isMovementFormOpen, setIsMovementFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  function filterQuery() {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.category) params.set('category', filters.category);
    return params.toString() ? `?${params}` : '';
  }

  async function loadMaterials() {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setMaterials(await request<Material[]>(`/materials${filterQuery()}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat material');
    } finally {
      setLoading(false);
    }
  }

  async function loadOptions() {
    if (!token) return;
    try {
      setOptions(await request<Options>('/materials/options'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat opsi material');
    }
  }

  useEffect(() => {
    void loadMaterials();
    void loadOptions();
  }, []);

  function openCreateMaterial() {
    setEditingMaterial(null);
    setMaterialForm(emptyMaterialForm);
    setIsMaterialFormOpen(true);
  }

  function openEditMaterial(material: Material) {
    setEditingMaterial(material);
    setMaterialForm({
      sku: material.sku || '',
      name: material.name,
      category: material.category || '',
      unit: material.unit,
      stock: material.stock.toString(),
      minStock: material.minStock.toString(),
      averagePrice: material.averagePrice.toString()
    });
    setIsMaterialFormOpen(true);
  }

  function openMovement(material: Material, type: 'IN' | 'OUT') {
    setMovementForm({ ...emptyMovementForm, materialId: material.id, type });
    setIsMovementFormOpen(true);
  }

  async function submitMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...materialForm,
      sku: materialForm.sku || null,
      category: materialForm.category || null,
      stock: Number(materialForm.stock || 0),
      minStock: Number(materialForm.minStock || 0),
      averagePrice: Number(materialForm.averagePrice || 0)
    };
    try {
      await request<Material>(editingMaterial ? `/materials/${editingMaterial.id}` : '/materials', {
        method: editingMaterial ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      setIsMaterialFormOpen(false);
      await loadMaterials();
      await loadOptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan material');
    } finally {
      setSaving(false);
    }
  }

  async function submitMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...movementForm,
      projectId: movementForm.projectId || null,
      qty: Number(movementForm.qty),
      note: movementForm.note || null
    };
    try {
      await request('/materials/movement', { method: 'POST', body: JSON.stringify(payload) });
      setIsMovementFormOpen(false);
      await loadMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan mutasi');
    } finally {
      setSaving(false);
    }
  }

  async function deleteMaterial(material: Material) {
    if (!window.confirm(`Hapus material "${material.name}"?`)) return;
    try {
      setError('');
      await request<{ ok: true }>(`/materials/${material.id}`, { method: 'DELETE' });
      await loadMaterials();
      await loadOptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus material');
    }
  }

  return (
    <section id="material" className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-navy">Material</h2>
          <p className="mt-1 text-sm text-slate-500">Stok dan mutasi inventaris.</p>
        </div>
        <button className="btn-primary inline-flex items-center gap-2" onClick={openCreateMaterial} disabled={!token}>
          <Plus size={16} /> Material Baru
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
        <input className="input" placeholder="Cari nama atau SKU" value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} />
        <select className="input" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
          <option value="">Semua kategori</option>
          {options.categories.map((category) => <option key={category}>{category}</option>)}
        </select>
        <button className="btn-dark" onClick={() => void loadMaterials()} disabled={!token}>Cari</button>
      </div>

      {!token && <p className="mt-4 text-sm text-orange-700">Login dulu agar data material dapat dimuat.</p>}
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-4 grid gap-3">
        {loading && <div className="rounded-xl border p-4 text-sm text-slate-500">Memuat material...</div>}
        {!loading && materials.length === 0 && <div className="rounded-xl border p-4 text-sm text-slate-500">Belum ada material.</div>}
        {materials.map((material) => {
          const lowStock = Number(material.stock) <= Number(material.minStock);
          return (
            <div key={material.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-navy">{material.name}</p>
                  <p className="text-sm text-slate-500">{material.sku || 'Tanpa SKU'}{material.category ? ` | ${material.category}` : ''}</p>
                  <p className="mt-1 text-sm font-semibold text-gold">Stok {formatNumber(material.stock)} {material.unit}</p>
                  {lowStock && <p className="mt-1 text-xs font-semibold text-red-600">Low stock | minimum {formatNumber(material.minStock)}</p>}
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg border p-2 text-emerald-700 hover:bg-emerald-50" title="Barang masuk" onClick={() => openMovement(material, 'IN')}><ArrowDownToLine size={16} /></button>
                  <button className="rounded-lg border p-2 text-orange-700 hover:bg-orange-50" title="Barang keluar" onClick={() => openMovement(material, 'OUT')}><ArrowUpFromLine size={16} /></button>
                  <button className="rounded-lg border p-2 text-slate-600 hover:bg-slate-50" title="Edit material" onClick={() => openEditMaterial(material)}><Pencil size={16} /></button>
                  <button className="rounded-lg border p-2 text-red-600 hover:bg-red-50" title="Hapus material" onClick={() => void deleteMaterial(material)}><Trash2 size={16} /></button>
                </div>
              </div>
              {material.movements[0] && <p className="mt-3 text-xs text-slate-500">Mutasi terakhir: {material.movements[0].type} {formatNumber(material.movements[0].qty)}{material.movements[0].project ? ` | ${material.movements[0].project.name}` : ''}</p>}
            </div>
          );
        })}
      </div>

      {isMaterialFormOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <form className="card w-full max-w-2xl p-6" onSubmit={submitMaterial}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-navy">{editingMaterial ? 'Edit Material' : 'Tambah Material'}</h3>
                <p className="text-sm text-slate-500">Stok awal diisi saat material dibuat.</p>
              </div>
              <button type="button" className="rounded-lg border p-2" onClick={() => setIsMaterialFormOpen(false)}><X size={16} /></button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input className="input" placeholder="SKU" value={materialForm.sku} onChange={(event) => setMaterialForm({ ...materialForm, sku: event.target.value })} />
              <input className="input" required placeholder="Nama material" value={materialForm.name} onChange={(event) => setMaterialForm({ ...materialForm, name: event.target.value })} />
              <input className="input" placeholder="Kategori" value={materialForm.category} onChange={(event) => setMaterialForm({ ...materialForm, category: event.target.value })} />
              <input className="input" required placeholder="Satuan" value={materialForm.unit} onChange={(event) => setMaterialForm({ ...materialForm, unit: event.target.value })} />
              <NumberInput className="input" placeholder="Stok awal" value={materialForm.stock} onChange={(val) => setMaterialForm({ ...materialForm, stock: val })} allowDecimal />
              <NumberInput className="input" placeholder="Minimum stok" value={materialForm.minStock} onChange={(val) => setMaterialForm({ ...materialForm, minStock: val })} allowDecimal />
              <NumberInput className="input md:col-span-2" placeholder="Harga rata-rata" value={materialForm.averagePrice} onChange={(val) => setMaterialForm({ ...materialForm, averagePrice: val })} allowDecimal />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="rounded-xl border px-5 py-3 font-semibold text-slate-600" onClick={() => setIsMaterialFormOpen(false)}>Batal</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Material'}</button>
            </div>
          </form>
        </div>
      )}

      {isMovementFormOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <form className="card w-full max-w-xl p-6" onSubmit={submitMovement}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-navy">{movementForm.type === 'IN' ? 'Barang Masuk' : 'Barang Keluar'}</h3>
                <p className="text-sm text-slate-500">Mutasi otomatis memperbarui stok.</p>
              </div>
              <button type="button" className="rounded-lg border p-2" onClick={() => setIsMovementFormOpen(false)}><X size={16} /></button>
            </div>
            <div className="mt-5 grid gap-4">
              <select className="input" value={movementForm.projectId} onChange={(event) => setMovementForm({ ...movementForm, projectId: event.target.value })}>
                <option value="">Tanpa proyek</option>
                {options.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
              <NumberInput className="input" required placeholder="Jumlah" value={movementForm.qty} onChange={(val) => setMovementForm({ ...movementForm, qty: val })} allowDecimal />
              <textarea className="input" rows={3} placeholder="Catatan" value={movementForm.note} onChange={(event) => setMovementForm({ ...movementForm, note: event.target.value })} />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="rounded-xl border px-5 py-3 font-semibold text-slate-600" onClick={() => setIsMovementFormOpen(false)}>Batal</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Mutasi'}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
