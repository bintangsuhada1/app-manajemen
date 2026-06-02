"use client";
import { DashboardShell } from '@/components/DashboardShell';
import { QuoteManagement } from '@/components/QuoteManagement';

export default function QuotesPage() {
  return (
    <DashboardShell>
      <div className="w-full max-w-none">
        <QuoteManagement />
      </div>
    </DashboardShell>
  );
}
