import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await login(email.trim().toLowerCase(), password);
    setPending(false);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error || 'Incorrect email or password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1420] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white">
            <Shield className="w-4.5 h-4.5" />
          </div>
          <span className="font-bold text-slate-100 tracking-tight">AEGIS</span>
        </Link>

        <div className="bg-[#141B2B] border border-slate-800 rounded-2xl p-7 space-y-5">
          <div>
            <h1 className="text-lg font-bold text-slate-100">Sign in</h1>
            <p className="text-xs text-slate-400 mt-1">Check on your website's traffic.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourbusiness.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            {error && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{error}</span>
              </div>
            )}
            <button
              type="submit" disabled={pending}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-950 font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {pending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Sign In</span>}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-5">
          Don't have an account?{' '}
          <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-0.5">
            Create one <ArrowRight className="w-3 h-3" />
          </Link>
        </p>
      </div>
    </div>
  );
}
