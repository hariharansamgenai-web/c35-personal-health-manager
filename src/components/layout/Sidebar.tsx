import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, HeartPulse, Dumbbell, Target, Apple, FileText,
  Calendar, Share2, Users, User, Sparkles, Watch,
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
          {/* PulsePath — Golden Heart logo */}
          <div style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            background: 'linear-gradient(145deg,#1a2340,#0e1628)',
            boxShadow: '0 0 18px rgba(245,158,11,.35), 0 2px 8px rgba(0,0,0,.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fbbf24"/>
                  <stop offset="100%" stopColor="#f59e0b"/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="1.2" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              {/* Heart outline — two arcs meeting at bottom point */}
              <path
                d="M13,21 C13,21 3,15 3,9 C3,6 5.5,4 8.5,4 C10.5,4 12,5 13,6.5 C14,5 15.5,4 17.5,4 C20.5,4 23,6 23,9 C23,15 13,21 13,21 Z"
                stroke="url(#hg)" strokeWidth="1.8" fill="none"
                strokeLinejoin="round" filter="url(#glow)"
              />
              {/* Outer glow ring — slightly larger, very faint */}
              <path
                d="M13,22 C13,22 1.5,15.5 1.5,8.5 C1.5,5 4.2,2.5 7.8,2.5 C10.2,2.5 12,3.8 13,5.5 C14,3.8 15.8,2.5 18.2,2.5 C21.8,2.5 24.5,5 24.5,8.5 C24.5,15.5 13,22 13,22 Z"
                stroke="#f59e0b" strokeWidth="0.6" fill="none" opacity="0.25"
              />
              {/* ECG line cutting through heart mid-section */}
              <path
                d="M4,12.5 L7.5,12.5 L9,9.5 L11,15.5 L12.5,11 L14,12.5 L16,12.5 L17.5,9.5 L19,15.5 L20.5,12.5 L22,12.5"
                stroke="#fbbf24" strokeWidth="1.5" fill="none"
                strokeLinecap="round" strokeLinejoin="round"
                filter="url(#glow)"
              />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-.03em' }}>
              PulsePath
            </p>
            <p style={{ fontSize: 9, color: 'rgba(245,158,11,.5)', marginTop: 3, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
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
