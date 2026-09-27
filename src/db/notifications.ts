import { eq, desc } from 'drizzle-orm';
import { db } from './index.ts';
import { notifications } from './schema.ts';

export async function getNotificationsForUser(recipientUid: string) {
  try {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientUid, recipientUid))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

export async function createNotification(data: {
  recipientUid: string;
  type: string;
  title: string;
  message: string;
}) {
  try {
    const result = await db
      .insert(notifications)
      .values({
        recipientUid: data.recipientUid,
        type: data.type,
        title: data.title,
        message: data.message,
        read: false,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

export async function markNotificationsAsRead(recipientUid: string) {
  try {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.recipientUid, recipientUid));
    return true;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return false;
  }
}

export async function markNotificationAsReadById(id: number, recipientUid: string) {
  try {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
    return true;
  } catch (error) {
    console.error('Error marking single notification read:', error);
    return false;
  }
}

export async function deleteNotificationsForUser(recipientUid: string) {
  try {
    await db
      .delete(notifications)
      .where(eq(notifications.recipientUid, recipientUid));
    return true;
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return false;
  }
}

