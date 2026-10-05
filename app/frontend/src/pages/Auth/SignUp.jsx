import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Building, RefreshCw, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { signup, verifyCode, resendCode } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AegisLogo from '../../components/Brand/AegisLogo';
import AuthVisual from '../../components/Brand/AuthVisual';

export default function SignUp() {
  const navigate = useNavigate();
  const { setSessionUser, checkSession } = useAuth();
  const [step, setStep] = useState('details');
  const [username, setUsername] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const [resendMsg, setResendMsg] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await signup(email.trim().toLowerCase(), password, username, company);
    setPending(false);
    if (res.success) setStep('code');
    else if (res.requires_verification || res.data?.requires_verification) {
      setStep('code');
      setError('This email already has an account awaiting verification. Enter the code or request a new one.');
    } else setError(res.error || 'Something went wrong.');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await verifyCode(email.trim().toLowerCase(), code.trim());
    setPending(false);
    if (res.success) {
      setSessionUser(res.user || res.data?.user || { email: email.trim().toLowerCase() });
      await checkSession();
      navigate('/dashboard');
    } else setError(res.error || 'Incorrect code.');
  };

  const handleResend = async () => {
    setResendMsg(null);
    const res = await resendCode(email.trim().toLowerCase());
    setResendMsg(res.success ? 'A new code has been sent.' : (res.error || 'Could not resend code.'));
  };

  return (
    <div className="min-h-screen bg-[#050b14] text-slate-100 lg:grid lg:grid-cols-[1.12fr_.88fr]">
      <AuthVisual mode="signup" />

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-8 lg:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(14,165,233,.12),transparent_28%)]" />
        <div className="relative w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex"><AegisLogo /></Link>

          <div className="rounded-[28px] border border-slate-700/70 bg-slate-900/70 p-7 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-9">
            {step === 'details' ? (
              <>
                <div className="mb-7">
                  <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-300">Create monitoring workspace</span>
                  <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Start monitoring your web applications</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Create an AEGIS workspace, then add your website and connect it to the monitoring service.</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  {[
                    [User,'text',username,setUsername,'Full name or username',true],
                    [Mail,'email',email,setEmail,'Email address',true],
                    [Building,'text',company,setCompany,'Organization or website',false],
                    [Lock,'password',password,setPassword,'Password (minimum 8 characters)',true],
                  ].map(([Icon,type,value,setValue,placeholder,required])=>(
                    <div className="relative" key={placeholder}>
                      <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"/>
                      <input type={type} required={required} minLength={type==='password'?8:undefined} value={value} onChange={(e)=>setValue(e.target.value)} placeholder={placeholder}
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 py-3.5 pl-11 pr-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/10"/>
                    </div>
                  ))}

                  <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-3.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300"/>
                    <p className="text-xs leading-5 text-slate-400">AEGIS monitors and alerts on suspicious activity. It does not block, modify, or stop traffic.</p>
                  </div>

                  {error && <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-950/35 p-3 text-xs text-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0"/><span>{error}</span></div>}

                  <button type="submit" disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 px-4 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/15 transition hover:brightness-110 disabled:opacity-50">
                    {pending ? <RefreshCw className="h-4 w-4 animate-spin"/> : <>Create workspace <ArrowRight className="h-4 w-4"/></>}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-300">Email verification</span>
                  <h1 className="mt-3 text-2xl font-black text-white">Check your inbox</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Enter the 6-digit code sent to <span className="text-slate-200">{email}</span>.</p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                  <input type="text" inputMode="numeric" maxLength={6} required value={code} onChange={(e)=>setCode(e.target.value.replace(/\D/g,''))} placeholder="000000"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 py-4 text-center font-mono text-xl tracking-[.5em] text-white outline-none focus:border-cyan-400/70"/>
                  {error && <div className="rounded-xl border border-rose-500/30 bg-rose-950/35 p-3 text-xs text-rose-200">{error}</div>}
                  <button type="submit" disabled={pending} className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 py-3.5 text-sm font-black text-slate-950">{pending ? 'Verifying…' : 'Verify & continue'}</button>
                  <button type="button" onClick={handleResend} className="w-full text-xs font-semibold text-slate-500 hover:text-cyan-300">Didn't get it? Resend code</button>
                  {resendMsg && <p className="text-center text-xs text-slate-400">{resendMsg}</p>}
                </form>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">Already have a workspace? <Link to="/signin" className="font-semibold text-cyan-300 hover:text-cyan-200">Sign in</Link></p>
        </div>
      </main>
    </div>
  );
}
