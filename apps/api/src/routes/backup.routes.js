import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { apiError, validationError } from '../utils/http.js';

const router = Router();
const backupRoles = ['SUPER_ADMIN'];
const tableNames = [
  'users',
  'customers',
  'projects',
  'projectMembers',
  'quotes',
  'quoteItems',
  'invoices',
  'invoiceItems',
  'transactions',
  'dailyReports',
  'dailyReportPhotos',
  'suppliers',
  'materials',
  'materialMovements',
  'documents',
  'companySettings'
];
const importSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  data: z.object(Object.fromEntries(tableNames.map((name) => [name, z.array(z.record(z.unknown()))])))
});

async function readBackupData() {
  const [
    users,
    customers,
    projects,
    projectMembers,
    quotes,
    quoteItems,
    invoices,
    invoiceItems,
    transactions,
    dailyReports,
    dailyReportPhotos,
    suppliers,
    materials,
    materialMovements,
    documents,
    companySettings
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.customer.findMany(),
    prisma.project.findMany(),
    prisma.projectMember.findMany(),
    prisma.quote.findMany(),
    prisma.quoteItem.findMany(),
    prisma.invoice.findMany(),
    prisma.invoiceItem.findMany(),
    prisma.transaction.findMany(),
    prisma.dailyReport.findMany(),
    prisma.dailyReportPhoto.findMany(),
    prisma.supplier.findMany(),
    prisma.material.findMany(),
    prisma.materialMovement.findMany(),
    prisma.document.findMany(),
    prisma.companySetting.findMany()
  ]);
  return {
    users,
    customers,
    projects,
    projectMembers,
    quotes,
    quoteItems,
    invoices,
    invoiceItems,
    transactions,
    dailyReports,
    dailyReportPhotos,
    suppliers,
    materials,
    materialMovements,
    documents,
    companySettings
  };
}

router.get('/export', requireAuth, allowRoles(...backupRoles), async (_, res) => {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: await readBackupData()
  };
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="pt-jurti-backup-${stamp}.json"`);
  res.json(payload);
});

router.post('/import', requireAuth, allowRoles(...backupRoles), async (req, res) => {
  const parsed = importSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  const { data } = parsed.data;
  if (!data.users.length) return apiError(res, 422, 'INVALID_BACKUP', 'Backup harus memuat minimal satu user');

  await prisma.$transaction(async (tx) => {
    await tx.dailyReportPhoto.deleteMany();
    await tx.document.deleteMany();
    await tx.materialMovement.deleteMany();
    await tx.invoiceItem.deleteMany();
    await tx.quoteItem.deleteMany();
    await tx.projectMember.deleteMany();
    await tx.transaction.deleteMany();
    await tx.dailyReport.deleteMany();
    await tx.invoice.deleteMany();
    await tx.quote.deleteMany();
    await tx.material.deleteMany();
    await tx.project.deleteMany();
    await tx.supplier.deleteMany();
    await tx.customer.deleteMany();
    await tx.companySetting.deleteMany();
    await tx.user.deleteMany();

    if (data.users.length) await tx.user.createMany({ data: data.users });
    if (data.customers.length) await tx.customer.createMany({ data: data.customers });
    if (data.suppliers.length) await tx.supplier.createMany({ data: data.suppliers });
    if (data.projects.length) await tx.project.createMany({ data: data.projects });
    if (data.materials.length) await tx.material.createMany({ data: data.materials });
    if (data.quotes.length) await tx.quote.createMany({ data: data.quotes });
    if (data.invoices.length) await tx.invoice.createMany({ data: data.invoices });
    if (data.dailyReports.length) await tx.dailyReport.createMany({ data: data.dailyReports });
    if (data.transactions.length) await tx.transaction.createMany({ data: data.transactions });
    if (data.projectMembers.length) await tx.projectMember.createMany({ data: data.projectMembers });
    if (data.quoteItems.length) await tx.quoteItem.createMany({ data: data.quoteItems });
    if (data.invoiceItems.length) await tx.invoiceItem.createMany({ data: data.invoiceItems });
    if (data.materialMovements.length) await tx.materialMovement.createMany({ data: data.materialMovements });
    if (data.documents.length) await tx.document.createMany({ data: data.documents });
    if (data.dailyReportPhotos.length) await tx.dailyReportPhoto.createMany({ data: data.dailyReportPhotos });
    if (data.companySettings.length) await tx.companySetting.createMany({ data: data.companySettings });
  });

  const counts = Object.fromEntries(tableNames.map((name) => [name, data[name].length]));
  res.json({ ok: true, importedAt: new Date().toISOString(), counts });
});

export const backupRoutes = router;
