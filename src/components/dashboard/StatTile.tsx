import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  note?: ReactNode;
  tone?: 'good' | 'watch' | 'neutral';
}

export function StatTile({ label, value, unit, note, tone = 'neutral' }: StatTileProps) {
  return (
    <div className="card-base p-4">
      <p className="text-sm text-neutral-600">{label}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span
          className={cn(
            'text-2xl font-bold tabular-nums',
            tone === 'good' && 'text-success-700',
            tone === 'watch' && 'text-warning-700',
            tone === 'neutral' && 'text-neutral-900'
          )}
        >
          {value}
        </span>
        {unit && <span className="text-sm text-neutral-500">{unit}</span>}
      </p>
      {note && <p className="mt-1 text-xs text-neutral-500">{note}</p>}
    </div>
  );
}
