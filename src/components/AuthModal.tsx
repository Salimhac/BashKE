import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { X, Lock, ShieldCheck, Mail, Key, User, Calendar, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

function formatFriendlyAuthError(err: any): string {
  if (!err) return 'An unexpected error occurred. Please try again.';
  const msg = typeof err === 'string' ? err : err.message || err.code || '';

  if (msg.includes('auth/network-request-failed')) {
    return 'Unable to reach the authentication service. Please check your internet connection.';
  }
  if (msg.includes('auth/email-already-in-use') || msg.includes('EMAIL_EXISTS')) {
    return 'An account with this email address already exists. Please sign in instead.';
  }
  if (msg.includes('auth/wrong-password') || msg.includes('auth/invalid-credential') || msg.includes('INVALID_CREDENTIALS')) {
    return 'Incorrect email or password. Please verify your details.';
  }
  if (msg.includes('auth/user-not-found') || msg.includes('USER_NOT_FOUND')) {
    return 'No account was found with that email address. Please double-check or create a new account.';
  }
  if (msg.includes('auth/weak-password')) {
    return 'Please choose a stronger password (at least 6 characters).';
  }
  if (msg.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (msg.includes('auth/too-many-requests')) {
    return 'Too many sign-in attempts. Please wait a moment before trying again.';
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'Could not connect to the server. Please check your connection and try again.';
  }
  return msg.replace(/^Firebase:\s*Error\s*\(([^)]+)\)\.?/i, 'Unable to complete sign-in. Please try again.');
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      onClose();
    } catch (err: any) {
      setError(formatFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthday) {
      setError('Please select your date of birth.');
      return;
    }
    setLoading(true);
    setError(null);
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
      setError(formatFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      setSuccess('Password reset link sent! Please check your email inbox.');
      setResetSentNotice('Instructions have been sent to your email. Follow the link in the message to reset your password.');
    } catch (err: any) {
      setError(formatFriendlyAuthError(err));
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
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
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
                    className="text-[11px] text-amber-800 hover:underline"
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
                className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-stone-900 text-xs font-semibold rounded-xl shadow-xs transition-colors mt-2"
              >
                {loading ? 'Signing in...' : 'Sign In to BashKE'}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-stone-500">Don't have an account yet? </span>
                <button
                  type="button"
                  onClick={() => onSwitchMode('signup')}
                  className="text-xs font-medium text-amber-800 hover:underline"
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

              {/* Birthday and Gender Row (Both Locked permanently) */}
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
                <label className="block text-xs font-medium text-stone-700 mb-1">Password (min 8 chars)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-stone-900 text-xs font-semibold rounded-xl shadow-xs transition-colors mt-2"
              >
                {loading ? 'Creating secure account...' : 'Create Anonymous Account'}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-stone-500">Already registered? </span>
                <button
                  type="button"
                  onClick={() => onSwitchMode('login')}
                  className="text-xs font-medium text-amber-800 hover:underline"
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
                    We will send a secure password reset link directly to your inbox.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-stone-900 text-xs font-semibold rounded-xl shadow-xs transition-colors"
                >
                  {loading ? 'Sending link...' : 'Send Password Reset Link'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => onSwitchMode('login')}
                    className="text-xs text-stone-500 hover:text-stone-800 hover:underline"
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
