import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { apiError, sanitizeText, validationError } from '../utils/http.js';
import { createBrandedPdf, drawSignature, drawTableHeader, drawTableRow, formatCurrency, formatDate, keyValue, sectionTitle } from '../utils/pdf.js';

const router = Router();
const readRoles = ['SUPER_ADMIN', 'DIREKTUR', 'KEUANGAN'];
const writeRoles = ['SUPER_ADMIN', 'KEUANGAN'];
const invoiceStatuses = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];
const itemSchema = z.object({
  description: z.string().trim().min(1).max(300).transform(sanitizeText),
  unit: z.string().trim().min(1).max(20).transform(sanitizeText).default('ls'),
  qty: z.number().positive(),
  unitPrice: z.number().nonnegative()
});
const invoiceSchema = z.object({
  number: z.string().trim().min(1).max(60).transform(sanitizeText),
  title: z.string().trim().min(2).max(180).transform(sanitizeText),
  status: z.enum(invoiceStatuses).default('DRAFT'),
  tax: z.number().nonnegative().default(0),
  paidAmount: z.number().nonnegative().default(0),
  dueDate: z.string().date().optional().nullable(),
  customerId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1)
});
const invoiceInclude = { customer: true, project: true, items: true };

function buildInvoicePayload(value) {
  const items = value.items.map((item) => ({
    ...item,
    total: item.qty * item.unitPrice
  }));
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal + value.tax;
  const { items: _items, dueDate, ...invoice } = value;
  return {
    invoice: {
      ...invoice,
      subtotal,
      total,
      dueDate: dueDate ? new Date(dueDate) : null
    },
    items
  };
}

router.get('/options', requireAuth, allowRoles(...readRoles), async (_, res) => {
  const [customers, projects] = await Promise.all([
    prisma.customer.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
  ]);
  res.json({ customers, projects, statuses: invoiceStatuses });
});

router.get('/', requireAuth, allowRoles(...readRoles), async (_, res) => {
  res.json(await prisma.invoice.findMany({ include: invoiceInclude, orderBy: { createdAt: 'desc' } }));
});

router.get('/:id', requireAuth, allowRoles(...readRoles), async (req, res) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: invoiceInclude });
  if (!invoice) return apiError(res, 404, 'NOT_FOUND', 'Invoice tidak ditemukan');
  res.json(invoice);
});

router.post('/', requireAuth, allowRoles(...writeRoles), async (req, res) => {
  const parsed = invoiceSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  const { invoice, items } = buildInvoicePayload(parsed.data);
  const data = await prisma.invoice.create({
    data: { ...invoice, items: { create: items } },
    include: invoiceInclude
  });
  res.status(201).json(data);
});

router.put('/:id', requireAuth, allowRoles(...writeRoles), async (req, res) => {
  const parsed = invoiceSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  const { invoice, items } = buildInvoicePayload(parsed.data);
  const data = await prisma.invoice.update({
    where: { id: req.params.id },
    data: {
      ...invoice,
      items: {
        deleteMany: {},
        create: items
      }
    },
    include: invoiceInclude
  });
  res.json(data);
});

router.delete('/:id', requireAuth, allowRoles('SUPER_ADMIN'), async (req, res) => {
  await prisma.invoice.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.get('/:id/pdf', requireAuth, allowRoles(...readRoles), async (req, res) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: invoiceInclude });
  if (!invoice) return apiError(res, 404, 'NOT_FOUND', 'Invoice tidak ditemukan');
  const doc = createBrandedPdf(res, `invoice-${invoice.number}.pdf`, 'Invoice', 'inline');
  sectionTitle(doc, 'Informasi Invoice');
  keyValue(doc, 'Nomor', invoice.number);
  keyValue(doc, 'Judul', invoice.title);
  keyValue(doc, 'Pelanggan', invoice.customer?.name || '-');
  keyValue(doc, 'Proyek', invoice.project?.name || '-');
  keyValue(doc, 'Jatuh tempo', formatDate(invoice.dueDate));
  doc.moveDown(0.6);
  const columns = [
    { label: 'No', x: 48, width: 24 },
    { label: 'Deskripsi', x: 78, width: 220 },
    { label: 'Qty', x: 304, width: 42, align: 'right' },
    { label: 'Satuan', x: 352, width: 48 },
    { label: 'Harga', x: 406, width: 68, align: 'right' },
    { label: 'Total', x: 480, width: 66, align: 'right' }
  ];
  drawTableHeader(doc, columns);
  invoice.items.forEach((item, index) => drawTableRow(doc, columns, [
    index + 1,
    item.description,
    Number(item.qty),
    item.unit,
    formatCurrency(item.unitPrice),
    formatCurrency(item.total)
  ], index % 2 === 1));
  doc.moveDown();
  keyValue(doc, 'Subtotal', formatCurrency(invoice.subtotal));
  keyValue(doc, 'Pajak', formatCurrency(invoice.tax));
  keyValue(doc, 'Total', formatCurrency(invoice.total));
  keyValue(doc, 'Sudah dibayar', formatCurrency(invoice.paidAmount));
  keyValue(doc, 'Sisa tagihan', formatCurrency(Number(invoice.total) - Number(invoice.paidAmount)));
  drawSignature(doc);
  doc.end();
});

export const invoiceRoutes = router;
