"use client";
import { DashboardShell } from '@/components/DashboardShell';
import { InvoiceManagement } from '@/components/InvoiceManagement';

export default function InvoicesPage() {
  return (
    <DashboardShell>
      <div className="w-full max-w-none">
        <InvoiceManagement />
      </div>
    </DashboardShell>
  );
}
