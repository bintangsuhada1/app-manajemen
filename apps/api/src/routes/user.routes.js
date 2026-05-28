import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { apiError, sanitizeText, validationError } from '../utils/http.js';

const router = Router();
const userRoles = ['SUPER_ADMIN', 'DIREKTUR', 'PROJECT_MANAGER', 'ADMIN', 'KEUANGAN', 'TEKNISI', 'MARKETING'];

const roleAliases = new Map([
  ['SUPER ADMIN', 'SUPER_ADMIN'],
  ['SUPER_ADMIN', 'SUPER_ADMIN'],
  ['DIREKTUR', 'DIREKTUR'],
  ['PROJECT MANAGER', 'PROJECT_MANAGER'],
  ['PROJECT_MANAGER', 'PROJECT_MANAGER'],
  ['ADMIN', 'ADMIN'],
  ['KEUANGAN', 'KEUANGAN'],
  ['TEKNISI', 'TEKNISI'],
  ['MARKETING', 'MARKETING']
]);

function normalizeRole(value) {
  if (typeof value !== 'string') return value;
  const key = value.trim().toUpperCase().replace(/-/g, ' ').replace(/\s+/g, ' ');
  return roleAliases.get(key) || key.replaceAll(' ', '_');
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase();
  if (['true', 'active', 'aktif', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', 'inactive', 'nonaktif', '0', 'no', 'off'].includes(normalized)) return false;
  return value;
}

function normalizeUserBody(body) {
  const data = body && typeof body === 'object' ? { ...body } : {};
  return {
    ...data,
    name: data.name ?? data.fullName,
    role: normalizeRole(data.role ?? data.internalRole),
    phone: data.phone ?? data.whatsapp ?? null,
    isActive: normalizeBoolean(data.isActive ?? data.status ?? true)
  };
}

const schema = z.object({
  name: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter').max(100, 'Nama lengkap maksimal 100 karakter').transform(sanitizeText),
  email: z.string().trim().email('Format email tidak valid').max(120, 'Email maksimal 120 karakter').transform((value) => value.toLowerCase()),
  role: z.enum(userRoles, { errorMap: () => ({ message: 'Role harus salah satu dari: SUPER ADMIN, DIREKTUR, PROJECT MANAGER, ADMIN, KEUANGAN, TEKNISI, MARKETING' }) }),
  phone: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.string().trim().max(30, 'Nomor WhatsApp maksimal 30 karakter').transform(sanitizeText).optional().nullable()
  ),
  isActive: z.boolean().default(true)
});

const createSchema = schema.extend({
  password: z.string().min(8, 'Password minimal 8 karakter').max(128, 'Password maksimal 128 karakter')
});

const passwordSchema = z.object({
  password: z.string().min(8, 'Password minimal 8 karakter').max(128, 'Password maksimal 128 karakter')
});

// Hanya SUPER_ADMIN yang bisa mengakses modul ini
router.use(requireAuth, allowRoles('SUPER_ADMIN'));

// Get all users
router.get('/', async (_, res) => {
  try {
    const data = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(data);
  } catch (error) {
    console.error('Get users error:', error);
    apiError(res, 500, 'GET_USERS_FAILED', 'Gagal memuat daftar user');
  }
});

// Create new user
router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(normalizeUserBody(req.body));
  if (!parsed.success) return validationError(res, parsed.error);

  const { password, email, ...userData } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return apiError(res, 400, 'EMAIL_EXISTS', 'Email sudah terdaftar di sistem');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const created = await prisma.user.create({
      data: {
        ...userData,
        email,
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Create user error:', error);
    apiError(res, 500, 'CREATE_USER_FAILED', 'Gagal membuat user baru');
  }
});

// Update user details
router.put('/:id', async (req, res) => {
  const parsed = schema.safeParse(normalizeUserBody(req.body));
  if (!parsed.success) return validationError(res, parsed.error);

  const { email } = parsed.data;
  const userId = req.params.id;

  try {
    const existing = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: userId }
      }
    });
    if (existing) {
      return apiError(res, 400, 'EMAIL_EXISTS', 'Email sudah digunakan oleh user lain');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update user error:', error);
    apiError(res, 500, 'UPDATE_USER_FAILED', 'Gagal memperbarui data user');
  }
});

// Reset password for a user
router.put('/:id/password', async (req, res) => {
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const userId = req.params.id;

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    res.json({ ok: true, message: 'Password user berhasil direset' });
  } catch (error) {
    console.error('Reset password error:', error);
    apiError(res, 500, 'RESET_PASSWORD_FAILED', 'Gagal mereset password user');
  }
});

export const userRoutes = router;
