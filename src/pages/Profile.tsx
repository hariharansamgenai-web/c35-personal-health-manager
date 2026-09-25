import { PagePlaceholder } from '@/components/common/PagePlaceholder';
import { User } from 'lucide-react';

export function ProfilePage() {
  return (
    <PagePlaceholder
      title="Profile"
      description="Manage your personal information and account settings."
      icon={<User className="h-6 w-6" />}
      phase="Phase 4"
    />
  );
}
