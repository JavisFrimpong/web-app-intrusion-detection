import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, RefreshCw, Server, AlertTriangle, UserCheck, Radar, LogOut } from 'lucide-react';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import { useDetectionHistory } from '../../hooks/useDetectionHistory';
import { formatTimestamp } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const pageTitles = {
  '/dashboard': ['Security Overview', 'Monitoring activity across your AEGIS workspace'],
  '/dashboard/websites': ['Websites', 'Add and connect web applications for monitoring'],
  '/dashboard/threat-detection': ['Live Activity', 'Review detection events as they are observed'],
  '/dashboard/traffic-analysis': ['Traffic Insights', 'Explore observed traffic patterns and anomalies'],
  '/dashboard/reports': ['Reports', 'Review and export monitoring history'],
  '/dashboard/settings': ['Settings', 'Manage your workspace and monitoring preferences'],
};

export default function Navbar({ setMobileOpen }) {
  const location = useLocation();
  const [title, subtitle] = pageTitles[location.pathname] || ['AEGIS', 'Security monitoring workspace'];
  const { isOnline, loading, recheckStatus } = useSystemStatus(15000);
  const { history, alerts } = useDetectionHistory(15000);
  const { user, logout } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifications = [
    ...alerts.map(a=>({id:`alert-${a.id}`,title:a.alertType,time:formatTimestamp(a.timestamp),type:'warning'})),
    ...history.filter(item=>item.prediction!==0).map(item=>({id:`det-${item.id}`,title:item.attackType,time:formatTimestamp(item.timestamp),type:'critical'}))
  ].slice(0,5);

  return (
    <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between border-b border-slate-800/80 bg-[#050b14]/85 px-4 backdrop-blur-xl lg:px-6">
      <div className="flex items-center gap-4">
        <button onClick={()=>setMobileOpen(true)} className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-300 lg:hidden"><Menu className="h-5 w-5"/></button>
        <div>
          <h1 className="text-base font-black tracking-tight text-white lg:text-lg">{title}</h1>
          <p className="mt-0.5 hidden text-[11px] text-slate-500 sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={recheckStatus} className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold sm:flex ${isOnline ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/25 bg-amber-500/10 text-amber-300'}`}>
          <Server className="h-3.5 w-3.5"/><span>{loading ? 'Checking…' : isOnline ? 'Service online' : 'Service offline'}</span><RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`}/>
        </button>

        <div className="relative">
          <button onClick={()=>setNotificationsOpen(!notificationsOpen)} className="relative rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-300 hover:border-cyan-500/30 hover:text-white">
            <Bell className="h-4 w-4"/>
            {notifications.length>0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500"/>}
          </button>
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-800 bg-slate-900 p-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span className="text-xs font-bold text-slate-200">Recent alerts</span><span className="text-[10px] text-slate-500">{notifications.length} items</span></div>
              <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
                {notifications.length===0 && <p className="px-1 py-3 text-xs text-slate-500">No suspicious events yet.</p>}
                {notifications.map(n=><div key={n.id} className="flex gap-2.5 rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                  {n.type==='critical'?<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400"/>:<Radar className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300"/>}
                  <div><p className="text-xs font-medium text-slate-200">{n.title}</p><p className="mt-0.5 text-[10px] text-slate-500">{n.time}</p></div>
                </div>)}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 border-l border-slate-800 pl-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white"><UserCheck className="h-4 w-4"/></div>
          <div className="hidden max-w-[145px] md:block"><p className="truncate text-xs font-semibold text-slate-200">{user?.email || 'Signed in'}</p><p className="mt-0.5 text-[10px] text-slate-500">Monitoring workspace</p></div>
          <button onClick={logout} title="Sign out" className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-500 hover:border-rose-500/30 hover:text-rose-400"><LogOut className="h-4 w-4"/></button>
        </div>
      </div>
    </header>
  );
}
