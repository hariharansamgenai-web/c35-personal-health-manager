import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { Loading } from '@/components/feedback/Loading';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ProfileForm } from '@/components/profile/ProfileForm';

export function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { selfProfile, loading, error, refresh } = useActiveProfile();
  const [saved, setSaved] = useState(false);

  if (loading && !selfProfile) return <Loading label="Loading your profile" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  if (!selfProfile) {
    return <ErrorState message="Your profile wasn’t found. Sign out and sign in again; if it persists, contact support." onRetry={refresh} />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">My profile</h2>
        <p className="mt-1 text-sm text-neutral-600">Signed in as {user?.email}</p>
      </div>
      <Card>
        <CardHeader title="Personal details" subtitle="Used to personalise your dashboard and summaries." className="mb-6" />
        <ProfileForm
          key={selfProfile.updated_at}
          profile={selfProfile}
          onSaved={async () => {
            await refresh();
            await refreshProfile();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
          }}
        />
        {saved && (
          <p role="status" className="mt-4 flex items-center gap-2 text-sm text-success-700">
            <CheckCircle2 className="h-4 w-4" />
            Profile saved.
          </p>
        )}
      </Card>
    </div>
  );
}
