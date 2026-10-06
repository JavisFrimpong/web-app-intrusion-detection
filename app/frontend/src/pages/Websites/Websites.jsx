import React, { useEffect, useMemo, useState } from 'react';
import { Globe2, Plus, ArrowRight, CheckCircle2, Clock3, Link2, X, Info, RefreshCw, AlertCircle, Trash2, FlaskConical, ShieldCheck } from 'lucide-react';
import { addWebsite, connectWebsite, deleteWebsite, fetchWebsites, runCicidsDemoSample } from '../../services/api';

export default function Websites() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [connectingId, setConnectingId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [lastPrediction, setLastPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await fetchWebsites();
    setLoading(false);
    if (res.success) setItems(res.websites);
    else setError(res.error);
  };

  useEffect(() => {
    load();
    const timer = setInterval(() => load(), 8000);
    return () => clearInterval(timer);
  }, []);

  const addNewWebsite = async (e) => {
    e.preventDefault();
    setError(null);
    setAdding(true);
    const res = await addWebsite(domain, label);
    setAdding(false);
    if (!res.success) return setError(res.error);
    setDomain('');
    setLabel('');
    setOpen(false);
    setMessage('Website added. Connect it to start hosted monitoring.');
    await load();
  };

  const connect = async (id) => {
    setError(null);
    setMessage(null);
    setConnectingId(id);
    const res = await connectWebsite(id);
    setConnectingId(null);
    if (!res.success) {
      setError(res.details ? `${res.error} ${res.details}` : res.error);
      return;
    }
    setMessage('Website verified. Availability monitoring is active. Run ML verification below to execute the deployed Random Forest and save a prediction to Live Activity.');
    await load();
  };

  const verifyMl = async (website) => {
    setError(null);
    setMessage(null);
    setVerifyingId(website.id);
    const res = await runCicidsDemoSample(website.id);
    setVerifyingId(null);
    if (!res.success) {
      setError(res.error);
      return;
    }
    setLastPrediction({
      website: res.data.website || website.domain,
      attackType: res.data.attack_type,
      confidence: res.data.confidence,
    });
    setMessage(`ML verification complete for ${res.data.website || website.domain}. Prediction saved to Live Activity.`);
    await load();
  };

  const remove = async (id) => {
    const res = await deleteWebsite(id);
    if (!res.success) return setError(res.error);
    await load();
  };

  const counts = useMemo(() => ({
    total: items.length,
    connected: items.filter(x => ['connected','verified','monitoring'].includes(x.status)).length,
    monitoring: items.filter(x => x.status === 'monitoring').length,
    pending: items.filter(x => !['connected','verified','monitoring'].includes(x.status)).length,
  }), [items]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-800/80 bg-slate-900/70 p-6 sm:p-7">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300">Website monitoring</span>
            <h1 className="mt-2 text-3xl font-black text-white">Add Website → Connect Website → Monitor Website</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Add a public website and let AEGIS monitor its availability, response behavior, and suspicious service conditions from the hosted monitoring service.
            </p>
          </div>
          <button onClick={()=>setOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-3 text-xs font-black text-slate-950 hover:brightness-110">
            <Plus className="h-4 w-4"/> Add website
          </button>
        </div>
      </section>

      {(error || message) && (
        <div className={`flex items-start gap-3 rounded-2xl border p-4 text-xs ${error ? 'border-rose-500/30 bg-rose-950/25 text-rose-200' : 'border-cyan-500/25 bg-cyan-950/20 text-cyan-100'}`}>
          {error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0"/> : <Info className="mt-0.5 h-4 w-4 shrink-0"/>}
          <span>{error || message}</span>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ['Websites', counts.total, Globe2, 'text-cyan-300'],
          ['Connected', counts.connected, CheckCircle2, 'text-emerald-300'],
          ['ML traffic active', counts.monitoring, Clock3, 'text-cyan-300'],
        ].map(([label,value,Icon,color])=>(
          <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/65 p-5">
            <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[.16em] text-slate-500">{label}</span><Icon className={`h-4 w-4 ${color}`}/></div>
            <div className="mt-4 text-3xl font-black text-white">{value}</div>
          </div>
        ))}
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-14 text-slate-500"><RefreshCw className="mr-2 h-4 w-4 animate-spin"/> Loading websites…</div>
      ) : items.length === 0 ? (
        <section className="rounded-[28px] border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10"><Globe2 className="h-6 w-6 text-cyan-300"/></div>
          <h2 className="mt-5 text-xl font-black text-white">No websites added yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Add a public website first. AEGIS will test whether the hosted service can reach it, then begin hosted monitoring.</p>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/65">
          <div className="border-b border-slate-800 px-5 py-4"><h2 className="text-sm font-bold text-white">Websites</h2></div>
          <div className="divide-y divide-slate-800">
            {items.map(item=>(
              <div key={item.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/60"><Globe2 className="h-4 w-4 text-cyan-300"/></div>
                  <div>
                    <p className="text-sm font-bold text-slate-100">{item.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{item.domain}</p>
                    {item.http_status && <p className="mt-1 text-[10px] text-slate-600">Last HTTP status: {item.http_status}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {item.status === 'monitoring' ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5"/> ML traffic active</span>
                  ) : ['connected','verified'].includes(item.status) ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-300"><CheckCircle2 className="h-3.5 w-3.5"/> Website connected</span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300"><Clock3 className="h-3.5 w-3.5"/> Connection pending</span>
                  )}

                  <button onClick={()=>connect(item.id)} disabled={connectingId===item.id} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-xs font-bold text-slate-300 hover:border-cyan-400/30 hover:text-cyan-300 disabled:opacity-50">
                    {connectingId===item.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin"/> : <Link2 className="h-3.5 w-3.5"/>}
                    {item.status === 'monitoring' ? 'Recheck website' : ['connected','verified'].includes(item.status) ? 'Recheck website' : 'Connect website'}
                  </button>

                  {['connected','verified','monitoring'].includes(item.status) && (
                    <button onClick={()=>verifyMl(item)} disabled={verifyingId===item.id} className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/15 disabled:opacity-50">
                      {verifyingId===item.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin"/> : <FlaskConical className="h-3.5 w-3.5"/>}
                      {verifyingId===item.id ? 'Predicting…' : 'Run ML verification'}
                    </button>
                  )}

                  <button onClick={()=>remove(item.id)} className="rounded-xl border border-slate-800 bg-slate-950/40 p-2 text-slate-600 hover:border-rose-500/30 hover:text-rose-400" title="Remove website"><Trash2 className="h-3.5 w-3.5"/></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {lastPrediction && (
        <section className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300"/>
            <div>
              <h3 className="text-sm font-bold text-white">Latest saved ML prediction</h3>
              <p className="mt-1 text-xs text-slate-300">
                <span className="font-semibold text-emerald-300">{lastPrediction.attackType}</span>
                {' '}on {lastPrediction.website} • Confidence {lastPrediction.confidence}%
              </p>
              <p className="mt-1 text-[11px] text-slate-500">This result was produced by the deployed 100-tree Random Forest using the project’s labeled CICIDS2017 verification flow and saved to Live Activity.</p>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300"/>
          <div>
            <h3 className="text-sm font-bold text-white">Monitoring modes</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Website verification requires no client installation and monitors reachability, HTTP status and response latency. Random Forest intrusion predictions require 78 standardized CICIDS2017 flow features from a compatible traffic source. For your defense, use “Run ML verification” to execute the real deployed model, save the prediction, mark ML activity, and display the result in Live Activity without pretending the sample is live visitor traffic.
            </p>
          </div>
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[26px] border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div><h2 className="text-xl font-black text-white">Add a website</h2><p className="mt-1 text-xs text-slate-500">Use a public domain such as example.com.</p></div>
              <button onClick={()=>setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4"/></button>
            </div>
            <form onSubmit={addNewWebsite} className="mt-6 space-y-4">
              <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-300">Website domain</span><input required value={domain} onChange={(e)=>setDomain(e.target.value)} placeholder="example.com" className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"/></label>
              <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-300">Display name <span className="text-slate-600">(optional)</span></span><input value={label} onChange={(e)=>setLabel(e.target.value)} placeholder="Main website" className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"/></label>
              <button type="submit" disabled={adding} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 py-3 text-sm font-black text-slate-950 disabled:opacity-50">
                {adding ? <RefreshCw className="h-4 w-4 animate-spin"/> : <>Add website <ArrowRight className="h-4 w-4"/></>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
