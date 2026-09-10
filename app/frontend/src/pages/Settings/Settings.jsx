import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Server, 
  Cpu, 
  Database, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  RefreshCw, 
  Sliders, 
  ShieldCheck,
  Moon,
  Laptop,
  Trash2,
  Wrench,
  Wifi
} from 'lucide-react';
import { getStoredApiUrl, setStoredApiUrl, fetchSystemStatus } from '../../services/api';
import { deleteUserAccount, getStoredUser } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import { useDetectionHistory } from '../../hooks/useDetectionHistory';

export default function Settings() {
  const currentUser = getStoredUser();
  const auth = useAuth();
  const [apiUrlInput, setApiUrlInput] = useState(getStoredApiUrl());
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('cyber-dark');
  const [clearResult, setClearResult] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Delete Account State
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [deleteEmailInput, setDeleteEmailInput] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const { recheckStatus, isOnline: isApiOnline } = useSystemStatus();
  const { isOnline: isDbOnline, clearHistory, totalCount } = useDetectionHistory(0);

  const handleDeleteAccount = async () => {
    const userEmail = currentUser?.email || deleteEmailInput.trim();
    if (!userEmail) {
      setDeleteError('Please enter your account email to confirm deletion.');
      return;
    }
    setDeletingAccount(true);
    setDeleteError(null);
    const res = await deleteUserAccount(userEmail);
    setDeletingAccount(false);
    if (res.success) {
      if (auth && auth.logout) {
        await auth.logout();
      } else {
        window.location.href = '/landing';
      }
    } else {
      setDeleteError(res.error || 'Failed to delete account.');
    }
  };

  const handleSaveApiUrl = async (e) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    setStoredApiUrl(apiUrlInput.trim());
    const res = await fetchSystemStatus();
    setTesting(false);

    if (res.success && res.isOnline) {
      setTestResult({
        success: true,
        message: `Successfully connected to Flask API (${res.data.model} - Status: ${res.data.status})`,
      });
      recheckStatus();
    } else {
      setTestResult({
        success: false,
        message: `Could not connect to Flask API at ${apiUrlInput}. Check that the backend server is running.`,
      });
    }
  };

  const handleClearHistory = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setClearing(true);
    setClearResult(null);
    const res = await clearHistory();
    setClearing(false);
    setConfirmClear(false);
    setClearResult(
      res.success
        ? { success: true, message: 'All stored predictions and alerts were cleared from the database.' }
        : { success: false, message: res.error || 'Failed to clear history — backend may be offline.' }
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-100">
              System & Model Settings
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Configure backend Flask REST API endpoints, ML hyperparameters, and theme preferences
            </p>
          </div>
        </div>
      </div>

      {/* Backend API Connection — read-only by default, no route map exposed */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Backend Connection
            </h2>
          </div>
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 hover:text-cyan-400 transition-colors"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{showAdvanced ? 'Hide advanced' : 'Advanced'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${isApiOnline ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              {isApiOnline ? 'Connected' : 'Not connected'}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              {isApiOnline ? 'The dashboard is receiving live data from the server.' : 'Make sure the backend is running.'}
            </p>
          </div>
        </div>

        {showAdvanced && (
          <form onSubmit={handleSaveApiUrl} className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300">
                Backend Server Address (developer setting — leave as default unless you know why you're changing it)
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  value={apiUrlInput}
                  onChange={(e) => setApiUrlInput(e.target.value)}
                  placeholder="http://127.0.0.1:5000/api"
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50"
                />
                <button
                  type="submit"
                  disabled={testing}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                >
                  {testing ? <RefreshCw className="w-4 h-4 animate-spin shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  <span>Save & Test</span>
                </button>
              </div>
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl border text-xs font-mono flex items-center space-x-2 ${
                testResult.success 
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </form>
        )}
      </div>

      {/* Data Management: real, destructive action wired to /history/clear */}
      <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
          <Trash2 className="w-5 h-5 text-rose-400" />
          <h2 className="text-base font-bold text-slate-100">
            Data Management
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-200 font-semibold">Clear Detection History</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Permanently deletes all {totalCount} stored predictions and heuristic alerts from predictions.db.
              This cannot be undone.
            </p>
          </div>
          <button
            onClick={handleClearHistory}
            disabled={!isDbOnline || clearing}
            className={`px-5 py-2.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-40 shrink-0 ${
              confirmClear
                ? 'bg-rose-600 text-white hover:bg-rose-500'
                : 'bg-slate-900 border border-rose-500/40 text-rose-300 hover:bg-rose-950/40'
            }`}
          >
            {clearing ? <RefreshCw className="w-4 h-4 animate-spin shrink-0" /> : <Trash2 className="w-4 h-4 shrink-0" />}
            <span>{confirmClear ? 'Confirm: Delete Everything' : 'Clear Detection History'}</span>
          </button>
        </div>

        {!isDbOnline && (
          <p className="text-[11px] text-amber-400 font-mono">Backend offline — reconnect before clearing history.</p>
        )}

        {clearResult && (
          <div className={`p-3 rounded-xl border text-xs font-mono flex items-center space-x-2 ${
            clearResult.success
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
          }`}>
            {clearResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />}
            <span>{clearResult.message}</span>
          </div>
        )}
      </div>

      {/* Danger Zone: Delete User Account */}
      <div className="glass-panel p-6 rounded-2xl border border-rose-600/40 bg-rose-950/10 space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-rose-900/40">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <h2 className="text-base font-bold text-rose-200">
            Danger Zone — Account Operations
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-200 font-semibold">Delete Client Account</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Permanently deletes your user credentials, organization references, and session profile from AEGIS Enterprise SOC database.
            </p>
          </div>
          <button
            onClick={() => setConfirmDeleteAccount(prev => !prev)}
            className="px-5 py-2.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider bg-rose-900/40 border border-rose-500/50 text-rose-300 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>{confirmDeleteAccount ? 'Cancel Deletion' : 'Delete Account'}</span>
          </button>
        </div>

        {confirmDeleteAccount && (
          <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/40 space-y-3 mt-3">
            <p className="text-xs font-mono text-rose-300 font-semibold">
              Warning: This action is permanent and cannot be undone. Enter your email address to confirm account deletion:
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="email"
                value={deleteEmailInput}
                onChange={(e) => setDeleteEmailInput(e.target.value)}
                placeholder={currentUser?.email || "confirm@yourcompany.com"}
                className="flex-1 px-4 py-2.5 bg-slate-900 border border-rose-500/30 rounded-xl text-xs font-mono text-rose-200 focus:outline-none focus:border-rose-500"
              />
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount || (!currentUser?.email && !deleteEmailInput.trim())}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 shadow-lg shadow-rose-600/30"
              >
                {deletingAccount ? <RefreshCw className="w-4 h-4 animate-spin shrink-0" /> : <Trash2 className="w-4 h-4 shrink-0" />}
                <span>Permanently Delete Account</span>
              </button>
            </div>

            {deleteError && (
              <p className="text-xs font-mono text-rose-400 flex items-center gap-1.5 pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{deleteError}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Machine Learning Model Specifications */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-slate-100">
            Machine Learning Architecture Specs
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 uppercase text-[10px]">Algorithm</span>
            <div className="text-sm font-bold text-slate-200">Random Forest Classifier</div>
            <p className="text-[11px] text-slate-500">n_estimators=100 · criterion='gini'</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 uppercase text-[10px]">Benchmark Dataset</span>
            <div className="text-sm font-bold text-slate-200">CICIDS2017</div>
            <p className="text-[11px] text-slate-500">78 Network Flow Features</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 uppercase text-[10px]">Test Validation Accuracy</span>
            <div className="text-sm font-bold text-emerald-400">99.20% Accuracy</div>
            <p className="text-[11px] text-slate-500">Sub-10ms Inference Latency</p>
          </div>
        </div>
      </div>

      {/* Project & Developer Info */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
          <Database className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-slate-100">
            AEGIS Enterprise System Architecture
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-200">System Overview</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              AEGIS is an enterprise AI-powered Intrusion Detection & Prevention System (IDS/IPS) that monitors and detects malicious web network traffic using a high-accuracy Random Forest machine learning model trained on the benchmark CICIDS2017 dataset. Built for real-time production threat analysis and Security Operations Center (SOC) telemetry monitoring.
            </p>
          </div>

          <div className="space-y-2 font-mono text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-400">Frontend Stack:</span>
              <span className="text-cyan-300 font-bold">React 19 + Vite + Tailwind</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Backend Stack:</span>
              <span className="text-cyan-300 font-bold">Flask REST API (Python)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ML Model:</span>
              <span className="text-cyan-300 font-bold">Random Forest (Scikit-Learn)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Dataset:</span>
              <span className="text-cyan-300 font-bold">Canadian Institute for Cybersecurity (CICIDS2017)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
