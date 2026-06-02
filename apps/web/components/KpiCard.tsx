import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

type KpiTone = 'blue' | 'gold' | 'emerald' | 'rose' | 'slate';

const toneStyles: Record<KpiTone, { icon: string; bar: string }> = {
  blue: { icon: 'bg-gradient-to-br from-sky-50 to-cyan-50 text-sky-700 ring-sky-100', bar: 'bg-gradient-to-r from-sky-400 to-cyan-400' },
  gold: { icon: 'bg-gradient-to-br from-amber-200 to-gold text-navy ring-orange-100', bar: 'bg-gradient-to-r from-amber-300 to-gold' },
  emerald: { icon: 'bg-gradient-to-br from-emerald-50 to-cyan-50 text-emerald-700 ring-emerald-100', bar: 'bg-gradient-to-r from-emerald-400 to-cyan-400' },
  rose: { icon: 'bg-gradient-to-br from-rose-50 to-orange-50 text-rose-700 ring-rose-100', bar: 'bg-gradient-to-r from-rose-400 to-orange-400' },
  slate: { icon: 'bg-gradient-to-br from-white to-slate-100 text-slate-700 ring-slate-200', bar: 'bg-gradient-to-r from-slate-300 to-slate-500' }
};

export function KpiCard({
  title,
  value,
  note,
  icon: Icon,
  tone = 'gold'
}: {
  title: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone?: KpiTone;
}) {
  const styles = toneStyles[tone];

  return (
    <div className="group relative rounded-[1.25rem] border border-white/65 bg-white/[0.74] shadow-[0_16px_44px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-200/80 hover:bg-white/[0.86] hover:shadow-[0_22px_54px_rgba(15,23,42,0.10)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.10),transparent_12rem)] opacity-80" />
      <div className={clsx('absolute inset-x-0 top-0 h-0.5', styles.bar)} />
      <div className="relative p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-500">{title}</p>
            <h3 className="money-value mt-1.5 break-words text-xl font-semibold text-slate-950">{value}</h3>
            <p className="mt-1.5 text-xs font-medium text-slate-500">{note}</p>
          </div>
          <div className={clsx('grid h-9 w-9 shrink-0 place-items-center rounded-xl shadow-sm ring-1', styles.icon)}>
            <Icon size={18} />
          </div>
        </div>
      </div>
    </div>
  );
}
