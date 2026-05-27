import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { apiError, sanitizeText, validationError } from '../utils/http.js';

const router = Router();
const readRoles = ['SUPER_ADMIN', 'DIREKTUR', 'PROJECT_MANAGER'];
const writeRoles = ['SUPER_ADMIN', 'PROJECT_MANAGER'];
const projectStatusValues = ['SURVEY', 'PENAWARAN', 'BERJALAN', 'HOLD', 'SELESAI', 'BATAL'];
const projectInclude = {
  customer: true,
  members: {
    include: { user: { select: { id: true, name: true, email: true, role: true } } }
  },
  _count: {
    select: {
      members: true,
      quotes: true,
      invoices: true,
      dailyReports: true,
      documents: true,
      transactions: true,
      materialMovements: true,
    }
  }
};

const schema = z.object({
  code: z.string().trim().max(50).transform(sanitizeText).optional().nullable(),
  name: z.string().trim().min(3).max(160).transform(sanitizeText),
  location: z.string().trim().max(160).transform(sanitizeText).optional().nullable(),
  description: z.string().trim().max(1500).transform(sanitizeText).optional().nullable(),
  status: z.enum(projectStatusValues).default('SURVEY'),
  budget: z.number().nonnegative().optional().nullable(),
  contractValue: z.number().nonnegative().optional().nullable(),
  progress: z.number().int().min(0).max(100).default(0),
  startDate: z.string().date().optional().nullable(),
  endDate: z.string().date().optional().nullable(),
  customerId: z.string().optional().nullable(),
  picUserId: z.string().optional().nullable()
});

function toProjectPayload(value) {
  const { picUserId, startDate, endDate, ...project } = value;
  return {
    project: {
      ...project,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    },
    picUserId
  };
}

async function syncPic(projectId, picUserId, tx) {
  await tx.projectMember.deleteMany({ where: { projectId, position: 'PIC' } });
  if (picUserId) {
    await tx.projectMember.upsert({
      where: { projectId_userId: { projectId, userId: picUserId } },
      update: { position: 'PIC' },
      create: { projectId, userId: picUserId, position: 'PIC' }
    });
  }
}

router.get('/options', requireAuth, allowRoles(...readRoles), async (_, res) => {
  const [customers, users] = await Promise.all([
    prisma.customer.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' }
    })
  ]);
  res.json({ customers, users, statuses: projectStatusValues });
});

router.get('/', requireAuth, allowRoles(...readRoles), async (req, res) => {
  const q = req.query.q?.toString() || '';
  const status = req.query.status?.toString();
  const data = await prisma.project.findMany({
    where: {
      AND: [
        q ? { OR: [{ name: { contains: q } }, { code: { contains: q } }, { location: { contains: q } }] } : {},
        status ? { status } : {}
      ]
    },
    include: projectInclude,
    orderBy: { createdAt: 'desc' }
  });
  res.json(data);
});

router.get('/:id', requireAuth, allowRoles(...readRoles), async (req, res) => {
  const data = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      ...projectInclude,
      dailyReports: { orderBy: { date: 'desc' }, take: 5 },
      invoices: { orderBy: { createdAt: 'desc' } },
      quotes: { orderBy: { createdAt: 'desc' } }
    }
  });
  if (!data) return apiError(res, 404, 'NOT_FOUND', 'Proyek tidak ditemukan');
  res.json(data);
});

router.post('/', requireAuth, allowRoles(...writeRoles), async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const { project, picUserId } = toProjectPayload(parsed.data);
  const data = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({ data: project });
    await syncPic(created.id, picUserId, tx);
    return tx.project.findUnique({ where: { id: created.id }, include: projectInclude });
  });

  res.status(201).json(data);
});

router.put('/:id', requireAuth, allowRoles(...writeRoles), async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const { project, picUserId } = toProjectPayload(parsed.data);
  const data = await prisma.$transaction(async (tx) => {
    await tx.project.update({ where: { id: req.params.id }, data: project });
    await syncPic(req.params.id, picUserId, tx);
    return tx.project.findUnique({ where: { id: req.params.id }, include: projectInclude });
  });

  res.json(data);
});

router.delete('/:id', requireAuth, allowRoles('SUPER_ADMIN', 'DIREKTUR'), async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        _count: {
          select: {
            members: true,
            quotes: true,
            invoices: true,
            dailyReports: true,
            documents: true,
            transactions: true,
            materialMovements: true,
          }
        }
      }
    });

    if (!project) return apiError(res, 404, 'NOT_FOUND', 'Proyek tidak ditemukan');

    const hasRelations = Object.values(project._count).some(count => count > 0);

    if (hasRelations) {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'BATAL' }
      });
      return res.json({ ok: true, message: 'Proyek memiliki data relasi dan status telah diubah menjadi BATAL', action: 'CANCELLED' });
    }

    await prisma.project.delete({ where: { id: projectId } });
    res.json({ ok: true, message: 'Proyek berhasil dihapus', action: 'DELETED' });
  } catch (error) {
    console.error('Delete project error:', error);
    apiError(res, 500, 'DELETE_FAILED', 'Gagal menghapus proyek: ' + (error.message || 'Terjadi kesalahan internal'));
  }
});

export const projectRoutes = router;
