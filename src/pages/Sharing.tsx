import { PagePlaceholder } from '@/components/common/PagePlaceholder';
import { Share2 } from 'lucide-react';

export function SharingPage() {
  return (
    <PagePlaceholder
      title="Secure Sharing"
      description="Share your health data with trusted family members or healthcare providers."
      icon={<Share2 className="h-6 w-6" />}
      phase="a later phase"
    />
  );
}
