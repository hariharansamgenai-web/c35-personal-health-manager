import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Award,
  CheckCircle2,
  Database,
  Droplet,
  FileText,
  HeartPulse,
  Moon,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
  GLUCOSE,
  SLEEP_GOAL_HOURS,
  STEP_GOAL,
  WATER_GOAL_ML,
  addDays,
  computeStats,
  dateRange,
  evaluateAlerts,
  findInsights,
  inWindow,
  loggingStreak,
  longDate,
  todayISO,
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
        <Heading name={name} />
        <EmptyState
          icon={<HeartPulse className="h-6 w-6" />}
          title="Start with today’s check-in"
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
        {seedError && <p className="text-center text-sm text-error-600">{seedError}</p>}
      </div>
    );
  }

  const { stats, prevStats, alerts, insights, streak, todayEntry, week } = view;
  const fastingDiff =
    stats.avgFasting !== null && prevStats.avgFasting !== null ? stats.avgFasting - prevStats.avgFasting : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Heading name={name} />
        {todayEntry ? (
          <Link to="/check-ins" className="inline-flex items-center gap-2 rounded-lg bg-success-50 px-3 py-2 text-sm font-medium text-success-800 hover:bg-success-100">
            <CheckCircle2 className="h-4 w-4" />
            Today is logged. Edit
          </Link>
        ) : (
          <Button onClick={() => navigate('/check-ins')}>Log today</Button>
        )}
      </div>

      <AlertList alerts={alerts} />

      {/* 1. Today's summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Fasting sugar, 7-day avg"
          value={stats.avgFasting === null ? '–' : Math.round(stats.avgFasting).toString()}
          unit="mg/dL"
          tone={stats.avgFasting === null ? 'neutral' : stats.avgFasting <= GLUCOSE.FASTING_MAX ? 'good' : 'watch'}
          note={
            fastingDiff === null ? (
              `Target ${GLUCOSE.FASTING_MIN}–${GLUCOSE.FASTING_MAX}`
            ) : (
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Big trend chart */}
        <Card className="lg:col-span-2">
          <CardHeader title="Blood sugar, last 7 days" subtitle="Red dots are below 70 or 250 and above." className="mb-4" />
          {week.some((c) => c.glucose_fasting !== null || c.glucose_post_meal !== null) ? (
            <GlucoseChart days={days} checkIns={week} />
          ) : (
            <p className="py-10 text-center text-sm text-neutral-500">No blood-sugar readings this week yet.</p>
          )}
        </Card>

        {/* Coach notes */}
        <Card className="flex flex-col">
          <CardHeader title="Coach notes" subtitle="Patterns found in your logs" className="mb-4" />
          {insights.length === 0 ? (
            <p className="text-sm text-neutral-600">Patterns appear once there are a few days of readings, sleep and steps to compare.</p>
          ) : (
            <ul className="space-y-3">
              {insights.slice(0, 4).map((i) => (
                <li key={i.text} className="flex gap-2.5 text-sm text-neutral-800">
                  <span
                    className={i.tone === 'positive' ? 'mt-1.5 h-2 w-2 shrink-0 rounded-full bg-success-500' : 'mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warning-500'}
                    aria-hidden
                  />
                  {i.text}
                </li>
              ))}
            </ul>
          )}
          <Link to="/ai-summary" className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-medium text-primary-700 hover:text-primary-800">
            <Sparkles className="h-4 w-4" />
            Get your weekly summary
          </Link>
        </Card>
      </div>

      {/* 3-6. Exercise / Water / Sleep / Weight */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader
            title="Steps"
            subtitle={`Goal ${STEP_GOAL.toLocaleString()}`}
            className="mb-3"
            action={<Activity className="h-4 w-4 text-neutral-400" />}
          />
          <p className="mb-3 text-xs text-neutral-500">
            Avg {stats.avgSteps === null ? '–' : Math.round(stats.avgSteps).toLocaleString()}
          </p>
          <MiniBars days={days} checkIns={week} field="steps" goal={STEP_GOAL} color="secondary" format={(v) => `${v.toLocaleString()} steps`} />
        </Card>
        <Card>
          <CardHeader
            title="Water"
            subtitle={`Goal ${(WATER_GOAL_ML / 1000).toFixed(1)} L`}
            className="mb-3"
            action={<Droplet className="h-4 w-4 text-neutral-400" />}
          />
          <p className="mb-3 text-xs text-neutral-500">
            Avg {stats.avgWater === null ? '–' : `${Math.round(stats.avgWater)} ml`}
          </p>
          <MiniBars days={days} checkIns={week} field="water_ml" goal={WATER_GOAL_ML} color="primary" format={(v) => `${v} ml`} />
        </Card>
        <Card>
          <CardHeader
            title="Sleep"
            subtitle={`Goal ${SLEEP_GOAL_HOURS} h`}
            className="mb-3"
            action={<Moon className="h-4 w-4 text-neutral-400" />}
          />
          <p className="mb-3 text-xs text-neutral-500">
            Avg {stats.avgSleep === null ? '–' : `${stats.avgSleep.toFixed(1)} h`}
          </p>
          <MiniBars days={days} checkIns={week} field="sleep_hours" goal={SLEEP_GOAL_HOURS} color="accent" format={(v) => `${v} h`} />
        </Card>
        <Card>
          <CardHeader title="Weight" className="mb-3" />
          {stats.latestWeight === null ? (
            <p className="py-8 text-center text-sm text-neutral-500">Log your weight to see the trend.</p>
          ) : (
            <>
              <p className="text-3xl font-bold tabular-nums text-neutral-900">
                {stats.latestWeight.toFixed(1)}
                <span className="ml-1 text-sm font-medium text-neutral-500">kg</span>
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {stats.weightChange === null || stats.weightChange === 0
                  ? 'No change this week'
                  : stats.weightChange > 0
                    ? `Up ${stats.weightChange.toFixed(1)} kg this week`
                    : `Down ${Math.abs(stats.weightChange).toFixed(1)} kg this week`}
              </p>
            </>
          )}
        </Card>
      </div>

      {/* 7. Goals   8. Recent check-ins   9. Recent records   10. Achievements */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Goals"
            subtitle="Active targets, tracked against real logged data"
            className="mb-4"
            action={<Target className="h-4 w-4 text-neutral-400" />}
          />
          {goals.filter((g) => g.status === 'active').length === 0 ? (
            <EmptyState
              icon={<Target className="h-5 w-5" />}
              title="No goals yet"
              description="Set a target like 8,000 steps a day to see progress here."
              action={<Button variant="outline" onClick={() => navigate('/goals')}>Open Goals</Button>}
            />
          ) : (
            <div className="space-y-4">
              {goals.filter((g) => g.status === 'active').slice(0, 3).map((g) => {
                const progress = computeGoalProgress(g, checkIns, activities);
                return (
                  <div key={g.id}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-neutral-800">{g.title}</span>
                      <Badge variant="neutral">{GOAL_CATEGORY_LABELS[g.category]}</Badge>
                    </div>
                    {progress.measurable ? (
                      <ProgressBar value={progress.value ?? 0} max={progress.target ?? 1} />
                    ) : (
                      <p className="text-xs text-neutral-500">Tracked manually</p>
                    )}
                  </div>
                );
              })}
              <Link to="/goals" className="inline-block text-sm font-medium text-primary-700 hover:text-primary-800">
                See all goals
              </Link>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent check-ins"
            subtitle="Your last three entries"
            className="mb-4"
          />
          {view.week.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">No check-ins this week yet.</p>
          ) : (
            <ul className="space-y-2">
              {[...view.week].reverse().slice(0, 3).map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-100 px-3 py-2">
                  <span className="text-sm font-medium text-neutral-900">{longDate(c.date)}</span>
                  <span className="flex flex-wrap gap-1.5">
                    {c.glucose_fasting !== null && <Badge variant="neutral">F {c.glucose_fasting}</Badge>}
                    {c.glucose_post_meal !== null && <Badge variant="neutral">P {c.glucose_post_meal}</Badge>}
                    {c.steps !== null && <Badge variant="neutral">{c.steps.toLocaleString()} steps</Badge>}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/check-ins" className="mt-4 inline-block text-sm font-medium text-primary-700 hover:text-primary-800">
            See all check-ins
          </Link>
        </Card>

        <Card>
          <CardHeader title="Recent medical records" className="mb-4" action={<FileText className="h-4 w-4 text-neutral-400" />} />
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="No records uploaded"
            description="Upload lab reports, prescriptions and scans in Phase 9."
          />
        </Card>

        <Card>
          <CardHeader title="Achievements" className="mb-4" action={<Award className="h-4 w-4 text-neutral-400" />} />
          <EmptyState
            icon={<Award className="h-5 w-5" />}
            title="Badges will appear here"
            description="Streaks and goal completions will be awarded as you keep logging."
          />
        </Card>
      </div>

      <p className="text-xs text-neutral-500">
        Targets are common defaults for adults with Type 2 Diabetes. Your doctor may set different ones. This app does
        not replace medical advice.
      </p>
    </div>
  );
}

function Heading({ name }: { name: string }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-900">{greeting}, {name}</h2>
      <p className="mt-1 text-sm text-neutral-600">Blood sugar, medication and habits for the past week.</p>
    </div>
  );
}
