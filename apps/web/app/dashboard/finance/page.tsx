"use client";
import { DashboardShell } from '@/components/DashboardShell';
import { FinanceManagement } from '@/components/FinanceManagement';

export default function FinancePage() {
  return (
    <DashboardShell>
      <div className="w-full max-w-none">
        <FinanceManagement />
      </div>
    </DashboardShell>
  );
}
