import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-soft px-4">
      <section className="card w-full max-w-lg p-8 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-gold">403</p>
        <h1 className="mt-3 text-2xl font-black text-navy">Akses Tidak Diizinkan</h1>
        <p className="mt-3 text-sm text-slate-500">Role Anda tidak memiliki akses ke modul ini.</p>
        <Link href="/dashboard" className="btn-primary mt-6 inline-block">Kembali ke Dashboard</Link>
      </section>
    </main>
  );
}
