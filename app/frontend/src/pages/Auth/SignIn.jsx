import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, RefreshCw, AlertCircle, ArrowRight, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { forgotPassword, resetPassword } from '../../services/api';
import AegisLogo from '../../components/Brand/AegisLogo';
import AuthVisual from '../../components/Brand/AuthVisual';

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await login(email.trim().toLowerCase(), password);
    setPending(false);
    if (res.success) navigate('/dashboard');
    else setError(res.error || 'Incorrect email or password.');
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);
    const res = await forgotPassword(email.trim().toLowerCase());
    setPending(false);
    if (res.success) {
      setMessage(res.message || 'If the account exists, a reset code has been sent.');
      setMode('reset');
    } else setError(res.error || 'Could not send a password reset code.');
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (newPassword.length < 8) return setError('Password must be at least 8 characters.');
    if (newPassword !== confirmPassword) return setError('The passwords do not match.');

    setPending(true);
    const res = await resetPassword(email.trim().toLowerCase(), resetCode.trim(), newPassword);
    setPending(false);
    if (res.success) {
      setPassword('');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage(res.message || 'Password reset successfully.');
      setMode('success');
    } else setError(res.error || 'Could not reset password.');
  };

  const goBackToSignIn = () => {
    setMode('signin');
    setError(null);
    setMessage(null);
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-[#050b14] text-slate-100 lg:grid lg:grid-cols-[1.12fr_.88fr]">
      <AuthVisual mode="signin" />

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-8 lg:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(14,165,233,.12),transparent_28%)]" />
        <div className="relative w-full max-w-md">
          <Link to="/" className="mb-9 inline-flex">
            <AegisLogo />
          </Link>

          <div className="rounded-[28px] border border-slate-700/70 bg-slate-900/70 p-7 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-9">
            {mode === 'signin' && (
              <>
                <div className="mb-7">
                  <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-300">Secure workspace access</span>
                  <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Welcome back</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Review monitored websites, suspicious activity, and traffic insights from your AEGIS workspace.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-slate-300">Email address</span>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@company.com"
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 py-3.5 pl-11 pr-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/10" />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-slate-300">Password</span>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Enter your password"
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 py-3.5 pl-11 pr-11 text-sm text-slate-100 outline-none transition focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/10" />
                      <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-300">
                        {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                      </button>
                    </div>
                  </label>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500">Monitoring access only</span>
                    <button type="button" onClick={()=>{setMode('forgot');setError(null);setMessage(null);}} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">Forgot password?</button>
                  </div>

                  {error && <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-950/35 p-3 text-xs text-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0"/><span>{error}</span></div>}

                  <button type="submit" disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 px-4 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/15 transition hover:brightness-110 disabled:opacity-50">
                    {pending ? <RefreshCw className="h-4 w-4 animate-spin"/> : <>Sign in <ArrowRight className="h-4 w-4"/></>}
                  </button>
                </form>
              </>
            )}

            {mode === 'forgot' && (
              <>
                <div className="mb-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10"><KeyRound className="h-5 w-5 text-cyan-300"/></div>
                  <h1 className="text-2xl font-black text-white">Reset access</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Enter your account email and we'll send a 6-digit reset code.</p>
                </div>
                <form onSubmit={handleForgot} className="space-y-4">
                  <div className="relative"><Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"/><input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@company.com" className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 py-3.5 pl-11 pr-4 text-sm outline-none focus:border-cyan-400/70"/></div>
                  {error && <div className="rounded-xl border border-rose-500/30 bg-rose-950/35 p-3 text-xs text-rose-200">{error}</div>}
                  <button type="submit" disabled={pending} className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 py-3.5 text-sm font-black text-slate-950">{pending ? 'Sending…' : 'Send reset code'}</button>
                  <button type="button" onClick={goBackToSignIn} className="w-full text-xs font-semibold text-slate-500 hover:text-cyan-300">Back to sign in</button>
                </form>
              </>
            )}

            {mode === 'reset' && (
              <>
                <h1 className="text-2xl font-black text-white">Choose a new password</h1>
                <p className="mt-2 mb-6 text-sm text-slate-400">Enter the code sent to <span className="text-slate-200">{email}</span>.</p>
                {message && <div className="mb-4 rounded-xl border border-cyan-500/25 bg-cyan-950/30 p-3 text-xs text-cyan-100">{message}</div>}
                <form onSubmit={handleReset} className="space-y-4">
                  <input type="text" inputMode="numeric" maxLength={6} required value={resetCode} onChange={(e)=>setResetCode(e.target.value.replace(/\D/g,''))} placeholder="000000" className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 py-3 text-center font-mono text-lg tracking-[.45em] outline-none focus:border-cyan-400/70"/>
                  <input type="password" required minLength={8} value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} placeholder="New password" className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3.5 text-sm outline-none focus:border-cyan-400/70"/>
                  <input type="password" required minLength={8} value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3.5 text-sm outline-none focus:border-cyan-400/70"/>
                  {error && <div className="rounded-xl border border-rose-500/30 bg-rose-950/35 p-3 text-xs text-rose-200">{error}</div>}
                  <button type="submit" disabled={pending} className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 py-3.5 text-sm font-black text-slate-950">{pending ? 'Updating…' : 'Reset password'}</button>
                  <button type="button" onClick={handleForgot} className="w-full text-xs text-slate-500 hover:text-cyan-300">Resend reset code</button>
                </form>
              </>
            )}

            {mode === 'success' && (
              <div className="text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10"><CheckCircle2 className="h-7 w-7 text-emerald-400"/></div>
                <h1 className="text-2xl font-black text-white">Password updated</h1>
                <p className="mt-2 text-sm leading-6 text-slate-400">Your password has been reset and previous sessions were signed out.</p>
                <button onClick={goBackToSignIn} className="mt-7 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 py-3.5 text-sm font-black text-slate-950">Sign in</button>
              </div>
            )}
          </div>

          {mode === 'signin' && <p className="mt-6 text-center text-sm text-slate-500">New to AEGIS? <Link to="/signup" className="font-semibold text-cyan-300 hover:text-cyan-200">Create a workspace</Link></p>}
        </div>
      </main>
    </div>
  );
}
