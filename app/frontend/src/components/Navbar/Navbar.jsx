import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Menu, 
  Bell, 
  RefreshCw, 
  Server, 
  CheckCircle2, 
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import { getStoredUser, logoutUser } from '../../services/authService';

const pageTitles = {
  '/': 'Security Operations Center (SOC) Overview',
  '/threat-detection': 'Live Intrusion Detection Feed',
  '/traffic-analysis': 'Network Traffic Metrics & Telemetry',
  '/reports': 'Threat Intelligence & Logs History',
  '/settings': 'System & ML Model Configuration',
};

export default function Navbar({ setMobileOpen }) {
  const location = useLocation();
  const currentPageTitle = pageTitles[location.pathname] || 'Dashboard';
  const { isOnline, model, status, loading, recheckStatus } = useSystemStatus(15000);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const currentUser = getStoredUser();

  const notifications = [
    { id: 1, title: 'SYN Flood Detected', time: '2 mins ago', type: 'critical' },
    { id: 2, title: 'Model Status Active', time: '10 mins ago', type: 'info' },
    { id: 3, title: 'Port Scan Blocked', time: '15 mins ago', type: 'warning' },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-6 flex items-center justify-between">
      {/* Left side: Hamburger + Page Title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <h1 className="text-base lg:text-lg font-bold text-slate-100 tracking-tight">
              {currentPageTitle}
            </h1>
          </div>
          <span className="hidden sm:inline-block text-[11px] text-slate-400 font-mono">
            Machine Learning Web App Intrusion Detection System
          </span>
        </div>
      </div>

      {/* Right side: API Status Pill + Notifications + User Avatar */}
      <div className="flex items-center space-x-3 lg:space-x-4">
        
        {/* Backend API Connection Status Indicator */}
        <div className="hidden sm:flex items-center">
          <button
            onClick={recheckStatus}
            title="Click to ping Flask API status endpoint (/api/status)"
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all ${
              isOnline
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                : 'bg-amber-950/60 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
            }`}
          >
            <Server className={`w-3.5 h-3.5 shrink-0 ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`} />
            
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {loading ? (
                'Connecting...'
              ) : isOnline ? (
                <span>
                  API: <strong className="font-bold">ONLINE</strong>
                  <span className="hidden md:inline"> ({model})</span>
                </span>
              ) : (
                'API: LOCAL ENGINE ONLINE'
              )}
            </span>

            <RefreshCw className={`w-3 h-3 shrink-0 text-slate-400 hover:text-white transition-transform ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Notifications dropdown trigger */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/40 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 lg:w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-3 backdrop-blur-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-200">SOC System Alerts</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                  3 New
                </span>
              </div>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start space-x-2.5">
                    {n.type === 'critical' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-200">{n.title}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Sign Out Button */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white border border-cyan-400/30 shadow-md shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="hidden md:flex flex-col min-w-0 max-w-[120px]">
            <span className="text-xs font-semibold text-slate-200 leading-tight truncate">
              {currentUser?.name || 'SOC Client'}
            </span>
            <span className="text-[10px] text-cyan-400 font-mono truncate">
              {currentUser?.company || 'Enterprise Partner'}
            </span>
          </div>

          <button
            onClick={logoutUser}
            title="Sign Out of AEGIS Console"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
