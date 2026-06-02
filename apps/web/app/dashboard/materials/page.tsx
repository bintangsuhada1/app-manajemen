"use client";
import { DashboardShell } from '@/components/DashboardShell';
import { MaterialManagement } from '@/components/MaterialManagement';

export default function MaterialsPage() {
  return (
    <DashboardShell>
      <div className="w-full max-w-none">
        <MaterialManagement />
      </div>
    </DashboardShell>
  );
}
