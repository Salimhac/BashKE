import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Unique user account ID
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // Hashed password for direct Neon DB auth
  displayName: text('display_name').notNull(),
  gender: text('gender').notNull().default('prefer-not-to-say'),
  birthday: text('birthday').notNull().default('1995-09-24'), // YYYY-MM-DD
  avatarSeed: text('avatar_seed').notNull().default('amber'),
  isEmailVerified: boolean('is_email_verified').notNull().default(true),
  realName: text('real_name'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const wishes = pgTable('wishes', {
  id: serial('id').primaryKey(),
  recipientId: text('recipient_id').notNull(), // Target user's uid or id
  senderUid: text('sender_uid'), // strictly private sender identifier
  senderHandle: text('sender_handle').notNull().default('Anonymous Friend'),
  message: text('message').notNull(),
  theme: text('theme').notNull().default('golden'), // 'golden' | 'party' | 'warmth' | 'confetti' | 'minimal'
  reactionEmoji: text('reaction_emoji'),
  likesCount: integer('likes_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const wishLikes = pgTable('wish_likes', {
  id: serial('id').primaryKey(),
  wishId: integer('wish_id').references(() => wishes.id, { onDelete: 'cascade' }).notNull(),
  userIdentifier: text('user_identifier').notNull(), // UID or client identifier
  createdAt: timestamp('created_at').defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  recipientUid: text('recipient_uid').notNull(),
  type: text('type').notNull().default('wish_received'),
  title: text('title').notNull(),
  message: text('message').notNull(),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  wishesReceived: many(wishes),
  notifications: many(notifications),
}));

export const wishesRelations = relations(wishes, ({ many }) => ({
  likes: many(wishLikes),
}));

export const wishLikesRelations = relations(wishLikes, ({ one }) => ({
  wish: one(wishes, {
    fields: [wishLikes.wishId],
    references: [wishes.id],
  }),
}));
