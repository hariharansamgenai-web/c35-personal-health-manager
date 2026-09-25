import { PagePlaceholder } from '@/components/common/PagePlaceholder';
import { FileText } from 'lucide-react';

export function DocumentsPage() {
  return (
    <PagePlaceholder
      title="Medical Documents"
      description="Upload and organize your medical records, lab results, and prescriptions."
      icon={<FileText className="h-6 w-6" />}
      phase="a later phase"
    />
  );
}
