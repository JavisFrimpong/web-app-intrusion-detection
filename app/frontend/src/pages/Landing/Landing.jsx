import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Globe, 
  Wifi, 
  Cpu, 
  Lock, 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Server, 
  FileSpreadsheet, 
  Layers, 
  HelpCircle,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getStoredUser } from '../../services/authService';
import AuthModal from '../../components/Auth/AuthModal';

export default function Landing() {
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('signin');
  const [activeFaq, setActiveFaq] = useState(null);

  const isUserAuth = isAuthenticated();
  const currentUser = getStoredUser();

  const handleLaunchConsole = () => {
    if (isUserAuth) {
      navigate('/');
    } else {
      setAuthTab('signup');
      setAuthModalOpen(true);
    }
  };

  const handleOpenSignIn = () => {
    setAuthTab('signin');
    setAuthModalOpen(true);
  };

  const faqs = [
    {
      q: "How does AEGIS detect malicious web network traffic?",
      a: "AEGIS leverages a Random Forest Machine Learning model trained on the benchmark CICIDS2017 dataset. When network traffic or a target domain is probed, 78 statistical flow features (duration, packet length distribution, flow bytes/sec, SYN/ACK counts) are extracted and classified in sub-10 milliseconds."
    },
    {
      q: "Can I test my own custom domain or public IP address?",
      a: "Yes! The Live Address Scanner allows clients to probe any domain or IP (such as google.com, spotify.com, speedtest.net, 8.8.8.8, or custom URLs) to perform live DNS resolution, measure HTTP response timing, and view real-time ML risk assessment."
    },
    {
      q: "How does the Email Verification Code system work?",
      a: "When you create a client account, a 6-digit verification code (OTP) is sent to your registered email address. You must verify this code to activate your account before accessing the live SOC Monitoring Console."
    },
    {
      q: "Can I export audit logs and threat telemetry reports?",
      a: "Absolultely. Logged-in security analysts can export historical threat logs and classification reports directly into CSV or JSON formats, or generate formatted executive PDF reports."
    }
  ];

  return (
    <div className="min-h-screen bg-cyber-grid bg-radial-gradient text-slate-100 font-sans flex flex-col">
      {/* Auth Modal Trigger */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authTab}
        onSuccess={() => navigate('/')}
      />

      {/* Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-blue-400 via-cyan-300 to-white bg-clip-text text-transparent">
                AEGIS SOC
              </span>
              <span className="text-[10px] text-cyan-400 font-mono block">Enterprise Security Platform</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-mono text-slate-300">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#live-scanner" className="hover:text-cyan-400 transition-colors">Live Scanner</a>
            <a href="#specs" className="hover:text-cyan-400 transition-colors">Architecture</a>
            <a href="#pricing" className="hover:text-cyan-400 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-cyan-400 transition-colors">FAQ</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 font-mono text-xs">
            {isUserAuth ? (
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black uppercase tracking-wider hover:brightness-110 transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20"
              >
                <UserCheck className="w-4 h-4 text-slate-950" />
                <span>Console ({currentUser?.name || 'Client'})</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleOpenSignIn}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={handleLaunchConsole}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-950 font-black uppercase tracking-wider hover:brightness-110 transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-8 max-w-7xl mx-auto flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Real-Time Machine Learning Intrusion Prevention</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-100 tracking-tight leading-tight">
              Protect Your Web Network with <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-teal-300 bg-clip-text text-transparent">AI-Powered SOC Telemetry</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 font-sans leading-relaxed max-w-xl">
              AEGIS monitors, probes, and classifies malicious web traffic in under 10ms. Monitor live addresses like <strong className="text-cyan-300">google.com</strong> or custom domains against trained Random Forest models.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={handleLaunchConsole}
                className="py-4 px-8 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5 fill-slate-950" />
                <span>{isUserAuth ? 'Enter SOC Dashboard' : 'Create Account & Monitor Website'}</span>
              </button>

              <a
                href="#live-scanner"
                className="py-4 px-6 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 font-mono text-xs font-bold hover:text-white hover:border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Explore Live Scanner</span>
              </a>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 font-mono">
              <div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400">99.20%</div>
                <div className="text-[11px] text-slate-400">Model Accuracy</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-cyan-400">&lt; 10ms</div>
                <div className="text-[11px] text-slate-400">Inference Latency</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-200">78 Features</div>
                <div className="text-[11px] text-slate-400">CICIDS2017 Vector</div>
              </div>
            </div>
          </div>

          {/* Hero Right Visual Preview Card */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="glass-panel p-6 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-4 relative overflow-hidden"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-slate-200">LIVE TARGET SCANNER</span>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                  REAL-TIME PROBE
                </span>
              </div>

              {/* Sample Target Address Display */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs">
                <div className="flex items-center space-x-2 truncate">
                  <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-slate-100 font-bold truncate">https://google.com</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded shrink-0">
                  200 OK
                </span>
              </div>

              {/* Live Probe Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Resolved IP</span>
                  <span className="text-slate-200 font-bold">142.250.190.46</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Latency</span>
                  <span className="text-cyan-400 font-bold">18.42 ms</span>
                </div>
              </div>

              {/* ML Verdict Card */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Classification: BENIGN
                  </span>
                  <span className="text-xs font-mono font-extrabold text-emerald-300">98.75% Conf</span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  Traffic pattern matches healthy baseline specs. No intrusion vectors detected.
                </p>
              </div>

              <button
                onClick={handleLaunchConsole}
                className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-xs font-mono font-bold text-cyan-300 flex items-center justify-center gap-2 transition-all"
              >
                <span>Test Custom Domain Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="py-16 px-4 sm:px-8 border-t border-slate-800/60 bg-slate-950/40">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block">
              ENTERPRISE DEFENSE CAPABILITIES
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
              Next-Generation Intrusion Detection
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-sans">
              Designed for modern Security Operations Centers (SOCs) to monitor, classify, and mitigate web attack threats in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Random Forest Classifier</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Trained on 78 statistical network flow parameters of the benchmark CICIDS2017 dataset. Evaluates SYN floods, DoS, PortScans, and SQL injections.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Live Target Address Testing</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Type any domain or public IP address (google.com, spotify.com, speedtest.net) to run live DNS resolution, latency timing, and ML security checks.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100">SOC Audit Logs & Exports</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Inspect complete classification audit trails in SQLite database storage. Export filtered logs to CSV, JSON, or print executive PDF reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4 sm:px-8 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block">
              ENTERPRISE TIERS
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
              Flexible Protection Plans
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
            {/* Starter */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
              <h3 className="text-base font-bold text-slate-200">Starter Protection</h3>
              <div className="text-3xl font-black text-slate-100">$49<span className="text-xs text-slate-400 font-normal">/mo</span></div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Single Domain Monitoring</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Live Address Scanner</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1,000 Flow Inferences/mo</li>
              </ul>
              <button onClick={handleLaunchConsole} className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold hover:text-white">Get Started</button>
            </div>

            {/* Enterprise SOC */}
            <div className="glass-panel p-6 rounded-2xl border border-cyan-500/50 shadow-xl shadow-cyan-500/10 space-y-4 relative">
              <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-bold uppercase">Popular</span>
              <h3 className="text-base font-bold text-cyan-300">Enterprise SOC</h3>
              <div className="text-3xl font-black text-slate-100">$199<span className="text-xs text-slate-400 font-normal">/mo</span></div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unlimited Live Target Probes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 78-Vector Random Forest ML</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> SQLite Log Store & CSV Exports</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Email OTP Verification System</li>
              </ul>
              <button onClick={handleLaunchConsole} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-slate-950 text-xs font-black uppercase">Launch Enterprise</button>
            </div>

            {/* Custom Defense */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
              <h3 className="text-base font-bold text-slate-200">Custom Defense</h3>
              <div className="text-3xl font-black text-slate-100">Custom</div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Dedicated Model Training</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> On-Premise Flask API Deployment</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 24/7 Priority Support</li>
              </ul>
              <button onClick={handleLaunchConsole} className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold hover:text-white">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-16 px-4 sm:px-8 border-t border-slate-800/60 bg-slate-950/40">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block">FREQUENTLY ASKED QUESTIONS</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3 font-sans">
            {faqs.map((faq, idx) => (
              <div key={idx} className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-200 hover:text-cyan-300 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === idx ? 'rotate-180 text-cyan-400' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-slate-400 font-sans leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-8 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-slate-200">AEGIS Enterprise Security Operations Center</span>
          </div>
          <div className="text-[11px] text-slate-500">
            © 2026 AEGIS Cybersecurity Engine. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
