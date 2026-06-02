'use client';
import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/DashboardShell';
import { DashboardAnalytics } from '@/components/DashboardAnalytics';
import ProjectsPreview from '@/components/ProjectsPreview';
import TransactionsPreview from '@/components/TransactionsPreview';
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

  return (
    <DashboardShell>
      <div className="w-full max-w-none">
        {canAccess(role, 'analytics') && <DashboardAnalytics />}

        <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-2">
          {canAccess(role, 'projects') && <ProjectsPreview />}
          {canAccess(role, 'finance') && <TransactionsPreview />}
        </div>
      </div>
    </DashboardShell>
  );
}
