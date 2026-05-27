import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
if (!process.env.SEED_DEFAULT_PASSWORD) throw new Error('SEED_DEFAULT_PASSWORD wajib diisi sebelum seed');
const passwordHash = await bcrypt.hash(process.env.SEED_DEFAULT_PASSWORD, 12);
const users = [
  ['Super Admin','superadmin@ptjurti.com','SUPER_ADMIN'], ['Direktur','direktur@ptjurti.com','DIREKTUR'], ['Project Manager','pm@ptjurti.com','PROJECT_MANAGER'],
  ['Admin','admin@ptjurti.com','ADMIN'], ['Keuangan','keuangan@ptjurti.com','KEUANGAN'], ['Teknisi','teknisi@ptjurti.com','TEKNISI'], ['Marketing','marketing@ptjurti.com','MARKETING']
];
for (const [name,email,role] of users) await prisma.user.upsert({ where:{email}, update:{}, create:{name,email,role,passwordHash} });
const customer = await prisma.customer.upsert({ where:{id:'seed-customer-1'}, update:{}, create:{id:'seed-customer-1',name:'Owner Gedung Batam',picName:'Bapak Owner',phone:'628xxxxxxxxxx',segment:'Gedung',status:'PROSPECT'} });
await prisma.project.upsert({ where:{code:'PRJ-2026-001'}, update:{}, create:{code:'PRJ-2026-001',name:'Instalasi Listrik Gedung 3 Lantai',location:'Batam',status:'BERJALAN',progress:62,budget:185000000,customerId:customer.id} });
await prisma.companySetting.create({ data:{ companyName:'PT Jurti Agung Mulia', address:'Tanjungpinang, Kepulauan Riau', email:'admin@ptjurtiagungmulia.com', website:'ptjurtiagungmulia.com' } }).catch(()=>{});
console.log('Seed selesai.');
await prisma.$disconnect();
