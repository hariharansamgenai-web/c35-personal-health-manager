import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, HeartPulse, Dumbbell, Target, Apple, FileText,
  Calendar, Share2, User, Sparkles, Watch,
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
          {/* PulsePath — Dual-lobe gradient heart */}
          <div style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            background: '#000',
            boxShadow: '0 0 20px rgba(139,92,246,.3), 0 0 20px rgba(251,146,60,.25), 0 2px 8px rgba(0,0,0,.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="30" height="28" viewBox="0 0 30 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                {/* Left lobe: purple → blue */}
                <radialGradient id="lg" cx="35%" cy="30%" r="70%">
                  <stop offset="0%"   stopColor="#7c3aed"/>
                  <stop offset="60%"  stopColor="#4f46e5"/>
                  <stop offset="100%" stopColor="#2563eb"/>
                </radialGradient>
                {/* Right lobe: amber → orange */}
                <radialGradient id="rg" cx="65%" cy="25%" r="70%">
                  <stop offset="0%"   stopColor="#fde68a"/>
                  <stop offset="40%"  stopColor="#f59e0b"/>
                  <stop offset="100%" stopColor="#ea580c"/>
                </radialGradient>
                {/* Blend zone: purple-orange mix */}
                <radialGradient id="mg" cx="50%" cy="45%" r="60%">
                  <stop offset="0%"  stopColor="#c026d3" stopOpacity="0.9"/>
                  <stop offset="50%" stopColor="#9333ea" stopOpacity="0.7"/>
                  <stop offset="100%" stopColor="#7c2d12" stopOpacity="0.5"/>
                </radialGradient>
                <clipPath id="lc">
                  {/* Left lobe clip: left half of heart */}
                  <path d="M15,24 C15,24 2,17 2,9.5 C2,5.5 5,3 8.5,3 C11,3 13.5,4.5 15,7 L15,24 Z"/>
                </clipPath>
                <clipPath id="rc">
                  {/* Right lobe clip: right half of heart */}
                  <path d="M15,24 C15,24 28,17 28,9.5 C28,5.5 25,3 21.5,3 C19,3 16.5,4.5 15,7 L15,24 Z"/>
                </clipPath>
              </defs>

              {/* Full heart mask — both lobes together */}
              <path d="M15,24 C15,24 2,17 2,9.5 C2,5.5 5,3 8.5,3 C11.5,3 13.5,5 15,7 C16.5,5 18.5,3 21.5,3 C25,3 28,5.5 28,9.5 C28,17 15,24 15,24 Z"
                fill="#000"/>

              {/* Left lobe — purple/blue */}
              <path d="M15,24 C15,24 2,17 2,9.5 C2,5.5 5,3 8.5,3 C11.5,3 13.5,5 15,7 C16.5,5 18.5,3 21.5,3 C25,3 28,5.5 28,9.5 C28,17 15,24 15,24 Z"
                fill="url(#lg)" clipPath="url(#lc)"/>

              {/* Right lobe — amber/orange */}
              <path d="M15,24 C15,24 2,17 2,9.5 C2,5.5 5,3 8.5,3 C11.5,3 13.5,5 15,7 C16.5,5 18.5,3 21.5,3 C25,3 28,5.5 28,9.5 C28,17 15,24 15,24 Z"
                fill="url(#rg)" clipPath="url(#rc)"/>

              {/* Blend overlay — the intersection leaf shape in the centre */}
              <path d="M15,7 C13.5,9 12,12 12,14 C12,18 13.5,21 15,24 C16.5,21 18,18 18,14 C18,12 16.5,9 15,7 Z"
                fill="url(#mg)" opacity="0.85"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-.03em' }}>
              PulsePath
            </p>
            <p style={{ fontSize: 9, color: 'rgba(167,139,250,.6)', marginTop: 3, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
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
