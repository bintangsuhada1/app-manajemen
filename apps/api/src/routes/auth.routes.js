import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { apiError, sanitizeText, validationError } from '../utils/http.js';
const router = Router();
const schema = z.object({
  email: z.string().trim().email().max(120).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128)
});
router.post('/login', async (req, res) => {
  const data = schema.safeParse(req.body);
  if (!data.success) return validationError(res, data.error);
  const user = await prisma.user.findUnique({ where: { email: data.data.email } });
  if (!user || !await bcrypt.compare(data.data.password, user.passwordHash)) return apiError(res, 401, 'INVALID_CREDENTIALS', 'Email atau password salah');
  if (!user.isActive) return apiError(res, 403, 'USER_INACTIVE', 'User tidak aktif');
  const token = jwt.sign({ id: user.id, role: user.role, name: sanitizeText(user.name) }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});
export const authRoutes = router;
