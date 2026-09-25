import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity, Award, CheckCircle2, Database, Droplet, FileText,
  HeartPulse, Moon, Sparkles, Target, TrendingDown, TrendingUp,
} from 'lucide-react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/feedback/Loading';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { AlertList } from '@/components/dashboard/AlertList';
import { StatTile } from '@/components/dashboard/StatTile';
import { MiniBars } from '@/components/dashboard/MiniBars';
import { GlucoseChart } from '@/components/health/GlucoseChart';
import { useCheckIns } from '@/hooks/useCheckIns';
import { useGoals } from '@/hooks/useGoals';
import { useActivities } from '@/hooks/useActivities';
import { loadDemoData } from '@/lib/checkins';
import { computeGoalProgress, GOAL_CATEGORY_LABELS } from '@/lib/goals';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  GLUCOSE, SLEEP_GOAL_HOURS, STEP_GOAL, WATER_GOAL_ML,
  addDays, computeStats, dateRange, evaluateAlerts, findInsights,
  inWindow, loggingStreak, longDate, todayISO,
} from '@/lib/health';

export function DashboardPage() {
  const { activeProfile } = useActiveProfile();
  const navigate = useNavigate();
  const { checkIns, loading, error, reload } = useCheckIns(activeProfile?.id, 14);
  const { goals } = useGoals(activeProfile?.id);
  const { activities } = useActivities(activeProfile?.id, 7);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  const today = todayISO();
  const days = useMemo(() => dateRange(today, 7), [today]);

  const view = useMemo(() => {
    const week = inWindow(checkIns, today, 7);
    const previous = inWindow(checkIns, addDays(today, -7), 7);
    return {
      week,
      previous,
      stats: computeStats(week),
      prevStats: computeStats(previous),
      alerts: evaluateAlerts(checkIns, today),
      insights: findInsights(week, previous),
      streak: loggingStreak(checkIns, today),
      todayEntry: checkIns.find((c) => c.date === today) ?? null,
    };
  }, [checkIns, today]);

  async function handleDemo() {
    if (!activeProfile) return;
    setSeeding(true);
    setSeedError(null);
    try {
      await loadDemoData(activeProfile.id);
      await reload();
    } catch (e) {
      setSeedError(e instanceof Error ? e.message : 'Could not load demo data.');
    } finally {
      setSeeding(false);
    }
  }

  if (!activeProfile) return <Loading label="Loading profile" />;
  if (loading && checkIns.length === 0) return <Loading label="Loading dashboard" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const name = activeProfile.display_name;

  if (checkIns.length === 0) {
    return (
      <div className="space-y-6">
        <Heading name={name} todayLogged={false} />
        <EmptyState
          icon={<HeartPulse className="h-6 w-6" />}
          title="Start with today's check-in"
          description="Log medication, blood sugar and a few habits. After a few days your trends, alerts and coach notes appear here."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => navigate('/check-ins')}>Log today</Button>
              <Button variant="outline" loading={seeding} onClick={handleDemo}>
                <Database className="h-4 w-4" />
                Load 14 days of demo data
              </Button>
            </div>
          }
        />
        {seedError && <p className="text-center text-sm" style={{ color: 'var(--danger)' }}>{seedError}</p>}
      </div>
    );
  }

  const { stats, prevStats, alerts, insights, streak, todayEntry, week } = view;
  const fastingDiff = stats.avgFasting !== null && prevStats.avgFasting !== null
    ? stats.avgFasting - prevStats.avgFasting : null;

  const activeGoals = goals.filter((g) => g.status === 'active');

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Heading name={name} todayLogged={!!todayEntry} />
        {todayEntry ? (
          <Link
            to="/check-ins"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold"
            style={{ background: 'var(--good-bg)', color: 'var(--good-text)' }}
          >
            <CheckCircle2 className="h-4 w-4" />
            Today is logged · Edit
          </Link>
        ) : (
          <Button onClick={() => navigate('/check-ins')}>Log today</Button>
        )}
      </div>

      {/* Alert rail */}
      {alerts.length > 0 && <AlertList alerts={alerts} />}

      {/* KPI row — 4 stat tiles with coloured top-stripe */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Fasting sugar · 7-day avg"
          value={stats.avgFasting === null ? '–' : Math.round(stats.avgFasting).toString()}
          unit="mg/dL"
          tone={stats.avgFasting === null ? 'neutral' : stats.avgFasting <= GLUCOSE.FASTING_MAX ? 'good' : 'watch'}
          note={
            fastingDiff === null ? `Target ${GLUCOSE.FASTING_MIN}–${GLUCOSE.FASTING_MAX}` : (
              <span className="inline-flex items-center gap-1">
                {fastingDiff <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                {Math.abs(Math.round(fastingDiff))} vs last week
              </span>
            )
          }
        />
        <StatTile
          label="Readings in range"
          value={stats.timeInRange === null ? '–' : Math.round(stats.timeInRange).toString()}
          unit="%"
          tone={stats.timeInRange === null ? 'neutral' : stats.timeInRange >= 70 ? 'good' : 'watch'}
          note="70–180 mg/dL"
        />
        <StatTile
          label="Medication taken"
          value={stats.adherence === null ? '–' : Math.round(stats.adherence).toString()}
          unit="%"
          tone={stats.adherence === null ? 'neutral' : stats.adherence >= 85 ? 'good' : 'watch'}
          note="of logged days this week"
        />
        <StatTile
          label="Logging streak"
          value={streak.toString()}
          unit={streak === 1 ? 'day' : 'days'}
          tone={streak >= 5 ? 'good' : 'neutral'}
          note={`${stats.loggedDays} of 7 days logged`}
        />
      </div>

      {/* Main 2-col: glucose chart + coach notes */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Blood sugar · last 7 days" subtitle="Red markers are below 70 or above 250 mg/dL" className="mb-4" />
          {week.some((c) => c.glucose_fasting !== null || c.glucose_post_meal !== null) ? (
            <GlucoseChart days={days} checkIns={week} />
          ) : (
            <p className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No blood-sugar readings this week yet.</p>
          )}
        </Card>

        <Card className="flex flex-col">
          <CardHeader title="Coach notes" subtitle="Patterns from your logs" className="mb-4" />
          {insights.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Patterns appear once there are a few days of readings, sleep and steps to compare.
            </p>
          ) : (
            <ul className="space-y-3">
              {insights.slice(0, 4).map((i) => (
                <li key={i.text} className="flex gap-2.5 text-sm leading-snug" style={{ color: 'var(--text-secondary)' }}>
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: i.tone === 'positive' ? 'var(--good)' : 'var(--warn)' }}
                    aria-hidden
                  />
                  {i.text}
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/ai-summary"
            className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            <Sparkles className="h-4 w-4" />
            Generate AI summary
          </Link>
        </Card>
      </div>

      {/* Habit row: Steps / Water / Sleep / Weight */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HabitCard
          title="Steps"
          icon={<Activity className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />}
          value={stats.avgSteps === null ? null : Math.round(stats.avgSteps)}
          unit="avg/day"
          goal={STEP_GOAL}
          goalLabel={`Goal ${STEP_GOAL.toLocaleString()}`}
        >
          <MiniBars days={days} checkIns={week} field="steps" goal={STEP_GOAL} color="secondary" format={(v) => `${v.toLocaleString()} steps`} />
        </HabitCard>

        <HabitCard
          title="Water"
          icon={<Droplet className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />}
          value={stats.avgWater === null ? null : Math.round(stats.avgWater)}
          unit="ml avg/day"
          goal={WATER_GOAL_ML}
          goalLabel={`Goal ${(WATER_GOAL_ML / 1000).toFixed(1)} L`}
        >
          <MiniBars days={days} checkIns={week} field="water_ml" goal={WATER_GOAL_ML} color="primary" format={(v) => `${v} ml`} />
        </HabitCard>

        <HabitCard
          title="Sleep"
          icon={<Moon className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />}
          value={stats.avgSleep === null ? null : stats.avgSleep}
          unit="h avg/night"
          goal={SLEEP_GOAL_HOURS}
          goalLabel={`Goal ${SLEEP_GOAL_HOURS} h`}
          decimals={1}
        >
          <MiniBars days={days} checkIns={week} field="sleep_hours" goal={SLEEP_GOAL_HOURS} color="accent" format={(v) => `${v} h`} />
        </HabitCard>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Weight</p>
          </div>
          {stats.latestWeight === null ? (
            <p className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Log your weight to see the trend.</p>
          ) : (
            <>
              <p className="text-4xl font-bold tabular-nums" style={{ color: 'var(--text-primary)', letterSpacing: '-.03em' }}>
                {stats.latestWeight.toFixed(1)}
                <span className="text-base font-medium ml-1" style={{ color: 'var(--text-muted)' }}>kg</span>
              </p>
              <p className="mt-2 text-xs" style={{ color: stats.weightChange && stats.weightChange < 0 ? 'var(--good)' : 'var(--text-muted)' }}>
                {stats.weightChange === null || stats.weightChange === 0
                  ? 'No change this week'
                  : stats.weightChange > 0
                    ? `↑ Up ${stats.weightChange.toFixed(1)} kg this week`
                    : `↓ Down ${Math.abs(stats.weightChange).toFixed(1)} kg this week`}
              </p>
            </>
          )}
        </Card>
      </div>

      {/* Bottom row: Goals + Recent check-ins + Records + Achievements */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Goals */}
        <Card>
          <CardHeader
            title="Goals"
            subtitle="Active targets · tracked from real data"
            className="mb-4"
            action={<Target className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />}
          />
          {activeGoals.length === 0 ? (
            <EmptyState
              icon={<Target className="h-5 w-5" />}
              title="No goals yet"
              description="Set a target like 8,000 steps a day to see progress here."
              action={<Button variant="outline" onClick={() => navigate('/goals')}>Open Goals</Button>}
            />
          ) : (
            <div className="space-y-4">
              {activeGoals.slice(0, 3).map((g) => {
                const progress = computeGoalProgress(g, checkIns, activities);
                return (
                  <div key={g.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{g.title}</span>
                      <span className="pill pill-good shrink-0">{GOAL_CATEGORY_LABELS[g.category]}</span>
                    </div>
                    {progress.measurable ? (
                      <ProgressBar value={progress.value ?? 0} max={progress.target ?? 1} />
                    ) : (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tracked manually</p>
                    )}
                  </div>
                );
              })}
              <Link to="/goals" className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                See all goals →
              </Link>
            </div>
          )}
        </Card>

        {/* Recent check-ins */}
        <Card>
          <CardHeader title="Recent check-ins" subtitle="Your last three entries" className="mb-4" />
          {week.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No check-ins this week yet.</p>
          ) : (
            <ul className="space-y-2">
              {[...week].reverse().slice(0, 3).map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg-card-2, var(--bg-card))' }}
                >
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{longDate(c.date)}</span>
                  <span className="flex flex-wrap gap-1.5">
                    {c.glucose_fasting !== null && (
                      <span className="pill" style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                        F {c.glucose_fasting}
                      </span>
                    )}
                    {c.glucose_post_meal !== null && (
                      <span className="pill" style={{ background: 'var(--warn-bg)', color: 'var(--warn-text)', border: '1px solid rgba(245,158,11,.2)' }}>
                        P {c.glucose_post_meal}
                      </span>
                    )}
                    {c.steps !== null && (
                      <span className="pill" style={{ background: 'var(--bg-card-2, var(--bg-card))', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        {c.steps.toLocaleString()} steps
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/check-ins" className="mt-4 inline-block text-sm font-semibold" style={{ color: 'var(--accent)' }}>
            See all check-ins →
          </Link>
        </Card>

        <Card>
          <CardHeader title="Recent medical records" className="mb-4" action={<FileText className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />} />
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="No records uploaded"
            description="Upload lab reports, prescriptions and scans in Documents."
          />
        </Card>

        <Card>
          <CardHeader title="Achievements" className="mb-4" action={<Award className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />} />
          <EmptyState
            icon={<Award className="h-5 w-5" />}
            title="Badges will appear here"
            description="Streaks and goal completions are awarded as you keep logging."
          />
        </Card>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Targets are common defaults for adults with Type 2 Diabetes. Your doctor may set different ones. This app does not replace medical advice.
      </p>
    </div>
  );
}

function Heading({ name, todayLogged }: { name: string; todayLogged: boolean }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-.02em' }}>
        {greeting}, {name}
      </h2>
      <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
        {todayLogged ? 'All caught up · blood sugar, medication and habits for the past week.' : 'Blood sugar, medication and habits for the past week.'}
      </p>
    </div>
  );
}

function HabitCard({
  title, icon, value, unit, goal, goalLabel, decimals = 0, children,
}: {
  title: string;
  icon: React.ReactNode;
  value: number | null;
  unit: string;
  goal: number;
  goalLabel: string;
  decimals?: number;
  children: React.ReactNode;
}) {
  const pct = value !== null ? Math.round((value / goal) * 100) : null;
  const tone = pct === null ? 'neutral' : pct >= 100 ? 'good' : pct >= 70 ? 'warn' : 'neutral';
  const valColor = tone === 'good' ? 'var(--good)' : tone === 'warn' ? 'var(--warn)' : 'var(--text-primary)';

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{title}</p>
        {icon}
      </div>
      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{goalLabel}</p>
      {value !== null && (
        <p className="text-sm font-semibold mb-2" style={{ color: valColor }}>
          Avg {decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString()} {unit}
        </p>
      )}
      {children}
    </Card>
  );
}
