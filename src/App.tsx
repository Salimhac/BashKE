import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { api } from './api';
import type { PublicUser } from './types';
import { Navbar } from './components/Navbar';
import { UserCard } from './components/UserCard';
import { WishBoardModal } from './components/WishBoardModal';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { NotificationsModal } from './components/NotificationsModal';
import { CalendarView } from './components/CalendarView';
import {
  Cake,
  Calendar,
  Sparkles,
  Search,
  Heart,
  AlertCircle,
  UserPlus,
  Mail,
  Gift,
} from 'lucide-react';
import { triggerConfetti } from './utils/confetti';

interface SystemMetrics {
  serverDate: string;
  formattedDate: string;
  totalMembers: number;
  totalWishesDelivered: number;
  activeCelebrationsToday: number;
  upcomingCelebrationsThisWeek: number;
}

function BirthdayBoardContent() {
  const {
    user: currentUser,
    openAuthModal,
    authModalState,
    closeAuthModal,
  } = useAuth();

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'all' | 'calendar'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  // Backend Data
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [counts, setCounts] = useState({ todayCount: 0, weekCount: 0, totalCount: 0 });
  const [systemInfo, setSystemInfo] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [selectedBoardUser, setSelectedBoardUser] = useState<PublicUser | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Sync URL query ?board=<id> for deep linking & sharing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const boardUid = params.get('board');
    if (boardUid && !selectedBoardUser) {
      api.getUserProfile(boardUid)
        .then((data) => {
          if (data?.user) {
            setSelectedBoardUser(data.user);
          }
        })
        .catch(() => {
          // ignore if user not found or deleted
        });
    }
  }, []);

  const handleSelectBoard = (user: PublicUser | null) => {
    setSelectedBoardUser(user);
    const url = new URL(window.location.href);
    if (user) {
      url.searchParams.set('board', user.id);
    } else {
      url.searchParams.delete('board');
    }
    window.history.replaceState({}, '', url.toString());
  };

  // Fetch real user list and system metrics from backend
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [userData, sysData] = await Promise.all([
        api.getUsers({
          filter: activeTab === 'calendar' ? 'all' : activeTab,
          search: searchQuery,
          gender: genderFilter,
        }),
        api.getSystemInfo().catch(() => null),
      ]);

      setUsers(Array.isArray(userData?.users) ? userData.users : []);
      setCounts({
        todayCount: userData?.meta?.todayCount ?? 0,
        weekCount: userData?.meta?.weekCount ?? 0,
        totalCount: userData?.meta?.totalCount ?? 0,
      });
      if (sysData) {
        setSystemInfo(sysData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load community.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, genderFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Open authenticated user's own board
  const handleOpenMyBoard = async () => {
    if (!currentUser) return;
    try {
      const data = await api.getUserProfile(currentUser.id);
      if (data?.user) {
        handleSelectBoard(data.user);
      }
    } catch {
      // ignore
    }
  };

  const safeUsers = Array.isArray(users) ? users : [];
  const todayUsers = safeUsers.filter((u) => u?.isBirthdayToday);
  const upcomingUsers = safeUsers.filter((u) => !u?.isBirthdayToday);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4EA] text-stone-900 selection:bg-amber-200">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenMyBoard={handleOpenMyBoard}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8">
        {/* Editorial Hero Banner */}
        <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-amber-300/30 shadow-xs bg-[#171412] text-white">
          {/* Top Maasai Shúkà celebratory accent stripe */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-shuka-stripe z-10" />

          <div className="absolute inset-0">
            <img
              src="/src/assets/images/kenyan_bash_celebration_1790371309874.jpg"
              alt="Kenyan birthday bash celebration under golden festoon lights"
              className="w-full h-full object-cover opacity-35"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-900/85 to-amber-950/50" />
          </div>

          <div className="relative p-5 sm:p-10 max-w-2xl space-y-3 sm:space-y-4">
            {/* Zero-Pill Inline Metadata */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-amber-300 tracking-wider uppercase font-semibold">
              <span className="flex items-center gap-1"><span>🇰🇪</span><span>Kenyan Bash Sherehe</span></span>
              <span aria-hidden="true" className="text-stone-500">·</span>
              <span>🎵 Music Wish Anthems</span>
              <span aria-hidden="true" className="text-stone-500">·</span>
              <span>Maasai Shúkà Cards</span>
              <span aria-hidden="true" className="text-stone-500">·</span>
              <span>100% Anonymous</span>
            </div>

            <h1
              className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-serif-display leading-tight"
              style={{ textWrap: 'balance' }}
            >
              Tupige Sherehe! Celebrate birthdays the authentic Kenyan party way.
            </h1>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-xl">
              BashKE brings the warmth, high-energy rhythm, and joy of a Kenyan birthday party to life. Dedicate iconic Kenyan party tracks (Rhumba, Afropop, Genge, Benga), seal anonymous handcrafted cards, and shower every celebrant with baraka and love!
            </p>

            {/* CTAs / Quick Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              {currentUser ? (
                <>
                  <button
                    onClick={handleOpenMyBoard}
                    className="min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-stone-950 text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Cake className="w-4 h-4 text-stone-950 shrink-0" />
                    <span>Open My Birthday Board</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('today')}
                    className="min-h-[44px] px-4 py-2.5 bg-stone-800/90 hover:bg-stone-700/90 border border-stone-600/80 text-white text-xs font-medium rounded-xl backdrop-blur-xs transition-colors flex items-center justify-center"
                  >
                    Today's Bash ({counts.todayCount})
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 hover:from-red-500 hover:to-amber-400 text-white text-xs font-bold rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-white shrink-0" />
                    <span>Join the Bash</span>
                  </button>
                  <button
                    onClick={() => openAuthModal('login')}
                    className="min-h-[44px] px-4 py-2.5 bg-stone-800/80 hover:bg-stone-700/80 border border-stone-600/80 text-white text-xs font-medium rounded-xl backdrop-blur-xs transition-colors flex items-center justify-center"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Live Community Horizon Metrics Banner */}
        <section className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:px-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200/80 shrink-0">
              <Calendar className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">
                Today's Date
              </p>
              <p className="text-sm font-bold font-serif-display text-stone-900 mt-0.5">
                {systemInfo?.formattedDate ||
                  new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-3 sm:gap-4 sm:divide-x divide-stone-200 text-stone-600 pt-3 border-t border-stone-100 sm:border-0 sm:pt-0">
            <div className="flex items-center gap-2">
              <span className="font-bold font-mono text-stone-900 text-base">
                {counts.todayCount}
              </span>
              <span className="text-[11px] leading-tight">
                {counts.todayCount === 1 ? 'member celebrating today' : 'members celebrating today'}
              </span>
            </div>

            <div className="sm:pl-4 flex items-center gap-2">
              <span className="font-bold font-mono text-stone-900 text-base">
                {counts.weekCount}
              </span>
              <span className="text-[11px] leading-tight">
                upcoming birthdays this week
              </span>
            </div>

            <div className="sm:pl-4 flex items-center gap-2">
              <span className="font-bold font-mono text-stone-900 text-base">
                {systemInfo?.totalWishesDelivered ?? 0}
              </span>
              <span className="text-[11px] leading-tight">
                sealed wishes delivered
              </span>
            </div>
          </div>
        </section>

        {/* View Switcher & Filters */}
        <section className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
          {/* Segmented Tab Controls */}
          <div className="flex items-center gap-1 p-1 bg-stone-200/70 rounded-2xl max-w-full overflow-x-auto scrollbar-none touch-pan-x">
            <button
              onClick={() => setActiveTab('today')}
              className={`min-h-[40px] px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'today'
                  ? 'bg-white text-stone-950 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Cake className="w-3.5 h-3.5 text-amber-600" />
              <span>Celebrating Today</span>
              <span className="ml-0.5 sm:ml-1 text-[11px] text-stone-400 font-mono">({counts.todayCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('week')}
              className={`min-h-[40px] px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'week'
                  ? 'bg-white text-stone-950 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>7-Day Horizon</span>
              <span className="ml-0.5 sm:ml-1 text-[11px] text-stone-400 font-mono">({counts.weekCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`min-h-[40px] px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'calendar'
                  ? 'bg-white text-stone-950 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Calendar Map</span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`min-h-[40px] px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-white text-stone-950 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>All Members</span>
              <span className="ml-0.5 sm:ml-1 text-[11px] text-stone-400 font-mono">({counts.totalCount})</span>
            </button>
          </div>

          {/* Search and Filters */}
          {activeTab !== 'calendar' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by pseudonym..."
                  className="w-full pl-9 pr-3 py-2.5 sm:py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white min-h-[40px]"
                />
              </div>

              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="text-xs bg-white border border-stone-300 rounded-xl px-3 py-2.5 sm:py-1.5 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[40px]"
              >
                <option value="">All Genders</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non-binary">Non-Binary</option>
                <option value="prefer-not-to-say">Unspecified</option>
              </select>
            </div>
          )}
        </section>

        {/* Dynamic Main View Area */}
        {activeTab === 'calendar' ? (
          <CalendarView
            users={safeUsers}
            todayDate={systemInfo?.serverDate || new Date().toISOString().split('T')[0]}
            onSelectUser={(u) => handleSelectBoard(u)}
          />
        ) : loading ? (
          <div className="py-24 text-center text-xs text-stone-400">Loading community members...</div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center rounded-3xl border border-dashed border-stone-200 bg-white p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <Cake className="w-6 h-6" />
            </div>
            {counts.totalCount === 0 ? (
              <>
                <h3 className="text-lg font-bold font-serif-display text-stone-900">
                  Welcome to BashKE
                </h3>
                <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                  Be the first to join our celebratory community! Create an account to set up your private birthday board and receive anonymous heartfelt cards on your special day.
                </p>
                <div className="pt-2 flex justify-center">
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-stone-900" />
                    <span>Join BashKE</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold font-serif-display text-stone-800">
                  No birthdays match active criteria
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                  {activeTab === 'today'
                    ? 'No community birthdays fall on today’s calendar date. Browse the 7-day horizon or explore all community members!'
                    : 'Try adjusting your search query or gender filter.'}
                </p>
                {activeTab === 'today' && (
                  <button
                    onClick={() => setActiveTab('week')}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-semibold rounded-xl"
                  >
                    View 7-Day Horizon
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* View Tab: Today */}
            {activeTab === 'today' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-stone-900 font-serif-display flex items-center gap-2">
                      <Cake className="w-5 h-5 text-amber-600" />
                      <span>Honorees Celebrating Today</span>
                    </h2>
                    <p className="text-xs text-stone-500">
                      These members are celebrating their birthday today. Their boards are open for anonymous wishes!
                    </p>
                  </div>

                  <span className="text-xs font-mono text-stone-500">
                    {users.length} {users.length === 1 ? 'board open' : 'boards open'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {users.map((u) => (
                    <UserCard
                      key={u.id}
                      user={u}
                      onOpenBoard={(userToOpen) => handleSelectBoard(userToOpen)}
                      isCurrentUser={currentUser?.id === u.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* View Tab: 7-Day Horizon */}
            {activeTab === 'week' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-stone-900 font-serif-display flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-600" />
                    <span>Upcoming 7-Day Horizon</span>
                  </h2>
                  <p className="text-xs text-stone-500">
                    Get your warm thoughts ready. Boards unlock automatically on their special date.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {users.map((u) => (
                    <UserCard
                      key={u.id}
                      user={u}
                      onOpenBoard={(userToOpen) => handleSelectBoard(userToOpen)}
                      isCurrentUser={currentUser?.id === u.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* View Tab: All Community Members */}
            {activeTab === 'all' && (
              <div className="space-y-8">
                {todayUsers.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 font-serif-display mb-3 flex items-center gap-2">
                      <Cake className="w-4 h-4 text-amber-600" />
                      <span>Today's Honorees ({todayUsers.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {todayUsers.map((u) => (
                        <UserCard
                          key={u.id}
                          user={u}
                          onOpenBoard={(userToOpen) => handleSelectBoard(userToOpen)}
                          isCurrentUser={currentUser?.id === u.id}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {upcomingUsers.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 font-serif-display mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-stone-500" />
                      <span>Community Horizon ({upcomingUsers.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {upcomingUsers.map((u) => (
                        <UserCard
                          key={u.id}
                          user={u}
                          onOpenBoard={(userToOpen) => handleSelectBoard(userToOpen)}
                          isCurrentUser={currentUser?.id === u.id}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* How BirthdayBoard Works Section */}
        <section className="pt-8 border-t border-stone-200">
          <div className="mb-4">
            <h2 className="text-lg font-bold font-serif-display text-stone-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-700" />
              <span>How BashKE Sherehe Works</span>
            </h2>
            <p className="text-xs text-stone-500">
              Honoring birthdays with authentic warmth, anonymous sincerity, and Kenyan festive joy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-2xs space-y-2 relative overflow-hidden group hover:border-red-300 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-900 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-stone-900 font-serif-display text-sm">
                01. Siri na Anonymous Sincerity
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Send notes as playful pseudonyms or classic well-wisher signatures. Pure warmth and high bash spirits without any social anxiety or peer pressure.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-2xs space-y-2 relative overflow-hidden group hover:border-amber-300 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                <Cake className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-stone-900 font-serif-display text-sm">
                02. Kila Bash Kwa Wakati
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Boards unlock on the member's exact birthday date. Wishes arrive right on time when the celebrations kick off.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-2xs space-y-2 relative overflow-hidden group hover:border-emerald-300 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-stone-900 font-serif-display text-sm">
                03. Maasai Shúkà & African Seals
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Pick vibrant stationery themes (Shúkà Crimson, Savannah Ochre, Rift Valley), emboss Simba & Ngoma wax seals, and celebrate with kalimba chimes.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="mt-16 border-t border-stone-200 py-8 bg-stone-100/60 text-xs text-stone-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cake className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-stone-900 font-serif-display text-sm">BashKE</span>
            <span aria-hidden="true">·</span>
            <span>Anonymous Celebrations & Birthday Bashes</span>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <button
              onClick={() => {
                setActiveTab('today');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-stone-900 transition-colors"
            >
              Today's Celebrations
            </button>
            <button
              onClick={() => {
                setActiveTab('week');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-stone-900 transition-colors"
            >
              7-Day Horizon
            </button>
            <button
              onClick={() => {
                setActiveTab('calendar');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-stone-900 transition-colors"
            >
              Calendar Map
            </button>
            <button
              onClick={() => {
                setActiveTab('all');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-stone-900 transition-colors"
            >
              All Members
            </button>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      {selectedBoardUser && (
        <WishBoardModal
          user={selectedBoardUser}
          isOpen={!!selectedBoardUser}
          onClose={() => handleSelectBoard(null)}
          onWishPostedOrDeleted={fetchUsers}
        />
      )}

      <AuthModal
        isOpen={authModalState.isOpen}
        mode={authModalState.mode}
        onClose={closeAuthModal}
        onSwitchMode={(newMode) => openAuthModal(newMode)}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onOpenBoard={handleOpenMyBoard}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BirthdayBoardContent />
    </AuthProvider>
  );
}
