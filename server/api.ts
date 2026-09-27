import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { getUsers, getUserByUid, getOrCreateUser, updateUserProfile, cleanAllUsersAndData } from '../src/db/users.ts';
import { getWishesForRecipient, createWish, toggleWishLike, getLikedWishIds, deleteWish, getTotalWishesCount } from '../src/db/wishes.ts';
import { getNotificationsForUser, createNotification, markNotificationsAsRead, markNotificationAsReadById, deleteNotificationsForUser } from '../src/db/notifications.ts';
import { requireAuth, optionalAuth, AuthRequest } from '../src/middleware/auth.ts';
import { checkBirthdayStatus } from './dto.js';

export const apiRouter = Router();

// Track simulated date on server (defaults to real current local date)
let activeSimulatedDate: string = new Date().toISOString().split('T')[0];

// Helper to sanitize text (anti-XSS and length limit)
function sanitizeText(str: string, maxLen = 280): string {
  if (!str) return '';
  const trimmed = str.trim().slice(0, maxLen);
  return trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getSimulatedDate(req: Request): string {
  const headerDate = req.headers['x-simulated-date'] as string;
  if (headerDate && /^\d{4}-\d{2}-\d{2}$/.test(headerDate)) {
    return headerDate;
  }
  return activeSimulatedDate;
}

function toPublicUserFromDb(u: any, totalWishesCount: number, simulatedDate: string) {
  const birthday = u.birthday || '1998-05-15';
  const { isToday, daysUntil, statusText } = checkBirthdayStatus(birthday, simulatedDate);
  const [, bMonth, bDay] = birthday.split('-').map(Number);

  return {
    id: u.uid,
    displayName: u.displayName,
    gender: u.gender || 'prefer-not-to-say',
    avatarSeed: u.avatarSeed || 'amber',
    birthMonth: bMonth,
    birthDay: bDay,
    isBirthdayToday: isToday,
    daysUntilBirthday: daysUntil,
    birthdayStatus: statusText,
    totalWishesCount,
  };
}

function toPrivateUserFromDb(u: any) {
  return {
    id: u.uid,
    email: u.email,
    displayName: u.displayName,
    gender: u.gender || 'prefer-not-to-say',
    birthday: u.birthday || '1998-05-15',
    avatarSeed: u.avatarSeed || 'amber',
    isEmailVerified: u.isEmailVerified ?? true,
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
    realNameProtected: true,
  };
}

// -------------------------------------------------------------
// Auth & User Routes
// -------------------------------------------------------------

// Sync Firebase Authenticated user to Cloud SQL database
apiRouter.post('/auth/sync', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const firebaseUser = req.user;
    if (!firebaseUser) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
    }

    const uid = firebaseUser.uid;
    const email = firebaseUser.email || (req.body && req.body.email) || `${uid}@bashke.app`;
    const name = (req.body && req.body.displayName) || (firebaseUser as any).name || email.split('@')[0];
    const avatarSeed = (req.body && req.body.avatarSeed) || `seed_${uid.slice(0, 8)}`;

    const profileData = {
      birthday: req.body?.birthday,
      gender: req.body?.gender,
      realName: req.body?.realName,
    };

    const dbUser = await getOrCreateUser(uid, email, name, avatarSeed, profileData);
    return res.json({ user: toPrivateUserFromDb(dbUser) });
  } catch (error: any) {
    console.error('Failed to sync auth user to Cloud SQL:', error);
    return res.status(500).json({ error: error.message || 'Failed to sync user' });
  }
});

apiRouter.post('/auth/logout', (_req: Request, res: Response) => {
  return res.json({ success: true, message: 'Logged out successfully' });
});

// Current user profile
apiRouter.get('/auth/me', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const firebaseUser = req.user;
    if (!firebaseUser) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Not logged in' });
    }

    const dbUser = await getUserByUid(firebaseUser.uid);
    if (!dbUser) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User profile does not exist in database' });
    }

    return res.json({ user: toPrivateUserFromDb(dbUser) });
  } catch (error: any) {
    console.error('Failed to get user profile from Cloud SQL:', error);
    return res.status(500).json({ error: error.message || 'Failed to get profile' });
  }
});

// Admin/Dev route to wipe all users and start fresh
apiRouter.post('/admin/clean-all-users', async (_req: Request, res: Response) => {
  try {
    await cleanAllUsersAndData();
    return res.json({ success: true, message: 'All users and celebration records successfully cleared. Starting fresh.' });
  } catch (error: any) {
    console.error('Failed to clean users from Cloud SQL:', error);
    return res.status(500).json({ error: error.message || 'Failed to clean users' });
  }
});

// Update editable user profile fields
apiRouter.patch('/users/me', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user?.uid || req.body.userId;
    if (!uid) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Please sign in to update profile' });
    }
    const { displayName, avatarSeed, gender, birthday, realName } = req.body;

    const currentUser = await getUserByUid(uid);
    if (!currentUser) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' });
    }

    const isPlaceholder = !currentUser.birthday || currentUser.birthday === '1996-09-24' || currentUser.birthday === '1995-09-24';

    if (realName !== undefined) {
      return res.status(403).json({
        error: 'FIELD_LOCKED',
        message: 'Security policy: Legal name is permanently locked for account integrity.',
      });
    }

    if (birthday !== undefined && !isPlaceholder && currentUser.birthday !== birthday) {
      return res.status(403).json({
        error: 'FIELD_LOCKED',
        message: 'Security policy: Verified birthday is permanently locked for board integrity.',
      });
    }

    const cleanName = displayName ? sanitizeText(displayName, 50) : undefined;
    const cleanBirthday = birthday && /^\d{4}-\d{2}-\d{2}$/.test(birthday) ? birthday : undefined;

    const updated = await updateUserProfile(uid, {
      displayName: cleanName,
      avatarSeed: avatarSeed ? sanitizeText(avatarSeed, 50) : undefined,
      gender: gender ? sanitizeText(gender, 30) : undefined,
      birthday: cleanBirthday,
    });

    if (!updated) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' });
    }

    return res.json({
      success: true,
      message: 'Profile updated in Cloud SQL',
      user: toPrivateUserFromDb(updated),
    });
  } catch (error: any) {
    console.error('Failed to update user profile in Cloud SQL:', error);
    return res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

// -------------------------------------------------------------
// Public Users & Birthdays (Cloud SQL)
// -------------------------------------------------------------

apiRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const filter = req.query.filter as string | undefined;
    const search = (req.query.search as string | undefined)?.toLowerCase();
    const genderFilter = req.query.gender as string | undefined;
    const simDate = getSimulatedDate(req);

    const allUsers = await getUsers();

    // Map each user to PublicUserDTO with calculated countdowns
    const userDTOs = await Promise.all(
      allUsers.map(async (u) => {
        const wishes = await getWishesForRecipient(u.uid);
        return toPublicUserFromDb(u, wishes.length, simDate);
      })
    );

    let filtered = userDTOs;

    if (filter === 'today') {
      filtered = filtered.filter((u) => u.isBirthdayToday);
    } else if (filter === 'week') {
      filtered = filtered.filter((u) => u.isBirthdayToday || (u.daysUntilBirthday >= 1 && u.daysUntilBirthday <= 7));
    }

    if (genderFilter && genderFilter !== 'all') {
      filtered = filtered.filter((u) => u.gender === genderFilter);
    }

    if (search) {
      filtered = filtered.filter((u) => u.displayName.toLowerCase().includes(search));
    }

    const todayCount = userDTOs.filter((u) => u.isBirthdayToday).length;
    const weekCount = userDTOs.filter((u) => u.daysUntilBirthday >= 1 && u.daysUntilBirthday <= 7).length;

    return res.json({
      users: filtered,
      meta: {
        simulatedDate: simDate,
        totalCount: userDTOs.length,
        todayCount,
        weekCount,
      },
    });
  } catch (error: any) {
    console.error('Failed to query users from Cloud SQL:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
});

apiRouter.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const simDate = getSimulatedDate(req);
    const guestOrUserToken = (req.headers['x-guest-token'] as string) || 'guest';

    const user = await getUserByUid(userId);
    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Celebrant not found in Cloud SQL' });
    }

    const wishes = await getWishesForRecipient(userId);
    const wishIds = wishes.map((w) => w.id);
    const likedIds = await getLikedWishIds(guestOrUserToken, wishIds);
    const likedSet = new Set(likedIds);

    const publicWishes = wishes.map((w) => {
      const raw = w.reactionEmoji || '';
      const [seal, music] = raw.includes(':::') ? raw.split(':::') : [raw || undefined, undefined];
      return {
        id: String(w.id),
        recipientId: w.recipientId,
        senderHandle: w.senderHandle,
        message: w.message,
        theme: w.theme,
        reactionEmoji: seal || undefined,
        musicTrack: music || undefined,
        createdAt: w.createdAt ? new Date(w.createdAt).toISOString() : new Date().toISOString(),
        canModerate: false,
        likesCount: w.likesCount,
        hasLiked: likedSet.has(w.id),
      };
    });

    return res.json({
      user: toPublicUserFromDb(user, wishes.length, simDate),
      wishes: publicWishes,
      simulatedDate: simDate,
    });
  } catch (error: any) {
    console.error('Failed to get user profile from Cloud SQL:', error);
    return res.status(500).json({ error: error.message || 'Failed to load profile' });
  }
});

// -------------------------------------------------------------
// Wish Board Actions (Cloud SQL)
// -------------------------------------------------------------

apiRouter.get('/users/:id/wishes', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const wishes = await getWishesForRecipient(userId);
    return res.json({ wishes });
  } catch (error: any) {
    console.error('Failed to fetch wishes from Cloud SQL:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch wishes' });
  }
});

apiRouter.post('/users/:id/wishes', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const recipientId = req.params.id;

    // The owner cannot post a wish to their own birthday board
    if (req.user?.uid && req.user.uid === recipientId) {
      return res.status(403).json({
        error: 'CANNOT_WISH_SELF',
        message: 'This is your own birthday board! As the birthday celebrant, your board is for friends, colleagues, and family to leave their wishes for you.',
      });
    }
    const { message, theme, anonymousHandleType, reactionEmoji, musicTrack } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'EMPTY_MESSAGE', message: 'A wish message cannot be blank.' });
    }

    if (message.length > 280) {
      return res.status(400).json({ error: 'MESSAGE_TOO_LONG', message: 'Wishes must be 280 characters or fewer.' });
    }

    const validThemes = ['golden', 'party', 'warmth', 'confetti', 'minimal'];
    const chosenTheme = validThemes.includes(theme) ? theme : 'golden';

    let senderHandle = 'Anonymous Well-Wisher';
    if (anonymousHandleType === 'numbered') {
      const num = Math.floor(1000 + Math.random() * 9000);
      senderHandle = `Warm Friend #${num}`;
    } else if (anonymousHandleType === 'poetic') {
      const poeticTitles = ['Starlight Wanderer', 'Autumn Traveler', 'Secret Neighbor', 'Solar Orbit Friend'];
      senderHandle = poeticTitles[Math.floor(Math.random() * poeticTitles.length)];
    }

    // Combine seal and music track dedication
    const cleanSeal = reactionEmoji ? sanitizeText(reactionEmoji, 10) : '🎂';
    const cleanTrack = musicTrack && typeof musicTrack === 'string' ? sanitizeText(musicTrack, 40) : undefined;
    const combinedReaction = cleanTrack ? `${cleanSeal}:::${cleanTrack}` : cleanSeal;

    const created = await createWish({
      recipientId,
      senderUid: req.user?.uid || undefined,
      senderHandle,
      message: sanitizeText(message, 280),
      theme: chosenTheme,
      reactionEmoji: combinedReaction,
    });

    // Create real notification in Cloud SQL for the celebrant
    await createNotification({
      recipientUid: recipientId,
      type: 'wish_received',
      title: 'New Sealed Wish Arrived',
      message: cleanTrack 
        ? `A thoughtful member sealed an anonymous wish card with a music dedication for your birthday board!`
        : `A thoughtful member sealed an anonymous wish card for your birthday board!`,
    }).catch((err) => console.warn('Notification insert error:', err));

    return res.status(201).json({
      success: true,
      wish: {
        id: String(created.id),
        recipientId: created.recipientId,
        senderHandle: created.senderHandle,
        message: created.message,
        theme: created.theme,
        reactionEmoji: cleanSeal,
        musicTrack: cleanTrack,
        createdAt: created.createdAt ? new Date(created.createdAt).toISOString() : new Date().toISOString(),
        likesCount: created.likesCount,
        hasLiked: false,
      },
    });
  } catch (error: any) {
    console.error('Failed to create wish in Cloud SQL:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit wish' });
  }
});

apiRouter.post('/users/:id/wishes/:wishId/like', async (req: Request, res: Response) => {
  try {
    const wishId = parseInt(req.params.wishId, 10);
    if (isNaN(wishId)) {
      return res.status(400).json({ error: 'INVALID_ID', message: 'Invalid wish ID' });
    }

    const voterId = (req.headers['x-guest-token'] as string) || (req.headers['authorization'] as string) || 'guest';
    const result = await toggleWishLike(wishId, voterId);

    return res.json({
      success: true,
      liked: result.liked,
      likesCount: result.likesCount,
    });
  } catch (error: any) {
    console.error('Failed to like wish in Cloud SQL:', error);
    return res.status(500).json({ error: error.message || 'Failed to update like' });
  }
});

apiRouter.delete('/users/:id/wishes/:wishId', async (req: Request, res: Response) => {
  try {
    const wishId = parseInt(req.params.wishId, 10);
    if (isNaN(wishId)) {
      return res.status(400).json({ error: 'INVALID_ID', message: 'Invalid wish ID' });
    }

    await deleteWish(wishId);
    return res.json({ success: true, message: 'Wish removed from Cloud SQL' });
  } catch (error: any) {
    console.error('Failed to delete wish from Cloud SQL:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete wish' });
  }
});

// -------------------------------------------------------------
// System Info & Date Simulation
// -------------------------------------------------------------

apiRouter.get('/system/info', async (req: Request, res: Response) => {
  try {
    const [users, totalWishes] = await Promise.all([
      getUsers(),
      getTotalWishesCount(),
    ]);
    const simDate = getSimulatedDate(req);

    const userDTOs = users.map((u) => toPublicUserFromDb(u, 0, simDate));
    const todayCount = userDTOs.filter((u) => u.isBirthdayToday).length;
    const weekCount = userDTOs.filter((u) => u.daysUntilBirthday >= 1 && u.daysUntilBirthday <= 7).length;

    const dateObj = new Date(`${simDate}T12:00:00Z`);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return res.json({
      status: 'healthy',
      serverTime: new Date().toISOString(),
      serverDate: simDate,
      formattedDate,
      totalMembers: users.length,
      totalWishesDelivered: totalWishes,
      activeCelebrationsToday: todayCount,
      upcomingCelebrationsThisWeek: weekCount,
    });
  } catch (error: any) {
    console.error('Failed to get system info from Cloud SQL:', error);
    return res.status(500).json({ error: error.message || 'Failed to retrieve stats' });
  }
});

apiRouter.post('/dev/simulate-date', (req: Request, res: Response) => {
  const { date } = req.body;
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    activeSimulatedDate = date;
    return res.json({ success: true, simulatedDate: activeSimulatedDate });
  } else if (date === 'reset') {
    activeSimulatedDate = new Date().toISOString().split('T')[0];
    return res.json({ success: true, simulatedDate: activeSimulatedDate });
  }
  return res.status(400).json({ error: 'INVALID_DATE', message: 'Date must be YYYY-MM-DD or "reset"' });
});

// Real Notifications from Cloud SQL
apiRouter.get('/notifications', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.json({ notifications: [] });
    }
    const notifs = await getNotificationsForUser(uid);
    return res.json({
      notifications: notifs.map((n) => ({
        id: String(n.id),
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Failed to get notifications:', error);
    return res.status(500).json({ error: error.message || 'Failed to get notifications' });
  }
});

apiRouter.patch('/notifications/:id/read', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user?.uid;
    const notifId = parseInt(req.params.id, 10);
    if (uid && !isNaN(notifId)) {
      await markNotificationAsReadById(notifId, uid);
    }
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to mark notification read' });
  }
});

apiRouter.delete('/notifications', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user?.uid;
    if (uid) {
      await deleteNotificationsForUser(uid);
    }
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to clear notifications' });
  }
});

apiRouter.post('/notifications/mark-read', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.json({ success: true });
    }
    await markNotificationsAsRead(uid);
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to mark notifications read:', error);
    return res.status(500).json({ error: error.message || 'Failed to mark read' });
  }
});

// -------------------------------------------------------------
// Gemini AI Birthday Wish Studio
// -------------------------------------------------------------

apiRouter.post('/ai/generate-wish', async (req: Request, res: Response) => {
  try {
    const { recipientName, tone, hint } = req.body;
    const cleanRecipient = sanitizeText(recipientName || 'a wonderful community member', 50);
    const cleanTone = sanitizeText(tone || 'warm and poetic', 50);
    const cleanHint = sanitizeText(hint || '', 100);

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI();
        const systemPrompt = `You are an artisanal celebration poet writing a warm, vibrant birthday card for a Kenyan birthday bash (sherehe) for ${cleanRecipient}.
Tone: ${cleanTone}.
${cleanHint ? `Special thought: ${cleanHint}` : ''}
Rules:
- Strictly between 20 and 50 words.
- Warm, celebratory, soulful, and uplifting party spirit ("sherehe", "baraka tele", long life, radiant joy, vibrant community love).
- If tone is sherehe or cheerful, embrace vibrant Nairobi bash energy and excitement. If baraka or warm, embrace soulful blessings, health, and peace.
- Absolutely DO NOT include signatures, greetings like "Dear X" or "From Y", and DO NOT mention your identity.
- Output ONLY the body of the message.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: systemPrompt,
        });

        const generatedText = response.text ? response.text.trim().replace(/^["']|["']$/g, '') : null;
        if (generatedText) {
          return res.json({ wish: generatedText });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini API call failed, falling back to curated stationery library:', geminiErr?.message);
      }
    }

    const fallbacks: Record<string, string[]> = {
      sherehe: [
        'Form ni birthday bash! May this special year bring unstoppable energy, big wins, good music, and endless laughter with your people. Tupige sherehe!',
        'Happy Birthday! Today we celebrate you in true Nairobi bash style — overflowing joy, dancing feet, and a sensational new chapter ahead!',
      ],
      baraka: [
        'Maisha marefu na baraka tele! Sending deepest warmth and blessings on your birthday. May good health, peace, and abundance walk with you every day.',
        'Celebrating the gift of your life today! May the year ahead be showered with deep peace, genuine laughter, and boundless blessings.',
      ],
      poetic: [
        'May your day be painted with the rich golden amber of an acacia sunset. Wishing you a magnificent orbit filled with grace, harmony, and luminous triumphs.',
        'Like a vibrant sunrise over the Great Rift Valley, may this fresh year awaken unexpected beauty, deep fulfillment, and peaceful joy in your heart.',
      ],
      warm: [
        'Sending radiant birthday warmth your way! May this milestone year surround you with genuine laughter, great health, and cherished moments with those who love you.',
        'Wishing you the sweetest celebrations today and a year brimming with wonderful surprises, booming success, and heartfelt happiness!',
      ],
      cheerful: [
        'Happy Birthday! May your cake be sweet, your celebration loud and joyous, and your year ahead completely spectacular in every way!',
        'Here’s to another magnificent trip around the sun! Keep shining your brilliant light and celebrating life to the fullest!',
      ],
      haiku: [
        'Golden sunset glow / Sherehe fills the night air / Blessings on your day.',
        'Acacia trees dance / New year begins with laughter / Happy Birthday friend.',
      ],
    };

    const selectedCategory = (cleanTone.toLowerCase() in fallbacks) ? cleanTone.toLowerCase() : 'warm';
    const list = fallbacks[selectedCategory] || fallbacks.warm;
    const randomFallback = list[Math.floor(Math.random() * list.length)];

    return res.json({ wish: randomFallback });
  } catch (err: any) {
    return res.status(500).json({ error: 'AI_GENERATION_FAILED', message: err.message || 'Could not generate wish' });
  }
});
