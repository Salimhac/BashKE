import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { X, Lock, ShieldCheck, Mail, Key, User, Calendar, Sparkles, AlertCircle, CheckCircle2, RefreshCw, WifiOff } from 'lucide-react';

function formatFriendlyAuthError(err: any): { text: string; isNetwork: boolean } {
  if (!err) return { text: 'An unexpected error occurred. Please try again.', isNetwork: false };
  const raw = typeof err === 'string' ? err : err.message || err.error || '';
  const msg = raw.toLowerCase();

  if (msg.includes('email_exists') || msg.includes('already exists') || msg.includes('email-already-in-use')) {
    return { text: 'An account with this email address already exists. Please sign in instead.', isNetwork: false };
  }
  if (msg.includes('invalid_credentials') || msg.includes('incorrect password') || msg.includes('wrong-password') || msg.includes('incorrect email or password')) {
    return { text: 'Incorrect email or password. Please verify your details.', isNetwork: false };
  }
  if (msg.includes('no account found') || msg.includes('user_not_found') || msg.includes('user-not-found')) {
    return { text: 'No account was found with that email address. Please click "Create one now" below.', isNetwork: false };
  }
  if (msg.includes('password must be at least') || msg.includes('weak-password')) {
    return { text: 'Please choose a password with at least 6 characters.', isNetwork: false };
  }
  if (msg.includes('valid email')) {
    return { text: 'Please enter a valid email address.', isNetwork: false };
  }
  if (
    msg.includes('404') ||
    msg.includes('not found') ||
    msg.includes('page could not be found') ||
    msg.includes('api server endpoint not found')
  ) {
    return {
      text: 'API server endpoint was not found (404). If you deployed to Vercel or a static host, the serverless API routes or vercel.json rewrites are required for backend endpoints. Ensure vercel.json is deployed and DATABASE_URL is set in environment variables.',
      isNetwork: true,
    };
  }
  if (
    msg.includes('network request failed') ||
    msg.includes('network-request-failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('econnrefused') ||
    msg.includes('etimedout') ||
    msg.includes('connection terminated') ||
    msg.includes('database operation failed') ||
    msg.includes('resuming from sleep') ||
    msg.includes('cold start')
  ) {
    return {
      text: 'Network request failed: Could not connect to the database. If your Neon database was paused/idle, it takes 2-3 seconds to wake up. Please check your connection and tap "Try Again".',
      isNetwork: true,
    };
  }
  return { text: raw, isNetwork: false };
}

interface AuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'signup' | 'reset';
  onClose: () => void;
  onSwitchMode: (mode: 'login' | 'signup' | 'reset') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, mode, onClose, onSwitchMode }) => {
  const { signInWithEmail, signUpWithEmail, sendPasswordReset } = useAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [realName, setRealName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | 'non-binary' | 'other' | 'prefer-not-to-say'>('non-binary');
  const [displayName, setDisplayName] = useState('');

  // Password reset states
  const [resetSentNotice, setResetSentNotice] = useState<string | null>(null);

  // Status & errors
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<{ message: string; isNetwork: boolean } | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorState(null);
    try {
      await signInWithEmail(email, password);
      onClose();
    } catch (err: any) {
      const parsed = formatFriendlyAuthError(err);
      setErrorState({ message: parsed.text, isNetwork: parsed.isNetwork });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!birthday) {
      setErrorState({ message: 'Please select your date of birth.', isNetwork: false });
      return;
    }
    setLoading(true);
    setErrorState(null);
    try {
      await signUpWithEmail({
        email,
        password,
        realName,
        birthday,
        gender,
        displayName: displayName.trim(),
      });
      onClose();
    } catch (err: any) {
      const parsed = formatFriendlyAuthError(err);
      setErrorState({ message: parsed.text, isNetwork: parsed.isNetwork });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorState(null);
    try {
      await sendPasswordReset(email);
      setSuccess('Password reset link sent! Please check your email inbox.');
      setResetSentNotice('Instructions have been sent to your email. Follow the link in the message to reset your password.');
    } catch (err: any) {
      const parsed = formatFriendlyAuthError(err);
      setErrorState({ message: parsed.text, isNetwork: parsed.isNetwork });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Modal Top Bar */}
        <div className="px-6 py-5 border-b border-stone-200/80 bg-stone-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-900 font-serif-display">
              {mode === 'login'
                ? 'Welcome Back'
                : mode === 'signup'
                ? 'Create Anonymous Account'
                : 'Reset Password'}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {mode === 'signup'
                ? 'Real name is stored securely and never shown to anyone'
                : 'BashKE — Private Identities, Public Celebrations'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-4">
          {errorState && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
              <div className="flex items-start gap-2.5">
                {errorState.isNetwork ? (
                  <WifiOff className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                )}
                <div className="flex-1 leading-relaxed">
                  <p className="font-semibold text-rose-900 mb-0.5">
                    {errorState.isNetwork ? 'Connection / Database Notice' : 'Request Notice'}
                  </p>
                  <p>{errorState.message}</p>
                </div>
              </div>

              {errorState.isNetwork && (
                <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between">
                  <span className="text-[11px] text-rose-700">Neon DB may be waking up</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (mode === 'signup') handleSignup();
                      else if (mode === 'login') handleLogin();
                      else if (mode === 'reset') handleRequestReset();
                    }}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>{loading ? 'Retrying...' : 'Try Again Now'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <div className="space-y-3.5">
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-stone-700">Password</label>
                    <button
                      type="button"
                      onClick={() => onSwitchMode('reset')}
                      className="text-[11px] text-amber-800 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-stone-900 text-xs font-semibold rounded-xl shadow-xs transition-colors mt-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? 'Signing in...' : 'Sign In to BashKE'}
                </button>

                <div className="text-center pt-2">
                  <span className="text-xs text-stone-500">Don't have an account yet? </span>
                  <button
                    type="button"
                    onClick={() => onSwitchMode('signup')}
                    className="text-xs font-medium text-amber-800 hover:underline cursor-pointer"
                  >
                    Create one now
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SIGNUP FORM */}
          {mode === 'signup' && (
            <div className="space-y-3.5">
              <form onSubmit={handleSignup} className="space-y-3.5">
                {/* Privacy Notice Box */}
                <div className="p-3 bg-stone-100 rounded-xl text-xs text-stone-600 flex items-start gap-2.5 border border-stone-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-semibold text-stone-800">Strict Anonymity Rule:</span> Real name,
                    birthday, and gender are permanently locked after creation. Your real name is NEVER
                    shown on any page, wish, or API response.
                  </div>
                </div>

                {/* Display Name (Public) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-stone-700">Display Name (Public)</label>
                    <span className="text-[10px] text-emerald-700 font-medium">Editable anytime</span>
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Stargazer99 or VelvetOrchid"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    required
                  />
                </div>

                {/* Real Name (Private) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-stone-700">Full Real Name</label>
                    <span className="text-[10px] text-rose-700 font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Strictly Private & Locked
                    </span>
                  </div>
                  <input
                    type="text"
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    placeholder="Stored for legal integrity only — never rendered"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    required
                  />
                </div>

                {/* Birthday and Gender Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-stone-700">Birthday</label>
                      <span className="text-[10px] text-stone-400">Locked permanently</span>
                    </div>
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-stone-700">Gender</label>
                      <span className="text-[10px] text-stone-400">Locked permanently</span>
                    </div>
                    <select
                      value={gender}
                      onChange={(e: any) => setGender(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="non-binary">Non-Binary</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Email (Private) */}
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Email (Private)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Password (min 6 chars)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-stone-900 text-xs font-semibold rounded-xl shadow-xs transition-colors mt-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? 'Creating secure account...' : 'Create Anonymous Account'}
                </button>

                <div className="text-center pt-2">
                  <span className="text-xs text-stone-500">Already registered? </span>
                  <button
                    type="button"
                    onClick={() => onSwitchMode('login')}
                    className="text-xs font-medium text-amber-800 hover:underline cursor-pointer"
                  >
                    Sign in here
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PASSWORD RESET FLOW */}
          {mode === 'reset' && (
            <div className="space-y-4">
              {resetSentNotice && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                  <p className="font-semibold mb-1">Reset Instructions Sent</p>
                  <p>{resetSentNotice}</p>
                </div>
              )}

              <form onSubmit={handleRequestReset} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Enter your registered account email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    required
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Password reset instructions will be dispatched to your account.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-stone-900 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {loading ? 'Sending link...' : 'Send Password Reset Request'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => onSwitchMode('login')}
                    className="text-xs text-stone-500 hover:text-stone-800 hover:underline cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
