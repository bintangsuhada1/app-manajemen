import { Router } from 'express';
import { prisma } from '../services/prisma.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { getCompanyWhere } from '../utils/company.js';

const router = Router();
const analyticsRoles = ['SUPER_ADMIN', 'DIREKTUR'];

router.get('/dashboard', requireAuth, allowRoles(...analyticsRoles), async (req, res) => {
  const companyWhere = getCompanyWhere(req);
  const now = new Date();
  const deadlineLimit = new Date(now);
  deadlineLimit.setDate(deadlineLimit.getDate() + 14);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

  const [
    activeProjects,
    customers,
    pendingQuotes,
    invoices,
    transactions,
    chartTransactions,
    deadlines
  ] = await Promise.all([
    prisma.project.count({ where: { ...companyWhere, status: 'BERJALAN' } }),
    prisma.customer.count({ where: companyWhere }),
    prisma.quote.count({ where: { ...companyWhere, status: { in: ['DRAFT', 'SENT'] } } }),
    prisma.invoice.findMany({
      where: { ...companyWhere, status: { not: 'CANCELLED' } },
      select: { total: true, status: true, dueDate: true }
    }),
    prisma.transaction.findMany({
      where: companyWhere,
      select: { type: true, amount: true, date: true }
    }),
    prisma.transaction.findMany({
      where: { ...companyWhere, date: { gte: yearStart, lte: yearEnd } },
      select: { type: true, amount: true, date: true }
    }),
    prisma.project.findMany({
      where: {
        ...companyWhere,
        status: { notIn: ['SELESAI', 'BATAL'] },
        endDate: { lte: deadlineLimit }
      },
      select: { id: true, code: true, name: true, endDate: true, status: true },
      orderBy: { endDate: 'asc' },
      take: 5
    })
  ]);

  const income = transactions
    .filter((row) => row.type === 'INCOME')
    .reduce((sum, row) => sum + Number(row.amount), 0);
  const expense = transactions
    .filter((row) => row.type === 'EXPENSE')
    .reduce((sum, row) => sum + Number(row.amount), 0);
  const invoiceTotal = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
  const invoiceOverdue = invoices.filter((invoice) => (
    invoice.status === 'OVERDUE'
    || (
      invoice.dueDate
      && invoice.dueDate < now
      && !['PAID', 'CANCELLED'].includes(invoice.status)
    )
  )).length;

  const chart = chartTransactions.length
    ? Array.from({ length: 12 }, (_, month) => ({ month: month + 1, income: 0, expense: 0 }))
    : [];
  chartTransactions.forEach((row) => {
    const bucket = chart[new Date(row.date).getMonth()];
    if (!bucket) return;
    if (row.type === 'INCOME') bucket.income += Number(row.amount);
    if (row.type === 'EXPENSE') bucket.expense += Number(row.amount);
  });

  res.json({
    kpis: {
      activeProjects: activeProjects || 0,
      customers: customers || 0,
      pendingQuotes: pendingQuotes || 0,
      invoiceTotal: invoiceTotal || 0,
      invoiceOverdue: invoiceOverdue || 0,
      income: income || 0,
      expense: expense || 0,
      balance: income - expense
    },
    chart,
    deadlines: deadlines || []
  });
});

export const analyticsRoutes = router;
