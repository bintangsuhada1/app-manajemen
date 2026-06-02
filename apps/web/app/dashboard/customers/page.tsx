"use client";
import { DashboardShell } from '@/components/DashboardShell';
import { CustomerManagement } from '@/components/CustomerManagement';

export default function CustomersPage() {
  return (
    <DashboardShell>
      <div className="w-full max-w-none">
        <CustomerManagement />
      </div>
    </DashboardShell>
  );
}
