import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { RELATIONSHIP_LABELS } from '@/lib/profiles';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { activeProfile, selfProfile, setActiveProfileId } = useActiveProfile();
  const viewingOther = activeProfile && selfProfile && activeProfile.id !== selfProfile.id;

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white lg:block">
        <Sidebar />
      </aside>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-neutral-200 bg-white animate-slide-in-right">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-6">
          <div className="mx-auto max-w-6xl">
            {viewingOther && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-2 text-sm text-secondary-900">
                <span>
                  Showing records for <strong>{activeProfile.display_name}</strong> (
                  {RELATIONSHIP_LABELS[activeProfile.relationship]})
                </span>
                <button
                  onClick={() => setActiveProfileId(selfProfile.id)}
                  className="font-medium text-secondary-800 underline hover:text-secondary-950"
                >
                  Back to my records
                </button>
              </div>
            )}
            {/* Remount the page when the profile changes so no data from the previous profile lingers. */}
            <Outlet key={activeProfile?.id ?? 'none'} />
          </div>
        </main>
      </div>
    </div>
  );
}
