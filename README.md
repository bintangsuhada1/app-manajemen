# PT Jurti Agung Mulia - Company Management Website

Fondasi website siap dikembangkan untuk PT Jurti Agung Mulia: landing page company profile + dashboard internal kontraktor kelistrikan.

## Stack
- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, Prisma ORM
- Database: MySQL
- Auth: JWT + bcrypt
- RBAC: Super Admin, Direktur, Project Manager, Admin, Keuangan, Teknisi, Marketing
- PDF/Excel: endpoint placeholder siap disambungkan ke PDFKit / ExcelJS

## Struktur
```
apps/web      Landing page + dashboard UI
apps/api      REST API, auth, RBAC, Prisma schema
apps/api/prisma/schema.prisma  Struktur database MySQL
```

## Menjalankan
1. Install dependency:
```bash
npm install
```
2. Copy env:
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```
Di PowerShell Windows:
```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
```
3. Isi `DATABASE_URL`, `JWT_SECRET`, `SEED_DEFAULT_PASSWORD`, dan `NEXT_PUBLIC_API_URL`.
4. Migrasi database:
```bash
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```
5. Jalankan:
```bash
npm run dev
```

## Script Pengembangan
- `npm run dev` menjalankan API dan web sekaligus.
- `npm run dev:api` menjalankan Express API di port `4000`.
- `npm run dev:web` menjalankan Next.js di port `3000`.
- `npm run check` memvalidasi API/Prisma dan TypeScript frontend.
- `npm run build` membuat production build frontend.

Jika build frontend gagal karena pesan memori/pagefile Windows, tutup aplikasi berat atau naikkan Virtual Memory Windows. Script build sudah diberi batas heap Node yang lebih longgar.

## Seed user
Seed membuat akun role awal. Password awal diambil dari `SEED_DEFAULT_PASSWORD` pada env, bukan dari nilai hardcoded.

## Production
- Set `NODE_ENV=production`.
- Isi `CORS_ORIGINS` dengan domain frontend produksi yang sah.
- Isi `NEXT_PUBLIC_API_URL` dengan origin API produksi.
- Gunakan `JWT_SECRET` acak yang panjang dan simpan hanya di secret manager/env server.
- Aktifkan `TRUST_PROXY=true` hanya bila aplikasi berada di belakang reverse proxy tepercaya.

## Modul Prioritas V1
- Landing page profil perusahaan
- Login multi-user
- Dashboard ringkasan
- Proyek
- Pelanggan/CRM
- Penawaran
- Invoice
- Keuangan sederhana
- Laporan harian teknisi
- Upload dokumen
- Material sederhana
