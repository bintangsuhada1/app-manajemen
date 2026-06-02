"use client";
import { DashboardShell } from '@/components/DashboardShell';
import { ProjectManagement } from '@/components/ProjectManagement';

export default function ProjectsPage() {
  return (
    <DashboardShell>
      <div className="w-full max-w-none">
        <ProjectManagement />
      </div>
    </DashboardShell>
  );
}
