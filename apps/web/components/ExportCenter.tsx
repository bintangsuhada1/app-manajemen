'use client';

import { Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { downloadProtectedFile } from '@/lib/download';
import { canAccess, ModuleKey } from '@/lib/permissions';

export function ExportCenter({ role }: { role?: string }) {
  const router = useRouter();
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const logout = () => {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
    router.replace('/login');
  };
  const allExports: Array<[string, string, string, ModuleKey]> = [
    ['PDF Rekap Proyek', '/exports/projects/recap.pdf', 'rekap-proyek.pdf', 'projects'],
    ['PDF Laporan Harian', '/exports/reports/daily.pdf', 'laporan-harian.pdf', 'reports'],
    ['PDF Laporan Keuangan', '/exports/finance/report.pdf', 'laporan-keuangan.pdf', 'finance'],
    ['Excel Proyek', '/exports/projects.xlsx', 'proyek.xlsx', 'projects'],
    ['Excel Pelanggan', '/exports/customers.xlsx', 'pelanggan.xlsx', 'customers'],
    ['Excel Invoice', '/exports/invoices.xlsx', 'invoice.xlsx', 'invoices'],
    ['Excel Transaksi', '/exports/finance.xlsx', 'transaksi-keuangan.xlsx', 'finance']
  ];
  const exports = allExports.filter(([, , , module]) => canAccess(role, module));
  if (exports.length === 0) return null;
  return <section className="card mt-6 p-5"><h2 className="text-xl font-black text-navy">Export</h2><div className="mt-4 flex flex-wrap gap-2">{exports.map(([label, path, filename]) => <button key={label} className="rounded-xl border px-4 py-3 text-sm font-semibold text-navy" onClick={() => void downloadProtectedFile(path, filename, token, logout, () => router.replace('/forbidden'))} disabled={!token}><Download size={16} className="mr-1 inline" />{label}</button>)}</div></section>;
}
