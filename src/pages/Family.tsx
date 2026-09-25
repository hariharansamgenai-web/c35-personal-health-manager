import { PagePlaceholder } from '@/components/common/PagePlaceholder';
import { Users } from 'lucide-react';

export function FamilyPage() {
  return (
    <PagePlaceholder
      title="Family Profiles"
      description="Manage health profiles for your family members."
      icon={<Users className="h-6 w-6" />}
      phase="Phase 5"
    />
  );
}
