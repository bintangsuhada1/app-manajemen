"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiUrl } from '@/lib/api';
import { getActiveCompanyId, ACTIVE_COMPANY_CHANGED_EVENT, withActiveCompanyId } from '@/lib/companies';

type Project = { id: string; name: string; code?: string | null; progress?: number; endDate?: string | null };

export default function ProjectsPreview() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(() => getActiveCompanyId());

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl}/api${withActiveCompanyId('/projects', activeCompanyId)}`);
        if (!res.ok) return setProjects([]);
        const data = await res.json();
        setProjects(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch {
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [activeCompanyId]);

  useEffect(() => {
    function onChange() {
      setActiveCompanyId(getActiveCompanyId());
    }
    window.addEventListener(ACTIVE_COMPANY_CHANGED_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(ACTIVE_COMPANY_CHANGED_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Proyek Terbaru</h3>
        <Link href="/dashboard/projects" className="btn-secondary text-xs">Lihat Semua</Link>
      </div>
      <div className="mt-3 space-y-2">
        {loading && <div className="text-sm text-slate-500">Memuat...</div>}
        {!loading && projects.length === 0 && <div className="text-sm text-slate-500">Tidak ada proyek.</div>}
        {projects.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-semibold text-navy">{p.name}</p>
              <p className="text-xs text-slate-500">{p.code || '-'}</p>
            </div>
            <div className="text-sm text-slate-600">{p.progress ?? 0}%</div>
          </div>
        ))}
      </div>
    </section>
  );
}
