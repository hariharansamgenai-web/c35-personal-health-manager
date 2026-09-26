import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity, Bell, BellRing, Brain, CheckCircle2,
  ChevronRight, Clock, Droplet, FileText, HeartPulse, Laptop,
  Moon, Phone, Pill, Plus, Smartphone, Sparkles, Target,
  TrendingDown, TrendingUp, Users, Watch, X, Zap,
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

// ─── helpers ────────────────────────────────────────────────────────────────
const FAMILY_CONTACTS = [
  { name: 'Shirpi (Partner)', relation: 'Partner', phone: '+6591234567', avatar: 'S' },
  { name: 'Amma',             relation: 'Mother',  phone: '+919876543210', avatar: 'A' },
  { name: 'Dr. Priya Nair',  relation: 'Doctor',  phone: '+6562345678', avatar: 'P' },
];

// ─── Logo mark ──────────────────────────────────────────────────────────────
function DualLobeLogo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.93} viewBox="0 0 30 28" fill="none">
      <defs>
        <radialGradient id="dlg-l" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#7c3aed"/>
          <stop offset="60%" stopColor="#4f46e5"/>
          <stop offset="100%" stopColor="#2563eb"/>
        </radialGradient>
        <radialGradient id="dlg-r" cx="65%" cy="25%" r="70%">
          <stop offset="0%" stopColor="#fde68a"/>
          <stop offset="40%" stopColor="#f59e0b"/>
          <stop offset="100%" stopColor="#ea580c"/>
        </radialGradient>
        <radialGradient id="dlg-m" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#c026d3" stopOpacity="0.9"/>
          <stop offset="50%" stopColor="#9333ea" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#7c2d12" stopOpacity="0.5"/>
        </radialGradient>
        <clipPath id="dlg-lc">
          <path d="M15,24 C15,24 2,17 2,9.5 C2,5.5 5,3 8.5,3 C11,3 13.5,4.5 15,7 L15,24 Z"/>
        </clipPath>
        <clipPath id="dlg-rc">
          <path d="M15,24 C15,24 28,17 28,9.5 C28,5.5 25,3 21.5,3 C19,3 16.5,4.5 15,7 L15,24 Z"/>
        </clipPath>
      </defs>
      <path d="M15,24 C15,24 2,17 2,9.5 C2,5.5 5,3 8.5,3 C11.5,3 13.5,5 15,7 C16.5,5 18.5,3 21.5,3 C25,3 28,5.5 28,9.5 C28,17 15,24 15,24 Z" fill="#000"/>
      <path d="M15,24 C15,24 2,17 2,9.5 C2,5.5 5,3 8.5,3 C11.5,3 13.5,5 15,7 C16.5,5 18.5,3 21.5,3 C25,3 28,5.5 28,9.5 C28,17 15,24 15,24 Z" fill="url(#dlg-l)" clipPath="url(#dlg-lc)"/>
      <path d="M15,24 C15,24 2,17 2,9.5 C2,5.5 5,3 8.5,3 C11.5,3 13.5,5 15,7 C16.5,5 18.5,3 21.5,3 C25,3 28,5.5 28,9.5 C28,17 15,24 15,24 Z" fill="url(#dlg-r)" clipPath="url(#dlg-rc)"/>
      <path d="M15,7 C13.5,9 12,12 12,14 C12,18 13.5,21 15,24 C16.5,21 18,18 18,14 C18,12 16.5,9 15,7 Z" fill="url(#dlg-m)" opacity="0.85"/>
    </svg>
  );
}

// ─── Emergency modal ────────────────────────────────────────────────────────
function EmergencyModal({ onClose }: { onClose: () => void }) {
  const [called, setCalled] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(5);
  const [autoSent, setAutoSent] = useState(false);

  useMemo(() => {
    if (autoSent) return;
    const t = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(t); setAutoSent(true); return 0; }
      return c - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [autoSent]);

  return (
    <div style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,.78)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%',maxWidth:420,borderRadius:20,overflow:'hidden',background:'var(--bg-card)',border:'1px solid rgba(239,68,68,.4)',boxShadow:'0 0 60px rgba(239,68,68,.25)' }}>
        <div style={{ background:'linear-gradient(135deg,#dc2626,#b91c1c)',padding:'20px 24px 16px' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div style={{ display:'flex',alignItems:'center',gap:12 }}>
              <div style={{ width:44,height:44,borderRadius:'50%',background:'rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <BellRing style={{ width:22,height:22,color:'#fff' }} className="animate-pulse" />
              </div>
              <div>
                <p style={{ fontSize:18,fontWeight:800,color:'#fff' }}>Emergency Alert</p>
                <p style={{ fontSize:12,color:'rgba(255,255,255,.7)',marginTop:2 }}>{autoSent?'Alert sent to all contacts':`Auto-sending in ${countdown}s`}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ color:'rgba(255,255,255,.6)',background:'none',border:'none',cursor:'pointer' }}><X style={{ width:20,height:20 }}/></button>
          </div>
          {!autoSent && <div style={{ marginTop:14,height:4,borderRadius:2,background:'rgba(255,255,255,.2)' }}><div style={{ height:'100%',borderRadius:2,background:'#fff',width:`${((5-countdown)/5)*100}%`,transition:'width 1s linear' }}/></div>}
        </div>
        <div style={{ padding:'16px 20px 20px' }}>
          <p style={{ fontSize:11,fontWeight:700,color:'var(--text-muted)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:12 }}>Call family &amp; care team</p>
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {FAMILY_CONTACTS.map(c => {
              const done = called.includes(c.phone);
              return (
                <a key={c.phone} href={`tel:${c.phone}`} onClick={()=>setCalled(p=>[...p,c.phone])} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:12,textDecoration:'none',background:done?'var(--good-bg)':'var(--bg-card-2,var(--bg-card))',border:`1px solid ${done?'rgba(16,185,129,.3)':'var(--border)'}` }}>
                  <div style={{ width:38,height:38,borderRadius:'50%',background:done?'var(--good)':'#dc2626',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff',flexShrink:0 }}>{done?'✓':c.avatar}</div>
                  <div style={{ flex:1 }}><p style={{ fontSize:13,fontWeight:600,color:'var(--text-primary)' }}>{c.name}</p><p style={{ fontSize:11,color:'var(--text-muted)' }}>{c.relation} · {c.phone}</p></div>
                  <div style={{ display:'flex',alignItems:'center',gap:5,fontSize:12,fontWeight:600,color:done?'var(--good-text)':'#dc2626' }}><Phone style={{ width:14,height:14 }}/>{done?'Called':'Call now'}</div>
                </a>
              );
            })}
          </div>
          <button onClick={()=>setCalled(FAMILY_CONTACTS.map(c=>c.phone))} style={{ marginTop:12,width:'100%',padding:'10px',borderRadius:10,border:'none',cursor:'pointer',background:'#dc2626',color:'#fff',fontSize:13,fontWeight:700 }}>🚨 Alert all contacts — I need help</button>
          <button onClick={onClose} style={{ marginTop:8,width:'100%',padding:'8px',borderRadius:10,border:'1px solid var(--border)',cursor:'pointer',background:'transparent',color:'var(--text-secondary)',fontSize:13 }}>I'm OK — Cancel alert</button>
        </div>
      </div>
    </div>
  );
}

// ─── Reusable sub-components ────────────────────────────────────────────────
function Section({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div style={{ padding:'16px 18px',borderRadius:18,background:'var(--bg-card)',border:'1px solid var(--border)' }}>
      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14 }}>
        <div style={{ width:28,height:28,borderRadius:8,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center' }}>{icon}</div>
        <p style={{ fontSize:12,fontWeight:700,color:'var(--text-muted)',letterSpacing:'.08em',textTransform:'uppercase' }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

function ActionCard({ icon, color, bg, title, subtitle, cta, onCta }: { icon: React.ReactNode; color: string; bg: string; title: string; subtitle: string; cta: string; onCta: ()=>void }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:12,border:`1px solid ${color}2a`,background:bg }}>
      <div style={{ width:36,height:36,borderRadius:9,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>{icon}</div>
      <div style={{ flex:1,minWidth:0 }}><p style={{ fontSize:13,fontWeight:700,color:'var(--text-primary)' }}>{title}</p><p style={{ fontSize:11,color:'var(--text-muted)',marginTop:1 }}>{subtitle}</p></div>
      <button onClick={onCta} style={{ padding:'5px 11px',borderRadius:8,border:`1px solid ${color}44`,background:`${color}14`,color,fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap' }}>{cta}</button>
    </div>
  );
}

function HabitRing({ label, value, max, unit, color, sublabel }: { label:string;value:number|null;max:number;unit:string;color:string;sublabel?:string }) {
  const r=28, circ=2*Math.PI*r, pct=value!==null?Math.min(value/max,1):0, dash=circ*pct;
  return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:6 }}>
      <div style={{ position:'relative',width:72,height:72 }}>
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke={`${color}22`} strokeWidth="7"/>
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="7" strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round" transform="rotate(-90 36 36)" style={{ transition:'stroke-dasharray .6s ease' }}/>
        </svg>
        <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
          <p style={{ fontSize:13,fontWeight:800,color,lineHeight:1,letterSpacing:'-.02em' }}>{value!==null?(unit==='h'?value.toFixed(1):Math.round(value).toLocaleString()):'–'}</p>
          <p style={{ fontSize:9,color:'var(--text-muted)',marginTop:1 }}>{unit}</p>
        </div>
      </div>
      <p style={{ fontSize:11,fontWeight:600,color:'var(--text-secondary)',textAlign:'center' }}>{label}</p>
      {sublabel&&<p style={{ fontSize:10,color:'var(--text-muted)',textAlign:'center',marginTop:-4 }}>{sublabel}</p>}
    </div>
  );
}

function KpiTile({ label,value,unit,tone,note }: { label:string;value:string;unit:string;tone:'good'|'warn'|'danger'|'neutral';note?:React.ReactNode }) {
  const c={good:'#10b981',warn:'#f59e0b',danger:'#ef4444',neutral:'var(--accent)'}[tone];
  const bg={good:'rgba(16,185,129,.08)',warn:'rgba(245,158,11,.08)',danger:'rgba(239,68,68,.08)',neutral:'var(--accent-bg)'}[tone];
  return (
    <div style={{ padding:'14px 16px',borderRadius:16,background:bg,border:`1px solid ${c}33`,borderTop:`3px solid ${c}` }}>
      <p style={{ fontSize:10,fontWeight:700,color:'var(--text-muted)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:6 }}>{label}</p>
      <p style={{ fontSize:30,fontWeight:800,color:c,letterSpacing:'-.04em',lineHeight:1 }}>{value}<span style={{ fontSize:13,fontWeight:500,marginLeft:3,color:'var(--text-muted)' }}>{unit}</span></p>
      {note&&<p style={{ fontSize:11,color:'var(--text-muted)',marginTop:5,display:'flex',alignItems:'center',gap:4 }}>{note}</p>}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
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
    const week=inWindow(checkIns,today,7), previous=inWindow(checkIns,addDays(today,-7),7);
    return { week, previous, stats:computeStats(week), prevStats:computeStats(previous), alerts:evaluateAlerts(checkIns,today), insights:findInsights(week,previous), streak:loggingStreak(checkIns,today), todayEntry:checkIns.find(c=>c.date===today)??null };
  }, [checkIns, today]);

  if (!activeProfile) return <Loading label="Loading profile"/>;
  if (loading && checkIns.length===0) return <Loading label="Loading dashboard"/>;
  if (error) return <ErrorState message={error} onRetry={reload}/>;

  const name = activeProfile.display_name;
  const { stats, prevStats, alerts, insights, streak, todayEntry, week } = view;
  const fastingDiff = stats.avgFasting!==null&&prevStats.avgFasting!==null ? stats.avgFasting-prevStats.avgFasting : null;
  const hour = new Date().getHours();
  const greeting = hour<12?'Good morning':hour<18?'Good afternoon':'Good evening';

  const todayMeds=todayEntry?.meds_taken, todaySteps=todayEntry?.steps??null, todayWater=todayEntry?.water_ml??null, todaySleep=todayEntry?.sleep_hours??null;

  const trendTone = fastingDiff===null?'neutral':fastingDiff<=-5?'good':fastingDiff<=5?'neutral':'warn';

  // Stress score: inverse of mood + energy
  const stressLevel = todayEntry
    ? (['great','good'].includes(todayEntry.mood??'')&&(todayEntry.energy_level??5)>=6) ? 'low'
    : (['poor','bad'].includes(todayEntry.mood??'')||(todayEntry.energy_level??5)<=3) ? 'high' : 'moderate'
    : null;

  // Screen-time proxy: steps low + energy low = likely sedentary/screen-heavy
  const likelyHighScreenTime = todaySteps!==null&&todaySteps<3000&&todayEntry&&(todayEntry.energy_level??5)<=4;

  const hasData = checkIns.length>0;

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:18 }}>

      {/* ── HEADER ─────────────────────────────────────── */}
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,background:'linear-gradient(135deg,rgba(124,58,237,.1) 0%,rgba(245,158,11,.06) 100%)',borderRadius:20,padding:'18px 20px',border:'1px solid var(--border)' }}>
        <div style={{ display:'flex',alignItems:'center',gap:14 }}>
          <div style={{ width:46,height:46,borderRadius:14,background:'#000',boxShadow:'0 0 18px rgba(139,92,246,.35),0 0 18px rgba(251,146,60,.25)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <DualLobeLogo size={32}/>
          </div>
          <div>
            <p style={{ fontSize:13,color:'var(--text-muted)',fontWeight:500 }}>{greeting}</p>
            <h2 style={{ fontSize:24,fontWeight:800,color:'var(--text-primary)',letterSpacing:'-.03em',lineHeight:1.1,marginTop:2 }}>{name} 👋</h2>
            {todayEntry
              ? <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:5 }}><CheckCircle2 style={{ width:13,height:13,color:'#10b981' }}/><span style={{ fontSize:12,color:'#10b981',fontWeight:600 }}>Today logged</span><span style={{ fontSize:12,color:'var(--text-muted)' }}>· {streak} day streak 🔥</span></div>
              : <button onClick={()=>navigate('/check-ins')} style={{ marginTop:7,display:'inline-flex',alignItems:'center',gap:6,padding:'5px 13px',borderRadius:9,background:'#7c3aed',color:'#fff',fontSize:12,fontWeight:700,border:'none',cursor:'pointer' }}><Plus style={{ width:12,height:12 }}/>Log today</button>}
          </div>
        </div>
        {/* Emergency bell */}
        <button onClick={()=>setShowEmergency(true)} title="Emergency — alert family" style={{ width:50,height:50,borderRadius:14,border:'2px solid rgba(239,68,68,.4)',background:'rgba(239,68,68,.1)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,flexDirection:'column',gap:2 }}>
          <Bell style={{ width:20,height:20,color:'#ef4444' }}/>
          <span style={{ fontSize:8,fontWeight:700,color:'#ef4444',letterSpacing:'.04em' }}>SOS</span>
        </button>
      </div>

      {/* ── TODAY'S HEALTH STRIP ─────────────────────── */}
      {hasData && (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10 }}>
          {[{label:'On Track',count:Math.max(0,5-alerts.length),color:'#10b981'},{label:'Attention',count:alerts.length,color:'#f59e0b'},{label:'Urgent',count:alerts.filter(a=>a.severity==='critical').length,color:'#ef4444'}].map(s=>(
            <div key={s.label} style={{ padding:'12px 8px',borderRadius:14,background:'var(--bg-card)',border:'1px solid var(--border)',textAlign:'center' }}>
              <p style={{ fontSize:22,fontWeight:800,color:s.color }}>{s.count}</p>
              <p style={{ fontSize:10,fontWeight:600,color:'var(--text-muted)',marginTop:2,textTransform:'uppercase',letterSpacing:'.06em' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── NO DATA ──────────────────────────────────── */}
      {!hasData && (
        <div style={{ textAlign:'center',padding:'32px 24px',borderRadius:20,background:'var(--bg-card)',border:'1px solid var(--border)' }}>
          <HeartPulse style={{ width:40,height:40,color:'var(--text-muted)',margin:'0 auto 12px' }}/>
          <p style={{ fontSize:16,fontWeight:700,color:'var(--text-primary)' }}>Start with today's check-in</p>
          <p style={{ fontSize:13,color:'var(--text-secondary)',marginTop:6,marginBottom:16 }}>Log medication, blood sugar and habits. Your dashboard populates after a few days.</p>
          <div style={{ display:'flex',justifyContent:'center',gap:10 }}>
            <button onClick={()=>navigate('/check-ins')} style={{ padding:'8px 18px',borderRadius:10,background:'#7c3aed',color:'#fff',fontSize:13,fontWeight:700,border:'none',cursor:'pointer' }}>Log today</button>
            <button onClick={async()=>{ if(!activeProfile)return;setSeeding(true);try{await loadDemoData(activeProfile.id);await reload();}finally{setSeeding(false);} }} disabled={seeding} style={{ padding:'8px 18px',borderRadius:10,border:'1px solid var(--border)',background:'transparent',color:'var(--text-secondary)',fontSize:13,fontWeight:600,cursor:'pointer' }}>
              {seeding?'Loading…':'Load demo data'}
            </button>
          </div>
        </div>
      )}

      {hasData && (<>

        {/* ── TODAY SNAPSHOT ───────────────────────────── */}
        <div style={{ padding:'14px 16px',borderRadius:16,background:'var(--bg-card)',border:'1px solid var(--border)' }}>
          <p style={{ fontSize:10,fontWeight:700,color:'var(--text-muted)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:10 }}>Today</p>
          <div style={{ display:'flex',flexWrap:'wrap',gap:'6px 18px',fontSize:13 }}>
            {([
              { icon:<HeartPulse style={{ width:13,height:13,color:'#ef4444' }}/>, label:`Meds ${todayMeds===true?'✓':todayMeds===false?'✗':'–'}`, color:todayMeds===true?'#10b981':todayMeds===false?'#ef4444':'var(--text-muted)' },
              { icon:<Activity style={{ width:13,height:13,color:'#0d9488' }}/>, label:`Steps ${todaySteps!==null?todaySteps.toLocaleString():'–'}`, color:todaySteps!==null&&todaySteps>=STEP_GOAL?'#10b981':'var(--text-secondary)' },
              { icon:<Droplet style={{ width:13,height:13,color:'#0ea5e9' }}/>, label:`Water ${todayWater!==null?(todayWater/1000).toFixed(1)+'L':'–'}`, color:todayWater!==null&&todayWater>=WATER_GOAL_ML?'#10b981':'var(--text-secondary)' },
              { icon:<Moon style={{ width:13,height:13,color:'#a78bfa' }}/>, label:`Sleep ${todaySleep!==null?todaySleep.toFixed(1)+'h':'–'}`, color:todaySleep!==null&&todaySleep>=SLEEP_GOAL_HOURS?'#10b981':'var(--text-secondary)' },
              ...(todayEntry?.glucose_fasting!=null?[{ icon:<Zap style={{ width:13,height:13,color:'#f59e0b' }}/>, label:`BG ${todayEntry.glucose_fasting}`, color:todayEntry.glucose_fasting<=GLUCOSE.FASTING_MAX?'#10b981':'#f59e0b' }]:[]),
            ] as Array<{icon:React.ReactNode;label:string;color:string}>).map((item,i)=>(
              <div key={i} style={{ display:'flex',alignItems:'center',gap:5 }}>{item.icon}<span style={{ color:item.color,fontWeight:500 }}>{item.label}</span></div>
            ))}
          </div>
          <button onClick={()=>navigate('/check-ins')} style={{ marginTop:10,fontSize:11,fontWeight:600,color:'var(--accent)',background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',alignItems:'center',gap:4 }}>
            Edit today <ChevronRight style={{ width:11,height:11 }}/>
          </button>
        </div>

        {/* ── KPI TILES ────────────────────────────────── */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10 }}>
          <KpiTile label="Fasting sugar · 7-day avg" value={stats.avgFasting===null?'–':Math.round(stats.avgFasting).toString()} unit="mg/dL"
            tone={stats.avgFasting===null?'neutral':stats.avgFasting<=GLUCOSE.FASTING_MAX?'good':'warn'}
            note={fastingDiff===null?`Target ${GLUCOSE.FASTING_MIN}–${GLUCOSE.FASTING_MAX}`:<span style={{ display:'flex',alignItems:'center',gap:3 }}>{fastingDiff<=0?<TrendingDown style={{ width:11,height:11 }}/>:<TrendingUp style={{ width:11,height:11 }}/>}{Math.abs(Math.round(fastingDiff))} vs last week</span>}/>
          <KpiTile label="Time in range" value={stats.timeInRange===null?'–':Math.round(stats.timeInRange).toString()} unit="%" tone={stats.timeInRange===null?'neutral':stats.timeInRange>=70?'good':'warn'} note="70–180 mg/dL target"/>
          <KpiTile label="Medication adherence" value={stats.adherence===null?'–':Math.round(stats.adherence).toString()} unit="%" tone={stats.adherence===null?'neutral':stats.adherence>=85?'good':'danger'} note="of logged days this week"/>
          <KpiTile label="Logging streak" value={streak.toString()} unit={streak===1?'day':'days'} tone={streak>=5?'good':'neutral'} note={`${stats.loggedDays} of 7 days logged`}/>
        </div>

        {/* ── HABIT RINGS ──────────────────────────────── */}
        <Section title="Weekly habits" color="#0d9488" icon={<Activity style={{ width:14,height:14,color:'#0d9488' }}/>}>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8 }}>
            <HabitRing label="Steps" value={stats.avgSteps} max={STEP_GOAL} unit="avg" color="#0d9488" sublabel={`Goal ${(STEP_GOAL/1000).toFixed(0)}k`}/>
            <HabitRing label="Water" value={stats.avgWater!==null?stats.avgWater/1000:null} max={WATER_GOAL_ML/1000} unit="L" color="#0ea5e9" sublabel={`Goal ${(WATER_GOAL_ML/1000).toFixed(1)}L`}/>
            <HabitRing label="Sleep" value={stats.avgSleep} max={SLEEP_GOAL_HOURS} unit="h" color="#a78bfa" sublabel={`Goal ${SLEEP_GOAL_HOURS}h`}/>
            <HabitRing label="Mood" value={week.filter(c=>c.mood==='good'||c.mood==='great').length} max={7} unit="days" color="#f472b6" sublabel="Good days"/>
          </div>
        </Section>

        {/* ── 💊 MEDICATION REMINDERS & REFILLS ──────── */}
        <Section title="Medication &amp; reminders" color="#ef4444" icon={<Pill style={{ width:14,height:14,color:'#ef4444' }}/>}>
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            <ActionCard icon={<Pill style={{ width:16,height:16,color:'#ef4444' }}/>} color="#ef4444" bg="rgba(239,68,68,.05)"
              title={todayMeds===false?'Evening dose missed':'Medication reminder'}
              subtitle={todayMeds===true?'All doses logged today ✓':todayMeds===false?'Mark your evening dose as taken':'Log today\'s medication status'}
              cta={todayMeds===true?'View log':'Log dose'} onCta={()=>navigate('/check-ins')}/>
            <ActionCard icon={<Clock style={{ width:16,height:16,color:'#f59e0b' }}/>} color="#f59e0b" bg="rgba(245,158,11,.05)"
              title="Refill alert" subtitle="Metformin — estimated 7 days remaining. Request refill from Dr. Priya."
              cta="Set reminder" onCta={()=>navigate('/documents')}/>
            {/* Medication streak row */}
            <div style={{ paddingTop:8,borderTop:'1px solid var(--border)' }}>
              <p style={{ fontSize:11,fontWeight:600,color:'var(--text-muted)',marginBottom:8 }}>7-day streak</p>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4 }}>
                {days.map(day=>{
                  const e=week.find(c=>c.date===day), taken=e?.meds_taken, lbl=new Date(day+'T12:00:00').toLocaleDateString('en',{weekday:'narrow'});
                  return (<div key={day} style={{ textAlign:'center' }}>
                    <p style={{ fontSize:9,color:'var(--text-muted)',marginBottom:4 }}>{lbl}</p>
                    <div style={{ width:28,height:28,borderRadius:8,margin:'0 auto',background:taken===true?'rgba(16,185,129,.2)':taken===false?'rgba(239,68,68,.15)':'var(--bg-card-2,var(--bg-card))',border:`1px solid ${taken===true?'rgba(16,185,129,.4)':taken===false?'rgba(239,68,68,.3)':'var(--border)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13 }}>
                      {taken===true?'💊':taken===false?'✗':'·'}
                    </div>
                  </div>);
                })}
              </div>
            </div>
          </div>
        </Section>

        {/* ── 🧠 STRESS / ANXIETY / BURNOUT ──────────── */}
        <Section title="Mental wellbeing" color="#8b5cf6" icon={<Brain style={{ width:14,height:14,color:'#8b5cf6' }}/>}>
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {/* Stress indicator */}
            <div style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:12,background:stressLevel==='high'?'rgba(239,68,68,.08)':stressLevel==='moderate'?'rgba(245,158,11,.08)':'rgba(16,185,129,.08)',border:`1px solid ${stressLevel==='high'?'rgba(239,68,68,.25)':stressLevel==='moderate'?'rgba(245,158,11,.25)':'rgba(16,185,129,.25)'}` }}>
              <div style={{ width:44,height:44,borderRadius:12,background:stressLevel==='high'?'rgba(239,68,68,.15)':stressLevel==='moderate'?'rgba(245,158,11,.15)':'rgba(16,185,129,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0 }}>
                {stressLevel==='high'?'😣':stressLevel==='moderate'?'😐':'😊'}
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13,fontWeight:700,color:'var(--text-primary)' }}>
                  Stress level: <span style={{ color:stressLevel==='high'?'#ef4444':stressLevel==='moderate'?'#f59e0b':'#10b981' }}>{stressLevel?stressLevel.charAt(0).toUpperCase()+stressLevel.slice(1):'Not logged'}</span>
                </p>
                <p style={{ fontSize:11,color:'var(--text-muted)',marginTop:2 }}>Based on today's mood &amp; energy log</p>
              </div>
              {stressLevel==='high'&&(
                <button onClick={()=>navigate('/check-ins')} style={{ padding:'5px 11px',borderRadius:8,border:'1px solid rgba(239,68,68,.4)',background:'rgba(239,68,68,.15)',color:'#ef4444',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap' }}>Check &amp; Act</button>
              )}
            </div>
            {/* Burnout tips */}
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
              {[
                { emoji:'🧘', tip:'5-min breathe', sub:'Reduces cortisol now' },
                { emoji:'🚶', tip:'Walk outside', sub:'10 min resets focus' },
                { emoji:'💬', tip:'Talk to someone', sub:'Reduces anxiety 40%' },
                { emoji:'📵', tip:'Phone-free hour', sub:'Lower stress hormones' },
              ].map(t=>(
                <div key={t.tip} style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:10,background:'var(--bg-card-2,var(--bg-card))',border:'1px solid var(--border)' }}>
                  <span style={{ fontSize:18 }}>{t.emoji}</span>
                  <div><p style={{ fontSize:12,fontWeight:600,color:'var(--text-primary)' }}>{t.tip}</p><p style={{ fontSize:10,color:'var(--text-muted)' }}>{t.sub}</p></div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── 📱 SCREEN TIME ───────────────────────────── */}
        <Section title="Screen time &amp; sedentary" color="#f472b6" icon={<Smartphone style={{ width:14,height:14,color:'#f472b6' }}/>}>
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            <div style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:12,background:likelyHighScreenTime?'rgba(244,114,182,.08)':'rgba(16,185,129,.06)',border:`1px solid ${likelyHighScreenTime?'rgba(244,114,182,.3)':'rgba(16,185,129,.2)'}` }}>
              <div style={{ width:44,height:44,borderRadius:12,background:likelyHighScreenTime?'rgba(244,114,182,.15)':'rgba(16,185,129,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0 }}>
                {likelyHighScreenTime?'⚠️':'✅'}
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13,fontWeight:700,color:'var(--text-primary)' }}>{likelyHighScreenTime?'Likely high screen time today':'Activity looks good today'}</p>
                <p style={{ fontSize:11,color:'var(--text-muted)',marginTop:2 }}>{todaySteps!==null?`${todaySteps.toLocaleString()} steps so far · Goal ${STEP_GOAL.toLocaleString()}`:'Log steps to track activity'}</p>
              </div>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8 }}>
              {[
                { icon:<Laptop style={{ width:14,height:14,color:'#f472b6' }}/>, label:'Work screen', val:'Est. 6h+', warn:true },
                { icon:<Smartphone style={{ width:14,height:14,color:'#a78bfa' }}/>, label:'Phone', val:'Log it', warn:false },
                { icon:<Activity style={{ width:14,height:14,color:'#0d9488' }}/>, label:'Move goal', val:`${todaySteps!==null?Math.round((todaySteps/STEP_GOAL)*100):0}%`, warn:todaySteps===null||todaySteps<STEP_GOAL*0.5 },
              ].map(m=>(
                <div key={m.label} style={{ padding:'10px 12px',borderRadius:12,background:'var(--bg-card-2,var(--bg-card))',border:'1px solid var(--border)',textAlign:'center' }}>
                  <div style={{ display:'flex',justifyContent:'center',marginBottom:4 }}>{m.icon}</div>
                  <p style={{ fontSize:14,fontWeight:800,color:m.warn?'#f59e0b':'var(--text-primary)' }}>{m.val}</p>
                  <p style={{ fontSize:10,color:'var(--text-muted)',marginTop:2 }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── ⌚ WEARABLE INTEGRATION ──────────────────── */}
        <Section title="Wearable devices" color="#4ade80" icon={<Watch style={{ width:14,height:14,color:'#4ade80' }}/>}>
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {[
              { name:'Apple Watch', status:'Not connected', icon:'⌚', synced:false },
              { name:'Fitbit',      status:'Not connected', icon:'📿', synced:false },
              { name:'Garmin',      status:'Not connected', icon:'🏃', synced:false },
            ].map(d=>(
              <div key={d.name} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:12,background:'var(--bg-card-2,var(--bg-card))',border:'1px solid var(--border)' }}>
                <span style={{ fontSize:22 }}>{d.icon}</span>
                <div style={{ flex:1 }}><p style={{ fontSize:13,fontWeight:600,color:'var(--text-primary)' }}>{d.name}</p><p style={{ fontSize:11,color:'var(--text-muted)' }}>{d.status}</p></div>
                <button onClick={()=>navigate('/wearables')} style={{ padding:'4px 10px',borderRadius:7,border:'1px solid rgba(74,222,128,.4)',background:'rgba(74,222,128,.1)',color:'#4ade80',fontSize:11,fontWeight:700,cursor:'pointer' }}>Connect</button>
              </div>
            ))}
            <button onClick={()=>navigate('/wearables')} style={{ padding:'9px',borderRadius:10,border:'1px dashed rgba(74,222,128,.3)',background:'transparent',color:'#4ade80',fontSize:12,fontWeight:600,cursor:'pointer' }}>
              + Add wearable device
            </button>
          </div>
        </Section>

        {/* ── 🧠 AI INSIGHTS ──────────────────────────── */}
        <div style={{ padding:'16px 18px',borderRadius:18,background:'linear-gradient(135deg,rgba(192,132,252,.08),rgba(129,140,248,.08))',border:'1px solid rgba(192,132,252,.2)' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}><Brain style={{ width:15,height:15,color:'#c084fc' }}/><p style={{ fontSize:12,fontWeight:700,color:'var(--text-muted)',letterSpacing:'.08em',textTransform:'uppercase' }}>AI Insights</p></div>
            <span style={{ fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:'rgba(192,132,252,.18)',color:'#c084fc' }}>
              {trendTone==='good'?'↑ Improving':trendTone==='warn'?'! Watch':'→ Stable'}
            </span>
          </div>
          {insights.length===0?<p style={{ fontSize:13,color:'var(--text-secondary)' }}>Patterns appear after a few days of logs.</p>:(
            <ul style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {insights.slice(0,3).map((ins,i)=>(
                <li key={i} style={{ display:'flex',gap:8,fontSize:13,color:'var(--text-secondary)',lineHeight:1.4 }}>
                  <span style={{ marginTop:5,width:6,height:6,borderRadius:'50%',flexShrink:0,background:ins.tone==='positive'?'#10b981':'#f59e0b' }}/>
                  {ins.text}
                </li>
              ))}
            </ul>
          )}
          <Link to="/ai-summary" style={{ marginTop:14,display:'inline-flex',alignItems:'center',gap:6,fontSize:12,fontWeight:700,color:'#c084fc',textDecoration:'none' }}>
            <Sparkles style={{ width:13,height:13 }}/>Generate full AI summary
          </Link>
        </div>

        {/* ── QUICK ACCESS ─────────────────────────────── */}
        <div>
          <p style={{ fontSize:11,fontWeight:700,color:'var(--text-muted)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:10 }}>Quick access</p>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10 }}>
            {[
              { icon:FileText, label:'Health Vault', sub:'Records & emergency info', to:'/documents', color:'#60a5fa' },
              { icon:Watch,    label:'Wearables',    sub:'Devices & sync',           to:'/wearables', color:'#4ade80' },
              { icon:Users,    label:'Family',       sub:'Profiles & members',       to:'/profile',   color:'#fbbf24' },
              { icon:Clock,    label:'History',      sub:'Full timeline',             to:'/timeline',  color:'#f472b6' },
            ].map(q=>(
              <Link key={q.to} to={q.to} style={{ display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:14,background:'var(--bg-card)',border:'1px solid var(--border)',textDecoration:'none' }}>
                <div style={{ width:36,height:36,borderRadius:10,flexShrink:0,background:`${q.color}18`,display:'flex',alignItems:'center',justifyContent:'center' }}><q.icon style={{ width:17,height:17,color:q.color }}/></div>
                <div><p style={{ fontSize:13,fontWeight:700,color:'var(--text-primary)' }}>{q.label}</p><p style={{ fontSize:11,color:'var(--text-muted)' }}>{q.sub}</p></div>
              </Link>
            ))}
          </div>
        </div>

        {/* Active goals strip */}
        {goals.filter(g=>g.status==='active').length>0&&(
          <div style={{ padding:'14px 18px',borderRadius:16,background:'var(--bg-card)',border:'1px solid var(--border)' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
              <p style={{ fontSize:12,fontWeight:700,color:'var(--text-muted)',letterSpacing:'.08em',textTransform:'uppercase' }}>Active goals</p>
              <Link to="/goals" style={{ fontSize:11,color:'var(--accent)',fontWeight:600 }}>See all</Link>
            </div>
            <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              {goals.filter(g=>g.status==='active').slice(0,4).map(g=>(
                <span key={g.id} style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:'rgba(13,148,136,.1)',color:'#0d9488',border:'1px solid rgba(13,148,136,.2)' }}>
                  <Target style={{ width:11,height:11 }}/>{g.title}
                </span>
              ))}
            </div>
          </div>
        )}

        <p style={{ fontSize:11,color:'var(--text-muted)',textAlign:'center' }}>Targets are defaults for adults with Type 2 Diabetes. This app does not replace medical advice.</p>
      </>)}

      {showEmergency&&<EmergencyModal onClose={()=>setShowEmergency(false)}/>}
    </div>
  );
}
