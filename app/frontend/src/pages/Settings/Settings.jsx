import React, { useState } from 'react';
import { Settings as SettingsIcon, Server, CheckCircle2, AlertCircle, RefreshCw, Trash2, Wrench, Wifi, User, BellRing, Moon, ShieldAlert } from 'lucide-react';
import { getStoredApiUrl, setStoredApiUrl, fetchSystemStatus } from '../../services/api';
import { deleteUserAccount } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import { useDetectionHistory } from '../../hooks/useDetectionHistory';

export default function Settings() {
  const auth = useAuth();
  const currentUser = auth.user;
  const [apiUrlInput, setApiUrlInput] = useState(getStoredApiUrl());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { recheckStatus, isOnline } = useSystemStatus();
  const { clearHistory, totalCount } = useDetectionHistory(0);

  const testApi = async (e) => {
    e.preventDefault();
    setTesting(true);
    setStoredApiUrl(apiUrlInput.trim());
    const res = await fetchSystemStatus();
    setTesting(false);
    setTestResult(res.success && res.isOnline ? {ok:true,text:'Monitoring API connected successfully.'}:{ok:false,text:'Could not connect to the monitoring API.'});
    if (res.success && res.isOnline) recheckStatus();
  };

  const clearData = async () => {
    if (!confirmClear) return setConfirmClear(true);
    setClearing(true);
    await clearHistory();
    setClearing(false);
    setConfirmClear(false);
  };

  const deleteAccount = async () => {
    if ((deleteEmail||'').trim().toLowerCase() !== (currentUser?.email||'').trim().toLowerCase()) return setDeleteError('Enter the exact account email to confirm deletion.');
    setDeleting(true);
    const res = await deleteUserAccount();
    setDeleting(false);
    if (res.success) await auth.logout();
    else setDeleteError(res.error || 'Could not delete account.');
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-[28px] border border-slate-800 bg-slate-900/65 p-6">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10"><SettingsIcon className="h-5 w-5 text-cyan-300"/></div><div><h1 className="text-2xl font-black text-white">Workspace settings</h1><p className="mt-1 text-xs text-slate-500">Manage your monitoring workspace, preferences, and account.</p></div></div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><User className="h-5 w-5 text-cyan-300"/><h2 className="mt-4 text-sm font-bold text-white">Account</h2><p className="mt-1 text-xs text-slate-500">{currentUser?.email || 'Signed-in user'}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><BellRing className="h-5 w-5 text-cyan-300"/><h2 className="mt-4 text-sm font-bold text-white">Alerts</h2><p className="mt-1 text-xs text-slate-500">Suspicious activity notifications enabled</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><Moon className="h-5 w-5 text-cyan-300"/><h2 className="mt-4 text-sm font-bold text-white">Appearance</h2><p className="mt-1 text-xs text-slate-500">AEGIS dark interface</p></div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4"><div className="flex items-center gap-2"><Server className="h-5 w-5 text-cyan-300"/><h2 className="text-sm font-bold text-white">Monitoring service</h2></div><button onClick={()=>setShowAdvanced(!showAdvanced)} className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-300"><Wrench className="h-3.5 w-3.5"/>{showAdvanced?'Hide advanced':'Advanced'}</button></div>
        <div className="mt-4 flex items-center gap-3"><div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${isOnline?'border-emerald-500/25 bg-emerald-500/10 text-emerald-300':'border-amber-500/25 bg-amber-500/10 text-amber-300'}`}><Wifi className="h-4 w-4"/></div><div><p className="text-sm font-semibold text-slate-200">{isOnline?'Connected':'Not connected'}</p><p className="text-xs text-slate-500">Connection between the dashboard and AEGIS monitoring API</p></div></div>
        {showAdvanced && <form onSubmit={testApi} className="mt-5 space-y-3 border-t border-slate-800 pt-4"><label className="text-xs text-slate-400">API endpoint</label><div className="flex flex-col gap-3 sm:flex-row"><input value={apiUrlInput} onChange={(e)=>setApiUrlInput(e.target.value)} className="flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-xs text-cyan-200 outline-none focus:border-cyan-400/50"/><button disabled={testing} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-xs font-black text-slate-950">{testing?<RefreshCw className="h-4 w-4 animate-spin"/>:<CheckCircle2 className="h-4 w-4"/>} Save & test</button></div>{testResult&&<div className={`rounded-xl border p-3 text-xs ${testResult.ok?'border-emerald-500/25 bg-emerald-500/10 text-emerald-300':'border-amber-500/25 bg-amber-500/10 text-amber-300'}`}>{testResult.text}</div>}</form>}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4"><ShieldAlert className="h-5 w-5 text-cyan-300"/><h2 className="text-sm font-bold text-white">Monitoring data</h2></div>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-slate-200">Clear event history</p><p className="mt-1 text-xs text-slate-500">Delete {totalCount} stored monitoring events and alerts from this account.</p></div><button onClick={clearData} disabled={clearing} className={`rounded-xl border px-4 py-2.5 text-xs font-bold ${confirmClear?'border-rose-500 bg-rose-600 text-white':'border-rose-500/30 bg-rose-500/10 text-rose-300'}`}>{clearing?'Clearing…':confirmClear?'Confirm deletion':'Clear history'}</button></div>
      </section>

      <section className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-6">
        <div className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-rose-400"/><h2 className="text-sm font-bold text-rose-200">Delete account</h2></div>
        <p className="mt-2 text-xs leading-5 text-slate-500">Permanently remove this account, sessions, and stored monitoring data.</p>
        {!confirmDelete ? <button onClick={()=>setConfirmDelete(true)} className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-300">Delete account</button> : <div className="mt-4 space-y-3"><input type="email" value={deleteEmail} onChange={(e)=>setDeleteEmail(e.target.value)} placeholder={currentUser?.email || 'Confirm email'} className="w-full rounded-xl border border-rose-500/25 bg-slate-950/60 px-4 py-3 text-sm outline-none focus:border-rose-400"/>{deleteError&&<div className="flex items-center gap-2 text-xs text-rose-300"><AlertCircle className="h-4 w-4"/>{deleteError}</div>}<div className="flex gap-2"><button onClick={deleteAccount} disabled={deleting} className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white">{deleting?'Deleting…':'Permanently delete'}</button><button onClick={()=>{setConfirmDelete(false);setDeleteError(null)}} className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-400">Cancel</button></div></div>}
      </section>
    </div>
  );
}
