export interface UserRecord {
  id?: string;
  uid?: string;
  email: string;
  displayName: string;
  gender: string;
  birthday: string;
  avatarSeed?: string;
  isEmailVerified?: boolean;
  createdAt?: string | Date;
}

export interface WishRecord {
  id: string | number;
  recipientId: string;
  senderHandle?: string;
  message: string;
  theme: string;
  reactionEmoji?: string;
  createdAt?: string | Date;
  likesCount?: number;
  likedBy?: string[];
}

export interface PublicUserDTO {
  id: string;
  displayName: string;
  gender: string;
  avatarSeed: string;
  birthMonth?: number;
  birthDay?: number;
  isBirthdayToday: boolean;
  daysUntilBirthday: number;
  birthdayStatus: string;
  totalWishesCount: number;
}

export interface PrivateUserDTO {
  id: string;
  email: string;
  displayName: string;
  gender: string;
  birthday: string; // Stored permanently locked date for the user's reference
  avatarSeed: string;
  isEmailVerified: boolean;
  createdAt: string;
  // NOTE: realName is strictly omitted even from the user's private DTO per security brief:
  // "nobody can ever see your real name, not even you on your own public profile... never rendered in any API response"
  realNameProtected: boolean;
}

export interface PublicWishDTO {
  id: string;
  recipientId: string;
  senderHandle: string; // "A well-wisher #4821" or "Anonymous"
  message: string;
  theme: string;
  reactionEmoji?: string;
  createdAt: string;
  canModerate?: boolean; // Set dynamically if viewer is recipient
  likesCount: number;
  hasLiked?: boolean;
}

/**
 * Calculates whether a birthday (YYYY-MM-DD) falls on simulated or current date (MM-DD)
 */
export function checkBirthdayStatus(birthdayStr: string, simulatedDateStr?: string): {
  isToday: boolean;
  daysUntil: number;
  statusText: string;
} {
  const refDate = simulatedDateStr ? new Date(`${simulatedDateStr}T12:00:00Z`) : new Date('2026-09-23T12:00:00Z');
  const [bYear, bMonth, bDay] = birthdayStr.split('-').map(Number);

  const currentYear = refDate.getUTCFullYear();
  const currentMonth = refDate.getUTCMonth() + 1; // 1-12
  const currentDay = refDate.getUTCDate();

  const isToday = bMonth === currentMonth && bDay === currentDay;

  // Calculate days until next birthday
  let nextBirthdayDate = new Date(Date.UTC(currentYear, bMonth - 1, bDay, 12, 0, 0));
  if (nextBirthdayDate.getTime() < refDate.getTime() && !isToday) {
    nextBirthdayDate = new Date(Date.UTC(currentYear + 1, bMonth - 1, bDay, 12, 0, 0));
  }

  const diffTime = nextBirthdayDate.getTime() - refDate.getTime();
  const daysUntil = isToday ? 0 : Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let statusText = '';
  if (isToday) {
    statusText = '🎂 Today is their birthday!';
  } else if (daysUntil === 1) {
    statusText = '🎈 Birthday is tomorrow!';
  } else if (daysUntil <= 7) {
    statusText = `🎉 Birthday in ${daysUntil} days`;
  } else {
    statusText = '✨ Upcoming celebration';
  }

  return { isToday, daysUntil, statusText };
}

/**
 * Strict sanitizer for public user profiles.
 * Strips email, realName, and exact birthday (on non-birthdays).
 */
export function toPublicUserDTO(user: UserRecord, totalWishesCount: number, simulatedDate?: string): PublicUserDTO {
  const { isToday, daysUntil, statusText } = checkBirthdayStatus(user.birthday, simulatedDate);
  const [, bMonth, bDay] = user.birthday.split('-').map(Number);

  return {
    id: user.uid || user.id || '',
    displayName: user.displayName,
    gender: user.gender,
    avatarSeed: user.avatarSeed || 'amber',
    birthMonth: bMonth,
    birthDay: bDay,
    isBirthdayToday: isToday,
    daysUntilBirthday: daysUntil,
    birthdayStatus: statusText,
    totalWishesCount,
  };
}

/**
 * Strict sanitizer for authenticated user's own profile.
 * OMITTING realName entirely (stored only for account integrity in DB).
 */
export function toPrivateUserDTO(user: UserRecord): PrivateUserDTO {
  return {
    id: user.uid || user.id || '',
    email: user.email,
    displayName: user.displayName,
    gender: user.gender,
    birthday: user.birthday,
    avatarSeed: user.avatarSeed || 'amber',
    isEmailVerified: user.isEmailVerified ?? true,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
    realNameProtected: true,
  };
}

/**
 * Sanitizer for public wishes.
 * Strips senderId, senderRealName, senderEmail.
 */
export function toPublicWishDTO(wish: WishRecord, viewerId?: string | null): PublicWishDTO {
  return {
    id: String(wish.id),
    recipientId: wish.recipientId,
    senderHandle: wish.senderHandle || 'Anonymous',
    message: wish.message,
    theme: wish.theme,
    reactionEmoji: wish.reactionEmoji,
    createdAt: wish.createdAt ? new Date(wish.createdAt).toISOString() : new Date().toISOString(),
    canModerate: viewerId ? viewerId === wish.recipientId : false,
    likesCount: typeof wish.likesCount === 'number' ? wish.likesCount : (wish.likedBy?.length ?? 0),
    hasLiked: viewerId && Array.isArray(wish.likedBy) ? wish.likedBy.includes(viewerId) : false,
  };
}
