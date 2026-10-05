import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, RefreshCw, AlertCircle, ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { forgotPassword, resetPassword } from '../../services/api';

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState('signin'); // signin | forgot | reset | success
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
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
    } else {
      setError(res.error || 'Could not send a password reset code.');
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setPending(true);
    const res = await resetPassword(
      email.trim().toLowerCase(),
      resetCode.trim(),
      newPassword
    );
    setPending(false);

    if (res.success) {
      setPassword('');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage(res.message || 'Password reset successfully.');
      setMode('success');
    } else {
      setError(res.error || 'Could not reset password.');
    }
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
    <div className="min-h-screen bg-[#0E1420] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white">
            <Shield className="w-4.5 h-4.5" />
          </div>
          <span className="font-bold text-slate-100 tracking-tight">AEGIS</span>
        </Link>

        <div className="bg-[#141B2B] border border-slate-800 rounded-2xl p-7 space-y-5">
          {mode === 'signin' && (
            <>
              <div>
                <h1 className="text-lg font-bold text-slate-100">Sign in</h1>
                <p className="text-xs text-slate-400 mt-1">Check on your website's traffic.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourbusiness.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                      setMessage(null);
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-950 font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {pending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Sign In</span>}
                </button>
              </form>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                  <KeyRound className="w-5 h-5 text-cyan-400" />
                </div>
                <h1 className="text-lg font-bold text-slate-100">Forgot password?</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your account email and we'll send you a 6-digit reset code.
                </p>
              </div>

              <form onSubmit={handleForgot} className="space-y-3">
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourbusiness.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                {error && (
                  <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-950 font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {pending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Send Reset Code</span>}
                </button>

                <button
                  type="button"
                  onClick={goBackToSignIn}
                  className="w-full text-xs text-slate-500 hover:text-cyan-400 transition-colors"
                >
                  Back to sign in
                </button>
              </form>
            </>
          )}

          {mode === 'reset' && (
            <>
              <div>
                <h1 className="text-lg font-bold text-slate-100">Reset your password</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Enter the 6-digit code sent to <span className="text-slate-300">{email}</span> and choose a new password.
                </p>
              </div>

              {message && (
                <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200">
                  {message}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.5em] text-lg py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-700 font-mono focus:outline-none focus:border-cyan-500/50"
                />

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min. 8 characters)"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                {error && (
                  <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-950 font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {pending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Reset Password</span>}
                </button>

                <button
                  type="button"
                  onClick={handleForgot}
                  disabled={pending}
                  className="w-full text-xs text-slate-500 hover:text-cyan-400 transition-colors disabled:opacity-50"
                >
                  Resend reset code
                </button>
              </form>
            </>
          )}

          {mode === 'success' && (
            <>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <h1 className="text-lg font-bold text-slate-100">Password updated</h1>
                <p className="text-xs text-slate-400 mt-2">
                  Your password has been reset. All previous login sessions were signed out for security.
                </p>
              </div>

              {message && (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200">
                  {message}
                </div>
              )}

              <button
                type="button"
                onClick={goBackToSignIn}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-950 font-bold text-sm hover:brightness-110 transition-all"
              >
                Sign in with new password
              </button>
            </>
          )}
        </div>

        {mode === 'signin' && (
          <p className="text-center text-xs text-slate-500 mt-5">
            Don't have an account?{' '}
            <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-0.5">
              Create one <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
