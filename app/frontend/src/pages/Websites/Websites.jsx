import React, { useMemo, useState } from 'react';
import { Globe2, Plus, ArrowRight, CheckCircle2, Clock3, Link2, Radar, X, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

function normalizeDomain(value) {
  return value.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

export default function Websites() {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aegis_monitored_websites') || '[]'); }
    catch { return []; }
  });
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState('');
  const [label, setLabel] = useState('');

  const save = (next) => {
    setItems(next);
    localStorage.setItem('aegis_monitored_websites', JSON.stringify(next));
  };

  const addWebsite = (e) => {
    e.preventDefault();
    const clean = normalizeDomain(domain);
    if (!clean) return;
    save([...items, {
      id: Date.now(),
      domain: clean,
      label: label.trim() || clean,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }]);
    setDomain('');
    setLabel('');
    setOpen(false);
  };

  const counts = useMemo(() => ({
    total: items.length,
    connected: items.filter(x => x.status === 'connected').length,
    pending: items.filter(x => x.status === 'pending').length,
  }), [items]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-800/80 bg-slate-900/70 p-6 sm:p-7">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300">Website monitoring</span>
            <h1 className="mt-2 text-3xl font-black text-white">Add Website → Connect Website → Monitor Traffic</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">Add the web application you want AEGIS to observe. Once the website connection is configured, monitoring events and traffic insights will appear in your workspace.</p>
          </div>
          <button onClick={()=>setOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-3 text-xs font-black text-slate-950 hover:brightness-110">
            <Plus className="h-4 w-4"/> Add website
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ['Websites', counts.total, Globe2, 'text-cyan-300'],
          ['Connected', counts.connected, CheckCircle2, 'text-emerald-300'],
          ['Pending setup', counts.pending, Clock3, 'text-amber-300'],
        ].map(([label,value,Icon,color])=>(
          <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/65 p-5">
            <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[.16em] text-slate-500">{label}</span><Icon className={`h-4 w-4 ${color}`}/></div>
            <div className="mt-4 text-3xl font-black text-white">{value}</div>
          </div>
        ))}
      </section>

      {items.length === 0 ? (
        <section className="rounded-[28px] border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10"><Globe2 className="h-6 w-6 text-cyan-300"/></div>
          <h2 className="mt-5 text-xl font-black text-white">No websites added yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Start by adding the domain you want to monitor. AEGIS will then guide the connection setup before traffic monitoring begins.</p>
          <button onClick={()=>setOpen(true)} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-xs font-bold text-cyan-200 hover:bg-cyan-400/15"><Plus className="h-4 w-4"/> Add your first website</button>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/65">
          <div className="border-b border-slate-800 px-5 py-4"><h2 className="text-sm font-bold text-white">Monitored websites</h2></div>
          <div className="divide-y divide-slate-800">
            {items.map(item=>(
              <div key={item.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/60"><Globe2 className="h-4 w-4 text-cyan-300"/></div>
                  <div><p className="text-sm font-bold text-slate-100">{item.label}</p><p className="mt-0.5 text-xs text-slate-500">{item.domain}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300"><Clock3 className="h-3.5 w-3.5"/> Pending connection</span>
                  <button className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-xs font-bold text-slate-300 hover:border-cyan-400/30 hover:text-cyan-300"><Link2 className="h-3.5 w-3.5"/> Connect website</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="flex items-start gap-3"><Info className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300"/><div><h3 className="text-sm font-bold text-white">Monitoring only</h3><p className="mt-1 text-xs leading-5 text-slate-500">AEGIS is designed to observe, detect, alert, and report suspicious activity. It does not block or alter website requests.</p></div></div>
      </section>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[26px] border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><h2 className="text-xl font-black text-white">Add a website</h2><p className="mt-1 text-xs text-slate-500">Enter the web application you want to monitor.</p></div><button onClick={()=>setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4"/></button></div>
            <form onSubmit={addWebsite} className="mt-6 space-y-4">
              <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-300">Website domain</span><input required value={domain} onChange={(e)=>setDomain(e.target.value)} placeholder="example.com" className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"/></label>
              <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-300">Display name <span className="text-slate-600">(optional)</span></span><input value={label} onChange={(e)=>setLabel(e.target.value)} placeholder="Main website" className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"/></label>
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 py-3 text-sm font-black text-slate-950">Add website <ArrowRight className="h-4 w-4"/></button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
