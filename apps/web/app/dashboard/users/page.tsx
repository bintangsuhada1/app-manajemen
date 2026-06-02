"use client";
import { DashboardShell } from '@/components/DashboardShell';
import { UserManagement } from '@/components/UserManagement';

export default function UsersPage() {
  return (
    <DashboardShell>
      <div className="w-full max-w-none">
        <UserManagement />
      </div>
    </DashboardShell>
  );
}
