export interface PublicUser {
  id: string;
  displayName: string;
  gender: 'female' | 'male' | 'non-binary' | 'other' | 'prefer-not-to-say';
  avatarSeed: string;
  birthMonth?: number;
  birthDay?: number;
  isBirthdayToday: boolean;
  daysUntilBirthday: number;
  birthdayStatus: string;
  totalWishesCount: number;
}

export interface PrivateUser {
  id: string;
  email: string;
  displayName: string;
  gender: string;
  birthday: string;
  avatarSeed: string;
  isEmailVerified: boolean;
  createdAt: string;
  realNameProtected: boolean;
}

export interface PublicWish {
  id: string;
  recipientId: string;
  senderHandle: string;
  message: string;
  theme: 'shuka' | 'golden' | 'rift' | 'nairobi' | 'kikoy' | 'party' | 'warmth' | 'confetti' | 'minimal' | string;
  reactionEmoji?: string;
  musicTrack?: string;
  createdAt: string;
  canModerate?: boolean;
  likesCount: number;
  hasLiked?: boolean;
}

export interface InAppNotification {
  id: string;
  recipientId: string;
  type: 'wish_received' | 'security_alert' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface SecurityLog {
  id: string;
  userId?: string;
  action: string;
  attemptedFields?: string[];
  details: string;
  ip: string;
  timestamp: string;
}

export interface OutboxEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  type: 'verification' | 'password_reset' | 'wish_notification';
  timestamp: string;
}
