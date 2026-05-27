'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || 'Login gagal. Periksa email dan password Anda.');
      window.localStorage.setItem('token', payload.token);
      window.localStorage.setItem('user', JSON.stringify(payload.user));
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-navy via-navy2 to-slate-900 px-4">
      <form className="w-full max-w-md rounded-3xl bg-white p-8 shadow-premium" onSubmit={handleSubmit}>
        <Link href="/" className="text-sm font-bold text-gold">← Kembali ke Beranda</Link>
        <h1 className="mt-5 text-3xl font-black text-navy">Login Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">Masuk sesuai role: Super Admin, Direktur, PM, Admin, Keuangan, Teknisi, atau Marketing.</p>
        <div className="mt-7 space-y-4">
          <input className="input" type="email" placeholder="Email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <input className="input" type="password" placeholder="Password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button className="btn-primary mt-6 block w-full text-center" disabled={loading}>{loading ? 'Masuk...' : 'Masuk'}</button>
      </form>
    </main>
  );
}
