import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { apiError, sanitizeText, validationError } from '../utils/http.js';

const router = Router();
const companyRoles = ['SUPER_ADMIN', 'DIREKTUR'];

const companySchema = z.object({
  id: z.string().trim().min(2).max(80).transform((value) => sanitizeText(value).toLowerCase()),
  name: z.string().trim().min(2).max(160).transform(sanitizeText),
  code: z.string().trim().max(80).transform(sanitizeText).optional().nullable(),
  type: z.string().trim().max(120).transform(sanitizeText).optional().nullable(),
  address: z.string().trim().max(1000).transform(sanitizeText).optional().nullable(),
  phone: z.string().trim().max(40).transform(sanitizeText).optional().nullable(),
  email: z.string().trim().email().max(160).transform((value) => value.toLowerCase()).optional().nullable(),
  website: z.string().trim().max(160).transform(sanitizeText).optional().nullable(),
  notes: z.string().trim().max(1000).transform(sanitizeText).optional().nullable()
});

function toPayload(value) {
  return {
    id: value.id,
    name: value.name,
    code: value.code || value.id.toUpperCase(),
    type: value.type || null,
    address: value.address || null,
    phone: value.phone || null,
    email: value.email || null,
    website: value.website || null,
    notes: value.notes || null
  };
}

router.get('/', requireAuth, allowRoles(...companyRoles), async (_, res) => {
  const companies = await prisma.company.findMany({ orderBy: { name: 'asc' } });
  res.json(companies);
});

router.post('/', requireAuth, allowRoles(...companyRoles), async (req, res) => {
  const parsed = companySchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const payload = toPayload(parsed.data);
  const existing = await prisma.company.findFirst({
    where: { OR: [{ id: payload.id }, { code: payload.code }] }
  });
  if (existing) return apiError(res, 409, 'COMPANY_EXISTS', 'Kode perusahaan sudah dipakai');

  const company = await prisma.company.create({ data: payload });
  res.status(201).json(company);
});

router.put('/:id', requireAuth, allowRoles(...companyRoles), async (req, res) => {
  const parsed = companySchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) return validationError(res, parsed.error);

  const payload = toPayload(parsed.data);
  const existing = await prisma.company.findUnique({ where: { id: req.params.id } });
  if (!existing) return apiError(res, 404, 'NOT_FOUND', 'Perusahaan tidak ditemukan');

  const duplicateCode = await prisma.company.findFirst({
    where: { code: payload.code, id: { not: req.params.id } }
  });
  if (duplicateCode) return apiError(res, 409, 'COMPANY_EXISTS', 'Kode perusahaan sudah dipakai');

  const company = await prisma.company.update({
    where: { id: req.params.id },
    data: {
      name: payload.name,
      code: payload.code,
      type: payload.type,
      address: payload.address,
      phone: payload.phone,
      email: payload.email,
      website: payload.website,
      notes: payload.notes
    }
  });
  res.json(company);
});

router.delete('/:id', requireAuth, allowRoles(...companyRoles), async (req, res) => {
  const company = await prisma.company.findUnique({
    where: { id: req.params.id },
    include: {
      _count: {
        select: {
          customers: true,
          projects: true,
          quotes: true,
          invoices: true,
          materials: true,
          materialMovements: true,
          suppliers: true,
          transactions: true,
          dailyReports: true,
          documents: true
        }
      }
    }
  });
  if (!company) return apiError(res, 404, 'NOT_FOUND', 'Perusahaan tidak ditemukan');
  if (Object.values(company._count).some((count) => count > 0)) {
    return apiError(res, 409, 'COMPANY_IN_USE', 'Perusahaan masih memiliki data dan tidak bisa dihapus');
  }

  await prisma.company.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export const companyRoutes = router;
