import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { sanitizeText, validationError } from '../utils/http.js';
import { getCompanyWhere, withCompanyId } from '../utils/company.js';

const router = Router();
const financeRoles = ['SUPER_ADMIN', 'DIREKTUR', 'KEUANGAN'];
const writeRoles = ['SUPER_ADMIN', 'KEUANGAN'];
const transactionTypes = ['INCOME', 'EXPENSE'];
const schema = z.object({
  type: z.enum(transactionTypes),
  date: z.string().date().optional().nullable(),
  category: z.string().trim().min(1).max(100).transform(sanitizeText),
  description: z.string().trim().max(500).transform(sanitizeText).optional().nullable(),
  amount: z.number().positive(),
  projectId: z.string().optional().nullable()
});

function buildWhere(query, companyWhere = {}) {
  const from = query.from?.toString();
  const to = query.to?.toString();
  const category = query.category?.toString();
  const type = query.type?.toString();
  return {
    ...companyWhere,
    ...(type ? { type } : {}),
    ...(category ? { category } : {}),
    ...(from || to ? {
      date: {
        ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}),
        ...(to ? { lte: new Date(`${to}T23:59:59`) } : {})
      }
    } : {})
  };
}

function serializePayload(value) {
  return {
    ...value,
    date: value.date ? new Date(value.date) : new Date()
  };
}

router.get('/options', requireAuth, allowRoles(...financeRoles), async (req, res) => {
  const companyWhere = getCompanyWhere(req);
  const [projects, categoryRows] = await Promise.all([
    prisma.project.findMany({ where: companyWhere, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.transaction.findMany({ where: companyWhere, distinct: ['category'], select: { category: true }, orderBy: { category: 'asc' } })
  ]);
  res.json({ projects, categories: categoryRows.map((row) => row.category), types: transactionTypes });
});

router.get('/', requireAuth, allowRoles(...financeRoles), async (req, res) => {
  const data = await prisma.transaction.findMany({
    where: buildWhere(req.query, getCompanyWhere(req)),
    include: { project: true },
    orderBy: { date: 'desc' }
  });
  res.json(data);
});

router.get('/summary', requireAuth, allowRoles(...financeRoles), async (req, res) => {
  const rows = await prisma.transaction.findMany({ where: buildWhere(req.query, getCompanyWhere(req)) });
  const income = rows.filter((row) => row.type === 'INCOME').reduce((sum, row) => sum + Number(row.amount), 0);
  const expense = rows.filter((row) => row.type === 'EXPENSE').reduce((sum, row) => sum + Number(row.amount), 0);
  res.json({ income, expense, balance: income - expense });
});

router.get('/chart', requireAuth, allowRoles(...financeRoles), async (req, res) => {
  const year = Number(req.query.year || new Date().getFullYear());
  const rows = await prisma.transaction.findMany({
    where: {
      ...getCompanyWhere(req),
      date: {
        gte: new Date(`${year}-01-01T00:00:00`),
        lte: new Date(`${year}-12-31T23:59:59`)
      }
    }
  });
  const data = Array.from({ length: 12 }, (_, month) => ({ month: month + 1, income: 0, expense: 0 }));
  rows.forEach((row) => {
    const bucket = data[new Date(row.date).getMonth()];
    if (row.type === 'INCOME') bucket.income += Number(row.amount);
    if (row.type === 'EXPENSE') bucket.expense += Number(row.amount);
  });
  res.json(data);
});

router.post('/', requireAuth, allowRoles(...writeRoles), async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  res.status(201).json(await prisma.transaction.create({ data: withCompanyId(req, serializePayload(parsed.data)), include: { project: true } }));
});

router.put('/:id', requireAuth, allowRoles(...writeRoles), async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  const existing = await prisma.transaction.findFirst({ where: { id: req.params.id, ...getCompanyWhere(req) } });
  if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Transaksi tidak ditemukan' });
  res.json(await prisma.transaction.update({
    where: { id: req.params.id },
    data: withCompanyId(req, serializePayload(parsed.data)),
    include: { project: true }
  }));
});

router.delete('/:id', requireAuth, allowRoles('SUPER_ADMIN'), async (req, res) => {
  const existing = await prisma.transaction.findFirst({ where: { id: req.params.id, ...getCompanyWhere(req) } });
  if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Transaksi tidak ditemukan' });
  await prisma.transaction.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export const financeRoutes = router;
