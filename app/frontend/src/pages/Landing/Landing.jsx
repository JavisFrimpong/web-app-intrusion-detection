import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  ArrowRight,
  Activity,
  Radar,
  LockKeyhole,
  CheckCircle2,
  Server,
  Eye,
  Database,
  Zap,
  ChevronRight
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

const features = [
  {
    icon: Radar,
    title: 'Live intrusion detection',
    text: 'Network flows are captured, transformed into CICIDS2017-aligned features, and classified by the Random Forest engine.',
  },
  {
    icon: Database,
    title: 'Account-isolated telemetry',
    text: 'Every customer sees only the detections, alerts, traffic statistics, and reports generated for their own account.',
  },
  {
    icon: Eye,
    title: 'SOC visibility without the noise',
    text: 'See attack class, source, destination port, confidence and status in a clean security operations console.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#020713] text-slate-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/2 h-[460px] w-[760px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute top-[38rem] -left-48 h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute right-[-10rem] top-[20rem] h-[420px] w-[420px] rounded-full bg-emerald-400/10 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
        />
      </div>

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link to="/" className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_35px_rgba(34,211,238,.14)]">
            <Shield className="h-5 w-5 text-cyan-300" />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-[#020713]" />
          </div>
          <div>
            <div className="text-sm font-black tracking-[0.2em] text-white">AEGIS SOC</div>
            <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-cyan-400">ML Intrusion Defense</div>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/signin"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="group inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-gradient-to-r from-cyan-300 to-emerald-300 px-4 py-2.5 text-sm font-black text-slate-950 shadow-[0_10px_35px_rgba(34,211,238,.18)] transition hover:-translate-y-0.5 hover:brightness-110 sm:px-5"
          >
            Get protected
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid min-h-[760px] max-w-7xl grid-cols-1 items-center gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:px-10 lg:pb-28 lg:pt-20">
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.div
              variants={fadeUp}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              AI-powered web intrusion monitoring
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl lg:text-[4.7rem]"
            >
              See the attack
              <span className="block bg-gradient-to-r from-cyan-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
                before it becomes damage.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg"
            >
              AEGIS turns live network traffic into actionable security intelligence using machine-learning detection,
              real-time telemetry, attack classification and a professional SOC dashboard built for modern web systems.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-6 py-3.5 text-sm font-black text-slate-950 shadow-[0_18px_60px_rgba(34,211,238,.18)] transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Launch your SOC
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/signin"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/50 px-6 py-3.5 text-sm font-bold text-slate-200 backdrop-blur-xl transition hover:border-cyan-500/30 hover:bg-slate-900"
              >
                Open security console
                <ChevronRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-9 grid max-w-xl grid-cols-3 gap-3">
              {[
                ['99.7%', 'Model accuracy'],
                ['78', 'Flow features'],
                ['24/7', 'Monitoring ready'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 backdrop-blur-xl">
                  <div className="text-xl font-black text-white sm:text-2xl">{value}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.13em] text-slate-500">{label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute inset-10 rounded-[3rem] bg-cyan-400/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-700/70 bg-[#07101f]/95 shadow-[0_35px_100px_rgba(0,0,0,.5)] backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/10">
                    <Activity className="h-4 w-4 text-cyan-300" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">LIVE DETECTION ENGINE</div>
                    <div className="font-mono text-[9px] text-slate-500">Random Forest · CICIDS2017</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 font-mono text-[9px] font-bold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  SENSOR ONLINE
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-5">
                {[
                  ['1,284', 'Flows inspected', Activity],
                  ['17', 'Threats detected', Shield],
                  ['98.7%', 'Avg confidence', Zap],
                ].map(([value, label, Icon]) => (
                  <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <Icon className="mb-4 h-4 w-4 text-cyan-300" />
                    <div className="text-lg font-black text-white">{value}</div>
                    <div className="mt-1 text-[9px] uppercase tracking-[0.11em] text-slate-500">{label}</div>
                  </div>
                ))}
              </div>

              <div className="px-5 pb-5">
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70">
                  <div className="grid grid-cols-[1.1fr_.8fr_1fr_.7fr] gap-3 border-b border-slate-800 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">
                    <span>Source</span><span>Port</span><span>Classification</span><span>Confidence</span>
                  </div>
                  {[
                    ['102.44.18.7', '443', 'BENIGN', '99.4%', 'emerald'],
                    ['41.66.210.34', '80', 'PORTSCAN', '97.8%', 'amber'],
                    ['185.220.101.6', '443', 'DDoS', '98.9%', 'rose'],
                    ['172.16.0.12', '8080', 'BENIGN', '99.7%', 'emerald'],
                  ].map((row, index) => (
                    <motion.div
                      key={row[0]}
                      initial={{ opacity: 0, x: 14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.55 + index * 0.12 }}
                      className="grid grid-cols-[1.1fr_.8fr_1fr_.7fr] gap-3 border-b border-slate-900 px-4 py-3 text-[10px] last:border-0 sm:text-[11px]"
                    >
                      <span className="font-mono text-slate-300">{row[0]}</span>
                      <span className="font-mono text-slate-500">{row[1]}</span>
                      <span className={row[4] === 'emerald' ? 'font-bold text-emerald-300' : row[4] === 'amber' ? 'font-bold text-amber-300' : 'font-bold text-rose-300'}>{row[2]}</span>
                      <span className="font-mono text-slate-300">{row[3]}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.div
                animate={{ x: ['-120%', '120%'] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'linear', repeatDelay: 1.2 }}
                className="pointer-events-none absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-cyan-200/[0.04] to-transparent"
              />
            </div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-7 -left-5 hidden w-56 rounded-2xl border border-cyan-300/20 bg-[#07101f]/95 p-4 shadow-2xl backdrop-blur-xl sm:block"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10">
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Threat classified</div>
                  <div className="mt-1 font-mono text-[9px] text-slate-500">98.9% confidence · just now</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        <section className="border-y border-white/[0.06] bg-white/[0.018]">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
              className="grid gap-5 lg:grid-cols-3"
            >
              {features.map(({ icon: Icon, title, text }) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  className="group rounded-[1.6rem] border border-slate-800/80 bg-slate-900/35 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-500/25 hover:bg-slate-900/55"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.07]">
                    <Icon className="h-5 w-5 text-cyan-300" />
                  </div>
                  <h3 className="text-lg font-black text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7 }}
            >
              <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">Built for trust</div>
              <h2 className="mt-4 max-w-xl text-3xl font-black tracking-tight text-white sm:text-4xl">
                Security intelligence your client can actually understand.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">
                AEGIS combines machine-learning classification with rate-based heuristics, live traffic telemetry,
                searchable detection history and visual reporting—without turning the interface into a wall of raw logs.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  ['Real packet telemetry', 'Captured by the AEGIS Windows sensor using Npcap/Scapy.'],
                  ['Sensor-side ML inference', 'The Windows AEGIS sensor classifies captured flows with the Random Forest model, then securely sends results to the hosted Flask API.'],
                  ['Tenant separation', 'Every signed-in account receives its own isolated detection history.'],
                ].map(([title, body]) => (
                  <div key={title} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                    <div>
                      <div className="text-sm font-bold text-slate-100">{title}</div>
                      <div className="mt-1 text-sm leading-6 text-slate-500">{body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7 }}
              className="rounded-[2rem] border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/70 p-6 shadow-2xl"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  [Server, 'Hosted API', 'Flask service online'],
                  [LockKeyhole, 'Secure sessions', 'Account-level access'],
                  [Activity, 'Live telemetry', 'Continuous flow updates'],
                  [Shield, 'ML classification', 'Random Forest engine'],
                ].map(([Icon, title, body]) => (
                  <div key={title} className="rounded-2xl border border-slate-800 bg-[#050b16] p-5">
                    <Icon className="h-5 w-5 text-cyan-300" />
                    <div className="mt-5 text-sm font-black text-white">{title}</div>
                    <div className="mt-1 text-xs text-slate-500">{body}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="relative overflow-hidden rounded-[2rem] border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[0.09] via-slate-900/80 to-emerald-400/[0.05] px-6 py-12 text-center sm:px-10 sm:py-16"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,.12),transparent_45%)]" />
            <div className="relative">
              <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300">AEGIS SOC</div>
              <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl">
                Turn your web traffic into a live security picture.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                Create an account, connect the monitoring sensor, and start seeing what your application is facing in real time.
              </p>
              <Link
                to="/signup"
                className="group mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"
              >
                Create your AEGIS account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <div className="flex items-center gap-2 font-bold text-slate-400">
            <Shield className="h-4 w-4 text-cyan-400" />
            AEGIS SOC
          </div>
          <div>Machine Learning Web Application Intrusion Detection System</div>
        </div>
      </footer>
    </div>
  );
}
