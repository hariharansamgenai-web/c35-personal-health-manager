import { PagePlaceholder } from '@/components/common/PagePlaceholder';
import { Calendar } from 'lucide-react';

export function TimelinePage() {
  return (
    <PagePlaceholder
      title="Health Timeline"
      description="A chronological view of your health events, check-ins, and milestones."
      icon={<Calendar className="h-6 w-6" />}
      phase="a later phase"
    />
  );
}
