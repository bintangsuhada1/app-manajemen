'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiUrl } from '@/lib/api';

type ChartRow = { month: number; income: number; expense: number };
const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function FinanceChart() {
  const router = useRouter();
  const [year, setYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState<ChartRow[]>([]);
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const authHeaders = useMemo(() => token ? { Authorization: `Bearer ${token}` } : undefined, [token]);

  useEffect(() => {
    async function loadChart() {
      if (!token) return;
      const response = await fetch(`${apiUrl}/api/finance/chart?year=${year}`, { headers: authHeaders });
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
      if (!response.ok) return;
      setRows(await response.json());
    }
    void loadChart();
  }, [authHeaders, router, token, year]);

  const data = rows.map((row) => ({ month: monthLabels[row.month - 1], in: row.income, out: row.expense }));

  return <section id="analitik" className="card p-5 lg:col-span-2"><div className="flex items-center justify-between"><h2 className="text-xl font-black text-navy">Grafik Keuangan</h2><select className="input max-w-40" value={year} onChange={(event) => setYear(Number(event.target.value))}>{[year - 1, year, year + 1].map((value) => <option key={value}>{value}</option>)}</select></div><div className="mt-5 h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month"/><YAxis/><Tooltip/><Bar dataKey="in" name="Pemasukan"/><Bar dataKey="out" name="Pengeluaran"/></BarChart></ResponsiveContainer></div></section>;
}
