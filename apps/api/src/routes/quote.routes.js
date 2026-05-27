import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { apiError, sanitizeText, validationError } from '../utils/http.js';
import { createBrandedPdf, drawSignature, drawTableHeader, drawTableRow, formatCurrency, formatDate, keyValue, sectionTitle } from '../utils/pdf.js';

const router = Router();
const readRoles = ['SUPER_ADMIN', 'DIREKTUR', 'ADMIN', 'MARKETING'];
const writeRoles = ['SUPER_ADMIN', 'ADMIN', 'MARKETING'];
const quoteStatuses = ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED'];
const itemSchema = z.object({
  description: z.string().trim().min(1).max(300).transform(sanitizeText),
  unit: z.string().trim().min(1).max(20).transform(sanitizeText).default('ls'),
  qty: z.number().positive(),
  unitPrice: z.number().nonnegative()
});
const quoteSchema = z.object({
  number: z.string().trim().min(1).max(60).transform(sanitizeText),
  title: z.string().trim().min(2).max(180).transform(sanitizeText),
  status: z.enum(quoteStatuses).default('DRAFT'),
  tax: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  validUntil: z.string().date().optional().nullable(),
  notes: z.string().trim().max(1000).transform(sanitizeText).optional().nullable(),
  customerId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1)
});
const quoteInclude = { customer: true, project: true, items: true };

function buildQuotePayload(value) {
  const items = value.items.map((item) => ({
    ...item,
    total: item.qty * item.unitPrice
  }));
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal + value.tax - value.discount;
  const { items: _items, validUntil, ...quote } = value;
  return {
    quote: {
      ...quote,
      subtotal,
      total,
      validUntil: validUntil ? new Date(validUntil) : null
    },
    items
  };
}

const publicRequestSchema = z.object({
  companyName: z.string().trim().min(3).max(120).transform(sanitizeText),
  picName: z.string().trim().min(2).max(120).transform(sanitizeText),
  phone: z.string().trim().min(5).max(30).transform(sanitizeText),
  email: z.string().trim().email().max(120).transform((value) => value.toLowerCase()).optional().nullable(),
  service: z.string().trim().min(2).max(120).transform(sanitizeText),
  description: z.string().trim().max(1000).transform(sanitizeText).optional().nullable()
});

router.post('/public-request', async (req, res) => {
  const parsed = publicRequestSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const { companyName, picName, phone, email, service, description } = parsed.data;

  try {
    let customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { name: companyName },
          phone ? { phone } : undefined,
          email ? { email } : undefined
        ].filter(Boolean)
      }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: companyName,
          picName,
          phone,
          email,
          status: 'PROSPECT',
          notes: 'Mendaftar secara otomatis via Request Penawaran di landing page website.'
        }
      });
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const number = `RFQ-${dateStr}-${randomNum}`;

    const created = await prisma.quote.create({
      data: {
        number,
        title: `Permintaan Penawaran: ${service}`,
        status: 'DRAFT',
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        customerId: customer.id,
        notes: `Kebutuhan lapangan:\n${description || '-'}`,
        items: {
          create: [
            {
              description: `Layanan kelistrikan: ${service}`,
              qty: 1,
              unit: 'ls',
              unitPrice: 0,
              total: 0
            }
          ]
        }
      },
      include: quoteInclude
    });

    res.status(201).json({ ok: true, quote: created });
  } catch (error) {
    console.error('Public request error:', error);
    apiError(res, 500, 'PUBLIC_REQUEST_FAILED', 'Gagal memproses permintaan penawaran harga');
  }
});

router.get('/options', requireAuth, allowRoles(...readRoles), async (_, res) => {
  const [customers, projects] = await Promise.all([
    prisma.customer.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
  ]);
  res.json({ customers, projects, statuses: quoteStatuses });
});

router.get('/', requireAuth, allowRoles(...readRoles), async (_, res) => {
  res.json(await prisma.quote.findMany({ include: quoteInclude, orderBy: { createdAt: 'desc' } }));
});

router.get('/:id', requireAuth, allowRoles(...readRoles), async (req, res) => {
  const quote = await prisma.quote.findUnique({ where: { id: req.params.id }, include: quoteInclude });
  if (!quote) return apiError(res, 404, 'NOT_FOUND', 'Penawaran tidak ditemukan');
  res.json(quote);
});

router.post('/', requireAuth, allowRoles(...writeRoles), async (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  const { quote, items } = buildQuotePayload(parsed.data);
  const data = await prisma.quote.create({
    data: { ...quote, items: { create: items } },
    include: quoteInclude
  });
  res.status(201).json(data);
});

router.put('/:id', requireAuth, allowRoles(...writeRoles), async (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  const { quote, items } = buildQuotePayload(parsed.data);
  const data = await prisma.quote.update({
    where: { id: req.params.id },
    data: {
      ...quote,
      items: {
        deleteMany: {},
        create: items
      }
    },
    include: quoteInclude
  });
  res.json(data);
});

router.delete('/:id', requireAuth, allowRoles('SUPER_ADMIN'), async (req, res) => {
  await prisma.quote.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.get('/:id/pdf', requireAuth, allowRoles(...readRoles), async (req, res) => {
  const quote = await prisma.quote.findUnique({ where: { id: req.params.id }, include: quoteInclude });
  if (!quote) return apiError(res, 404, 'NOT_FOUND', 'Penawaran tidak ditemukan');
  const doc = createBrandedPdf(res, `penawaran-${quote.number}.pdf`, 'Quotation', 'inline');
  sectionTitle(doc, 'Informasi Penawaran');
  keyValue(doc, 'Nomor', quote.number);
  keyValue(doc, 'Judul', quote.title);
  keyValue(doc, 'Pelanggan', quote.customer?.name || '-');
  keyValue(doc, 'Proyek', quote.project?.name || '-');
  keyValue(doc, 'Berlaku sampai', formatDate(quote.validUntil));
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
  quote.items.forEach((item, index) => drawTableRow(doc, columns, [
    index + 1,
    item.description,
    Number(item.qty),
    item.unit,
    formatCurrency(item.unitPrice),
    formatCurrency(item.total)
  ], index % 2 === 1));
  doc.moveDown();
  keyValue(doc, 'Subtotal', formatCurrency(quote.subtotal));
  keyValue(doc, 'Pajak', formatCurrency(quote.tax));
  keyValue(doc, 'Diskon', formatCurrency(quote.discount));
  keyValue(doc, 'Grand Total', formatCurrency(quote.total));
  if (quote.notes) {
    doc.moveDown(0.6);
    sectionTitle(doc, 'Catatan');
    doc.fillColor('#334155').font('Helvetica').fontSize(9.5).text(quote.notes, { width: 511 });
  }
  drawSignature(doc);
  doc.end();
});

export const quoteRoutes = router;
