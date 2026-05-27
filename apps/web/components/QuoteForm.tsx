'use client';

import { FormEvent, useState } from 'react';
import { apiUrl } from '@/lib/api';

export function QuoteForm() {
  const [companyName, setCompanyName] = useState('');
  const [picName, setPicName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [service, setService] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSent(false);

    try {
      const response = await fetch(`${apiUrl}/api/quotes/public-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          companyName,
          picName,
          phone,
          email: email || null,
          service,
          description: description || null
        })
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || 'Gagal mengirimkan permintaan');
      }

      setSent(true);
      setCompanyName('');
      setPicName('');
      setPhone('');
      setEmail('');
      setService('');
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6" id="penawaran">
      <p className="text-sm font-bold uppercase tracking-widest text-gold">Request for Quotation</p>
      <h3 className="mt-2 text-2xl font-black text-navy">Form Permintaan Penawaran</h3>
      
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input 
          className="input" 
          required 
          placeholder="Nama perusahaan / pelanggan" 
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          disabled={loading}
        />
        <input 
          className="input" 
          required 
          placeholder="Nama PIC" 
          value={picName}
          onChange={(e) => setPicName(e.target.value)}
          disabled={loading}
        />
        <input 
          className="input" 
          required 
          placeholder="Nomor WhatsApp" 
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={loading}
        />
        <select 
          className="input" 
          required 
          value={service}
          onChange={(e) => setService(e.target.value)}
          disabled={loading}
        >
          <option value="">Pilih layanan</option>
          <option value="Instalasi listrik gedung">Instalasi listrik gedung</option>
          <option value="Panel MDP/SDP">Panel MDP/SDP</option>
          <option value="Genset & ATS/AMF">Genset & ATS/AMF</option>
          <option value="PLTS">PLTS</option>
          <option value="PJU">PJU</option>
          <option value="Grounding">Grounding</option>
          <option value="Maintenance kelistrikan">Maintenance kelistrikan</option>
        </select>
        <input 
          className="input md:col-span-2" 
          type="email" 
          placeholder="Alamat Email (opsional)" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <textarea 
          className="input md:col-span-2" 
          rows={4} 
          placeholder="Ceritakan kebutuhan proyek, lokasi, daya listrik, target waktu, dan kendala lapangan." 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
      </div>

      <button className="btn-primary mt-5 w-full" disabled={loading}>
        {loading ? 'Mengirim...' : 'Kirim Permintaan'}
      </button>

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {sent && (
        <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          Permintaan berhasil dikirim! Tim marketing kami akan segera menghubungi Anda melalui WhatsApp atau Email.
        </p>
      )}
    </form>
  );
}
