import type { NutritionSummary } from '@/lib/meals';

interface NutritionBarProps {
  summary: NutritionSummary;
  calorieTarget?: number;
}

export function NutritionBar({ summary, calorieTarget }: NutritionBarProps) {
  return (
    <div className="grid grid-cols-5 gap-3 text-center">
      <Stat label="Calories" value={summary.calories} unit="kcal" target={calorieTarget} />
      <Stat label="Protein" value={summary.protein_g} unit="g" />
      <Stat label="Carbs" value={summary.carbs_g} unit="g" />
      <Stat label="Fat" value={summary.fat_g} unit="g" />
      <Stat label="Fiber" value={summary.fiber_g} unit="g" />
    </div>
  );
}

function Stat({ label, value, unit, target }: { label: string; value: number; unit: string; target?: number }) {
  return (
    <div>
      <p className="text-lg font-bold text-neutral-900">
        {Number.isInteger(value) ? value : value.toFixed(1)}
        <span className="ml-0.5 text-xs font-normal text-neutral-500">{unit}</span>
      </p>
      <p className="text-xs text-neutral-500">{label}</p>
      {target !== undefined && (
        <p className="mt-0.5 text-xs text-neutral-400">
          Est. target {target} kcal
        </p>
      )}
    </div>
  );
}
