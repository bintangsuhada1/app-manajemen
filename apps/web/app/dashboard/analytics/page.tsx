"use client";
import { DashboardShell } from '@/components/DashboardShell';
import { DashboardAnalytics } from '@/components/DashboardAnalytics';

export default function AnalyticsPage() {
  return (
    <DashboardShell>
      <div className="w-full max-w-none">
        <DashboardAnalytics />
      </div>
    </DashboardShell>
  );
}
