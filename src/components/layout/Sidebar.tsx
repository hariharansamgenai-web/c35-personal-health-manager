import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, HeartPulse, Dumbbell, Target, Apple, FileText,
  Calendar, Share2, Users, User, Sparkles, Activity, Watch,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/check-ins',  label: 'Check-ins',   icon: HeartPulse },
  { to: '/exercise',   label: 'Exercise',    icon: Dumbbell },
  { to: '/goals',      label: 'Goals',       icon: Target },
  { to: '/nutrition',  label: 'Nutrition',   icon: Apple },
  { to: '/documents',  label: 'Documents',   icon: FileText },
  { to: '/timeline',   label: 'Timeline',    icon: Calendar },
  { to: '/sharing',    label: 'Sharing',     icon: Share2 },
  { to: '/family',     label: 'Family',      icon: Users },
  { to: '/ai-summary', label: 'AI Summary',  icon: Sparkles },
  { to: '/wearables',  label: 'Wearables',   icon: Watch },
];

const accountItems = [{ to: '/profile', label: 'Profile', icon: User }];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex h-full flex-col overflow-y-auto py-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--accent)' }}>
          <Activity className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Health<span style={{ color: 'var(--text-secondary)' }}>Mgr</span>
        </span>
      </div>

      {/* Main nav */}
      <div className="mt-4 flex-1 px-3">
        <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[.1em]" style={{ color: 'var(--text-muted)' }}>
          Main
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn('nav-link', isActive && 'nav-link-active')
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Account */}
      <div className="mt-auto px-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[.1em]" style={{ color: 'var(--text-muted)' }}>
          Account
        </p>
        {accountItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
