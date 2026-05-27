'use client';
import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/DashboardShell';
import { ProjectManagement } from '@/components/ProjectManagement';
import { CustomerManagement } from '@/components/CustomerManagement';
import { QuoteManagement } from '@/components/QuoteManagement';
import { InvoiceManagement } from '@/components/InvoiceManagement';
import { FinanceManagement } from '@/components/FinanceManagement';
import { DailyReportManagement } from '@/components/DailyReportManagement';
import { MaterialManagement } from '@/components/MaterialManagement';
import { DocumentManagement } from '@/components/DocumentManagement';
import { ExportCenter } from '@/components/ExportCenter';
import { DashboardAnalytics } from '@/components/DashboardAnalytics';
import { BackupManagement } from '@/components/BackupManagement';
import { UserManagement } from '@/components/UserManagement';
import { canAccess } from '@/lib/permissions';

export default function DashboardPage() {
  const [role, setRole] = useState<string>();

  useEffect(() => {
    try {
      const user = window.localStorage.getItem('user');
      setRole(user ? JSON.parse(user).role : undefined);
    } catch {
      setRole(undefined);
    }
  }, []);

  return <DashboardShell>
    {canAccess(role, 'analytics') && <DashboardAnalytics />}

    {canAccess(role, 'projects') && <ProjectManagement />}

    {(canAccess(role, 'customers') || canAccess(role, 'quotes')) && (
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {canAccess(role, 'customers') && <CustomerManagement />}
        {canAccess(role, 'quotes') && <QuoteManagement />}
      </div>
    )}

    {(canAccess(role, 'invoices') || canAccess(role, 'finance') || canAccess(role, 'materials')) && (
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {canAccess(role, 'invoices') && <InvoiceManagement />}
        {canAccess(role, 'finance') && <FinanceManagement />}
        {canAccess(role, 'materials') && <MaterialManagement />}
      </div>
    )}

    {canAccess(role, 'reports') && <DailyReportManagement />}
    {canAccess(role, 'documents') && <DocumentManagement />}
    {canAccess(role, 'users') && <UserManagement />}
    {canAccess(role, 'backups') && <BackupManagement />}
    <ExportCenter role={role} />
  </DashboardShell>;
}
