import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { ProfileSwitcher } from '@/components/profile/ProfileSwitcher';
import { useActiveProfile } from '@/context/ActiveProfileContext';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/check-ins': 'Daily Check-ins',
  '/exercise': 'Exercise & Activity',
  '/goals': 'Goals',
  '/nutrition': 'Nutrition',
  '/documents': 'Documents',
  '/timeline': 'Health Timeline',
  '/sharing': 'Sharing',
  '/family': 'Family Profiles',
  '/profile': 'Profile',
  '/ai-summary': 'AI Health Summary',
};

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, profile, signOut } = useAuth();
  const { selfProfile } = useActiveProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const title = pageTitles[location.pathname] || 'Personal Health Manager';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? 'User';

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
      <ProfileSwitcher />
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Account menu"
          aria-expanded={menuOpen}
          className="flex items-center gap-1 rounded-lg p-1.5 hover:bg-neutral-100"
        >
          <ProfileAvatar
            profile={{ display_name: displayName, avatar_url: selfProfile?.avatar_url ?? null }}
            size="sm"
          />
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg animate-fade-in">
            <p className="truncate border-b border-neutral-100 px-4 py-2 text-xs text-neutral-500">
              {user?.email}
            </p>
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate('/profile');
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Profile settings
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-error-600 hover:bg-error-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
      </div>
    </header>
  );
}
