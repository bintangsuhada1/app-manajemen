import fs from 'fs/promises';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { apiError, sanitizeText, validationError } from '../utils/http.js';

const upload = multer({ dest: process.env.UPLOAD_DIR || 'uploads', limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();
const readRoles = ['SUPER_ADMIN', 'DIREKTUR', 'ADMIN'];
const writeRoles = ['SUPER_ADMIN', 'ADMIN'];
const uploadSchema = z.object({
  title: z.string().trim().max(180).transform(sanitizeText).optional(),
  category: z.string().trim().min(1).max(80).transform(sanitizeText).default('GENERAL'),
  projectId: z.string().trim().optional().nullable()
});

function buildWhere(query) {
  const projectId = query.projectId?.toString();
  const category = query.category?.toString();
  const mimeType = query.mimeType?.toString();
  return {
    ...(projectId ? { projectId } : {}),
    ...(category ? { category } : {}),
    ...(mimeType ? { mimeType: { contains: mimeType } } : {})
  };
}

router.get('/options', requireAuth, allowRoles(...readRoles), async (_, res) => {
  const [projects, categoryRows, mimeRows] = await Promise.all([
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.document.findMany({ distinct: ['category'], select: { category: true }, orderBy: { category: 'asc' } }),
    prisma.document.findMany({ distinct: ['mimeType'], select: { mimeType: true }, orderBy: { mimeType: 'asc' } })
  ]);
  res.json({
    projects,
    categories: categoryRows.map((row) => row.category),
    mimeTypes: mimeRows.map((row) => row.mimeType).filter(Boolean)
  });
});

router.get('/', requireAuth, allowRoles(...readRoles), async (req, res) => {
  res.json(await prisma.document.findMany({
    where: buildWhere(req.query),
    include: { project: true, uploadedBy: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  }));
});

router.get('/:id', requireAuth, allowRoles(...readRoles), async (req, res) => {
  const doc = await prisma.document.findUnique({
    where: { id: req.params.id },
    include: { project: true, uploadedBy: { select: { id: true, name: true, email: true } } }
  });
  if (!doc) return apiError(res, 404, 'NOT_FOUND', 'Dokumen tidak ditemukan');
  res.json(doc);
});

router.get('/:id/file', requireAuth, allowRoles(...readRoles), async (req, res) => {
  const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!doc) return apiError(res, 404, 'NOT_FOUND', 'Dokumen tidak ditemukan');
  res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
  res.sendFile(doc.path, { root: process.cwd() });
});

router.post('/upload', requireAuth, allowRoles(...writeRoles), upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return apiError(res, 422, 'FILE_REQUIRED', 'File wajib diupload');
  const parsed = uploadSchema.safeParse({
    title: req.body.title || undefined,
    category: req.body.category || 'GENERAL',
    projectId: req.body.projectId || null
  });
  if (!parsed.success) {
    await fs.unlink(file.path).catch(() => {});
    return validationError(res, parsed.error);
  }
  const payload = parsed.data;
  const doc = await prisma.document.create({
    data: {
      title: payload.title || sanitizeText(file.originalname).slice(0, 180),
      category: payload.category,
      fileName: sanitizeText(file.originalname).slice(0, 180),
      path: file.path,
      mimeType: file.mimetype,
      size: file.size,
      projectId: payload.projectId,
      uploadedById: req.user.id
    },
    include: { project: true, uploadedBy: { select: { id: true, name: true, email: true } } }
  });
  res.status(201).json(doc);
});

router.delete('/:id', requireAuth, allowRoles(...writeRoles), async (req, res) => {
  const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!doc) return apiError(res, 404, 'NOT_FOUND', 'Dokumen tidak ditemukan');
  await prisma.document.delete({ where: { id: req.params.id } });
  await fs.unlink(doc.path).catch(() => {});
  res.json({ ok: true });
});

export const documentRoutes = router;
