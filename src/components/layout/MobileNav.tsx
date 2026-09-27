import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Apple, FileText, Grid2x2, X, Plus,
  Dumbbell, Target, Calendar, Share2, Sparkles, Watch, User, LogOut, Moon,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

const left = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/nutrition', label: 'Food', icon: Apple },
];
const right = [
  { to: '/documents', label: 'Vault', icon: FileText },
];

const more = [
  { to: '/exercise',   label: 'Exercise',   icon: Dumbbell,  color: '#34d399' },
  { to: '/goals',      label: 'Goals',      icon: Target,    color: '#a78bfa' },
  { to: '/timeline',   label: 'History',    icon: Calendar,  color: '#f472b6' },
  { to: '/ai-summary', label: 'AI Summary', icon: Sparkles,  color: '#c084fc' },
  { to: '/wearables',  label: 'Wearables',  icon: Watch,     color: '#4ade80' },
  { to: '/sharing',    label: 'Sharing',    icon: Share2,    color: '#38bdf8' },
  { to: '/profile',    label: 'Profile',    icon: User,      color: '#94a3b8' },
];

function Tab({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Home }) {
  return (
    <NavLink to={to} className="mnav-tab">
      {({ isActive }) => (
        <>
          <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.4 : 1.9}
            style={{ color: isActive ? 'var(--mnav-active)' : 'var(--mnav-idle)' }} />
          <span style={{ color: isActive ? 'var(--mnav-active)' : 'var(--mnav-idle)', fontWeight: isActive ? 700 : 500 }}>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isDark, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const moreActive = more.some((m) => location.pathname.startsWith(m.to));
  const onCheckIn = location.pathname.startsWith('/check-ins');

  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="All sections">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="mnav-sheet">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>All sections</p>
              <button onClick={() => setOpen(false)} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: 'var(--bg-page)', color: 'var(--text-secondary)' }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {more.map((m) => (
                <NavLink key={m.to} to={m.to} className="mnav-sheet-item">
                  {({ isActive }) => (
                    <>
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl"
                        style={{ background: `${m.color}${isActive ? '40' : '1f'}`, boxShadow: isActive ? `inset 0 0 0 1.5px ${m.color}` : undefined }}>
                        <m.icon className="h-[22px] w-[22px]" style={{ color: m.color }} />
                      </span>
                      <span className="text-[11.5px] font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>{m.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
            <button onClick={toggle} role="switch" aria-checked={isDark}
              className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3"
              style={{ background: 'var(--bg-page)', border: '1px solid var(--border)' }}>
              <span className="flex items-center gap-2.5 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                <Moon className="h-[18px] w-[18px]" style={{ color: '#8b5cf6' }} /> Dark mode
              </span>
              <span className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors"
                style={{ background: isDark ? '#8b5cf6' : 'var(--border)' }}>
                <span className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform"
                  style={{ transform: isDark ? 'translateX(24px)' : 'translateX(4px)' }} />
              </span>
            </button>
            <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
              style={{ background: 'var(--bg-page)', border: '1px solid var(--border)' }}>
              <p className="min-w-0 truncate text-[13px]" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
              <button onClick={() => { setOpen(false); signOut(); }}
                className="flex min-h-[40px] shrink-0 items-center gap-1.5 px-1 text-sm font-semibold" style={{ color: 'var(--danger)' }}>
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="mnav lg:hidden" aria-label="Main navigation">
        {left.map((t) => <Tab key={t.to} {...t} />)}

        <div className="mnav-fab-slot">
          <button
            onClick={() => navigate('/check-ins')}
            className="mnav-fab"
            aria-label="Log today's check-in"
            aria-current={onCheckIn ? 'page' : undefined}
          >
            <Plus className="h-7 w-7" strokeWidth={2.6} />
          </button>
          <span className="mnav-fab-label" style={{ color: onCheckIn ? 'var(--mnav-active)' : 'var(--mnav-idle)', fontWeight: onCheckIn ? 700 : 500 }}>Check-in</span>
        </div>

        {right.map((t) => <Tab key={t.to} {...t} />)}

        <button onClick={() => setOpen(true)} className="mnav-tab" aria-label="More sections" aria-expanded={open}>
          <Grid2x2 className="h-[22px] w-[22px]" strokeWidth={moreActive ? 2.4 : 1.9}
            style={{ color: moreActive ? 'var(--mnav-active)' : 'var(--mnav-idle)' }} />
          <span style={{ color: moreActive ? 'var(--mnav-active)' : 'var(--mnav-idle)', fontWeight: moreActive ? 700 : 500 }}>More</span>
        </button>
      </nav>
    </>
  );
}
