import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail, Lock, ArrowRight, BookOpen, Loader2, Eye, EyeOff,
  Sparkles, Award, GraduationCap, ArrowLeft, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';

/* ─── Toast Popup ─────────────────────────────────────────── */
interface ToastProps { type: 'success' | 'error' | 'loading'; message: string }

const Toast: React.FC<ToastProps> = ({ type, message }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    error:   <XCircle    className="w-5 h-5 text-red-400    shrink-0" />,
    loading: <Loader2    className="w-5 h-5 text-primary-400 shrink-0 animate-spin" />,
  };
  const colors = {
    success: 'border-emerald-500/40 bg-emerald-950/80',
    error:   'border-red-500/40    bg-red-950/80',
    loading: 'border-primary-500/40 bg-slate-900/90',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: -24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0,   scale: 1    }}
      exit={{    opacity: 0, y: -16, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl text-white text-sm font-semibold min-w-[260px] max-w-sm ${colors[type]}`}
    >
      {icons[type]}
      <span>{message}</span>
    </motion.div>
  );
};

/* ─── Field-level validation helpers ──────────────────────── */
const validateEmail = (v: string) => {
  if (!v) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address';
  return '';
};
const validatePassword = (v: string) => {
  if (!v) return 'Password is required';
  if (v.length < 6) return 'Password must be at least 6 characters';
  return '';
};

/* ─── Component ──────────────────────────────────────────── */
export const Login: React.FC = () => {
  const [identifier, setIdentifier]   = useState('');
  const [password,   setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError]       = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [touched, setTouched]             = useState({ email: false, password: false });

  const [toast, setToast]   = useState<ToastProps | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();

  /* Show registration success banner if redirected from register */
  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message) {
      showToast('success', state.message);
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  const showToast = (type: ToastProps['type'], message: string, duration = 3500) => {
    setToast({ type, message });
    if (type !== 'loading') {
      setTimeout(() => setToast(null), duration);
    }
  };

  /* Live validation on blur */
  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'email')    setEmailError(validateEmail(identifier));
    if (field === 'password') setPasswordError(validatePassword(password));
  };

  /* Live clearing on type */
  const handleEmailChange = (v: string) => {
    setIdentifier(v);
    if (touched.email) setEmailError(validateEmail(v));
  };
  const handlePasswordChange = (v: string) => {
    setPassword(v);
    if (touched.password) setPasswordError(validatePassword(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Full validation on submit
    const eErr = validateEmail(identifier);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    setTouched({ email: true, password: true });
    if (eErr || pErr) return;

    setIsLoading(true);
    showToast('loading', 'Signing you in…');

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier, password }),
      });
      const data = await res.json();

      if (res.ok) {
        login(data.access_token, data.user);
        showToast('success', `Welcome back, ${data.user?.name || 'User'}! Redirecting…`);
        setTimeout(() => navigate('/dashboard'), 1200);
      } else {
        setToast(null);
        const msg =
          res.status === 401 ? 'Invalid email or password. Please try again.' :
          res.status === 404 ? 'Account not found. Please register first.' :
          data.message || 'Login failed. Please try again.';
        showToast('error', msg);
      }
    } catch {
      setToast(null);
      showToast('error', 'Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    showToast('loading', 'Opening Google sign-in…');
    localStorage.removeItem('cm_jwt_token');

    try {
      const provider = new GoogleAuthProvider();
      const cred     = await signInWithPopup(auth, provider);
      const idToken  = await cred.user.getIdToken();
      const photoUrl = cred.user.photoURL;

      showToast('loading', 'Verifying your account…');

      const res  = await fetch(`${API_BASE}/api/auth/firebase-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, photoUrl }),
      });
      const data = await res.json();

      if (res.ok) {
        login(data.access_token, data.user);
        showToast('success', `Welcome back, ${data.user?.name || 'User'}! Redirecting…`);
        setTimeout(() => navigate('/dashboard'), 1200);
      } else {
        setToast(null);
        if (res.status === 404) {
          showToast('error', 'Google account not found. Please register first.');
        } else {
          showToast('error', data.message || 'Google login failed.');
        }
      }
    } catch (err: any) {
      setToast(null);
      if (err.code !== 'auth/popup-closed-by-user') {
        showToast('error', err.message || 'An error occurred during Google login.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-outfit text-slate-800 dark:text-slate-100 relative overflow-hidden">

      {/* ── Global Toast ── */}
      <AnimatePresence>{toast && <Toast {...toast} />}</AnimatePresence>

      {/* Back to Home */}
      <Link
        to="/"
        className="absolute top-6 right-6 flex items-center space-x-2 px-4 py-2 rounded-full bg-white/45 dark:bg-slate-900/40 backdrop-blur border border-slate-200/50 dark:border-slate-800/80 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 shadow-sm hover:scale-105 transition-all z-50"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      {/* Mobile blobs */}
      <div className="absolute lg:hidden top-[-10%] right-[-10%] w-[300px] h-[300px] bg-primary-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute lg:hidden bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-secondary-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* ── Left pane ── */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white border-r border-slate-800">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-primary-600/20 rounded-full blur-[120px] mix-blend-screen animate-float" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-secondary-600/20 rounded-full blur-[100px] mix-blend-screen animate-float-delayed" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />
          <div className="absolute top-1/4 left-12 opacity-25 animate-float" style={{ animationDelay: '0.5s' }}><BookOpen className="w-8 h-8 text-primary-400" /></div>
          <div className="absolute bottom-1/4 right-20 opacity-20 animate-float-delayed" style={{ animationDelay: '1.2s' }}><GraduationCap className="w-10 h-10 text-secondary-400" /></div>
          <div className="absolute top-1/2 right-12 opacity-15 animate-float" style={{ animationDelay: '2s' }}><Award className="w-8 h-8 text-primary-350" /></div>
          <div className="absolute top-1/3 right-1/3 opacity-30 animate-pulse"><Sparkles className="w-6 h-6 text-yellow-400" /></div>
        </div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center space-x-3 group w-max">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-600 font-bold text-lg shadow-lg group-hover:scale-105 transition-transform">CM</div>
            <span className="font-bold text-xl tracking-tight">Learning Hub</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg mb-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6">
              Welcome back to your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-secondary-400 to-purple-400">
                digital campus.
              </span>
            </h2>
            <p className="text-base text-slate-400 leading-relaxed font-medium">
              Log in to resume your active learning streaks, complete timed quizzes, submit homework, and coordinate directly with your mentors.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 text-sm text-slate-500 font-medium">
          © {new Date().getFullYear()} CM Learning Hub. All rights reserved.
        </div>
      </div>

      {/* ── Right pane / Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">

        {/* Mobile logo */}
        <Link to="/" className="lg:hidden absolute top-6 left-6 flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">CM</div>
          <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">Learning Hub</span>
        </Link>

        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-2xl p-8 sm:p-10 rounded-3xl"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Sign In</h1>
              <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">Enter your account details to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                  Email Address
                </label>
                <div className="relative group flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={identifier}
                    onChange={e => handleEmailChange(e.target.value)}
                    onBlur={() => handleBlur('email')}
                    className={`block w-full pl-11 pr-10 py-3 bg-slate-50/50 dark:bg-slate-800/30 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all font-semibold ${
                      touched.email && emailError
                        ? 'border-red-400 dark:border-red-500/70 bg-red-50/30 dark:bg-red-950/10'
                        : touched.email && !emailError
                        ? 'border-emerald-400 dark:border-emerald-600/60'
                        : 'border-slate-200 dark:border-slate-700/80'
                    }`}
                    placeholder="jane@learninghub.com"
                    autoComplete="email"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {touched.email && emailError && <XCircle className="w-5 h-5 text-red-400" />}
                  </div>
                </div>
                <AnimatePresence>
                  {touched.email && emailError && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-1.5 ml-1 flex items-center gap-1 text-xs text-red-500 font-semibold"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {emailError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5 ml-1 pr-1">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
                  <a href="#" className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">
                    Forgot Password?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => handlePasswordChange(e.target.value)}
                    onBlur={() => handleBlur('password')}
                    className={`block w-full pl-11 pr-20 py-3 bg-slate-50/50 dark:bg-slate-800/30 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all font-semibold ${
                      touched.password && passwordError
                        ? 'border-red-400 dark:border-red-500/70 bg-red-50/30 dark:bg-red-950/10'
                        : touched.password && !passwordError
                        ? 'border-emerald-400 dark:border-emerald-600/60'
                        : 'border-slate-200 dark:border-slate-700/80'
                    }`}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <div className="w-5 flex justify-center pointer-events-none">
                      {touched.password && passwordError && <XCircle className="w-5 h-5 text-red-400" />}
                    </div>
                  </div>
                </div>
                <AnimatePresence>
                  {touched.password && passwordError && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-1.5 ml-1 flex items-center gap-1 text-xs text-red-500 font-semibold"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {passwordError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-500/20 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98] group"
                >
                  {isLoading
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <>
                        Sign In
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                  }
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700/60" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white dark:bg-[#0f172a] text-slate-500 text-xs font-bold uppercase tracking-wider">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm bg-white dark:bg-slate-800/40 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
              </div>
            </div>

            <div className="mt-8 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-extrabold text-primary-600 hover:text-primary-500 dark:text-primary-400 transition-colors">
                Create one now
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
