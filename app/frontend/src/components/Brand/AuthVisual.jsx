import React from 'react';
import { Activity, Globe2, Radar, Shield, Waves } from 'lucide-react';
import AegisLogo from './AegisLogo';

export default function AuthVisual({ mode = 'signin' }) {
  const signup = mode === 'signup';

  return (
    <section className="relative hidden lg:flex min-h-screen overflow-hidden bg-[#03101f] border-r border-cyan-500/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(14,165,233,.22),transparent_30%),radial-gradient(circle_at_30%_70%,rgba(37,99,235,.18),transparent_35%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(56,189,248,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,.08)_1px,transparent_1px)] [background-size:42px_42px]" />

      <svg className="absolute inset-0 h-full w-full opacity-80" viewBox="0 0 1000 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <radialGradient id="nodeGlow">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g fill="none" stroke="#38bdf8" strokeOpacity=".28">
          <path d="M75 315 C250 180 420 210 555 330 S810 530 940 350" />
          <path d="M40 520 C260 380 400 410 540 520 S790 690 960 545" />
          <path d="M110 690 C300 565 540 585 850 735" />
          <ellipse cx="500" cy="470" rx="370" ry="180" strokeOpacity=".16" />
        </g>
        {[ [120,320],[285,260],[470,345],[650,430],[840,355],[205,550],[420,500],[620,590],[815,545],[340,690],[690,735] ].map(([x,y],i)=>(
          <g key={i}>
            <circle cx={x} cy={y} r="22" fill="url(#nodeGlow)" opacity=".35" />
            <circle cx={x} cy={y} r="4" fill="#67e8f9" />
          </g>
        ))}
      </svg>

      <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
        <AegisLogo />

        <div className="max-w-2xl py-12">
          <div className="relative mx-auto mb-10 flex h-52 w-52 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/[0.04] shadow-[0_0_120px_rgba(34,211,238,.18)]">
            <div className="absolute inset-5 rounded-full border border-cyan-400/15 animate-pulse" />
            <Shield className="h-24 w-24 text-cyan-300 drop-shadow-[0_0_24px_rgba(34,211,238,.5)]" strokeWidth={1.4} />
            <Radar className="absolute -right-2 top-7 h-12 w-12 text-blue-400" strokeWidth={1.4} />
            <Activity className="absolute -left-3 bottom-8 h-10 w-10 text-teal-300" strokeWidth={1.4} />
          </div>

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-cyan-300/90">
            {signup ? 'Security visibility starts here' : 'Real-time web monitoring'}
          </p>
          <h1 className="max-w-xl text-4xl xl:text-5xl font-black leading-tight text-white">
            {signup ? 'See suspicious activity across your web applications.' : 'Monitor what matters. Investigate what looks wrong.'}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            AEGIS gives teams a clear view of web traffic, suspicious requests, anomalies, and detection events from one focused monitoring workspace.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3 max-w-xl">
            {[
              [Globe2, 'Website visibility'],
              [Waves, 'Traffic insights'],
              [Radar, 'Detection alerts']
            ].map(([Icon,label])=>(
              <div key={label} className="rounded-2xl border border-slate-700/70 bg-slate-950/45 p-4 backdrop-blur">
                <Icon className="mb-3 h-5 w-5 text-cyan-300" />
                <p className="text-xs font-semibold text-slate-200">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500">AEGIS observes and alerts. It does not block or alter client traffic.</p>
      </div>
    </section>
  );
}
