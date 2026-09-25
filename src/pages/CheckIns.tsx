import { PagePlaceholder } from '@/components/common/PagePlaceholder';
import { HeartPulse } from 'lucide-react';

export function CheckInsPage() {
  return (
    <PagePlaceholder
      title="Daily Check-ins"
      description="Log how you feel each day — mood, energy, sleep, and notes."
      icon={<HeartPulse className="h-6 w-6" />}
      phase="Phase 7"
    />
  );
}
