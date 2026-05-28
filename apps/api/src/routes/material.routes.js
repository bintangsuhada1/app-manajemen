import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { apiError, sanitizeText, validationError } from '../utils/http.js';
import { getCompanyWhere, withCompanyId } from '../utils/company.js';

const router = Router();
const readRoles = ['SUPER_ADMIN', 'DIREKTUR', 'PROJECT_MANAGER'];
const writeRoles = ['SUPER_ADMIN', 'PROJECT_MANAGER'];
const movementRoles = ['SUPER_ADMIN', 'PROJECT_MANAGER'];
const materialSchema = z.object({
  sku: z.string().trim().max(60).transform(sanitizeText).optional().nullable(),
  name: z.string().trim().min(2).max(160).transform(sanitizeText),
  category: z.string().trim().max(100).transform(sanitizeText).optional().nullable(),
  unit: z.string().trim().min(1).max(20).transform(sanitizeText).default('pcs'),
  stock: z.number().nonnegative().default(0),
  minStock: z.number().nonnegative().default(0),
  averagePrice: z.number().nonnegative().default(0)
});
const movementSchema = z.object({
  materialId: z.string().min(1),
  projectId: z.string().optional().nullable(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  qty: z.number().positive(),
  note: z.string().trim().max(500).transform(sanitizeText).optional().nullable()
});

router.get('/options', requireAuth, allowRoles(...readRoles), async (req, res) => {
  const companyWhere = getCompanyWhere(req);
  const [projects, categories] = await Promise.all([
    prisma.project.findMany({ where: companyWhere, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.material.findMany({ where: companyWhere, distinct: ['category'], select: { category: true }, orderBy: { category: 'asc' } })
  ]);
  res.json({
    projects,
    categories: categories.map((row) => row.category).filter(Boolean)
  });
});

router.get('/', requireAuth, allowRoles(...readRoles), async (req, res) => {
  const q = req.query.q?.toString() || '';
  const category = req.query.category?.toString();
  const companyWhere = getCompanyWhere(req);
  const data = await prisma.material.findMany({
    where: {
      AND: [
        companyWhere,
        q ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }] } : {},
        category ? { category } : {}
      ]
    },
    include: { movements: { include: { project: true }, orderBy: { createdAt: 'desc' } } },
    orderBy: { name: 'asc' }
  });
  res.json(data);
});

router.post('/', requireAuth, allowRoles(...writeRoles), async (req, res) => {
  const parsed = materialSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  res.status(201).json(await prisma.material.create({ data: withCompanyId(req, parsed.data) }));
});

router.put('/:id', requireAuth, allowRoles(...writeRoles), async (req, res) => {
  const parsed = materialSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  const existing = await prisma.material.findFirst({ where: { id: req.params.id, ...getCompanyWhere(req) } });
  if (!existing) return apiError(res, 404, 'NOT_FOUND', 'Material tidak ditemukan');
  res.json(await prisma.material.update({ where: { id: req.params.id }, data: parsed.data }));
});

router.delete('/:id', requireAuth, allowRoles('SUPER_ADMIN'), async (req, res) => {
  const existing = await prisma.material.findFirst({ where: { id: req.params.id, ...getCompanyWhere(req) } });
  if (!existing) return apiError(res, 404, 'NOT_FOUND', 'Material tidak ditemukan');
  await prisma.material.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.post('/movement', requireAuth, allowRoles(...movementRoles), async (req, res) => {
  const parsed = movementSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  const payload = parsed.data;
  const result = await prisma.$transaction(async (tx) => {
    const material = await tx.material.findFirst({ where: { id: payload.materialId, ...getCompanyWhere(req) } });
    if (!material) throw new Error('MATERIAL_NOT_FOUND');

    const currentStock = Number(material.stock);
    const delta = payload.type === 'IN'
      ? payload.qty
      : payload.type === 'OUT'
        ? -payload.qty
        : payload.qty;
    const nextStock = currentStock + delta;
    if (nextStock < 0) throw new Error('INSUFFICIENT_STOCK');

    const movement = await tx.materialMovement.create({ data: withCompanyId(req, payload), include: { project: true } });
    const updatedMaterial = await tx.material.update({
      where: { id: payload.materialId },
      data: { stock: nextStock }
    });
    return { movement, material: updatedMaterial };
  }).catch((error) => {
    if (error.message === 'MATERIAL_NOT_FOUND') return null;
    if (error.message === 'INSUFFICIENT_STOCK') return 'INSUFFICIENT_STOCK';
    throw error;
  });

  if (result === null) return apiError(res, 404, 'NOT_FOUND', 'Material tidak ditemukan');
  if (result === 'INSUFFICIENT_STOCK') return apiError(res, 422, 'INSUFFICIENT_STOCK', 'Stok tidak mencukupi');
  res.status(201).json(result);
});

export const materialRoutes = router;
