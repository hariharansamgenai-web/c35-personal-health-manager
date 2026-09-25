import { PagePlaceholder } from '@/components/common/PagePlaceholder';
import { Target } from 'lucide-react';

export function GoalsPage() {
  return (
    <PagePlaceholder
      title="Goals"
      description="Set and track health goals — exercise targets, nutrition, sleep, and more."
      icon={<Target className="h-6 w-6" />}
      phase="Phase 9"
    />
  );
}
