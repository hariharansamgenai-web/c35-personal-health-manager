import { PagePlaceholder } from '@/components/common/PagePlaceholder';
import { LayoutDashboard } from 'lucide-react';

export function DashboardPage() {
  return (
    <PagePlaceholder
      title="Dashboard"
      description="An overview of your health at a glance — recent check-ins, goal progress, and activity summary."
      icon={<LayoutDashboard className="h-6 w-6" />}
      phase="Phase 6"
    />
  );
}
