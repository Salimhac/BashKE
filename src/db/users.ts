import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import { users, wishes, wishLikes, notifications } from './schema.ts';

export async function cleanAllUsersAndData() {
  try {
    await db.delete(wishLikes);
    await db.delete(wishes);
    await db.delete(notifications);
    await db.delete(users);
    return { success: true };
  } catch (error) {
    console.error('Error in cleanAllUsersAndData:', error);
    throw new Error('Database wipe operation failed.', { cause: error });
  }
}

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string,
  avatarSeed?: string,
  profileData?: {
    birthday?: string;
    gender?: string;
    realName?: string;
  }
) {
  try {
    const existing = await getUserByUid(uid);
    if (existing) {
      // If profileData specifies a birthday, update if the existing was empty or old placeholder
      if (profileData?.birthday && (!existing.birthday || existing.birthday === '1996-09-24' || existing.birthday === '1995-09-24')) {
        const updated = await db
          .update(users)
          .set({
            birthday: profileData.birthday,
            ...(profileData.gender ? { gender: profileData.gender } : {}),
            ...(profileData.realName ? { realName: profileData.realName } : {}),
            updatedAt: new Date(),
          })
          .where(eq(users.uid, uid))
          .returning();
        return updated[0] || existing;
      }
      return existing;
    }

    const fallbackName = displayName || email.split('@')[0] || 'Friend';
    const fallbackSeed = avatarSeed || `seed_${uid.slice(0, 8)}`;
    const userBirthday = profileData?.birthday || '1998-05-15';
    const userGender = profileData?.gender || 'prefer-not-to-say';
    const userRealName = profileData?.realName || null;

    const result = await db.insert(users)
      .values({
        uid,
        email,
        displayName: fallbackName,
        avatarSeed: fallbackSeed,
        birthday: userBirthday,
        gender: userGender,
        realName: userRealName,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(displayName ? { displayName } : {}),
          ...(profileData?.birthday ? { birthday: profileData.birthday } : {}),
          ...(profileData?.gender ? { gender: profileData.gender } : {}),
          ...(profileData?.realName ? { realName: profileData.realName } : {}),
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw new Error('Database operation failed. Could not register or find user.', { cause: error });
  }
}

export async function getUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error('Error in getUsers:', error);
    throw new Error('Database operation failed. Could not fetch users.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('Error in getUserByUid:', error);
    throw new Error('Database operation failed. Could not fetch user.', { cause: error });
  }
}

export async function updateUserProfile(
  uid: string,
  data: { displayName?: string; avatarSeed?: string; gender?: string; birthday?: string }
) {
  try {
    const updatePayload: Record<string, any> = { updatedAt: new Date() };
    if (data.displayName !== undefined) updatePayload.displayName = data.displayName;
    if (data.avatarSeed !== undefined) updatePayload.avatarSeed = data.avatarSeed;
    if (data.gender !== undefined) updatePayload.gender = data.gender;
    if (data.birthday !== undefined) updatePayload.birthday = data.birthday;

    const result = await db
      .update(users)
      .set(updatePayload)
      .where(eq(users.uid, uid))
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw new Error('Database operation failed. Could not update user profile.', { cause: error });
  }
}
