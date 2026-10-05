import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Activity, Radar, Eye, Globe2, BellRing, BarChart3, CheckCircle2, ChevronRight } from 'lucide-react';
import AegisLogo from '../../components/Brand/AegisLogo';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };

const features = [
  { icon: Radar, title: 'Live activity monitoring', text: 'Observe suspicious requests and detection events from connected web applications in one focused workspace.' },
  { icon: BarChart3, title: 'Traffic insights', text: 'Review traffic patterns, event trends, and unusual activity without digging through raw infrastructure logs.' },
  { icon: BellRing, title: 'Actionable alerts', text: 'Surface suspicious activity that deserves review and keep a searchable record of what AEGIS observed.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#020713] text-slate-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/2 h-[460px] w-[760px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute top-[38rem] -left-48 h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute right-[-10rem] top-[20rem] h-[420px] w-[420px] rounded-full bg-sky-400/10 blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:42px_42px]" />
      </div>

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link to="/" className="inline-flex"><AegisLogo /></Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link to="/signin" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4">Sign in</Link>
          <Link to="/signup" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2.5 text-sm font-black text-slate-950 shadow-[0_10px_35px_rgba(34,211,238,.18)] transition hover:-translate-y-0.5 hover:brightness-110 sm:px-5">
            Start monitoring <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid min-h-[760px] max-w-7xl grid-cols-1 items-center gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:px-10 lg:pb-28 lg:pt-20">
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.div variants={fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"/><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"/></span>
              Web application monitoring
            </motion.div>

            <motion.h1 variants={fadeUp} className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl lg:text-[4.7rem]">
              See suspicious activity
              <span className="block bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-400 bg-clip-text text-transparent">without losing visibility.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
              AEGIS helps teams monitor web traffic, identify suspicious behavior, and review detection events from a professional security monitoring workspace.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/signup" className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3.5 text-sm font-black text-slate-950 shadow-[0_18px_60px_rgba(34,211,238,.18)] transition hover:-translate-y-0.5 hover:brightness-110">
                Monitor a website <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/>
              </Link>
              <Link to="/signin" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/50 px-6 py-3.5 text-sm font-bold text-slate-200 backdrop-blur-xl transition hover:border-cyan-500/30 hover:bg-slate-900">
                Open dashboard <ChevronRight className="h-4 w-4"/>
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-9 grid max-w-xl grid-cols-3 gap-3">
              {[
                ['Observe', 'Web activity'],
                ['Detect', 'Suspicious behavior'],
                ['Report', 'Monitoring events'],
              ].map(([value,label])=>(
                <div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 backdrop-blur-xl">
                  <div className="text-lg font-black text-white sm:text-xl">{value}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.13em] text-slate-500">{label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div initial={{opacity:0,scale:.94,y:20}} animate={{opacity:1,scale:1,y:0}} transition={{duration:.8,delay:.15,ease:[.22,1,.36,1]}} className="relative">
            <div className="absolute inset-10 rounded-[3rem] bg-cyan-400/10 blur-3xl"/>
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-700/70 bg-[#07101f]/95 shadow-[0_35px_100px_rgba(0,0,0,.5)] backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/10"><Activity className="h-4 w-4 text-cyan-300"/></div>
                  <div><div className="text-xs font-black text-white">MONITORING ACTIVITY</div><div className="text-[9px] text-slate-500">Recent observed events</div></div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-[9px] font-bold text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/>SERVICE ONLINE</div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-5">
                {[
                  ['3', 'Websites', Globe2],
                  ['17', 'Suspicious events', Radar],
                  ['1,284', 'Traffic observed', Eye],
                ].map(([value,label,Icon])=>(
                  <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <Icon className="mb-4 h-4 w-4 text-cyan-300"/>
                    <div className="text-lg font-black text-white">{value}</div>
                    <div className="mt-1 text-[9px] uppercase tracking-[0.11em] text-slate-500">{label}</div>
                  </div>
                ))}
              </div>

              <div className="px-5 pb-5">
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70">
                  <div className="grid grid-cols-[1fr_.9fr_1fr_.7fr] gap-3 border-b border-slate-800 px-4 py-3 text-[9px] uppercase tracking-[0.12em] text-slate-500"><span>Website</span><span>Source</span><span>Event</span><span>Risk</span></div>
                  {[
                    ['example.com','102.44.18.7','Normal request','Low'],
                    ['api.example.com','41.66.210.34','Repeated probing','Medium'],
                    ['shop.example.com','185.220.101.6','Suspicious burst','High'],
                    ['example.com','172.16.0.12','Normal request','Low'],
                  ].map((row,index)=>(
                    <motion.div key={index} initial={{opacity:0,x:14}} animate={{opacity:1,x:0}} transition={{delay:.55+index*.12}} className="grid grid-cols-[1fr_.9fr_1fr_.7fr] gap-3 border-b border-slate-900 px-4 py-3 text-[10px] last:border-0 sm:text-[11px]">
                      <span className="text-slate-300">{row[0]}</span><span className="font-mono text-slate-500">{row[1]}</span><span className="text-slate-300">{row[2]}</span><span className={row[3]==='High'?'font-bold text-rose-300':row[3]==='Medium'?'font-bold text-amber-300':'font-bold text-emerald-300'}>{row[3]}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="border-y border-white/[0.06] bg-white/[0.018]">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
            <motion.div initial="hidden" whileInView="show" viewport={{once:true,amount:.2}} variants={stagger} className="grid gap-5 lg:grid-cols-3">
              {features.map(({icon:Icon,title,text})=>(
                <motion.div key={title} variants={fadeUp} className="rounded-[1.6rem] border border-slate-800/80 bg-slate-900/35 p-6 transition hover:-translate-y-1 hover:border-cyan-500/25 hover:bg-slate-900/55">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.07]"><Icon className="h-5 w-5 text-cyan-300"/></div>
                  <h3 className="text-lg font-black text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">Simple onboarding</div>
              <h2 className="mt-4 max-w-xl text-3xl font-black tracking-tight text-white sm:text-4xl">Add Website → Connect Website → Monitor Traffic</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">AEGIS is built around visibility. Add the site you want to observe, connect it to the monitoring service, and review activity from one dashboard.</p>
              <div className="mt-8 space-y-4">
                {[
                  ['Add your website','Create a monitoring target in your workspace.'],
                  ['Connect monitoring','Complete the connection setup for that web application.'],
                  ['Review activity','See traffic insights, suspicious events, alerts, and reports.'],
                ].map(([title,body])=>(
                  <div key={title} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300"/><div><div className="text-sm font-bold text-slate-100">{title}</div><div className="mt-1 text-sm leading-6 text-slate-500">{body}</div></div></div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/70 p-6 shadow-2xl">
              <div className="rounded-2xl border border-slate-800 bg-[#050b16] p-5">
                <div className="flex items-center gap-3"><Radar className="h-5 w-5 text-cyan-300"/><div><div className="text-sm font-black text-white">Monitoring only</div><div className="mt-1 text-xs text-slate-500">AEGIS observes, detects, alerts, and reports.</div></div></div>
                <p className="mt-4 text-sm leading-6 text-slate-400">The product does not block, modify, or stop client traffic. It is designed to provide visibility and detection intelligence.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:px-10">
          <div className="relative overflow-hidden rounded-[2rem] border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[0.09] via-slate-900/80 to-blue-500/[0.05] px-6 py-12 text-center sm:px-10 sm:py-16">
            <div className="relative">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300">AEGIS SOC</div>
              <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl">Turn web activity into a clear monitoring picture.</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">Create a workspace and start building visibility across the websites you manage.</p>
              <Link to="/signup" className="group mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5">Create workspace <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <AegisLogo compact />
          <div>Web application monitoring, detection, alerts, and reporting.</div>
        </div>
      </footer>
    </div>
  );
}
