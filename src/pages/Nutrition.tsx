import { PagePlaceholder } from '@/components/common/PagePlaceholder';
import { Apple } from 'lucide-react';

export function NutritionPage() {
  return (
    <PagePlaceholder
      title="Nutrition"
      description="Log your meals and track calories, protein, carbs, and fat."
      icon={<Apple className="h-6 w-6" />}
      phase="Phase 10"
    />
  );
}
