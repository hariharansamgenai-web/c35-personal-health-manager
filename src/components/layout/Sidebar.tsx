import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  HeartPulse,
  Dumbbell,
  Target,
  Apple,
  FileText,
  Calendar,
  Share2,
  Users,
  User,
  Sparkles,
  Activity, Watch} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/check-ins', label: 'Check-ins', icon: HeartPulse },
  { to: '/exercise', label: 'Exercise', icon: Dumbbell },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/nutrition', label: 'Nutrition', icon: Apple },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/timeline', label: 'Timeline', icon: Calendar },
  { to: '/sharing', label: 'Sharing', icon: Share2 },
  { to: '/family', label: 'Family', icon: Users },
  { to: '/ai-summary', label: 'AI Summary', icon: Sparkles },
  { to: '/wearables', label: 'Wearables', icon: Watch },
];

const accountItems = [
  { to: '/profile', label: 'Profile', icon: User },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto px-3 py-4">
      <div className="mb-4 flex items-center gap-2 px-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <span className="text-sm font-bold text-neutral-900">Health Manager</span>
      </div>

      <div className="mb-2 px-3 text-2xs font-semibold uppercase tracking-wider text-neutral-400">
        Main
      </div>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn('nav-link', isActive && 'nav-link-active')
          }
        >
          <item.icon className="h-5 w-5 shrink-0" />
          <span>{item.label}</span>
        </NavLink>
      ))}

      <div className="mb-2 mt-4 px-3 text-2xs font-semibold uppercase tracking-wider text-neutral-400">
        Account
      </div>
      {accountItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn('nav-link', isActive && 'nav-link-active')
          }
        >
          <item.icon className="h-5 w-5 shrink-0" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
