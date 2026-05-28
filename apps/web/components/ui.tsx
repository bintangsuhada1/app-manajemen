import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

type PolymorphicProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

export function Card<T extends ElementType = 'section'>({ as, className, children, ...props }: PolymorphicProps<T>) {
  const Component = as || 'section';
  return <Component className={clsx('card', className)} {...props}>{children}</Component>;
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: ComponentPropsWithoutRef<'button'> & { variant?: 'primary' | 'dark' | 'secondary' }) {
  return <button className={clsx(variant === 'primary' && 'btn-primary', variant === 'dark' && 'btn-dark', variant === 'secondary' && 'btn-secondary', className)} {...props} />;
}

export function Input(props: ComponentPropsWithoutRef<'input'>) {
  return <input {...props} className={clsx('input', props.className)} />;
}

export function Badge({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
  return <span {...props} className={clsx('badge', className)} />;
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="section-header">
      <div className="min-w-0">
        <h2 className="section-title">{title}</h2>
        {description && <p className="section-description">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Table({ className, ...props }: ComponentPropsWithoutRef<'table'>) {
  return <table {...props} className={clsx('w-full text-left', className)} />;
}

export function StatCard({
  title,
  value,
  note,
  icon: Icon,
  tone = 'slate'
}: {
  title: string;
  value: ReactNode;
  note?: string;
  icon?: LucideIcon;
  tone?: 'slate' | 'blue' | 'cyan' | 'amber' | 'emerald' | 'rose';
}) {
  const toneClass = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-50 text-blue-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700'
  }[tone];

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-500">{title}</p>
          <div className="money-value mt-1.5 break-words text-xl font-semibold text-slate-950">{value}</div>
          {note && <p className="mt-1 text-xs font-medium text-slate-500">{note}</p>}
        </div>
        {Icon && <div className={clsx('grid h-9 w-9 shrink-0 place-items-center rounded-xl', toneClass)}><Icon size={18} /></div>}
      </div>
    </div>
  );
}
