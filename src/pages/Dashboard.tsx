import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity, AlertTriangle, Bell, BellRing, Brain, CheckCircle2,
  ChevronRight, Clock, Droplet, FileText, HeartPulse,
  Moon, Phone, Plus, Sparkles, Target, TrendingDown, TrendingUp,
  Users, Watch, X, Zap,
} from 'lucide-react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { Loading } from '@/components/feedback/Loading';
import { ErrorState } from '@/components/feedback/ErrorState';

import { useCheckIns } from '@/hooks/useCheckIns';
import { useGoals } from '@/hooks/useGoals';
import { loadDemoData } from '@/lib/checkins';
import {
  GLUCOSE, SLEEP_GOAL_HOURS, STEP_GOAL, WATER_GOAL_ML,
  addDays, computeStats, dateRange, evaluateAlerts, findInsights,
  inWindow, loggingStreak, todayISO,
} from '@/lib/health';

// ─── Emergency modal ────────────────────────────────────────────────────────
const FAMILY_CONTACTS = [
  { name: 'Shirpi (Partner)', relation: 'Partner', phone: '+6591234567', avatar: 'S' },
  { name: 'Amma',             relation: 'Mother',  phone: '+919876543210', avatar: 'A' },
  { name: 'Dr. Priya Nair',  relation: 'Doctor',  phone: '+6562345678', avatar: 'P' },
];

function EmergencyModal({ onClose }: { onClose: () => void }) {
  const [called, setCalled] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(5);
  const [autoSent, setAutoSent] = useState(false);

  // 5-second auto-cancel countdown
  useMemo(() => {
    if (autoSent) return;
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(t);
          setAutoSent(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [autoSent]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420, borderRadius: 20, overflow: 'hidden',
          background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,.4)',
          boxShadow: '0 0 60px rgba(239,68,68,.25)',
        }}
      >
        {/* Red header */}
        <div style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', padding: '20px 24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BellRing style={{ width: 22, height: 22, color: '#fff' }} className="animate-pulse" />
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>
                  Emergency Alert
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>
                  {autoSent ? 'Alert sent to all contacts' : `Auto-sending in ${countdown}s`}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{ color: 'rgba(255,255,255,.6)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>
          {/* Progress bar */}
          {!autoSent && (
            <div style={{ marginTop: 14, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.2)' }}>
              <div style={{
                height: '100%', borderRadius: 2, background: '#fff',
                width: `${((5 - countdown) / 5) * 100}%`,
                transition: 'width 1s linear',
              }} />
            </div>
          )}
        </div>

        {/* Contacts */}
        <div style={{ padding: '16px 20px 20px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Call family &amp; care team
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAMILY_CONTACTS.map(c => {
              const wasCalled = called.includes(c.phone);
              return (
                <a
                  key={c.phone}
                  href={`tel:${c.phone}`}
                  onClick={() => setCalled(p => [...p, c.phone])}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 12, textDecoration: 'none',
                    background: wasCalled ? 'var(--good-bg)' : 'var(--bg-card-2,var(--bg-card))',
                    border: `1px solid ${wasCalled ? 'rgba(16,185,129,.3)' : 'var(--border)'}`,
                    transition: 'all .2s',
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: wasCalled ? 'var(--good)' : '#dc2626',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#fff',
                  }}>{wasCalled ? '✓' : c.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.relation} · {c.phone}</p>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600,
                    color: wasCalled ? 'var(--good-text)' : '#dc2626',
                  }}>
                    <Phone style={{ width: 14, height: 14 }} />
                    {wasCalled ? 'Called' : 'Call now'}
                  </div>
                </a>
              );
            })}
          </div>

          {/* SMS all button */}
          <button
            onClick={() => {
              setCalled(FAMILY_CONTACTS.map(c => c.phone));
            }}
            style={{
              marginTop: 12, width: '100%', padding: '10px',
              borderRadius: 10, border: 'none', cursor: 'pointer',
              background: '#dc2626', color: '#fff',
              fontSize: 13, fontWeight: 700, letterSpacing: '.02em',
            }}
          >
            🚨 Alert all contacts — I need help
          </button>
          <button onClick={onClose} style={{
            marginTop: 8, width: '100%', padding: '8px',
            borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer',
            background: 'transparent', color: 'var(--text-secondary)', fontSize: 13,
          }}>
            I'm OK — Cancel alert
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Attention card ──────────────────────────────────────────────────────────
function AttentionCard({
  icon, color, bg, title, subtitle, action, actionLabel,
}: {
  icon: React.ReactNode; color: string; bg: string;
  title: string; subtitle: string; action: () => void; actionLabel: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
      borderRadius: 14, border: `1px solid ${color}33`, background: bg,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: `${color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</p>
      </div>
      <button onClick={action} style={{
        padding: '5px 11px', borderRadius: 8, border: `1px solid ${color}44`,
        background: `${color}18`, color, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
      }}>
        {actionLabel}
      </button>
    </div>
  );
}

// ─── Habit ring ──────────────────────────────────────────────────────────────
function HabitRing({
  label, value, max, unit, color, sublabel,
}: { label: string; value: number | null; max: number; unit: string; color: string; sublabel?: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const pct = value !== null ? Math.min(value / max, 1) : 0;
  const dash = circ * pct;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke={`${color}22`} strokeWidth="7"/>
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            transform="rotate(-90 36 36)"
            style={{ transition: 'stroke-dasharray .6s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <p style={{ fontSize: 13, fontWeight: 800, color, lineHeight: 1, letterSpacing: '-.02em' }}>
            {value !== null ? (unit === 'h' ? value.toFixed(1) : Math.round(value).toLocaleString()) : '–'}
          </p>
          <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{unit}</p>
        </div>
      </div>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>{label}</p>
      {sublabel && <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: -4 }}>{sublabel}</p>}
    </div>
  );
}

// ─── KPI tile ────────────────────────────────────────────────────────────────
function KpiTile({ label, value, unit, tone, note }: {
  label: string; value: string; unit: string; tone: 'good' | 'warn' | 'danger' | 'neutral'; note?: React.ReactNode;
}) {
  const colors = { good: '#10b981', warn: '#f59e0b', danger: '#ef4444', neutral: 'var(--accent)' };
  const bgs    = { good: 'rgba(16,185,129,.08)', warn: 'rgba(245,158,11,.08)', danger: 'rgba(239,68,68,.08)', neutral: 'var(--accent-bg)' };
  const c = colors[tone]; const bg = bgs[tone];
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 16, background: bg,
      border: `1px solid ${c}33`,
      borderTop: `3px solid ${c}`,
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 30, fontWeight: 800, color: c, letterSpacing: '-.04em', lineHeight: 1 }}>
        {value}<span style={{ fontSize: 13, fontWeight: 500, marginLeft: 3, color: 'var(--text-muted)' }}>{unit}</span>
      </p>
      {note && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>{note}</p>}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { activeProfile } = useActiveProfile();
  const navigate = useNavigate();
  const { checkIns, loading, error, reload } = useCheckIns(activeProfile?.id, 14);
  const { goals } = useGoals(activeProfile?.id);
  const [seeding, setSeeding] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);

  const today = todayISO();
  const days = useMemo(() => dateRange(today, 7), [today]);

  const view = useMemo(() => {
    const week     = inWindow(checkIns, today, 7);
    const previous = inWindow(checkIns, addDays(today, -7), 7);
    return {
      week, previous,
      stats:     computeStats(week),
      prevStats:  computeStats(previous),
      alerts:    evaluateAlerts(checkIns, today),
      insights:  findInsights(week, previous),
      streak:    loggingStreak(checkIns, today),
      todayEntry: checkIns.find(c => c.date === today) ?? null,
    };
  }, [checkIns, today]);

  if (!activeProfile) return <Loading label="Loading profile" />;
  if (loading && checkIns.length === 0) return <Loading label="Loading dashboard" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const name = activeProfile.display_name;
  const { stats, prevStats, alerts, insights, streak, todayEntry, week } = view;
  const fastingDiff = stats.avgFasting !== null && prevStats.avgFasting !== null
    ? stats.avgFasting - prevStats.avgFasting : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Today at-a-glance values
  const todayMeds  = todayEntry?.meds_taken;
  const todaySteps = todayEntry?.steps ?? null;
  const todayWater = todayEntry?.water_ml ?? null;
  const todaySleep = todayEntry?.sleep_hours ?? null;

  // Attention items
  const attentionItems = [
    todayMeds === false && {
      icon: <HeartPulse style={{ width: 18, height: 18, color: '#ef4444' }} />,
      color: '#ef4444', bg: 'rgba(239,68,68,.05)',
      title: 'Medication due', subtitle: 'Evening dose not logged',
      action: () => navigate('/check-ins'), actionLabel: 'Log dose',
    },
    (todayWater !== null && todayWater < WATER_GOAL_ML * 0.7) && {
      icon: <Droplet style={{ width: 18, height: 18, color: '#0ea5e9' }} />,
      color: '#0ea5e9', bg: 'rgba(14,165,233,.05)',
      title: 'Hydration low', subtitle: `${(WATER_GOAL_ML - (todayWater ?? 0)).toLocaleString()} ml remaining`,
      action: () => navigate('/check-ins'), actionLabel: 'Add water',
    },
    (todaySleep !== null && todaySleep < SLEEP_GOAL_HOURS * 0.85) && {
      icon: <Moon style={{ width: 18, height: 18, color: '#a78bfa' }} />,
      color: '#a78bfa', bg: 'rgba(167,139,250,.05)',
      title: 'Sleep below goal', subtitle: `Logged ${todaySleep?.toFixed(1)}h, goal is ${SLEEP_GOAL_HOURS}h`,
      action: () => navigate('/check-ins'), actionLabel: 'View',
    },
  ].filter(Boolean) as Array<{
    icon: React.ReactNode; color: string; bg: string;
    title: string; subtitle: string; action: () => void; actionLabel: string;
  }>;

  const onTrack = 5 - attentionItems.length; // simplified

  const trendTone = fastingDiff === null ? 'neutral'
    : fastingDiff <= -5 ? 'good'
    : fastingDiff <= 5  ? 'neutral'
    : 'warn';

  const hasData = checkIns.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        background: 'linear-gradient(135deg,rgba(13,148,136,.12) 0%,rgba(14,165,233,.06) 100%)',
        borderRadius: 20, padding: '18px 20px',
        border: '1px solid var(--border)',
      }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{greeting}</p>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-.03em', lineHeight: 1.1, marginTop: 2 }}>
            {name} 👋
          </h2>
          {todayEntry ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <CheckCircle2 style={{ width: 14, height: 14, color: '#10b981' }} />
              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Today logged</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· {streak} day streak 🔥</span>
            </div>
          ) : (
            <button onClick={() => navigate('/check-ins')} style={{
              marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 10, background: '#0d9488', color: '#fff',
              fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
            }}>
              <Plus style={{ width: 13, height: 13 }} />
              Log today's check-in
            </button>
          )}
        </div>

        {/* Emergency bell */}
        <button
          onClick={() => setShowEmergency(true)}
          title="Emergency — alert family"
          style={{
            width: 52, height: 52, borderRadius: 16, border: '2px solid rgba(239,68,68,.4)',
            background: 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, transition: 'all .2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,.2)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,.1)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,.4)';
          }}
        >
          <Bell style={{ width: 22, height: 22, color: '#ef4444' }} />
        </button>
      </div>

      {/* ── Today's health summary strip ───────────────────────────── */}
      {hasData && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10,
        }}>
          {[
            { label: 'On Track',  count: Math.max(0, onTrack), icon: '✅', color: '#10b981' },
            { label: 'Attention', count: attentionItems.length, icon: '⚠️',  color: '#f59e0b' },
            { label: 'Urgent',    count: alerts.filter(a => a.severity === 'critical').length, icon: '🚨', color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '12px 14px', borderRadius: 14,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.count}</p>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Needs your attention ───────────────────────────────────── */}
      {attentionItems.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle style={{ width: 13, height: 13 }} /> Needs your attention
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {attentionItems.map((a, i) => <AttentionCard key={i} {...a} />)}
          </div>
        </div>
      )}

      {/* ── No data empty state ─────────────────────────────────────── */}
      {!hasData && (
        <div style={{
          textAlign: 'center', padding: '32px 24px', borderRadius: 20,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
        }}>
          <HeartPulse style={{ width: 40, height: 40, color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Start with today's check-in</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, marginBottom: 16 }}>
            Log medication, blood sugar and habits. Your dashboard populates after a few days.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <button onClick={() => navigate('/check-ins')} style={{
              padding: '8px 18px', borderRadius: 10, background: '#0d9488', color: '#fff',
              fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
            }}>Log today</button>
            <button
              onClick={async () => {
                if (!activeProfile) return;
                setSeeding(true);
                try { await loadDemoData(activeProfile.id); await reload(); }
                finally { setSeeding(false); }
              }}
              disabled={seeding}
              style={{
                padding: '8px 18px', borderRadius: 10, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-secondary)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {seeding ? 'Loading…' : 'Load demo data'}
            </button>
          </div>
        </div>
      )}

      {hasData && (<>

        {/* ── Today snapshot ─────────────────────────────────────────── */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Today
          </p>
          <div style={{
            padding: '14px 16px', borderRadius: 16,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', fontSize: 13 }}>
              {([
                { icon: <HeartPulse style={{ width: 14, height: 14, color: '#ef4444' }} />, label: `Medication ${todayMeds === true ? '✓' : todayMeds === false ? '✗' : '–'}`, color: todayMeds === true ? '#10b981' : todayMeds === false ? '#ef4444' : 'var(--text-muted)' },
                { icon: <Activity style={{ width: 14, height: 14, color: '#0d9488' }} />, label: `Steps ${todaySteps !== null ? todaySteps.toLocaleString() : '–'}`, color: todaySteps !== null && todaySteps >= STEP_GOAL ? '#10b981' : 'var(--text-secondary)' },
                { icon: <Droplet style={{ width: 14, height: 14, color: '#0ea5e9' }} />, label: `Water ${todayWater !== null ? (todayWater / 1000).toFixed(1) + 'L' : '–'}`, color: todayWater !== null && todayWater >= WATER_GOAL_ML ? '#10b981' : 'var(--text-secondary)' },
                { icon: <Moon style={{ width: 14, height: 14, color: '#a78bfa' }} />, label: `Sleep ${todaySleep !== null ? todaySleep.toFixed(1) + 'h' : '–'}`, color: todaySleep !== null && todaySleep >= SLEEP_GOAL_HOURS ? '#10b981' : 'var(--text-secondary)' },
                ...(todayEntry?.glucose_fasting != null ? [{ icon: <Zap style={{ width: 14, height: 14, color: '#f59e0b' }} />, label: `Fasting ${todayEntry.glucose_fasting} mg/dL`, color: todayEntry.glucose_fasting <= GLUCOSE.FASTING_MAX ? '#10b981' : '#f59e0b' }] : []),
              ] as Array<{ icon: React.ReactNode; label: string; color: string }>).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {item.icon}
                  <span style={{ color: item.color, fontWeight: 500 }}>{item.label}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/check-ins')} style={{
              marginTop: 12, fontSize: 11, fontWeight: 600, color: 'var(--accent)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Edit today's check-in <ChevronRight style={{ width: 12, height: 12 }} />
            </button>
          </div>
        </div>

        {/* ── KPI tiles ──────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          <KpiTile
            label="Fasting sugar · 7-day avg"
            value={stats.avgFasting === null ? '–' : Math.round(stats.avgFasting).toString()}
            unit="mg/dL"
            tone={stats.avgFasting === null ? 'neutral' : stats.avgFasting <= GLUCOSE.FASTING_MAX ? 'good' : 'warn'}
            note={fastingDiff === null ? `Target ${GLUCOSE.FASTING_MIN}–${GLUCOSE.FASTING_MAX}` : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {fastingDiff <= 0 ? <TrendingDown style={{ width: 11, height: 11 }} /> : <TrendingUp style={{ width: 11, height: 11 }} />}
                {Math.abs(Math.round(fastingDiff))} vs last week
              </span>
            )}
          />
          <KpiTile
            label="Time in range"
            value={stats.timeInRange === null ? '–' : Math.round(stats.timeInRange).toString()}
            unit="%"
            tone={stats.timeInRange === null ? 'neutral' : stats.timeInRange >= 70 ? 'good' : 'warn'}
            note="70–180 mg/dL target"
          />
          <KpiTile
            label="Medication adherence"
            value={stats.adherence === null ? '–' : Math.round(stats.adherence).toString()}
            unit="%"
            tone={stats.adherence === null ? 'neutral' : stats.adherence >= 85 ? 'good' : 'danger'}
            note="of logged days this week"
          />
          <KpiTile
            label="Logging streak"
            value={streak.toString()}
            unit={streak === 1 ? 'day' : 'days'}
            tone={streak >= 5 ? 'good' : 'neutral'}
            note={`${stats.loggedDays} of 7 days logged`}
          />
        </div>

        {/* ── Habit rings ─────────────────────────────────────────────── */}
        <div style={{
          padding: '16px 20px', borderRadius: 18,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
              Weekly habits
            </p>
            <Link to="/check-ins" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>See all</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            <HabitRing label="Steps" value={stats.avgSteps} max={STEP_GOAL} unit="avg" color="#0d9488"
              sublabel={`Goal ${(STEP_GOAL/1000).toFixed(0)}k`} />
            <HabitRing label="Water" value={stats.avgWater !== null ? stats.avgWater / 1000 : null} max={WATER_GOAL_ML / 1000} unit="L" color="#0ea5e9"
              sublabel={`Goal ${(WATER_GOAL_ML/1000).toFixed(1)}L`} />
            <HabitRing label="Sleep" value={stats.avgSleep} max={SLEEP_GOAL_HOURS} unit="h" color="#a78bfa"
              sublabel={`Goal ${SLEEP_GOAL_HOURS}h`} />
            <HabitRing label="Mood" value={week.filter(c => c.mood === 'good' || c.mood === 'great').length} max={7} unit="days" color="#f472b6"
              sublabel="Good mood days" />
          </div>
        </div>

        {/* ── 7-day glucose heatmap ───────────────────────────────────── */}
        <div style={{
          padding: '16px 20px', borderRadius: 18,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Blood sugar · 7-day heatmap</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Each day coloured by fasting reading</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {[{ label: 'In range', color: '#10b981' }, { label: 'Watch', color: '#f59e0b' }, { label: 'High', color: '#ef4444' }].map(l => (
                <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, display: 'inline-block' }} />{l.label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
            {days.map(day => {
              const entry = week.find(c => c.date === day);
              const glucose = entry?.glucose_fasting ?? null;
              const tone = glucose === null ? 'none'
                : glucose <= GLUCOSE.FASTING_MAX ? 'good'
                : glucose <= 180 ? 'warn' : 'danger';
              const bg = tone === 'good' ? 'rgba(16,185,129,.18)' : tone === 'warn' ? 'rgba(245,158,11,.18)' : tone === 'danger' ? 'rgba(239,68,68,.18)' : 'var(--bg-card-2,var(--bg-card))';
              const border = tone === 'good' ? 'rgba(16,185,129,.35)' : tone === 'warn' ? 'rgba(245,158,11,.35)' : tone === 'danger' ? 'rgba(239,68,68,.35)' : 'var(--border)';
              const textColor = tone === 'good' ? '#10b981' : tone === 'warn' ? '#f59e0b' : tone === 'danger' ? '#ef4444' : 'var(--text-muted)';
              const dayLabel = new Date(day + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' });
              return (
                <div key={day} style={{
                  borderRadius: 10, padding: '10px 6px', textAlign: 'center',
                  background: bg, border: `1px solid ${border}`,
                }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>{dayLabel}</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: textColor, letterSpacing: '-.03em', lineHeight: 1 }}>
                    {glucose !== null ? glucose : '–'}
                  </p>
                  <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>mg/dL</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Medication streak tracker ────────────────────────────────── */}
        <div style={{
          padding: '16px 20px', borderRadius: 18,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Medication streak</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Last 7 days · tap a day to log</p>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              background: stats.adherence !== null && stats.adherence >= 85 ? 'rgba(16,185,129,.15)' : 'rgba(245,158,11,.15)',
              color: stats.adherence !== null && stats.adherence >= 85 ? '#10b981' : '#f59e0b',
            }}>
              {stats.adherence !== null ? `${Math.round(stats.adherence)}% adherence` : 'No data'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
            {days.map(day => {
              const entry = week.find(c => c.date === day);
              const taken = entry?.meds_taken;
              const dayLabel = new Date(day + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' });
              const isToday = day === today;
              return (
                <div key={day}
                  onClick={() => navigate('/check-ins')}
                  style={{
                    borderRadius: 10, padding: '10px 4px', textAlign: 'center', cursor: 'pointer',
                    background: taken === true ? 'rgba(16,185,129,.15)' : taken === false ? 'rgba(239,68,68,.1)' : 'var(--bg-card-2,var(--bg-card))',
                    border: `${isToday ? '2px' : '1px'} solid ${taken === true ? 'rgba(16,185,129,.4)' : taken === false ? 'rgba(239,68,68,.3)' : 'var(--border)'}`,
                  }}
                >
                  <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>{dayLabel}</p>
                  <div style={{ fontSize: 18, lineHeight: 1 }}>
                    {taken === true ? '💊' : taken === false ? '✗' : '○'}
                  </div>
                  <p style={{ fontSize: 9, marginTop: 5, fontWeight: 600,
                    color: taken === true ? '#10b981' : taken === false ? '#ef4444' : 'var(--text-muted)' }}>
                    {taken === true ? 'Taken' : taken === false ? 'Missed' : 'Not logged'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Weekly check-in summary ──────────────────────────────────── */}
        <div style={{
          padding: '16px 20px', borderRadius: 18,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>This week at a glance</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Daily log completeness · last 7 days</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
              {stats.loggedDays}/7 days logged
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...days].reverse().slice(0, 5).map(day => {
              const entry = week.find(c => c.date === day);
              if (!entry) return (
                <div key={day} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  borderRadius: 10, border: '1px solid var(--border)', opacity: .45,
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', minWidth: 34 }}>
                    {new Date(day + 'T12:00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Not logged</span>
                </div>
              );
              const chips = [
                entry.meds_taken !== null && { label: entry.meds_taken ? '💊 Meds ✓' : '💊 Missed', ok: entry.meds_taken },
                entry.glucose_fasting !== null && { label: `🩸 ${entry.glucose_fasting}`, ok: entry.glucose_fasting <= GLUCOSE.FASTING_MAX },
                entry.steps !== null && { label: `👣 ${(entry.steps / 1000).toFixed(1)}k`, ok: entry.steps >= STEP_GOAL },
                entry.water_ml !== null && { label: `💧 ${(entry.water_ml / 1000).toFixed(1)}L`, ok: entry.water_ml >= WATER_GOAL_ML },
                entry.sleep_hours !== null && { label: `😴 ${entry.sleep_hours.toFixed(1)}h`, ok: entry.sleep_hours >= SLEEP_GOAL_HOURS },
              ].filter(Boolean) as Array<{ label: string; ok: boolean | null }>;
              const isToday = day === today;
              return (
                <div key={day} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  borderRadius: 10,
                  border: `1px solid ${isToday ? 'rgba(13,148,136,.4)' : 'var(--border)'}`,
                  background: isToday ? 'rgba(13,148,136,.06)' : 'transparent',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isToday ? '#0d9488' : 'var(--text-secondary)', minWidth: 56, flexShrink: 0 }}>
                    {isToday ? 'Today' : new Date(day + 'T12:00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric' })}
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, flex: 1 }}>
                    {chips.map((chip, i) => (
                      <span key={i} style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                        background: chip.ok ? 'rgba(16,185,129,.12)' : chip.ok === false ? 'rgba(239,68,68,.1)' : 'var(--bg-card)',
                        color: chip.ok ? '#10b981' : chip.ok === false ? '#ef4444' : 'var(--text-muted)',
                        border: `1px solid ${chip.ok ? 'rgba(16,185,129,.25)' : chip.ok === false ? 'rgba(239,68,68,.2)' : 'var(--border)'}`,
                      }}>{chip.label}</span>
                    ))}
                    {chips.length === 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No readings logged</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── AI Insights ─────────────────────────────────────────────── */}
        <div style={{
          padding: '16px 20px', borderRadius: 18,
          background: 'linear-gradient(135deg,rgba(192,132,252,.08),rgba(129,140,248,.08))',
          border: '1px solid rgba(192,132,252,.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain style={{ width: 16, height: 16, color: '#c084fc' }} />
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>AI Insights</p>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: 'rgba(192,132,252,.18)', color: '#c084fc', letterSpacing: '.04em',
            }}>
              {trendTone === 'good' ? '↑ Improving' : trendTone === 'warn' ? '! Watch' : '→ Stable'}
            </span>
          </div>
          {insights.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Patterns appear after a few days of logs.</p>
          ) : (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {insights.slice(0, 3).map((ins, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <span style={{
                    marginTop: 5, width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: ins.tone === 'positive' ? '#10b981' : '#f59e0b',
                  }} />
                  {ins.text}
                </li>
              ))}
            </ul>
          )}
          <Link to="/ai-summary" style={{
            marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 700, color: '#c084fc', textDecoration: 'none',
          }}>
            <Sparkles style={{ width: 13, height: 13 }} />
            Generate full AI summary
          </Link>
        </div>

        {/* ── Quick access ────────────────────────────────────────────── */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Quick access
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
            {[
              { icon: FileText,  label: 'Health Vault',    sub: 'Lab reports & docs',   to: '/documents', color: '#60a5fa' },
              { icon: Watch,     label: 'Wearables',       sub: 'Devices & sync',        to: '/wearables', color: '#4ade80' },
              { icon: Users,     label: 'Family',          sub: 'Profiles & sharing',    to: '/family',    color: '#fbbf24' },
              { icon: Clock,     label: 'History',         sub: 'Full timeline',          to: '/timeline',  color: '#f472b6' },
            ].map(q => (
              <Link key={q.to} to={q.to} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)',
                textDecoration: 'none', transition: 'border-color .2s',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `${q.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <q.icon style={{ width: 17, height: 17, color: q.color }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{q.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{q.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Goals mini strip ────────────────────────────────────────── */}
        {goals.filter(g => g.status === 'active').length > 0 && (
          <div style={{
            padding: '14px 18px', borderRadius: 16,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Active goals</p>
              <Link to="/goals" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>See all</Link>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {goals.filter(g => g.status === 'active').slice(0, 4).map(g => (
                <span key={g.id} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: 'rgba(13,148,136,.1)', color: '#0d9488', border: '1px solid rgba(13,148,136,.2)',
                }}>
                  <Target style={{ width: 11, height: 11 }} />{g.title}
                </span>
              ))}
            </div>
          </div>
        )}

        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
          Targets are defaults for adults with Type 2 Diabetes. This app does not replace medical advice.
        </p>
      </>)}

      {/* ── Emergency modal ─────────────────────────────────────────── */}
      {showEmergency && <EmergencyModal onClose={() => setShowEmergency(false)} />}
    </div>
  );
}
