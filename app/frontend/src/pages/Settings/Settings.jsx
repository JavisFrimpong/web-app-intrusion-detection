import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Server, 
  Cpu, 
  Database, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sliders, 
  ShieldCheck,
  Moon,
  Laptop
} from 'lucide-react';
import { getStoredApiUrl, setStoredApiUrl, fetchSystemStatus } from '../../services/api';
import { useSystemStatus } from '../../hooks/useSystemStatus';

export default function Settings() {
  const [apiUrlInput, setApiUrlInput] = useState(getStoredApiUrl());
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('cyber-dark');
  const { recheckStatus } = useSystemStatus();

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
        message: `Could not connect to Flask API at ${apiUrlInput}. Running in local simulation mode.`,
      });
    }
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

      {/* Backend API Configuration */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
          <Server className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-slate-100">
            Backend REST API Connection
          </h2>
        </div>

        <form onSubmit={handleSaveApiUrl} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300">
              Flask API Base URL
            </label>
            <div className="flex items-center space-x-3">
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
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Save & Ping</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Default Flask REST API URL specified in project requirements: <code className="text-cyan-400">http://127.0.0.1:5000/api</code>
            </p>
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

        {/* API Endpoint Documentation Quick Spec */}
        <div className="pt-2">
          <span className="text-xs font-mono text-slate-400 block mb-2 font-bold uppercase">
            Configured Flask REST API Endpoints
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-emerald-400 font-bold">GET /status</span>
              <p className="text-[11px] text-slate-400 mt-1">
                Returns: <code className="text-slate-300">&#123;"model":"Random Forest", "system":"Intrusion Detection System", "status":"active"&#125;</code>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-cyan-400 font-bold">POST /predict</span>
              <p className="text-[11px] text-slate-400 mt-1">
                Returns: <code className="text-slate-300">&#123;"prediction":0, "attack_type":"BENIGN", "confidence":86.06&#125;</code>
              </p>
            </div>
          </div>
        </div>
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

      {/* Project & Developer Info (Final Year Project Showcase) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
          <Database className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-slate-100">
            Project & Developer Information
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-200">Project Overview</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              This application is an AI-powered Intrusion Detection System (IDS) that detects malicious web network traffic using a Random Forest machine learning model trained on the CICIDS2017 dataset. Built as a university Final Year Project demonstration.
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
