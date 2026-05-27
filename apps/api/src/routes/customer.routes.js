import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { sanitizeText, validationError } from '../utils/http.js';

const router = Router();
const readRoles = ['SUPER_ADMIN', 'DIREKTUR', 'ADMIN', 'MARKETING'];
const writeRoles = ['SUPER_ADMIN', 'ADMIN', 'MARKETING'];
const schema = z.object({
  name: z.string().trim().min(2).max(120).transform(sanitizeText),
  picName: z.string().trim().max(120).transform(sanitizeText).optional().nullable(),
  phone: z.string().trim().max(30).transform(sanitizeText).optional().nullable(),
  email: z.string().trim().email().max(120).transform((value) => value.toLowerCase()).optional().nullable(),
  address: z.string().trim().max(500).transform(sanitizeText).optional().nullable(),
  segment: z.string().trim().max(80).transform(sanitizeText).optional().nullable(),
  status: z.enum(['PROSPECT', 'ACTIVE', 'INACTIVE']).default('PROSPECT'),
  notes: z.string().trim().max(1000).transform(sanitizeText).optional().nullable()
});

router.get('/', requireAuth, allowRoles(...readRoles), async (req, res) => {
  const q = req.query.q?.toString() || '';
  const data = await prisma.customer.findMany({
    where: q ? {
      OR: [
        { name: { contains: q } },
        { picName: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } }
      ]
    } : {},
    orderBy: { createdAt: 'desc' }
  });
  res.json(data);
});

router.post('/', requireAuth, allowRoles(...writeRoles), async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  const data = await prisma.customer.create({ data: parsed.data });
  res.status(201).json(data);
});

router.put('/:id', requireAuth, allowRoles(...writeRoles), async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  const data = await prisma.customer.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(data);
});

router.delete('/:id', requireAuth, allowRoles('SUPER_ADMIN'), async (req, res) => {
  await prisma.customer.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export const customerRoutes = router;
