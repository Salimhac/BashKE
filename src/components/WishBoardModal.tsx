import React, { useState, useEffect, useCallback } from 'react';
import type { PublicUser, PublicWish } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { getAvatarStyle, getInitials } from '../utils/avatar';
import { triggerConfetti } from '../utils/confetti';
import {
  playCelebrationChime,
  playWaxSealClick,
  KENYAN_BASH_TRACKS,
  playBashTrackMelody,
  stopBashTrackMelody,
} from '../utils/sound';
import {
  X,
  Trash2,
  Sparkles,
  Heart,
  Clock,
  AlertCircle,
  CheckCircle2,
  PenTool,
  RotateCcw,
  Copy,
  Check,
  Lock,
  Music,
  Play,
  Square,
  Volume2,
} from 'lucide-react';

interface WishBoardModalProps {
  user: PublicUser;
  isOpen: boolean;
  onClose: () => void;
  onWishPostedOrDeleted: () => void;
}

const STATIONERY_THEMES = [
  {
    id: 'shuka',
    name: 'Maasai Shúkà',
    badge: '🔴 Red',
    bg: 'bg-red-50/95 border-red-300 text-stone-900',
    sealBg: 'bg-red-600 text-amber-100',
    accent: 'text-red-800',
  },
  {
    id: 'golden',
    name: 'Savannah Ochre',
    badge: '🟡 Gold',
    bg: 'bg-amber-50/90 border-amber-300 text-stone-900',
    sealBg: 'bg-amber-600 text-amber-100',
    accent: 'text-amber-800',
  },
  {
    id: 'coast',
    name: 'Swahili Bahari',
    badge: '🌊 Teal',
    bg: 'bg-teal-50/90 border-teal-200 text-stone-900',
    sealBg: 'bg-teal-700 text-teal-100',
    accent: 'text-teal-800',
  },
  {
    id: 'nairobi',
    name: 'Nairobi Usiku',
    badge: '✨ Night',
    bg: 'bg-stone-900 border-amber-500/40 text-amber-100',
    sealBg: 'bg-amber-500 text-stone-950',
    accent: 'text-amber-300',
  },
];

const WAX_SEALS = [
  { icon: '🎂', label: 'Keki ya Bash' },
  { icon: '🦁', label: 'Simba (Lion)' },
  { icon: '🥁', label: 'Ngoma (African Drum)' },
  { icon: '✨', label: 'Nyota ya Baraka' },
  { icon: '🥂', label: 'Glasi ya Toast' },
  { icon: '🌾', label: 'Acacia Tree' },
];

const QUICK_INSPIRATIONS = [
  {
    label: '✨ Baraka tele!',
    text: 'Maisha marefu na baraka tele! Celebrating you, your incredible warmth, and the joy you bring. Happy Birthday! 🎂✨',
  },
  {
    label: '🥳 Form ni Bash',
    text: 'Form ni birthday bash! May this special year bring unstoppable energy, big wins, and endless laughter. Tupige sherehe! 🥳',
  },
  {
    label: '🥂 Long Life & Wins',
    text: 'Happy Birthday! Wishing you good health, prosperity, and an amazing journey ahead around the sun! 🥂🎉',
  },
];

const WhatsAppIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={`fill-current ${className}`} viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export const WishBoardModal: React.FC<WishBoardModalProps> = ({
  user,
  isOpen,
  onClose,
  onWishPostedOrDeleted,
}) => {
  const { user: currentUser, openAuthModal } = useAuth();
  const [wishes, setWishes] = useState<PublicWish[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>('shuka');
  const [selectedSeal, setSelectedSeal] = useState('🎂');
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  const [playingTrackWishId, setPlayingTrackWishId] = useState<string | null>(null);
  const [handleType, setHandleType] = useState<'well_wisher' | 'custom'>('well_wisher');
  const [customAlias, setCustomAlias] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [deletingWishId, setDeletingWishId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [likingWishId, setLikingWishId] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Check if current user is the owner of this board
  const isSelf = currentUser?.id === user.id;
  const avatarStyle = getAvatarStyle(user.avatarSeed);
  const initials = getInitials(user.displayName);

  // Deep-link URL for sharing
  const boardUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?board=${user.id}`
      : '';

  const handleWhatsAppShare = () => {
    const text = isSelf
      ? `🎉 It's my birthday celebration! Leave me an anonymous birthday wish or blessing on my board here:\n${boardUrl}\n🎂✨ Tupige sherehe!`
      : `🎂 Today is ${user.displayName}'s birthday celebration! Leave them an anonymous birthday wish on their board here:\n${boardUrl}\n✨ Form ni sherehe!`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(boardUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleClose = () => {
    stopBashTrackMelody();
    onClose();
  };

  const fetchBoard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getUserProfile(user.id);
      setWishes(data.wishes);
    } catch (err: any) {
      setError(err.message || 'Failed to load wish board.');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (isOpen) {
      fetchBoard();
      setMessage('');
      setError(null);
      setSuccessNotice(null);
      setSelectedTrackId(null);
      setPreviewingTrackId(null);
      setPlayingTrackWishId(null);
    } else {
      stopBashTrackMelody();
    }
    return () => {
      stopBashTrackMelody();
    };
  }, [isOpen, fetchBoard]);

  if (!isOpen) return null;

  // Music Dedication playback handlers
  const handleTogglePlayWishTrack = (wishId: string, trackId: string) => {
    if (playingTrackWishId === wishId) {
      stopBashTrackMelody();
      setPlayingTrackWishId(null);
    } else {
      stopBashTrackMelody();
      setPreviewingTrackId(null);
      setPlayingTrackWishId(wishId);
      playBashTrackMelody(trackId, () => {
        setPlayingTrackWishId(null);
      });
    }
  };

  const handleTogglePreviewTrack = (trackId: string) => {
    if (previewingTrackId === trackId) {
      stopBashTrackMelody();
      setPreviewingTrackId(null);
    } else {
      stopBashTrackMelody();
      setPlayingTrackWishId(null);
      setPreviewingTrackId(trackId);
      setSelectedTrackId(trackId);
      playBashTrackMelody(trackId, () => {
        setPreviewingTrackId(null);
      });
    }
  };

  // Single-Click AI Wish Generator
  const handleGenerateGeminiWish = async () => {
    try {
      setIsGeneratingAi(true);
      setError(null);
      const tones: Array<'sherehe' | 'baraka' | 'poetic'> = ['sherehe', 'baraka', 'poetic'];
      const randomTone = tones[Math.floor(Math.random() * tones.length)];
      const res = await api.generateAiWish({
        recipientName: user.displayName,
        tone: randomTone,
      });
      if (res?.wish) {
        setMessage(res.wish);
        playCelebrationChime();
      }
    } catch (err: any) {
      setError(err.message || 'AI wish generation encountered a temporary issue.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Toggle Like on a wish
  const handleToggleLike = async (wishId: string) => {
    const previousWishes = [...wishes];
    setWishes((prev) =>
      prev.map((w) => {
        if (w.id === wishId) {
          const currentlyLiked = !!w.hasLiked;
          const currentCount = w.likesCount ?? 0;
          return {
            ...w,
            hasLiked: !currentlyLiked,
            likesCount: currentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1,
          };
        }
        return w;
      })
    );

    try {
      setLikingWishId(wishId);
      const res = await api.likeWish(user.id, wishId);
      setWishes((prev) =>
        prev.map((w) =>
          w.id === wishId
            ? {
                ...w,
                hasLiked: res.liked,
                likesCount: res.likesCount,
              }
            : w
        )
      );
    } catch (err: any) {
      setWishes(previousWishes);
      setError(err.message || 'Could not register appreciation.');
    } finally {
      setLikingWishId(null);
    }
  };

  // Submit wish
  const handlePostWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    if (isSelf) {
      setError('You cannot write a wish on your own board! Share it with friends so they can write for you.');
      return;
    }

    if (!message.trim()) {
      setError('Please write a heartfelt birthday note.');
      return;
    }

    try {
      setPosting(true);
      setError(null);
      stopBashTrackMelody();

      const res = await api.postWish(user.id, {
        message: message.trim(),
        theme: selectedTheme,
        reactionEmoji: selectedSeal,
        musicTrack: selectedTrackId || undefined,
        anonymousHandleType:
          handleType === 'custom' && customAlias.trim() ? customAlias.trim() : 'well_wisher',
      });

      playCelebrationChime();
      triggerConfetti();
      setMessage('');
      setSelectedTrackId(null);
      setPreviewingTrackId(null);
      setSuccessNotice('Your wish and music dedication was sealed and delivered to the board!');
      setWishes((prev) => [res.wish, ...prev]);
      onWishPostedOrDeleted();
    } catch (err: any) {
      setError(err.message || 'Could not post wish.');
    } finally {
      setPosting(false);
    }
  };

  // Delete wish (moderation by board owner)
  const handleDeleteWish = async (wishId: string) => {
    if (confirmDeleteId !== wishId) {
      setConfirmDeleteId(wishId);
      return;
    }

    try {
      setDeletingWishId(wishId);
      setConfirmDeleteId(null);
      await api.deleteWish(user.id, wishId);
      setWishes((prev) => prev.filter((w) => w.id !== wishId));
      onWishPostedOrDeleted();
    } catch (err: any) {
      setError(err.message || 'Could not delete wish.');
    } finally {
      setDeletingWishId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-stone-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="fixed inset-0" onClick={handleClose} aria-hidden="true" />

      {/* Modal Container with Warm Kenyan Party Canvas */}
      <div className="relative w-full max-w-5xl bg-[#FAF5ED] rounded-2xl sm:rounded-3xl border border-amber-300/40 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[94vh] sm:max-h-[92vh] my-auto">
        {/* Maasai Shúkà Flag & Plaid Ribbon Accent */}
        <div className="h-1.5 w-full bg-shuka-stripe shrink-0" />

        {/* Honoree Marquee Header with Warm Sherehe Vibe */}
        <div className="relative bg-[#171412] text-white p-4 sm:p-6 lg:p-7 overflow-hidden shrink-0">
          <div className="absolute inset-0">
            <img
              src="/src/assets/images/kenyan_bash_celebration_1790371309874.jpg"
              alt="Kenyan bash festive celebration atmosphere"
              className="w-full h-full object-cover opacity-35"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/85 to-amber-950/60" />
          </div>

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-12 sm:pr-14">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-bold text-base sm:text-lg border-2 border-amber-400/50 shadow-md shrink-0 ${avatarStyle.bg}`}
              >
                {initials}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-amber-300 font-semibold tracking-wide">
                  <span>{user.isBirthdayToday ? '🎉 Bash Leo · Today' : 'Upcoming Bash'}</span>
                  <span aria-hidden="true" className="text-stone-500">·</span>
                  <span>{wishes.length} {wishes.length === 1 ? 'Sealed Wish' : 'Sealed Wishes'}</span>
                  <span aria-hidden="true" className="hidden sm:inline text-stone-500">·</span>
                  <span className="hidden sm:inline text-amber-400 flex items-center gap-1">
                    <Music className="w-3 h-3" /> Musical Wishes Active
                  </span>
                </div>

                <h1 className="text-lg sm:text-2xl font-bold font-serif-display text-white mt-0.5 truncate">
                  {user.displayName}
                  {isSelf && (
                    <span className="ml-2 text-xs font-sans text-amber-300 font-semibold bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-400/30">
                      Your Board
                    </span>
                  )}
                </h1>
                <p className="text-xs text-amber-100/80 mt-0.5 line-clamp-1">
                  {isSelf
                    ? 'This is your board! Friends and family dedicate songs and anonymous wishes here.'
                    : 'Leave an anonymous birthday note & dedicate an authentic Kenyan bash anthem.'}
                </p>
              </div>
            </div>

            {/* Header Actions: WhatsApp Share + Copy Link */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                title={isSelf ? 'Share your board on WhatsApp' : `Share ${user.displayName}'s board on WhatsApp`}
              >
                <WhatsAppIcon className="w-4 h-4 fill-white" />
                <span>Share on WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Copy board link"
              >
                {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden xs:inline">{linkCopied ? 'Copied' : 'Link'}</span>
              </button>
            </div>

            {/* Absolute close button */}
            <button
              onClick={handleClose}
              className="absolute top-0 right-0 sm:top-1 sm:right-1 p-2 text-stone-400 hover:text-white rounded-full hover:bg-white/10 transition-colors z-20 min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer"
              aria-label="Close wish board"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left (Compose or Honoree Hub) & Right (Wishes Wall) */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 bg-[#FAF5ED]">
          
          {/* Left Column (col-span-5) */}
          <div className="lg:col-span-5 space-y-4">
            {isSelf ? (
              /* ============================================================== */
              /* HONOREE HUB: Displayed when current user is viewing their own board */
              /* ============================================================== */
              <div className="bg-white/95 rounded-3xl border border-amber-200/80 p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-amber-100">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-300 to-amber-500 text-stone-950 flex items-center justify-center text-xl shadow-xs">
                    👑
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold font-serif-display text-stone-900">
                      Your Birthday Hub
                    </h2>
                    <p className="text-xs text-stone-500">
                      Celebrant Dashboard · {user.displayName}
                    </p>
                  </div>
                </div>

                {/* Owner restriction notice */}
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs leading-relaxed space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-amber-900">
                    <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>You cannot write on your own board</span>
                  </p>
                  <p className="text-stone-600">
                    This space is strictly for friends, family, and colleagues to surprise you with anonymous wishes, party songs, and blessings. Share your link so everyone can post their cards!
                  </p>
                </div>

                {/* Prominent WhatsApp Share Button */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                    Invite Friends on WhatsApp
                  </label>
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-white text-sm font-bold rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <WhatsAppIcon className="w-5 h-5 fill-white" />
                    <span>Share My Board on WhatsApp</span>
                  </button>
                </div>

                {/* Direct Link Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span className="font-semibold text-[11px] uppercase tracking-wider">Your Shareable Link</span>
                    {linkCopied && (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1 animate-in fade-in">
                        <Check className="w-3.5 h-3.5" /> Copied!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={boardUrl}
                      className="flex-1 text-xs px-3 py-2.5 bg-stone-50 border border-amber-200/80 rounded-xl text-stone-700 font-mono select-all focus:outline-none"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3.5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {linkCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{linkCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Board Statistics */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-amber-100">
                  <div className="p-3.5 rounded-2xl bg-[#FAF5ED] border border-amber-200/60 text-center">
                    <span className="text-2xl font-bold font-mono text-stone-900 block">{wishes.length}</span>
                    <span className="text-[11px] text-stone-500 font-medium">Sealed Wishes</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#FAF5ED] border border-amber-200/60 text-center">
                    <span className="text-2xl font-bold font-mono text-rose-600 block">
                      {wishes.reduce((acc, w) => acc + (w.likesCount || 0), 0)}
                    </span>
                    <span className="text-[11px] text-stone-500 font-medium">Hearts Received</span>
                  </div>
                </div>

                <p className="text-[11px] text-stone-400 text-center italic">
                  💡 Tap the play button on any card to listen to the song dedicated to you!
                </p>
              </div>
            ) : (
              /* ============================================================== */
              /* SIMPLE WISH COMPOSE CARD + MUSIC DEDICATION */
              /* ============================================================== */
              <div className="bg-white/95 rounded-3xl border border-amber-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-amber-100">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold font-serif-display text-stone-900 flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Write a Birthday Wish</span>
                    </h2>
                    <p className="text-xs text-stone-500">
                      For {user.displayName} · Sealed anonymously
                    </p>
                  </div>
                </div>

                {/* 1-Tap Quick Inspo Chips & AI Button */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Quick Ideas:</span>
                    <button
                      type="button"
                      disabled={isGeneratingAi}
                      onClick={handleGenerateGeminiWish}
                      className="text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>{isGeneratingAi ? 'Writing wish...' : '✨ Write with AI'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {QUICK_INSPIRATIONS.map((insp, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setMessage(insp.text);
                          playWaxSealClick();
                        }}
                        className="px-2.5 py-1 bg-amber-50/80 hover:bg-amber-100 text-stone-800 border border-amber-200/80 rounded-xl text-[11px] font-medium shrink-0 transition-colors cursor-pointer"
                      >
                        {insp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Compose Form */}
                <form onSubmit={handlePostWish} className="space-y-3.5">
                  <div className="relative">
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={`Write your heartfelt birthday note for ${user.displayName}...`}
                      maxLength={280}
                      className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-amber-200/80 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-[#FAF7F0] placeholder:text-stone-400 leading-relaxed resize-none text-stone-800"
                    />
                    <span className="absolute bottom-2.5 right-3 text-[10px] font-mono text-stone-400">
                      {280 - message.length}
                    </span>
                  </div>

                  {/* -------------------------------------------------------- */}
                  {/* WISH WITH MUSIC: Dedicated Kenyan Bash Party Anthems     */}
                  {/* -------------------------------------------------------- */}
                  <div className="pt-2 border-t border-amber-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>Wish With Music (Bash Anthem)</span>
                      </label>
                      {selectedTrackId && (
                        <button
                          type="button"
                          onClick={() => {
                            stopBashTrackMelody();
                            setSelectedTrackId(null);
                            setPreviewingTrackId(null);
                          }}
                          className="text-[10px] text-stone-500 hover:text-red-600 cursor-pointer underline"
                        >
                          Clear song
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {KENYAN_BASH_TRACKS.map((t) => {
                        const isSelected = selectedTrackId === t.id;
                        const isPreviewing = previewingTrackId === t.id;
                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              setSelectedTrackId(t.id);
                              playWaxSealClick();
                            }}
                            className={`p-2 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-300 shadow-2xs'
                                : 'bg-[#FAF7F0] hover:bg-amber-50/70 border-amber-200/70 text-stone-800'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-base">{t.emoji}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePreviewTrack(t.id);
                                }}
                                className={`px-1.5 py-0.5 rounded-md text-[10px] flex items-center gap-1 transition-colors cursor-pointer ${
                                  isPreviewing
                                    ? 'bg-red-600 text-white font-bold animate-pulse'
                                    : 'bg-white hover:bg-amber-200 text-amber-950 border border-amber-200'
                                }`}
                                title={isPreviewing ? 'Stop track' : 'Listen to melody'}
                              >
                                {isPreviewing ? (
                                  <>
                                    <Square className="w-2.5 h-2.5 fill-current" />
                                    <span>Stop</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-2.5 h-2.5 fill-current" />
                                    <span>Play</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-stone-900 truncate leading-tight">{t.title}</p>
                              <p className="text-[9px] text-stone-500 truncate">{t.artist}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {selectedTrackId && (
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-300/80 flex items-center justify-between text-xs text-amber-950">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                          <span>
                            Attached: <strong>{KENYAN_BASH_TRACKS.find((t) => t.id === selectedTrackId)?.title}</strong>
                          </span>
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold">Audio dedication active</span>
                      </div>
                    )}
                  </div>

                  {/* Compact Card Style & Stamp Pickers */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-100">
                    {/* Paper Theme */}
                    <div>
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                        Paper Theme
                      </label>
                      <div className="grid grid-cols-2 gap-1">
                        {STATIONERY_THEMES.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setSelectedTheme(t.id);
                              playWaxSealClick();
                            }}
                            className={`py-1 px-1.5 text-[11px] rounded-lg border text-center transition-all truncate cursor-pointer ${
                              selectedTheme === t.id
                                ? 'border-amber-500 bg-amber-100 font-bold text-stone-900 shadow-2xs'
                                : 'border-amber-200/70 hover:border-amber-300 text-stone-600 bg-white'
                            }`}
                          >
                            {t.badge}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Wax Stamp */}
                    <div>
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                        Wax Seal Stamp
                      </label>
                      <div className="flex flex-wrap items-center gap-1">
                        {WAX_SEALS.map((s) => (
                          <button
                            key={s.icon}
                            type="button"
                            onClick={() => {
                              setSelectedSeal(s.icon);
                              playWaxSealClick();
                            }}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs border transition-transform cursor-pointer ${
                              selectedSeal === s.icon
                                ? 'scale-110 border-amber-500 bg-amber-100 ring-2 ring-amber-300/40 shadow-2xs'
                                : 'border-amber-200/70 hover:bg-stone-50 bg-white'
                            }`}
                            title={s.label}
                          >
                            {s.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Anonymous / Custom Name */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                      <span className="font-bold uppercase tracking-wider text-[10px]">Signing As:</span>
                      <button
                        type="button"
                        onClick={() => setHandleType(handleType === 'custom' ? 'well_wisher' : 'custom')}
                        className="text-amber-800 hover:underline font-medium cursor-pointer"
                      >
                        {handleType === 'custom' ? 'Use Anonymous' : '+ Custom Alias'}
                      </button>
                    </div>

                    {handleType === 'custom' ? (
                      <input
                        type="text"
                        value={customAlias}
                        onChange={(e) => setCustomAlias(e.target.value)}
                        placeholder="e.g. Secret Admirer, Old Friend..."
                        maxLength={32}
                        className="w-full text-xs p-2.5 rounded-xl border border-amber-200/80 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-stone-50"
                      />
                    ) : (
                      <div className="text-xs text-stone-600 bg-[#FAF7F0] px-3 py-1.5 rounded-xl border border-amber-200/70 flex items-center justify-between">
                        <span>Anonymous Well-Wisher</span>
                        <span className="text-[10px] text-emerald-700 font-semibold">Zero Identity Leak</span>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{error}</span>
                    </div>
                  )}

                  {successNotice && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{successNotice}</span>
                    </div>
                  )}

                  {/* Clean, Prominent Submit Button */}
                  <button
                    type="submit"
                    disabled={posting || !message.trim()}
                    className="w-full py-3.5 px-5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 hover:from-red-500 hover:via-amber-400 hover:to-red-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 border border-red-500/40 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span className="font-serif-display tracking-wide text-sm">
                      {posting ? 'Sealing Wish Card...' : selectedTrackId ? 'Seal Card & Party Anthem 🎵' : 'Seal & Send Wish 💌'}
                    </span>
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right Column: Guestbook Wall of Wishes (col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold font-serif-display text-stone-900">
                  Guestbook &amp; Baraka Wall
                </h2>
                <p className="text-xs text-stone-500">
                  {wishes.length} {wishes.length === 1 ? 'card' : 'cards'} on this board
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="px-2.5 py-1 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                  title="Share board on WhatsApp"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366]" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>

                <button
                  onClick={fetchBoard}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-200 transition-colors cursor-pointer"
                  title="Refresh wishes"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-stone-500">Retrieving sealed cards &amp; music...</p>
              </div>
            ) : wishes.length === 0 ? (
              <div className="bg-white/95 rounded-3xl border border-amber-200/80 p-8 sm:p-12 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto text-xl">
                  💌
                </div>
                <h3 className="text-base font-bold font-serif-display text-stone-900">
                  Waiting for the First Birthday Note
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                  {isSelf
                    ? 'No wishes yet! Share your board link on WhatsApp to invite friends and family to dedicate songs and notes.'
                    : 'Be the first to leave an anonymous celebratory note! Pick an anthem and seal a card.'}
                </p>
                {isSelf && (
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                  >
                    <WhatsAppIcon className="w-4 h-4 fill-white" />
                    <span>Share on WhatsApp</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {wishes.map((w) => {
                  const themeStyle =
                    STATIONERY_THEMES.find((t) => t.id === w.theme) || STATIONERY_THEMES[0];
                  const attachedTrack = w.musicTrack
                    ? KENYAN_BASH_TRACKS.find((t) => t.id === w.musicTrack)
                    : null;
                  const isTrackPlaying = playingTrackWishId === w.id;

                  return (
                    <div
                      key={w.id}
                      className={`relative rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-xs flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 ${themeStyle.bg}`}
                    >
                      <div>
                        {/* Note Header: Sender Handle + Seal */}
                        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-black/5">
                          <span className="text-xs font-mono font-semibold opacity-75 truncate max-w-[170px]">
                            {w.senderHandle}
                          </span>
                          <span className="text-base">{w.reactionEmoji || '🎂'}</span>
                        </div>

                        {/* Note Content */}
                        <p className="text-xs sm:text-sm font-serif-display leading-relaxed whitespace-pre-wrap">
                          {w.message}
                        </p>

                        {/* Attached Party Anthem / Music Dedication */}
                        {attachedTrack && (
                          <div className="mt-3 p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-sm shrink-0">{attachedTrack.emoji}</span>
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-stone-900 truncate leading-tight">
                                  {attachedTrack.title}
                                </p>
                                <p className="text-[9px] text-stone-600 truncate">
                                  {attachedTrack.artist}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleTogglePlayWishTrack(w.id, attachedTrack.id)}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                                isTrackPlaying
                                  ? 'bg-red-600 text-white shadow-2xs'
                                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-2xs'
                              }`}
                              title={isTrackPlaying ? 'Stop music' : 'Play dedication'}
                            >
                              {isTrackPlaying ? (
                                <>
                                  <div className="flex items-end gap-0.5 h-3">
                                    <span className="w-0.5 bg-white rounded-full animate-eq-1" />
                                    <span className="w-0.5 bg-white rounded-full animate-eq-2" />
                                    <span className="w-0.5 bg-white rounded-full animate-eq-3" />
                                  </div>
                                  <span>Stop</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-2.5 h-2.5 fill-current" />
                                  <span>Play Beat</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Note Footer: Timestamp, Like/Heart, Moderation */}
                      <div className="mt-3.5 pt-2.5 border-t border-black/5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 opacity-60 text-[11px]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {new Date(w.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Heart / Appreciation button */}
                          <button
                            type="button"
                            onClick={() => handleToggleLike(w.id)}
                            disabled={likingWishId === w.id}
                            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs transition-colors cursor-pointer ${
                              w.hasLiked
                                ? 'bg-rose-100 text-rose-700 font-bold'
                                : 'hover:bg-black/5 text-stone-600'
                            }`}
                            title="Appreciate this wish"
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                w.hasLiked ? 'fill-rose-500 text-rose-500' : 'text-stone-400'
                              }`}
                            />
                            <span className="tabular-nums font-mono text-[11px]">
                              {w.likesCount ?? 0}
                            </span>
                          </button>

                          {/* Recipient Moderation */}
                          {w.canModerate && (
                            <button
                              type="button"
                              onClick={() => handleDeleteWish(w.id)}
                              disabled={deletingWishId === w.id}
                              className={`p-1 rounded-lg text-xs transition-colors cursor-pointer ${
                                confirmDeleteId === w.id
                                  ? 'bg-rose-600 text-white px-2 py-0.5'
                                  : 'text-stone-400 hover:text-rose-600 hover:bg-black/5'
                              }`}
                              title="Delete from your board"
                            >
                              {confirmDeleteId === w.id ? 'Confirm?' : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
