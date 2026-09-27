import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, HeartPulse, Apple, FileText, Grid2x2, X,
  Dumbbell, Target, Calendar, Share2, Sparkles, Watch, User, LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const tabs = [
  { to: '/dashboard', label: 'Home',      icon: LayoutDashboard, color: '#63b3ed' },
  { to: '/check-ins', label: 'Check-in',  icon: HeartPulse,      color: '#f87171' },
  { to: '/nutrition', label: 'Food',      icon: Apple,           color: '#fb923c' },
  { to: '/documents', label: 'Vault',     icon: FileText,        color: '#60a5fa' },
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

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const moreActive = more.some((m) => location.pathname.startsWith(m.to));

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-label="More sections">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="mobile-sheet animate-sheet-up">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>All sections</p>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg p-1.5" style={{ color: 'var(--text-muted)' }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {more.map((m) => (
                <NavLink key={m.to} to={m.to} className="mobile-sheet-item">
                  {({ isActive }) => (
                    <>
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl"
                        style={{ background: isActive ? `${m.color}33` : `${m.color}1a` }}>
                        <m.icon className="h-5 w-5" style={{ color: m.color }} />
                      </span>
                      <span className="text-[11px] font-medium" style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {m.label}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
              style={{ background: 'var(--bg-page)', border: '1px solid var(--border)' }}>
              <p className="min-w-0 truncate text-xs" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
              <button onClick={() => { setOpen(false); signOut(); }}
                className="flex shrink-0 items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--danger)' }}>
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="mobile-tabbar lg:hidden" aria-label="Main navigation">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} className="mobile-tab">
            {({ isActive }) => (
              <>
                <span className="mobile-tab-icon" style={isActive ? { background: `${t.color}26` } : undefined}>
                  <t.icon className="h-5 w-5" style={{ color: isActive ? t.color : 'var(--text-muted)' }} strokeWidth={isActive ? 2.4 : 2} />
                </span>
                <span style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isActive ? 700 : 500 }}>{t.label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button onClick={() => setOpen(true)} className="mobile-tab" aria-label="More sections" aria-expanded={open}>
          <span className="mobile-tab-icon" style={moreActive ? { background: 'rgba(245,158,11,.18)' } : undefined}>
            <Grid2x2 className="h-5 w-5" style={{ color: moreActive ? '#f59e0b' : 'var(--text-muted)' }} />
          </span>
          <span style={{ color: moreActive ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: moreActive ? 700 : 500 }}>More</span>
        </button>
      </nav>
    </>
  );
}
