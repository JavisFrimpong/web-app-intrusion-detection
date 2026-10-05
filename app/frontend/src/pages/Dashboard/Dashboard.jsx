import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Eye,
  Globe2,
  Radar,
  Server,
  Signal,
  TimerReset
} from 'lucide-react';
import { Link } from 'react-router-dom';
import TrafficLineChart from '../../components/Charts/TrafficLineChart';
import AttackPieChart from '../../components/Charts/AttackPieChart';
import ThreatCategoryBarChart from '../../components/Charts/ThreatCategoryBarChart';
import DetectionTable from '../../components/DetectionTable/DetectionTable';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import { useDetectionHistory } from '../../hooks/useDetectionHistory';

function MetricCard({ icon: Icon, label, value, subtext, tone = 'cyan' }) {
  const tones = {
    cyan: 'text-cyan-300 bg-cyan-400/10 border-cyan-400/20',
    amber: 'text-amber-300 bg-amber-400/10 border-amber-400/20',
    rose: 'text-rose-300 bg-rose-400/10 border-rose-400/20',
    emerald: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
  };
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-5 shadow-lg shadow-black/10">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${tones[tone]}`}><Icon className="h-4 w-4"/></div>
      </div>
      <div className="mt-5 text-3xl font-black tracking-tight text-white">{value}</div>
      <p className="mt-1 text-xs text-slate-500">{subtext}</p>
    </div>
  );
}

export default function Dashboard() {
  const { isOnline: isSystemOnline, status } = useSystemStatus();
  const {
    history,
    stats,
    totalCount,
    threatCount,
    isOnline: isDbOnline
  } = useDetectionHistory();

  const isOnline = isDbOnline || isSystemOnline;
  const highRisk = history.filter((item) => item.prediction !== 0).length;
  let monitoredCount = 0;
  try {
    monitoredCount = JSON.parse(localStorage.getItem('aegis_monitored_websites') || '[]').length;
  } catch {
    monitoredCount = 0;
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[28px] border border-slate-800/80 bg-slate-900/70 p-6 sm:p-7"
      >
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">Monitoring workspace</span>
              <span className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${isOnline ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/25 bg-amber-500/10 text-amber-300'}`}>
                <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {isOnline ? 'Monitoring service online' : 'Monitoring service unavailable'}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">Security monitoring at a glance</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Review suspicious activity, traffic patterns, and recent detection events across the websites connected to your AEGIS workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/dashboard/websites" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-xs font-bold text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-300">
              <Globe2 className="h-4 w-4"/> Manage websites
            </Link>
            <Link to="/dashboard/threat-detection" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3 text-xs font-black text-slate-950 transition hover:brightness-110">
              <Radar className="h-4 w-4"/> View live activity <ArrowRight className="h-4 w-4"/>
            </Link>
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Globe2} label="Monitored websites" value={monitoredCount.toString()} subtext={monitoredCount ? "Websites in this workspace" : "Add a website to begin monitoring"} tone="cyan" />
        <MetricCard icon={AlertTriangle} label="Suspicious events" value={threatCount.toString()} subtext="Flagged activity in this workspace" tone="rose" />
        <MetricCard icon={Activity} label="Traffic reviewed" value={totalCount.toString()} subtext="Observed requests and flows" tone="emerald" />
        <MetricCard icon={Eye} label="High-risk activity" value={highRisk.toString()} subtext="Items requiring review" tone="amber" />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-800/80 bg-slate-900/65 p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Observed traffic trend</h2>
              <p className="mt-1 text-xs text-slate-500">Normal and suspicious activity over time</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/50 px-2.5 py-1 text-[11px] text-slate-400"><Signal className="h-3.5 w-3.5 text-cyan-300"/> Live feed</span>
          </div>
          <TrafficLineChart data={stats.trafficTimeline} />
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/65 p-5">
          <h2 className="text-base font-bold text-white">Activity classification</h2>
          <p className="mt-1 text-xs text-slate-500">Distribution of observed event types</p>
          <div className="mt-3"><AttackPieChart data={stats.attackDistribution} /></div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_.7fr]">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/65 p-5">
          <h2 className="text-base font-bold text-white">Alert categories</h2>
          <p className="mt-1 text-xs text-slate-500">Most frequently observed suspicious patterns</p>
          <div className="mt-3"><ThreatCategoryBarChart data={stats.threatCategories} /></div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/65 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Workspace status</h2>
            <Server className="h-4 w-4 text-cyan-300"/>
          </div>
          <div className="mt-5 space-y-4">
            {[
              ['Monitoring API', isOnline ? 'Online' : 'Offline', isOnline ? 'text-emerald-300' : 'text-amber-300'],
              ['Detection service', status === 'active' || isOnline ? 'Available' : 'Standby', 'text-cyan-300'],
              ['Last refresh', 'Live', 'text-slate-300'],
            ].map(([label,value,color])=>(
              <div key={label} className="flex items-center justify-between border-b border-slate-800 pb-3 last:border-b-0">
                <span className="text-xs text-slate-500">{label}</span>
                <span className={`text-xs font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex gap-3"><TimerReset className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"/><p className="text-xs leading-5 text-slate-500">AEGIS observes and reports suspicious activity. It does not block, modify, or stop requests.</p></div>
          </div>
        </div>
      </section>

      <DetectionTable detections={history} limit={6} title="Recent monitoring events" />
    </div>
  );
}
