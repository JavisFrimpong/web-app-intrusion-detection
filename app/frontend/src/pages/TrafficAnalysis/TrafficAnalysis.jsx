import React, { useState } from 'react';
import { 
  Activity, 
  Clock, 
  Wifi, 
  Sliders, 
  ArrowUpRight, 
  ArrowDownRight,
  Radio,
  Zap,
  Globe
} from 'lucide-react';
import TrafficLineChart from '../../components/Charts/TrafficLineChart';
import AttackPieChart from '../../components/Charts/AttackPieChart';
import ThreatCategoryBarChart from '../../components/Charts/ThreatCategoryBarChart';
import { 
  MOCK_TRAFFIC_TIMELINE, 
  MOCK_ATTACK_DISTRIBUTION, 
  MOCK_THREAT_CATEGORIES 
} from '../../utils/presetData';

export default function TrafficAnalysis() {
  const [timeframe, setTimeframe] = useState('24h'); // '1h' | '24h' | '7d'
  const [liveStreamActive, setLiveStreamActive] = useState(true);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
              NETWORK PACKET TELEMETRY & FLOW DYNAMICS
            </span>
            <h1 className="text-2xl font-black text-slate-100">
              Web Network Traffic Deep Dive
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
              Comprehensive telemetry metrics, packet length distribution, protocol breakdown, and real-time network flow monitoring.
            </p>
          </div>

          {/* Timeframe selector + Live Stream Toggle */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs font-mono">
              {['1h', '24h', '7d'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-xl transition-all ${
                    timeframe === tf ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={() => setLiveStreamActive(!liveStreamActive)}
              className={`px-3 py-2 rounded-2xl border text-xs font-mono flex items-center space-x-2 transition-all ${
                liveStreamActive 
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${liveStreamActive ? 'animate-pulse text-emerald-400' : ''}`} />
              <span>{liveStreamActive ? 'LIVE STREAMING' : 'PAUSED'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Traffic Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase">Avg Flow Duration</span>
          <div className="text-xl font-bold text-slate-100 flex items-center justify-between">
            <span>3,420 ms</span>
            <span className="text-xs text-emerald-400 font-normal flex items-center">
              <ArrowDownRight className="w-3.5 h-3.5" /> -4.2%
            </span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase">Flow Bytes / Sec</span>
          <div className="text-xl font-bold text-slate-100 flex items-center justify-between">
            <span>428.5 KB/s</span>
            <span className="text-xs text-emerald-400 font-normal flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12.4%
            </span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase">Packets / Sec</span>
          <div className="text-xl font-bold text-slate-100 flex items-center justify-between">
            <span>1,840 pkt/s</span>
            <span className="text-xs text-cyan-400 font-normal">Normal</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase">Active Port Channels</span>
          <div className="text-xl font-bold text-slate-100 flex items-center justify-between">
            <span>80, 443, 22</span>
            <span className="text-xs text-slate-400 font-normal">HTTP/SSH</span>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Network Flow Rate ({timeframe.toUpperCase()} Window)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Real-time BENIGN packet flow vs Malicious Anomaly Spikes
              </p>
            </div>
          </div>
          <TrafficLineChart data={MOCK_TRAFFIC_TIMELINE} />
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-3">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Protocol & Vector Split
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Categorical proportion of captured flow samples
            </p>
          </div>
          <AttackPieChart data={MOCK_ATTACK_DISTRIBUTION} />
        </div>
      </div>

      {/* Bottom Bar Chart: Port Activity & Threat Categories */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Destination Port Attack Load & Frequency
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Histogram of threat vectors classified by Random Forest model
            </p>
          </div>
        </div>
        <ThreatCategoryBarChart data={MOCK_THREAT_CATEGORIES} />
      </div>
    </div>
  );
}
