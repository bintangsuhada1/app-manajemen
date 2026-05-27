import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { apiError, sanitizeText, validationError } from '../utils/http.js';

const router = Router();
const readRoles = ['SUPER_ADMIN', 'DIREKTUR', 'PROJECT_MANAGER', 'TEKNISI'];
const writeRoles = ['SUPER_ADMIN', 'PROJECT_MANAGER', 'TEKNISI'];
const schema = z.object({
  date: z.string().date().optional().nullable(),
  projectId: z.string().min(1),
  technicianId: z.string().min(1),
  workDescription: z.string().trim().min(1).max(2000).transform(sanitizeText),
  obstacle: z.string().trim().max(1000).transform(sanitizeText).optional().nullable(),
  progressNote: z.string().trim().max(1000).transform(sanitizeText).optional().nullable(),
  checklistJson: z.unknown().optional().nullable(),
  status: z.string().trim().max(40).transform(sanitizeText).optional().default('SUBMITTED')
});
const reportInclude = { project: true, technician: true, photos: true };

function buildWhere(query) {
  const projectId = query.projectId?.toString();
  const technicianId = query.technicianId?.toString();
  const from = query.from?.toString();
  const to = query.to?.toString();
  return {
    ...(projectId ? { projectId } : {}),
    ...(technicianId ? { technicianId } : {}),
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

router.get('/options', requireAuth, allowRoles(...readRoles), async (_, res) => {
  const [projects, technicians] = await Promise.all([
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' }
    })
  ]);
  res.json({ projects, technicians });
});

router.get('/', requireAuth, allowRoles(...readRoles), async (req, res) => {
  res.json(await prisma.dailyReport.findMany({
    where: buildWhere(req.query),
    include: reportInclude,
    orderBy: { date: 'desc' }
  }));
});

router.get('/:id', requireAuth, allowRoles(...readRoles), async (req, res) => {
  const report = await prisma.dailyReport.findUnique({ where: { id: req.params.id }, include: reportInclude });
  if (!report) return apiError(res, 404, 'NOT_FOUND', 'Laporan tidak ditemukan');
  res.json(report);
});

router.post('/', requireAuth, allowRoles(...writeRoles), async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  res.status(201).json(await prisma.dailyReport.create({
    data: serializePayload(parsed.data),
    include: reportInclude
  }));
});

router.put('/:id', requireAuth, allowRoles(...writeRoles), async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  res.json(await prisma.dailyReport.update({
    where: { id: req.params.id },
    data: serializePayload(parsed.data),
    include: reportInclude
  }));
});

router.delete('/:id', requireAuth, allowRoles('SUPER_ADMIN', 'PROJECT_MANAGER'), async (req, res) => {
  await prisma.dailyReport.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export const reportRoutes = router;
