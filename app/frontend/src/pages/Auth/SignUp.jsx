import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, User, Building, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import { signup, verifyCode, resendCode } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function SignUp() {
  const navigate = useNavigate();
  const { setSessionUser, checkSession } = useAuth();

  const [step, setStep] = useState('details'); // 'details' | 'code'
  const [username, setUsername] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const [fallbackCode, setFallbackCode] = useState(null);
  const [resendMsg, setResendMsg] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await signup(email.trim().toLowerCase(), password, username, company);
    setPending(false);
    if (res.success) {
      setStep('code');
      const codeFound = res.verification_code || res.data?.verification_code;
      if (codeFound) setFallbackCode(codeFound);
    } else {
      setError(res.error || 'Something went wrong.');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await verifyCode(email.trim().toLowerCase(), code.trim());
    setPending(false);
    if (res.success) {
      setSessionUser(res.email || res.data?.email || email);
      await checkSession();
      navigate('/dashboard');
    } else {
      setError(res.error || 'Incorrect code.');
    }
  };

  const handleResend = async () => {
    setResendMsg(null);
    const res = await resendCode(email.trim().toLowerCase());
    const codeFound = res.verification_code || res.data?.verification_code;
    if (codeFound) setFallbackCode(codeFound);
    setResendMsg(res.success ? 'New code sent.' : (res.error || 'Could not resend code.'));
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
          {step === 'details' ? (
            <>
              <div>
                <h1 className="text-lg font-bold text-slate-100">Create your account</h1>
                <p className="text-xs text-slate-400 mt-1">We'll email you a code to confirm it's really you.</p>
              </div>
              <form onSubmit={handleSignup} className="space-y-3">
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username (e.g. alex_mercer)"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourbusiness.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text" value={company} onChange={(e) => setCompany(e.target.value)}
                    placeholder="Organization Name (Optional)"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (min. 8 characters)"
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
                  {pending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Continue</span>}
                </button>
              </form>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-lg font-bold text-slate-100">Check your email</h1>
                <p className="text-xs text-slate-400 mt-1">Enter the 6-digit code we sent to <span className="text-slate-300">{email}</span>.</p>
              </div>
              {fallbackCode && (
                <div className="p-2 bg-cyan-950/60 border border-cyan-500/40 rounded-xl text-center text-xs font-mono text-cyan-300">
                  Verification Code: <strong className="text-cyan-100 text-sm font-bold">{fallbackCode}</strong>
                </div>
              )}
              <form onSubmit={handleVerify} className="space-y-3">
                <input
                  type="text" inputMode="numeric" maxLength={6} required value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.5em] text-lg py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-700 font-mono focus:outline-none focus:border-cyan-500/50"
                />
                {error && (
                  <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{error}</span>
                  </div>
                )}
                <button
                  type="submit" disabled={pending}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-950 font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {pending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify & Continue</span>}
                </button>
                <button type="button" onClick={handleResend} className="w-full text-xs text-slate-500 hover:text-cyan-400 transition-colors">
                  Didn't get it? Resend code
                </button>
                {resendMsg && <p className="text-[11px] text-center text-slate-400">{resendMsg}</p>}
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-5">
          Already have an account?{' '}
          <Link to="/signin" className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-0.5">
            Sign in <ArrowRight className="w-3 h-3" />
          </Link>
        </p>
      </div>
    </div>
  );
}
