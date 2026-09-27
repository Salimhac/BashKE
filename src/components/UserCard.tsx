import React from 'react';
import type { PublicUser } from '../types';
import { getAvatarStyle, getInitials } from '../utils/avatar';
import { MessageSquare, Cake, ArrowRight } from 'lucide-react';

interface UserCardProps {
  user: PublicUser;
  onOpenBoard: (user: PublicUser) => void;
  isCurrentUser: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onOpenBoard, isCurrentUser }) => {
  const avatarStyle = getAvatarStyle(user.avatarSeed);
  const initials = getInitials(user.displayName);

  const formatGender = (gender: string) => {
    switch (gender) {
      case 'female':
        return 'Female';
      case 'male':
        return 'Male';
      case 'non-binary':
        return 'Non-Binary';
      case 'prefer-not-to-say':
        return 'Unspecified';
      default:
        return 'Other';
    }
  };

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?board=${user.id}`;
    const text = isCurrentUser
      ? `🎉 It's my birthday celebration! Leave me an anonymous birthday wish or blessing on my board here:\n${url}\n🎂✨ Tupige sherehe!`
      : `🎂 Today is ${user.displayName}'s birthday celebration! Leave them an anonymous birthday wish on their board here:\n${url}\n✨ Form ni sherehe!`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={() => onOpenBoard(user)}
      className={`group relative text-left bg-white rounded-2xl sm:rounded-3xl border transition-all duration-200 cursor-pointer p-4 sm:p-6 flex flex-col justify-between overflow-hidden ${
        user.isBirthdayToday
          ? 'border-red-400/80 shadow-md hover:shadow-lg hover:border-red-500 bg-gradient-to-b from-red-50/40 via-amber-50/20 to-white'
          : 'border-stone-200/80 hover:border-stone-300 hover:shadow-2xs'
      }`}
    >
      {/* Top Shúkà ribbon on active celebrant cards */}
      {user.isBirthdayToday && (
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-shuka-stripe" />
      )}

      <div>
        {/* Top Header: Avatar + Birthday Indicator */}
        <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
          <div
            className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm tracking-wider border shadow-2xs transition-transform group-hover:scale-105 shrink-0 ${avatarStyle.bg}`}
          >
            {initials}
          </div>

          {/* Birthday Status or Horizon Countdown */}
          {user.isBirthdayToday ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-100 text-red-950 border border-red-200 text-[11px] sm:text-xs font-bold font-serif-display shadow-2xs">
              <Cake className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>🎉 Bash Leo!</span>
            </div>
          ) : (
            <div className="text-right">
              <span className="text-[11px] sm:text-xs font-mono text-stone-500 tabular-nums">
                {user.daysUntilBirthday === 1
                  ? 'Tomorrow'
                  : `In ${user.daysUntilBirthday} days`}
              </span>
            </div>
          )}
        </div>

        {/* Primary Anchor: Celebrant Display Name */}
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-red-700 transition-colors font-serif-display truncate">
            {user.displayName}
            {isCurrentUser && (
              <span className="ml-2 text-xs font-normal text-amber-700 font-sans">
                (Your Board)
              </span>
            )}
          </h3>

          {/* Clean unboxed metadata with dot separators (Zero-pill discipline) */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-stone-500">
            <span>{formatGender(user.gender)}</span>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <span>{user.isBirthdayToday ? 'Active Bash' : 'Locked Horizon'}</span>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <span className="tabular-nums font-mono">{user.totalWishesCount} wishes</span>
          </div>
        </div>

        {/* Quiet Celebratory Note */}
        <p className="mt-2.5 sm:mt-3.5 text-xs text-stone-600 leading-relaxed line-clamp-2">
          {user.isBirthdayToday
            ? 'Tupige sherehe! Board open for anonymous wishes, wax seal cards, and celebrations.'
            : 'Board unlocks for anonymous messages once the server clock matches their birthday.'}
        </p>
      </div>

      {/* Card Footer: Clear Action Button */}
      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <MessageSquare className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span className="tabular-nums font-mono font-medium text-stone-700">
            {user.totalWishesCount}
          </span>
          <span className="hidden xs:inline">{user.totalWishesCount === 1 ? 'wish card' : 'wish cards'}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="min-h-[38px] min-w-[38px] px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 shadow-2xs active:scale-95 cursor-pointer"
            title={isCurrentUser ? "Share your board on WhatsApp" : `Share ${user.displayName}'s board on WhatsApp`}
            aria-label="Share on WhatsApp"
          >
            <svg className="w-3.5 h-3.5 fill-[#25D366] shrink-0" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenBoard(user);
            }}
            className={`min-h-[38px] px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer ${
              user.isBirthdayToday
                ? 'bg-gradient-to-r from-red-600 via-amber-500 to-red-600 hover:from-red-500 hover:to-amber-400 text-white border border-red-400/80 ring-2 ring-red-400/30'
                : 'bg-stone-900 hover:bg-stone-800 text-white'
            }`}
          >
            <span>{user.isBirthdayToday ? 'Open Bash Board' : 'View Board'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
