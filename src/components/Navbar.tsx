import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Settings,
  LogOut,
  Cake,
  Volume2,
  VolumeX,
  Calendar,
} from 'lucide-react';
import { getAvatarStyle, getInitials } from '../utils/avatar';
import { getSoundEnabled, toggleSound } from '../utils/sound';

interface NavbarProps {
  activeTab: 'today' | 'week' | 'all' | 'calendar';
  setActiveTab: (tab: 'today' | 'week' | 'all' | 'calendar') => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenMyBoard: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenNotifications,
  onOpenMyBoard,
}) => {
  const { user, logout, openAuthModal, unreadNotifsCount } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [soundActive, setSoundActive] = useState(getSoundEnabled());

  const avatarStyle = user ? getAvatarStyle(user.avatarSeed) : null;
  const initials = user ? getInitials(user.displayName) : '';

  const handleToggleSound = () => {
    const next = toggleSound();
    setSoundActive(next);
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-50/95 backdrop-blur-md border-b border-stone-200">
      {/* Authentic Maasai Shúkà celebratory accent stripe */}
      <div className="h-1 bg-shuka-stripe w-full" />
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('today')}
            className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 font-serif-display hover:text-amber-900 transition-colors whitespace-nowrap focus:outline-none flex items-center gap-1.5 sm:gap-2 shrink-0"
          >
            <Cake className="w-5 h-5 text-amber-600" />
            <span>Bash<span className="text-amber-600 font-extrabold">KE</span></span>
          </button>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-100 text-red-900 text-[10px] font-bold border border-red-200/80 tracking-wide uppercase">
            <span>🇰🇪</span>
            <span>Sherehe</span>
          </span>
        </div>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium text-stone-600">
          <button
            onClick={() => setActiveTab('today')}
            className={`transition-colors whitespace-nowrap py-1 ${
              activeTab === 'today' ? 'text-amber-900 font-semibold border-b-2 border-amber-600' : 'hover:text-stone-900'
            }`}
          >
            Today's Celebrations
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={`transition-colors whitespace-nowrap py-1 ${
              activeTab === 'week' ? 'text-amber-900 font-semibold border-b-2 border-amber-600' : 'hover:text-stone-900'
            }`}
          >
            7-Day Horizon
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`transition-colors whitespace-nowrap py-1 ${
              activeTab === 'calendar' ? 'text-amber-900 font-semibold border-b-2 border-amber-600' : 'hover:text-stone-900'
            }`}
          >
            Calendar Map
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`transition-colors whitespace-nowrap py-1 ${
              activeTab === 'all' ? 'text-amber-900 font-semibold border-b-2 border-amber-600' : 'hover:text-stone-900'
            }`}
          >
            All Members
          </button>
        </nav>

        {/* Primary Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Celebratory Sound Toggle */}
          <button
            onClick={handleToggleSound}
            aria-label={soundActive ? 'Mute celebratory chimes' : 'Enable celebratory chimes'}
            title={soundActive ? 'Celebratory chimes active' : 'Celebratory chimes muted'}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            {soundActive ? <Volume2 className="w-4 h-4 text-amber-700" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
          </button>

          {user ? (
            <>
              {/* Notifications Bell */}
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-amber-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-stone-100 transition-colors focus:outline-none"
                  aria-expanded={userDropdownOpen}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs border ${avatarStyle?.bg}`}
                  >
                    {initials}
                  </div>
                  <span className="hidden sm:inline-block text-xs font-semibold text-stone-800 max-w-[120px] truncate">
                    {user.displayName}
                  </span>
                </button>

                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-24px)] rounded-2xl bg-white border border-stone-200 shadow-lg py-1.5 z-50 text-xs text-stone-700 animate-in fade-in">
                      <div className="px-3 py-2 border-b border-stone-100">
                        <p className="font-semibold text-stone-900 truncate">{user.displayName}</p>
                        <p className="text-[11px] text-stone-400 truncate">{user.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenMyBoard();
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-stone-50 flex items-center gap-2 text-stone-700"
                      >
                        <Cake className="w-4 h-4 text-amber-600" />
                        <span>My Birthday Board</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenSettings();
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-stone-50 flex items-center gap-2 text-stone-700"
                      >
                        <Settings className="w-4 h-4 text-stone-500" />
                        <span>Account Settings</span>
                      </button>

                      <div className="my-1 border-t border-stone-100" />

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => openAuthModal('login')}
                className="px-2.5 sm:px-3.5 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors whitespace-nowrap"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="px-3 sm:px-4 py-1.5 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition-colors whitespace-nowrap"
              >
                Join BashKE
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="flex md:hidden border-t border-stone-200 px-2 py-1.5 bg-stone-50/95 overflow-x-auto gap-1 text-xs font-medium text-stone-600 scrollbar-none touch-pan-x">
        <button
          onClick={() => setActiveTab('today')}
          className={`min-h-[42px] px-3.5 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
            activeTab === 'today' ? 'bg-amber-100 text-amber-950 font-bold' : 'hover:bg-stone-100 text-stone-700'
          }`}
        >
          <Cake className="w-3.5 h-3.5 text-amber-600" />
          <span>Today</span>
        </button>
        <button
          onClick={() => setActiveTab('week')}
          className={`min-h-[42px] px-3.5 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
            activeTab === 'week' ? 'bg-amber-100 text-amber-950 font-bold' : 'hover:bg-stone-100 text-stone-700'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-stone-500" />
          <span>7-Day</span>
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`min-h-[42px] px-3.5 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
            activeTab === 'calendar' ? 'bg-amber-100 text-amber-950 font-bold' : 'hover:bg-stone-100 text-stone-700'
          }`}
        >
          <span>Calendar</span>
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`min-h-[42px] px-3.5 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
            activeTab === 'all' ? 'bg-amber-100 text-amber-950 font-bold' : 'hover:bg-stone-100 text-stone-700'
          }`}
        >
          <span>All Members</span>
        </button>
      </div>
    </header>
  );
};
