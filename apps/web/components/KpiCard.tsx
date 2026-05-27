import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

type KpiTone = 'blue' | 'gold' | 'emerald' | 'rose' | 'slate';

const toneStyles: Record<KpiTone, { icon: string; bar: string }> = {
  blue: { icon: 'bg-sky-50 text-sky-700 ring-sky-100', bar: 'bg-sky-500' },
  gold: { icon: 'bg-orange-50 text-gold ring-orange-100', bar: 'bg-gold' },
  emerald: { icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100', bar: 'bg-emerald-500' },
  rose: { icon: 'bg-rose-50 text-rose-700 ring-rose-100', bar: 'bg-rose-500' },
  slate: { icon: 'bg-slate-100 text-slate-700 ring-slate-200', bar: 'bg-slate-500' }
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
    <div className="group overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm shadow-slate-200/70 transition-colors hover:border-slate-300">
      <div className={clsx('h-1 w-full', styles.bar)} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-slate-500">{title}</p>
            <h3 className="mt-2 break-words text-2xl font-black text-navy">{value}</h3>
            <p className="mt-2 text-xs font-medium text-slate-500">{note}</p>
          </div>
          <div className={clsx('grid h-11 w-11 shrink-0 place-items-center rounded-lg ring-1', styles.icon)}>
            <Icon size={21} />
          </div>
        </div>
      </div>
    </div>
  );
}
