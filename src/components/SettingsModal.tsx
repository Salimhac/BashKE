import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  X,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Mail,
  User,
  Calendar,
  RotateCcw,
  Trash2,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser, cleanAllUsersAndStartFresh } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [customBirthday, setCustomBirthday] = useState(user?.birthday || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !user) return null;

  const handleResetAllUsers = async () => {
    try {
      setLoading(true);
      await cleanAllUsersAndStartFresh();
      onClose();
      window.location.reload();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to wipe users.' });
      setLoading(false);
    }
  };

  const isPlaceholderBirthday = !user?.birthday || user.birthday === '1996-09-24' || user.birthday === '1995-09-24';

  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || displayName.trim() === user.displayName) return;

    try {
      setLoading(true);
      setStatusMessage(null);
      const res = await api.updateDisplayName(displayName.trim());
      updateUser(res.user);
      setStatusMessage({ type: 'success', text: 'Display name updated successfully.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update display name.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBirthday = async () => {
    if (!customBirthday || customBirthday === user.birthday) return;
    try {
      setLoading(true);
      setStatusMessage(null);
      const res = await api.updateUserProfile({ birthday: customBirthday });
      updateUser(res.user);
      setStatusMessage({ type: 'success', text: 'Birthday saved successfully! Your community celebration date is updated.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update birthday.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      setLoading(true);
      setStatusMessage(null);
      const res = await api.verifyEmail(verificationCode || undefined);
      updateUser(res.user);
      setStatusMessage({ type: 'success', text: res.message });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Verification failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200/80 bg-stone-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-900 font-serif-display">
              Account & Profile Settings
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Manage your display name and birthday profile details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-5">
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Section 1: Display Name */}
          <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80">
            <h3 className="text-xs font-semibold text-stone-900 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-stone-600" />
              Public Display Name
            </h3>
            <p className="text-[11px] text-stone-500 mb-3">
              This name is displayed on your birthday board and community celebrations.
            </p>

            <form onSubmit={handleUpdateDisplayName} className="flex gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter new display name"
                className="flex-1 text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                required
              />
              <button
                type="submit"
                disabled={loading || displayName.trim() === user.displayName}
                className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-medium rounded-xl transition-colors whitespace-nowrap"
              >
                Save
              </button>
            </form>
          </div>

          {/* Section 2: Email & Verification */}
          <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-stone-600" />
                Account Email
              </h3>
              {user.isEmailVerified ? (
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Verified
                </span>
              ) : (
                <span className="text-[11px] font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Unverified
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-500 mb-3">
              Registered email: <span className="font-mono text-stone-700">{user.email}</span>
            </p>

            {!user.isEmailVerified && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code or click to verify"
                  className="flex-1 text-xs p-2 rounded-xl border border-stone-300 bg-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleVerifyEmail}
                  disabled={loading}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-900 text-xs font-semibold rounded-xl whitespace-nowrap"
                >
                  Verify Email
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Birthday Profile Details */}
          <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80 space-y-3">
            <h3 className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-600" />
              Birthday & Profile Details
            </h3>

            {isPlaceholderBirthday ? (
              <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    <span>Set Your Real Birthday</span>
                  </p>
                  <span className="text-[10px] text-amber-800 font-semibold uppercase bg-amber-200/80 px-2 py-0.5 rounded-full">
                    Action Needed
                  </span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Your account was assigned an initial placeholder date ({user.birthday}). Select your actual date of birth below so your birthday board unlocks on your real celebration day:
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="date"
                    value={customBirthday}
                    onChange={(e) => setCustomBirthday(e.target.value)}
                    className="flex-1 text-xs p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleSaveBirthday}
                    disabled={loading || !customBirthday || customBirthday === user.birthday}
                    className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-stone-950 text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95 whitespace-nowrap cursor-pointer"
                  >
                    Save My Birthday
                  </button>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-stone-200/80">
                <p className="text-[11px] text-stone-400 flex items-center gap-1 mb-1">
                  <Lock className="w-3 h-3 text-stone-400" />
                  {isPlaceholderBirthday ? 'Current Saved Date' : 'Verified Birthday Date'}
                </p>
                <p className="font-mono text-xs text-stone-800 font-semibold">
                  {user.birthday}
                </p>
                <p className="text-[10px] text-stone-500 mt-1">
                  {isPlaceholderBirthday
                    ? 'Please use the selector above to set your real date.'
                    : 'Your board unlocks for wishes on this date every year.'}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-stone-200/80">
                <p className="text-[11px] text-stone-400 flex items-center gap-1 mb-1">
                  <User className="w-3 h-3 text-stone-400" />
                  Gender
                </p>
                <p className="capitalize font-mono text-xs text-stone-800 font-semibold">
                  {user.gender}
                </p>
                <p className="text-[10px] text-stone-500 mt-1">
                  Set during registration.
                </p>
              </div>
            </div>

            {/* Database Fresh Start Option */}
            <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-rose-700" />
                  <span>Clean All Users & Start Fresh</span>
                </span>
                <span className="text-[10px] text-rose-700 font-semibold uppercase bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                  Database Reset
                </span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Wipe all registered members, wish cards, and celebration boards to start completely fresh with 0 users.
              </p>
              {confirmReset ? (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResetAllUsers}
                    disabled={loading}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    {loading ? 'Cleaning...' : 'Yes, Clean All Users Now'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clean All Users & Start Fresh</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-medium rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
