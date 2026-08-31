import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Mail, 
  User, 
  Building, 
  KeyRound, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { registerUser, verifyOtpCode, resendOtpCode, loginUser } from '../../services/authService';

export default function AuthModal({ isOpen, onClose, initialTab = 'signin', onSuccess }) {
  const [tab, setTab] = useState(initialTab); // 'signin' | 'signup' | 'verify'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
  });

  // OTP 6-digit state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [revealedCode, setRevealedCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    setTab(initialTab);
    setErrorMsg('');
    setSuccessMsg('');
  }, [initialTab, isOpen]);

  // Resend countdown timer
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMsg('');
  };

  // OTP Digit Handler
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setErrorMsg('');

    // Auto focus next box
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtpDigits(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  // Sign In submit
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const res = await loginUser({ email: formData.email, password: formData.password });
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Authentication successful! Accessing SOC console...');
      setTimeout(() => {
        if (onSuccess) onSuccess(res.user);
        onClose();
      }, 600);
    } else if (res.requires_verification) {
      setPendingEmail(formData.email);
      setTab('verify');
      setErrorMsg('Account requires email verification. Please enter your 6-digit code.');
    } else {
      setErrorMsg(res.error || 'Failed to authenticate. Please check credentials.');
    }
  };

  // Sign Up submit -> Sends 6-digit OTP Email Code
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const res = await registerUser(formData);
    setLoading(false);

    if (res.success) {
      setPendingEmail(formData.email);
      setRevealedCode(res.verification_code || '');
      setResendTimer(30);
      setTab('verify');
      setSuccessMsg(`Verification code sent to ${formData.email}.`);
    } else {
      setErrorMsg(res.error || 'Registration failed. Please try again.');
    }
  };

  // Verify OTP submit
  const handleVerifySubmit = async (e) => {
    if (e) e.preventDefault();
    const code = otpDigits.join('');
    if (code.length < 6) {
      setErrorMsg('Please enter all 6 digits of your verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await verifyOtpCode({ email: pendingEmail || formData.email, code });
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Email verified successfully! Opening SOC console...');
      setTimeout(() => {
        if (onSuccess) onSuccess(res.user);
        onClose();
        window.location.href = '/';
      }, 700);
    } else {
      setErrorMsg(res.error || 'Invalid verification code.');
    }
  };

  const handleResendClick = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    const res = await resendOtpCode(pendingEmail || formData.email);
    setLoading(false);
    if (res.success) {
      setRevealedCode(res.verification_code || '');
      setResendTimer(30);
      setSuccessMsg('New 6-digit verification code sent.');
    } else {
      setErrorMsg(res.error || 'Failed to resend code.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 tracking-tight">
                AEGIS Enterprise SOC
              </h2>
              <span className="text-xs text-cyan-400 font-mono flex items-center gap-1">
                <Lock className="w-3 h-3" /> Secure Client Authentication
              </span>
            </div>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs font-mono text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 1: SIGN IN FORM */}
          {/* ============================================================ */}
          {tab === 'signin' && (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" /> Client Work Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="analyst@organization.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" /> Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <ArrowRight className="w-4 h-4" />}
                <span>Sign In to SOC Console</span>
              </button>

              <div className="text-center pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400">Need an enterprise account? </span>
                <button
                  type="button"
                  onClick={() => setTab('signup')}
                  className="text-xs text-cyan-400 hover:underline font-mono font-bold"
                >
                  Create Client Account
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* TAB 2: SIGN UP FORM */}
          {/* ============================================================ */}
          {tab === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-cyan-400" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Alex Mercer"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-300 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" /> Work Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="alex.mercer@company.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-300 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-cyan-400" /> Company / Organization
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="Cyber Defense Systems Ltd"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-300 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" /> Create Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Sparkles className="w-4 h-4 fill-slate-950" />}
                <span>Register & Send Email Verification Code</span>
              </button>

              <div className="text-center pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400">Already registered? </span>
                <button
                  type="button"
                  onClick={() => setTab('signin')}
                  className="text-xs text-cyan-400 hover:underline font-mono font-bold"
                >
                  Sign In Here
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* TAB 3: 6-DIGIT EMAIL OTP VERIFICATION FORM */}
          {/* ============================================================ */}
          {tab === 'verify' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-2">
                  <Mail className="w-6 h-6 animate-bounce" />
                </div>
                <h3 className="text-base font-bold text-slate-100">
                  Check Your Email Inbox
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  We sent a 6-digit verification code to <strong className="text-cyan-300 font-mono">{pendingEmail || formData.email}</strong>. Please check your email inbox (and spam folder) and enter the code below:
                </p>
              </div>

              {/* 6 Individual Digit Inputs */}
              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <div className="flex justify-center items-center gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => otpInputRefs.current[idx] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-10 h-12 sm:w-11 sm:h-13 bg-slate-950 border border-slate-800 rounded-xl text-center text-lg font-black font-mono text-cyan-300 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || otpDigits.join('').length < 6}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <CheckCircle2 className="w-4 h-4 fill-slate-950" />}
                  <span>Verify Code & Activate Account</span>
                </button>
              </form>

              {/* Resend Code Action */}
              <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTab('signup')}
                  className="text-slate-400 hover:text-slate-200"
                >
                  Change Email
                </button>

                <button
                  type="button"
                  disabled={resendTimer > 0 || loading}
                  onClick={handleResendClick}
                  className="text-cyan-400 hover:underline font-bold disabled:opacity-40 disabled:no-underline"
                >
                  {resendTimer > 0 ? `Resend Code (${resendTimer}s)` : 'Resend Code'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
