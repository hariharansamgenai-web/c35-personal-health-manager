import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, HeartPulse, Dumbbell, Target, Apple, FileText,
  Calendar, Share2, Users, User, Sparkles, Activity, Watch,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Each nav item gets a colour that appears on its icon bubble when active
const navItems = [
  { to: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard, color: '#63b3ed' },
  { to: '/check-ins',  label: 'Check-ins',   icon: HeartPulse,      color: '#f87171' },
  { to: '/exercise',   label: 'Exercise',    icon: Dumbbell,        color: '#34d399' },
  { to: '/goals',      label: 'Goals',       icon: Target,          color: '#a78bfa' },
  { to: '/nutrition',  label: 'Nutrition',   icon: Apple,           color: '#fb923c' },
  { to: '/documents',  label: 'Health Vault',   icon: FileText,        color: '#60a5fa' },
  { to: '/timeline',   label: 'History',    icon: Calendar,        color: '#f472b6' },
  { to: '/sharing',    label: 'Sharing',     icon: Share2,          color: '#38bdf8' },
  { to: '/family',     label: 'Family',      icon: Users,           color: '#fbbf24' },
  { to: '/ai-summary', label: 'AI Summary',  icon: Sparkles,        color: '#c084fc' },
  { to: '/wearables',  label: 'Wearable Devices',   icon: Watch,           color: '#4ade80' },
];

const accountItems = [
  { to: '/profile', label: 'Profile', icon: User, color: '#94a3b8' },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex h-full flex-col overflow-y-auto" style={{ padding: '0 0 8px' }}>

      {/* Logo lockup */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid rgba(255,255,255,.07)',
        marginBottom: '4px',
      }}>
        <div className="flex items-center gap-3">
          {/* PulsePath logo mark */}
          <div style={{
            width: 36, height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #0d9488, #0f766e)',
            boxShadow: '0 0 16px rgba(13,148,136,.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Activity style={{ width: 20, height: 20, color: '#fff', strokeWidth: 2.5 }} />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-.03em' }}>
              PulsePath
            </p>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,.45)', marginTop: 3, fontWeight: 500, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Small habits. Better health.
            </p>
          </div>
        </div>
      </div>

      {/* Section: Main */}
      <div style={{ flex: 1, padding: '8px 10px 0' }}>
        <p style={{
          fontSize: 9.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,.28)', padding: '4px 10px 8px',
        }}>Main</p>

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}
            style={({ isActive }) => isActive ? {
              // Active: colour-tinted glass pill
              background: `linear-gradient(135deg, ${item.color}22, ${item.color}11)`,
              boxShadow: `inset 0 0 0 1px ${item.color}33, 0 2px 8px ${item.color}1a`,
              color: '#fff',
            } : {}}
          >
            {({ isActive }) => (
              <>
                {/* Icon bubble */}
                <span style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? `${item.color}30` : 'rgba(255,255,255,.06)',
                  transition: 'background .15s',
                }}>
                  <item.icon style={{
                    width: 15, height: 15, strokeWidth: 2,
                    color: isActive ? item.color : 'rgba(255,255,255,.5)',
                    transition: 'color .15s',
                  }} />
                </span>
                <span style={{ fontSize: 13, transition: 'color .15s' }}>{item.label}</span>
                {/* Active indicator dot */}
                {isActive && (
                  <span style={{
                    marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%',
                    background: item.color, boxShadow: `0 0 6px ${item.color}`,
                  }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Divider */}
      <div style={{ margin: '8px 16px', height: 1, background: 'rgba(255,255,255,.07)' }} />

      {/* Section: Account */}
      <div style={{ padding: '0 10px 8px' }}>
        <p style={{
          fontSize: 9.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,.28)', padding: '4px 10px 8px',
        }}>Account</p>

        {accountItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}
            style={({ isActive }) => isActive ? {
              background: `linear-gradient(135deg, ${item.color}22, ${item.color}11)`,
              boxShadow: `inset 0 0 0 1px ${item.color}33`,
              color: '#fff',
            } : {}}
          >
            {({ isActive }) => (
              <>
                <span style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? `${item.color}30` : 'rgba(255,255,255,.06)',
                }}>
                  <item.icon style={{
                    width: 15, height: 15, strokeWidth: 2,
                    color: isActive ? item.color : 'rgba(255,255,255,.5)',
                  }} />
                </span>
                <span style={{ fontSize: 13 }}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Bottom: version badge */}
      <div style={{ padding: '0 16px 8px' }}>
        <div style={{
          borderRadius: 8, padding: '8px 12px',
          background: 'rgba(99,179,237,.07)',
          border: '1px solid rgba(99,179,237,.12)',
        }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', fontWeight: 600, letterSpacing: '.04em' }}>
            Group AIAP-G35
          </p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,.22)', marginTop: 1 }}>
            Hackathon build · Sep 2026
          </p>
        </div>
      </div>
    </nav>
  );
}
