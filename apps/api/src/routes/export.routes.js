import { Router } from 'express';
import ExcelJS from 'exceljs';
import { prisma } from '../services/prisma.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { createBrandedPdf, drawSignature, drawTableHeader, drawTableRow, formatCurrency, formatDate, keyValue, sectionTitle } from '../utils/pdf.js';

const router = Router();
const projectRoles = ['SUPER_ADMIN', 'DIREKTUR', 'PROJECT_MANAGER'];
const customerRoles = ['SUPER_ADMIN', 'DIREKTUR', 'ADMIN', 'MARKETING'];
const invoiceRoles = ['SUPER_ADMIN', 'DIREKTUR', 'KEUANGAN'];
const financeRoles = ['SUPER_ADMIN', 'DIREKTUR', 'KEUANGAN'];
const reportRoles = ['SUPER_ADMIN', 'DIREKTUR', 'PROJECT_MANAGER', 'TEKNISI'];
async function excel(res, filename, sheetName, columns, rows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns;
  sheet.addRows(rows);
  sheet.getRow(1).font = { bold: true };
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
}

router.get('/reports/daily.pdf', requireAuth, allowRoles(...reportRoles), async (_, res) => {
  const rows = await prisma.dailyReport.findMany({ include: { project: true, technician: true }, orderBy: { date: 'desc' } });
  const doc = createBrandedPdf(res, 'laporan-harian.pdf', 'Laporan Harian Teknisi');
  const columns = [
    { label: 'No', x: 48, width: 24 },
    { label: 'Tanggal', x: 78, width: 70 },
    { label: 'Proyek', x: 154, width: 130 },
    { label: 'Teknisi', x: 290, width: 100 },
    { label: 'Pekerjaan', x: 396, width: 150 }
  ];
  drawTableHeader(doc, columns);
  rows.forEach((row, index) => drawTableRow(doc, columns, [
    index + 1,
    formatDate(row.date),
    row.project.name,
    row.technician.name,
    row.workDescription
  ], index % 2 === 1));
  drawSignature(doc, 'Mengetahui');
  doc.end();
});
router.get('/projects/recap.pdf', requireAuth, allowRoles(...projectRoles), async (_, res) => {
  const rows = await prisma.project.findMany({ include: { customer: true }, orderBy: { createdAt: 'desc' } });
  const doc = createBrandedPdf(res, 'rekap-proyek.pdf', 'Rekap Proyek');
  const columns = [
    { label: 'No', x: 48, width: 24 },
    { label: 'Kode', x: 78, width: 72 },
    { label: 'Proyek', x: 156, width: 150 },
    { label: 'Status', x: 312, width: 72 },
    { label: 'Progress', x: 390, width: 56, align: 'right' },
    { label: 'Pelanggan', x: 452, width: 94 }
  ];
  drawTableHeader(doc, columns);
  rows.forEach((row, index) => drawTableRow(doc, columns, [
    index + 1,
    row.code || '-',
    row.name,
    row.status,
    `${row.progress}%`,
    row.customer?.name || '-'
  ], index % 2 === 1));
  drawSignature(doc, 'Disahkan oleh');
  doc.end();
});
router.get('/finance/report.pdf', requireAuth, allowRoles(...financeRoles), async (_, res) => {
  const rows = await prisma.transaction.findMany({ include: { project: true }, orderBy: { date: 'desc' } });
  const income = rows.filter((x) => x.type === 'INCOME').reduce((s, x) => s + Number(x.amount), 0);
  const expense = rows.filter((x) => x.type === 'EXPENSE').reduce((s, x) => s + Number(x.amount), 0);
  const doc = createBrandedPdf(res, 'laporan-keuangan.pdf', 'Laporan Keuangan');
  sectionTitle(doc, 'Ringkasan');
  keyValue(doc, 'Pemasukan', formatCurrency(income));
  keyValue(doc, 'Pengeluaran', formatCurrency(expense));
  keyValue(doc, 'Saldo', formatCurrency(income - expense));
  doc.moveDown(0.6);
  const columns = [
    { label: 'No', x: 48, width: 24 },
    { label: 'Tanggal', x: 78, width: 70 },
    { label: 'Tipe', x: 154, width: 60 },
    { label: 'Kategori', x: 220, width: 105 },
    { label: 'Nominal', x: 331, width: 85, align: 'right' },
    { label: 'Proyek', x: 422, width: 124 }
  ];
  drawTableHeader(doc, columns);
  rows.forEach((row, index) => drawTableRow(doc, columns, [
    index + 1,
    formatDate(row.date),
    row.type,
    row.category,
    formatCurrency(row.amount),
    row.project?.name || '-'
  ], index % 2 === 1));
  drawSignature(doc, 'Disetujui oleh');
  doc.end();
});
router.get('/projects.xlsx', requireAuth, allowRoles(...projectRoles), async (_, res) => {
  const rows = await prisma.project.findMany({ include: { customer: true }, orderBy: { createdAt: 'desc' } });
  await excel(res, 'proyek.xlsx', 'Proyek', [
    { header: 'Kode', key: 'code' }, { header: 'Nama', key: 'name' }, { header: 'Pelanggan', key: 'customer' },
    { header: 'Status', key: 'status' }, { header: 'Progress', key: 'progress' }, { header: 'Nilai Kontrak', key: 'contractValue' }
  ], rows.map((x) => ({ code: x.code, name: x.name, customer: x.customer?.name || '', status: x.status, progress: x.progress, contractValue: Number(x.contractValue || 0) })));
});
router.get('/customers.xlsx', requireAuth, allowRoles(...customerRoles), async (_, res) => {
  const rows = await prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
  await excel(res, 'pelanggan.xlsx', 'Pelanggan', [
    { header: 'Nama', key: 'name' }, { header: 'PIC', key: 'picName' }, { header: 'Telepon', key: 'phone' },
    { header: 'Email', key: 'email' }, { header: 'Segment', key: 'segment' }, { header: 'Status', key: 'status' }
  ], rows);
});
router.get('/invoices.xlsx', requireAuth, allowRoles(...invoiceRoles), async (_, res) => {
  const rows = await prisma.invoice.findMany({ include: { customer: true, project: true }, orderBy: { createdAt: 'desc' } });
  await excel(res, 'invoice.xlsx', 'Invoice', [
    { header: 'Nomor', key: 'number' }, { header: 'Judul', key: 'title' }, { header: 'Pelanggan', key: 'customer' },
    { header: 'Proyek', key: 'project' }, { header: 'Status', key: 'status' }, { header: 'Total', key: 'total' }
  ], rows.map((x) => ({ number: x.number, title: x.title, customer: x.customer?.name || '', project: x.project?.name || '', status: x.status, total: Number(x.total) })));
});
router.get('/finance.xlsx', requireAuth, allowRoles(...financeRoles), async (_, res) => {
  const rows = await prisma.transaction.findMany({ include: { project: true }, orderBy: { date: 'desc' } });
  await excel(res, 'transaksi-keuangan.xlsx', 'Transaksi', [
    { header: 'Tanggal', key: 'date' }, { header: 'Tipe', key: 'type' }, { header: 'Kategori', key: 'category' },
    { header: 'Deskripsi', key: 'description' }, { header: 'Nominal', key: 'amount' }, { header: 'Proyek', key: 'project' }
  ], rows.map((x) => ({ date: x.date.toISOString().slice(0, 10), type: x.type, category: x.category, description: x.description || '', amount: Number(x.amount), project: x.project?.name || '' })));
});

export const exportRoutes = router;
