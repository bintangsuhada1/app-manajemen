"use client";
import { DashboardShell } from '@/components/DashboardShell';
import { DocumentManagement } from '@/components/DocumentManagement';

export default function DocumentsPage() {
  return (
    <DashboardShell>
      <div className="w-full max-w-none">
        <DocumentManagement />
      </div>
    </DashboardShell>
  );
}
