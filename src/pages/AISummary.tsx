import { PagePlaceholder } from '@/components/common/PagePlaceholder';
import { Sparkles } from 'lucide-react';

export function AISummaryPage() {
  return (
    <PagePlaceholder
      title="AI Health Summary"
      description="Get an AI-generated summary of your health habits and progress over a selected period."
      icon={<Sparkles className="h-6 w-6" />}
      phase="Phase 11"
    />
  );
}
