import { AlertTriangle, ShieldAlert } from 'lucide-react';
import type { HealthAlert } from '@/types';
import { cn } from '@/lib/utils';

export function AlertList({ alerts }: { alerts: HealthAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <section aria-label="Health alerts" className="space-y-3">
      {alerts.map((a) => {
        const critical = a.severity === 'critical';
        const Icon = critical ? ShieldAlert : AlertTriangle;
        return (
          <div
            key={a.id}
            role={critical ? 'alert' : 'status'}
            className={cn('flex gap-3 rounded-xl border p-4', critical ? 'border-error-200 bg-error-50' : 'border-warning-200 bg-warning-50')}
          >
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', critical ? 'text-error-600' : 'text-warning-600')} />
            <div className="min-w-0">
              <p className={cn('font-semibold', critical ? 'text-error-800' : 'text-warning-800')}>{a.title}</p>
              <p className="mt-0.5 text-sm text-neutral-700">{a.detail}</p>
              <p className="mt-2 text-sm font-medium text-neutral-900">{a.action}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
