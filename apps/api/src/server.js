import 'dotenv/config';
import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRoutes } from './routes/auth.routes.js';
import { projectRoutes } from './routes/project.routes.js';
import { customerRoutes } from './routes/customer.routes.js';
import { quoteRoutes } from './routes/quote.routes.js';
import { invoiceRoutes } from './routes/invoice.routes.js';
import { financeRoutes } from './routes/finance.routes.js';
import { reportRoutes } from './routes/report.routes.js';
import { materialRoutes } from './routes/material.routes.js';
import { documentRoutes } from './routes/document.routes.js';
import { exportRoutes } from './routes/export.routes.js';
import { analyticsRoutes } from './routes/analytics.routes.js';
import { backupRoutes } from './routes/backup.routes.js';
import { userRoutes } from './routes/user.routes.js';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET wajib diisi di environment API');
}

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '10mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

app.get('/api/health', (_, res) => res.json({ ok: true, app: 'PT Jurti API' }));
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/users', userRoutes);

app.use((_, res) => res.status(404).json({ code: 'NOT_FOUND', message: 'Endpoint tidak ditemukan' }));
app.use((error, _, res, __) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'Format JSON tidak valid' });
  }
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ code: 'FILE_TOO_LARGE', message: 'Ukuran file terlalu besar' });
  }
  console.error(error);
  return res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Terjadi kesalahan pada server' });
});

app.listen(process.env.PORT || 4000, () => console.log(`API running on port ${process.env.PORT || 4000}`));
