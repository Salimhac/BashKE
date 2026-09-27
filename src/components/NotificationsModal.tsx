import React from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { X, Bell, Cake, ShieldCheck, Check, Trash2 } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBoard: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, onOpenBoard }) => {
  const { notifications, refreshNotifications } = useAuth();

  if (!isOpen) return null;

  const handleMarkRead = async (id: string) => {
    await api.markNotificationRead(id);
    refreshNotifications();
  };

  const handleClearAll = async () => {
    await api.clearNotifications();
    refreshNotifications();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200/80 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 font-serif-display">Notifications</h2>
              <p className="text-xs text-stone-500">
                Wishes received on your public birthday board
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-stone-400 hover:text-stone-700 px-2 py-1 rounded-lg hover:bg-stone-200/60 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-stone-800">No new notifications</p>
              <p className="text-[11px] text-stone-500 mt-1 max-w-xs mx-auto">
                When someone posts an anonymous wish to your birthday board, it will show up here.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all text-xs ${
                  n.read
                    ? 'bg-stone-50/70 border-stone-200 text-stone-700'
                    : 'bg-amber-50/70 border-amber-200 text-amber-950 font-medium'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Cake className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-semibold">{n.title}</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="mt-2 text-stone-800 leading-relaxed font-normal">
                  {n.message}
                </p>

                <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1 text-emerald-700">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Sender identity strictly anonymous</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!n.read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="text-amber-800 hover:text-amber-950 font-medium"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onClose();
                        onOpenBoard();
                      }}
                      className="text-stone-700 hover:text-stone-900 underline"
                    >
                      View board
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
