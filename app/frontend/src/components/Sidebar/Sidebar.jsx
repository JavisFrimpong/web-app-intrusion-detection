import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radar,
  Activity,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Globe2
} from 'lucide-react';
import { motion } from 'framer-motion';
import AegisLogo from '../Brand/AegisLogo';

const navItems = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/dashboard/websites', label: 'Websites', icon: Globe2 },
  { path: '/dashboard/threat-detection', label: 'Live Activity', icon: Radar, badge: 'Live' },
  { path: '/dashboard/traffic-analysis', label: 'Traffic Insights', icon: Activity },
  { path: '/dashboard/reports', label: 'Reports', icon: FileSpreadsheet },
  { path: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden" onClick={()=>setMobileOpen(false)} />}
      <aside className={`fixed bottom-0 left-0 top-0 z-50 flex flex-col border-r border-slate-800/80 bg-[#050b14]/95 backdrop-blur-xl transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex h-20 items-center justify-between border-b border-slate-800/70 px-4">
          <div className="overflow-hidden">{collapsed ? <AegisLogo compact /> : <AegisLogo />}</div>
          <button onClick={()=>setCollapsed(!collapsed)} className="hidden h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:border-cyan-500/40 hover:text-white lg:flex">
            {collapsed ? <ChevronRight className="h-4 w-4"/> : <ChevronLeft className="h-4 w-4"/>}
          </button>
        </div>

        {!collapsed && (
          <div className="mx-3 mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Monitoring service</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.7)]" />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Workspace connected to AEGIS API</p>
          </div>
        )}

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-5">
          {navItems.map((item)=>{
            const Icon=item.icon;
            return (
              <NavLink key={item.path} to={item.path} end={item.path==='/dashboard'} onClick={()=>setMobileOpen(false)}
                className={({isActive})=>`group relative flex items-center rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${isActive ? 'border-cyan-500/25 bg-cyan-500/10 text-cyan-200' : 'border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900/60 hover:text-slate-200'}`}>
                {({isActive})=><>
                  {isActive && <motion.div layoutId="activeIndicator" className="absolute left-0 h-6 w-1 rounded-r-full bg-cyan-400"/>}
                  <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-cyan-300' : 'text-slate-500 group-hover:text-cyan-300'}`}/>
                  {!collapsed && <span className="ml-3 truncate">{item.label}</span>}
                  {!collapsed && item.badge && <span className="ml-auto rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-300">{item.badge}</span>}
                  {collapsed && <div className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-200 opacity-0 shadow-lg transition group-hover:opacity-100">{item.label}</div>}
                </>}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-800/70 p-3">
          {!collapsed ? (
            <div className="rounded-xl bg-slate-900/40 px-3 py-2.5">
              <div className="text-xs font-semibold text-slate-300">AEGIS Monitoring</div>
              <div className="mt-1 text-[10px] text-slate-500">Observe • Detect • Alert • Report</div>
            </div>
          ) : <div className="mx-auto h-2.5 w-2.5 rounded-full bg-emerald-400"/>}
        </div>
      </aside>
    </>
  );
}
