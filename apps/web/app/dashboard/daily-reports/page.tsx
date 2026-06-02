"use client";
import { DashboardShell } from '@/components/DashboardShell';
import { DailyReportManagement } from '@/components/DailyReportManagement';

export default function DailyReportsPage() {
  return (
    <DashboardShell>
      <div className="w-full max-w-none">
        <DailyReportManagement />
      </div>
    </DashboardShell>
  );
}
