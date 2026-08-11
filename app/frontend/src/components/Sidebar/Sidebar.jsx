import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Activity, 
  FileSpreadsheet, 
  Settings, 
  Shield, 
  ChevronLeft, 
  ChevronRight,
  Cpu,
  Lock
} from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/threat-detection', label: 'Threat Detection', icon: ShieldAlert, badge: 'Live' },
  { path: '/traffic-analysis', label: 'Traffic Analysis', icon: Activity },
  { path: '/reports', label: 'Reports & Logs', icon: FileSpreadsheet },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-xl border-r border-slate-800/80 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/60">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20 shrink-0">
              <Shield className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>

            {!collapsed && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col min-w-0"
              >
                <span className="font-extrabold tracking-wider text-sm bg-gradient-to-r from-blue-400 via-cyan-300 to-white bg-clip-text text-transparent truncate">
                  AEGIS SOC
                </span>
                <span className="text-[10px] uppercase font-mono text-cyan-400 tracking-widest flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> ML IDS v1.0
                </span>
              </motion.div>
            )}
          </div>

          {/* Desktop Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/40 transition-colors"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Model Specs Quick Info */}
        {!collapsed && (
          <div className="mx-3 mt-4 p-3 rounded-xl bg-gradient-to-b from-slate-900/90 to-slate-900/40 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1 text-slate-300 font-medium">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Core Engine
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                99.2% ACC
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Random Forest · CICIDS2017
            </p>
          </div>
        )}

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `group relative flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/30 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 hover:border-slate-800 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 w-1 h-6 bg-cyan-400 rounded-r-full shadow-[0_0_10px_#06b6d4]"
                      />
                    )}
                    <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'
                    }`} />
                    
                    {!collapsed && (
                      <span className="ml-3 truncate font-sans tracking-wide">
                        {item.label}
                      </span>
                    )}

                    {!collapsed && item.badge && (
                      <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        {item.badge}
                      </span>
                    )}

                    {collapsed && (
                      <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-slate-200 text-xs rounded-md shadow-lg border border-slate-800 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-slate-800/60 bg-slate-950/60">
          {!collapsed ? (
            <div className="flex items-center space-x-3 px-2 py-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-slate-200 truncate">
                  Final Year Project
                </span>
                <span className="text-[10px] text-slate-400 truncate font-mono">
                  Web App Security SOC
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="System Active" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
