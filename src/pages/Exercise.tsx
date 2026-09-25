import { PagePlaceholder } from '@/components/common/PagePlaceholder';
import { Dumbbell } from 'lucide-react';

export function ExercisePage() {
  return (
    <PagePlaceholder
      title="Exercise & Activity"
      description="Track your workouts, activities, and physical exercise."
      icon={<Dumbbell className="h-6 w-6" />}
      phase="Phase 8"
    />
  );
}
