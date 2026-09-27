import { and, eq, sql } from 'drizzle-orm';
import { db } from './index.ts';
import { wishes, wishLikes } from './schema.ts';

export async function getWishesForRecipient(recipientId: string) {
  try {
    return await db
      .select()
      .from(wishes)
      .where(eq(wishes.recipientId, recipientId))
      .orderBy(sql`${wishes.createdAt} DESC`);
  } catch (error) {
    console.error('Error in getWishesForRecipient:', error);
    throw new Error('Database operation failed. Could not fetch wishes.', { cause: error });
  }
}

export async function createWish(data: {
  recipientId: string;
  senderUid?: string;
  senderHandle: string;
  message: string;
  theme: string;
  reactionEmoji?: string;
}) {
  try {
    const result = await db
      .insert(wishes)
      .values({
        recipientId: data.recipientId,
        senderUid: data.senderUid || null,
        senderHandle: data.senderHandle,
        message: data.message,
        theme: data.theme,
        reactionEmoji: data.reactionEmoji || null,
        likesCount: 0,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error in createWish:', error);
    throw new Error('Database operation failed. Could not create wish.', { cause: error });
  }
}

export async function toggleWishLike(wishId: number, userIdentifier: string) {
  try {
    const existing = await db
      .select()
      .from(wishLikes)
      .where(and(eq(wishLikes.wishId, wishId), eq(wishLikes.userIdentifier, userIdentifier)))
      .limit(1);

    if (existing.length > 0) {
      // Unlike
      await db
        .delete(wishLikes)
        .where(and(eq(wishLikes.wishId, wishId), eq(wishLikes.userIdentifier, userIdentifier)));

      const updated = await db
        .update(wishes)
        .set({
          likesCount: sql`GREATEST(0, ${wishes.likesCount} - 1)`,
        })
        .where(eq(wishes.id, wishId))
        .returning();

      return { liked: false, likesCount: updated[0]?.likesCount ?? 0 };
    } else {
      // Like
      await db.insert(wishLikes).values({
        wishId,
        userIdentifier,
      });

      const updated = await db
        .update(wishes)
        .set({
          likesCount: sql`${wishes.likesCount} + 1`,
        })
        .where(eq(wishes.id, wishId))
        .returning();

      return { liked: true, likesCount: updated[0]?.likesCount ?? 1 };
    }
  } catch (error) {
    console.error('Error in toggleWishLike:', error);
    throw new Error('Database operation failed. Could not toggle like.', { cause: error });
  }
}

export async function getLikedWishIds(userIdentifier: string, wishIds: number[]): Promise<number[]> {
  try {
    if (!wishIds.length) return [];
    const likes = await db
      .select({ wishId: wishLikes.wishId })
      .from(wishLikes)
      .where(eq(wishLikes.userIdentifier, userIdentifier));

    const set = new Set(likes.map((l) => l.wishId));
    return wishIds.filter((id) => set.has(id));
  } catch (error) {
    console.error('Error in getLikedWishIds:', error);
    return [];
  }
}

export async function deleteWish(wishId: number) {
  try {
    await db.delete(wishes).where(eq(wishes.id, wishId));
    return true;
  } catch (error) {
    console.error('Error in deleteWish:', error);
    throw new Error('Database operation failed. Could not delete wish.', { cause: error });
  }
}

export async function getTotalWishesCount(): Promise<number> {
  try {
    const result = await db.select({ count: sql<number>`count(*)` }).from(wishes);
    return Number(result[0]?.count ?? 0);
  } catch (error) {
    console.error('Error in getTotalWishesCount:', error);
    return 0;
  }
}
