import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import session from 'express-session';
import MemoryStore from 'memorystore';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import {
  users,
  posts,
  likes,
  comments,
  messages,
  notifications,
  type User,
  type Post,
  type Like,
  type Comment,
  type Message,
  type Notification,
  type InsertUser,
  type PostWithUser,
  type CommentWithUser,
  type MessageWithUser,
  type NotificationWithData
} from '@shared/schema';
import { IStorage } from './storage';
import { hashPassword } from './auth';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create postgres connection
const queryClient = postgres(process.env.DATABASE_URL);
const db = drizzle(queryClient);

export class PgStorage implements IStorage {
  sessionStore: any; // Use any for sessionStore type

  constructor() {
    // Create memorystore for sessions (in a real app, you'd use a persistent store)
    const MemoryStoreFactory = MemoryStore(session);
    this.sessionStore = new MemoryStoreFactory({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  async init() {
    try {
      // This will create the tables if they don't exist yet
      console.info('Running database migrations...');
      await migrate(db, { migrationsFolder: './migrations' });
      console.info('Database migrations completed successfully');
    } catch (error) {
      console.error('Error during database migrations:', error);
      throw error;
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Post methods
  async createPost(postData: any): Promise<Post> {
    const result = await db.insert(posts).values(postData).returning();
    return result[0];
  }

  async getPostById(postId: number): Promise<PostWithUser | undefined> {
    const result = await db
      .select({
        post: posts,
        user: users
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.id, postId))
      .limit(1);

    if (result.length === 0) return undefined;

    // Get like count
    const likeCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(likes)
      .where(eq(likes.postId, postId));

    // Get comment count
    const commentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(eq(comments.postId, postId));

    return {
      ...result[0].post,
      user: result[0].user,
      likeCount: likeCount[0].count,
      commentCount: commentCount[0].count
    };
  }

  async getPostsByUserId(userId: number): Promise<PostWithUser[]> {
    const result = await db
      .select({
        post: posts,
        user: users
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));

    const postsWithCounts = await Promise.all(
      result.map(async (row) => {
        // Get like count
        const likeCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(likes)
          .where(eq(likes.postId, row.post.id));

        // Get comment count
        const commentCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(comments)
          .where(eq(comments.postId, row.post.id));

        return {
          ...row.post,
          user: row.user,
          likeCount: likeCount[0].count,
          commentCount: commentCount[0].count
        };
      })
    );

    return postsWithCounts;
  }

  async getAllPosts(): Promise<PostWithUser[]> {
    const result = await db
      .select({
        post: posts,
        user: users
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt));

    const postsWithCounts = await Promise.all(
      result.map(async (row) => {
        // Get like count
        const likeCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(likes)
          .where(eq(likes.postId, row.post.id));

        // Get comment count
        const commentCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(comments)
          .where(eq(comments.postId, row.post.id));

        return {
          ...row.post,
          user: row.user,
          likeCount: likeCount[0].count,
          commentCount: commentCount[0].count
        };
      })
    );

    return postsWithCounts;
  }

  async sharePost(userId: number, originalPostId: number, content?: string): Promise<Post> {
    const originalPost = await this.getPostById(originalPostId);
    if (!originalPost) {
      throw new Error('Original post not found');
    }

    const sharePost = {
      userId,
      content: content || '',
      originalPostId,
      images: originalPost.images,
      createdAt: new Date()
    };

    const result = await db.insert(posts).values(sharePost).returning();
    return result[0];
  }

  // Like methods
  async createLike(userId: number, postId: number): Promise<Like> {
    const likeData = {
      userId,
      postId,
      createdAt: new Date()
    };

    const result = await db.insert(likes).values(likeData).returning();
    return result[0];
  }

  async deleteLike(userId: number, postId: number): Promise<void> {
    await db.delete(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.postId, postId)
        )
      );
  }

  async getLikesByPostId(postId: number): Promise<Like[]> {
    return await db
      .select()
      .from(likes)
      .where(eq(likes.postId, postId));
  }

  async getLikeByUserAndPost(userId: number, postId: number): Promise<Like | undefined> {
    const result = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.postId, postId)
        )
      )
      .limit(1);
    
    return result[0];
  }

  // Comment methods
  async createComment(commentData: any): Promise<Comment> {
    const result = await db.insert(comments).values(commentData).returning();
    return result[0];
  }

  async getCommentsByPostId(postId: number): Promise<CommentWithUser[]> {
    const result = await db
      .select({
        comment: comments,
        user: users
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));

    return result.map((row) => ({
      ...row.comment,
      user: row.user
    }));
  }

  // Message methods
  async createMessage(messageData: any): Promise<Message> {
    const result = await db.insert(messages).values(messageData).returning();
    return result[0];
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<MessageWithUser[]> {
    const result = await db
      .select({
        message: messages,
        sender: {
          alias: 'sender',
          ...users
        },
        receiver: {
          alias: 'receiver',
          ...users
        }
      })
      .from(messages)
      .innerJoin(
        users,
        eq(messages.senderId, users.id)
      )
      .innerJoin(
        users,
        eq(messages.receiverId, users.id)
      )
      .where(
        or(
          and(
            eq(messages.senderId, user1Id),
            eq(messages.receiverId, user2Id)
          ),
          and(
            eq(messages.senderId, user2Id),
            eq(messages.receiverId, user1Id)
          )
        )
      )
      .orderBy(messages.createdAt);

    return result.map((row) => ({
      ...row.message,
      sender: row.sender,
      receiver: row.receiver
    }));
  }

  async getMessageContacts(userId: number): Promise<User[]> {
    // Get all users who have sent messages to this user
    const senderIds = await db
      .select({ id: messages.senderId })
      .from(messages)
      .where(eq(messages.receiverId, userId))
      .groupBy(messages.senderId);
      
    // Get all users who have received messages from this user
    const receiverIds = await db
      .select({ id: messages.receiverId })
      .from(messages)
      .where(eq(messages.senderId, userId))
      .groupBy(messages.receiverId);
      
    // Combine the IDs
    const userIds = [
      ...senderIds.map(row => row.id),
      ...receiverIds.map(row => row.id)
    ].filter((value, index, self) => self.indexOf(value) === index && value !== userId);
    
    // If no contacts, return empty array
    if (userIds.length === 0) return [];
    
    // Get user data for all contacts
    const contacts = await db
      .select()
      .from(users)
      .where(sql`${users.id} IN (${userIds.join(',')})`);
      
    return contacts;
  }

  async markMessagesAsRead(senderId: number, receiverId: number): Promise<void> {
    await db.update(messages)
      .set({ read: true })
      .where(
        and(
          eq(messages.senderId, senderId),
          eq(messages.receiverId, receiverId),
          eq(messages.read, false)
        )
      );
  }

  async getUnreadMessagesCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.read, false)
        )
      );
    
    return result[0].count;
  }

  // Notification methods
  async createNotification(notificationData: any): Promise<Notification> {
    const result = await db.insert(notifications).values(notificationData).returning();
    return result[0];
  }

  async getNotificationsByUserId(userId: number): Promise<NotificationWithData[]> {
    const result = await db
      .select({
        notification: notifications,
        actor: users,
        post: posts
      })
      .from(notifications)
      .innerJoin(users, eq(notifications.actorId, users.id))
      .leftJoin(posts, eq(notifications.postId, posts.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    return result.map((row) => ({
      ...row.notification,
      actor: row.actor,
      post: row.post || undefined
    }));
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, notificationId));
  }

  async getUnreadNotificationsCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );
    
    return result[0].count;
  }
}

// Export an instance of the PostgreSQL storage
export const pgStorage = new PgStorage();