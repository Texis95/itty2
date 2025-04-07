import { users, User, InsertUser, posts, Post, likes, Like, comments, Comment, messages, Message, notifications, Notification, insertUserSchema, PostWithUser, CommentWithUser, MessageWithUser, NotificationWithData } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Post
  createPost(post: any): Promise<Post>;
  getPostById(postId: number): Promise<PostWithUser | undefined>;
  getPostsByUserId(userId: number): Promise<PostWithUser[]>;
  getAllPosts(): Promise<PostWithUser[]>;
  sharePost(userId: number, originalPostId: number, content?: string): Promise<Post>;
  
  // Like
  createLike(userId: number, postId: number): Promise<Like>;
  deleteLike(userId: number, postId: number): Promise<void>;
  getLikesByPostId(postId: number): Promise<Like[]>;
  getLikeByUserAndPost(userId: number, postId: number): Promise<Like | undefined>;
  
  // Comment
  createComment(comment: any): Promise<Comment>;
  getCommentsByPostId(postId: number): Promise<CommentWithUser[]>;
  
  // Message
  createMessage(message: any): Promise<Message>;
  getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<MessageWithUser[]>;
  getMessageContacts(userId: number): Promise<User[]>;
  markMessagesAsRead(senderId: number, receiverId: number): Promise<void>;
  getUnreadMessagesCount(userId: number): Promise<number>;
  
  // Notification
  createNotification(notification: any): Promise<Notification>;
  getNotificationsByUserId(userId: number): Promise<NotificationWithData[]>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  getUnreadNotificationsCount(userId: number): Promise<number>;
  
  // Session
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private likes: Map<number, Like>;
  private comments: Map<number, Comment>;
  private messages: Map<number, Message>;
  private notifications: Map<number, Notification>;
  sessionStore: session.SessionStore;
  
  private currentIds = {
    users: 1,
    posts: 1,
    likes: 1,
    comments: 1,
    messages: 1,
    notifications: 1
  };

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.likes = new Map();
    this.comments = new Map();
    this.messages = new Map();
    this.notifications = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Add an admin user
    this.createUser({
      username: "admin",
      email: "admin@itty.com",
      password: "$argon2id$v=19$m=65536,t=3,p=4$V5fALCPR1vdcczgJtQD2pg$PalXRGJJmVrW3EcBLewjLOPsWTOMOCzULWt6U3R60CE", // "admin123"
      profileImage: "https://randomuser.me/api/portraits/men/1.jpg",
      bio: "System administrator"
    }).then(user => {
      // Update to make admin
      const adminUser = { ...user, isAdmin: true };
      this.users.set(user.id, adminUser);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now, 
      isAdmin: false 
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Post methods
  async createPost(postData: any): Promise<Post> {
    const id = this.currentIds.posts++;
    const now = new Date();
    const post: Post = {
      id,
      userId: postData.userId,
      content: postData.content,
      images: postData.images || [],
      createdAt: now,
      originalPostId: postData.originalPostId || null
    };
    this.posts.set(id, post);
    return post;
  }
  
  async getPostById(postId: number): Promise<PostWithUser | undefined> {
    const post = this.posts.get(postId);
    if (!post) return undefined;
    
    const user = await this.getUser(post.userId);
    if (!user) return undefined;
    
    const likes = await this.getLikesByPostId(postId);
    const comments = await this.getCommentsByPostId(postId);
    
    return {
      ...post,
      user,
      likeCount: likes.length,
      commentCount: comments.length,
      comments
    };
  }
  
  async getPostsByUserId(userId: number): Promise<PostWithUser[]> {
    const userPosts = Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return Promise.all(userPosts.map(async post => {
      const user = await this.getUser(post.userId);
      const likes = await this.getLikesByPostId(post.id);
      const comments = await this.getCommentsByPostId(post.id);
      
      return {
        ...post,
        user: user!,
        likeCount: likes.length,
        commentCount: comments.length,
        comments
      };
    }));
  }
  
  async getAllPosts(): Promise<PostWithUser[]> {
    const allPosts = Array.from(this.posts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return Promise.all(allPosts.map(async post => {
      const user = await this.getUser(post.userId);
      const likes = await this.getLikesByPostId(post.id);
      const comments = await this.getCommentsByPostId(post.id);
      
      return {
        ...post,
        user: user!,
        likeCount: likes.length,
        commentCount: comments.length,
        comments
      };
    }));
  }
  
  async sharePost(userId: number, originalPostId: number, content?: string): Promise<Post> {
    const originalPost = await this.getPostById(originalPostId);
    if (!originalPost) throw new Error("Original post not found");
    
    return this.createPost({
      userId,
      content: content || `Shared a post from ${originalPost.user.username}`,
      originalPostId
    });
  }
  
  // Like methods
  async createLike(userId: number, postId: number): Promise<Like> {
    const existingLike = await this.getLikeByUserAndPost(userId, postId);
    if (existingLike) return existingLike;
    
    const id = this.currentIds.likes++;
    const now = new Date();
    const like: Like = {
      id,
      userId,
      postId,
      createdAt: now
    };
    this.likes.set(id, like);
    
    // Create notification for post owner
    const post = await this.getPostById(postId);
    if (post && post.userId !== userId) {
      await this.createNotification({
        userId: post.userId,
        type: 'like',
        actorId: userId,
        postId
      });
    }
    
    return like;
  }
  
  async deleteLike(userId: number, postId: number): Promise<void> {
    const like = await this.getLikeByUserAndPost(userId, postId);
    if (like) {
      this.likes.delete(like.id);
    }
  }
  
  async getLikesByPostId(postId: number): Promise<Like[]> {
    return Array.from(this.likes.values()).filter(like => like.postId === postId);
  }
  
  async getLikeByUserAndPost(userId: number, postId: number): Promise<Like | undefined> {
    return Array.from(this.likes.values()).find(
      like => like.userId === userId && like.postId === postId
    );
  }
  
  // Comment methods
  async createComment(commentData: any): Promise<Comment> {
    const id = this.currentIds.comments++;
    const now = new Date();
    const comment: Comment = {
      id,
      postId: commentData.postId,
      userId: commentData.userId,
      content: commentData.content,
      createdAt: now
    };
    this.comments.set(id, comment);
    
    // Create notification for post owner
    const post = await this.getPostById(commentData.postId);
    if (post && post.userId !== commentData.userId) {
      await this.createNotification({
        userId: post.userId,
        type: 'comment',
        actorId: commentData.userId,
        postId: commentData.postId
      });
    }
    
    return comment;
  }
  
  async getCommentsByPostId(postId: number): Promise<CommentWithUser[]> {
    const postComments = Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    return Promise.all(postComments.map(async comment => {
      const user = await this.getUser(comment.userId);
      return {
        ...comment,
        user: user!
      };
    }));
  }
  
  // Message methods
  async createMessage(messageData: any): Promise<Message> {
    const id = this.currentIds.messages++;
    const now = new Date();
    const message: Message = {
      id,
      senderId: messageData.senderId,
      receiverId: messageData.receiverId,
      content: messageData.content,
      read: false,
      createdAt: now
    };
    this.messages.set(id, message);
    
    // Create notification for message recipient
    await this.createNotification({
      userId: messageData.receiverId,
      type: 'message',
      actorId: messageData.senderId,
      messageId: id
    });
    
    return message;
  }
  
  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<MessageWithUser[]> {
    const userMessages = Array.from(this.messages.values())
      .filter(message => 
        (message.senderId === user1Id && message.receiverId === user2Id) ||
        (message.senderId === user2Id && message.receiverId === user1Id)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    return Promise.all(userMessages.map(async message => {
      const sender = await this.getUser(message.senderId);
      const receiver = await this.getUser(message.receiverId);
      return {
        ...message,
        sender: sender!,
        receiver: receiver!
      };
    }));
  }
  
  async getMessageContacts(userId: number): Promise<User[]> {
    // Get all users that have exchanged messages with this user
    const messages = Array.from(this.messages.values())
      .filter(message => message.senderId === userId || message.receiverId === userId);
    
    const contactIds = new Set<number>();
    messages.forEach(message => {
      if (message.senderId === userId) {
        contactIds.add(message.receiverId);
      } else {
        contactIds.add(message.senderId);
      }
    });
    
    const contacts = await Promise.all(
      Array.from(contactIds).map(id => this.getUser(id))
    );
    
    return contacts.filter(contact => contact !== undefined) as User[];
  }
  
  async markMessagesAsRead(senderId: number, receiverId: number): Promise<void> {
    Array.from(this.messages.values())
      .filter(message => message.senderId === senderId && message.receiverId === receiverId && !message.read)
      .forEach(message => {
        const updatedMessage = { ...message, read: true };
        this.messages.set(message.id, updatedMessage);
      });
  }
  
  async getUnreadMessagesCount(userId: number): Promise<number> {
    return Array.from(this.messages.values())
      .filter(message => message.receiverId === userId && !message.read)
      .length;
  }
  
  // Notification methods
  async createNotification(notificationData: any): Promise<Notification> {
    const id = this.currentIds.notifications++;
    const now = new Date();
    const notification: Notification = {
      id,
      userId: notificationData.userId,
      type: notificationData.type,
      actorId: notificationData.actorId,
      postId: notificationData.postId || null,
      messageId: notificationData.messageId || null,
      read: false,
      createdAt: now
    };
    this.notifications.set(id, notification);
    return notification;
  }
  
  async getNotificationsByUserId(userId: number): Promise<NotificationWithData[]> {
    const userNotifications = Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return Promise.all(userNotifications.map(async notification => {
      const actor = await this.getUser(notification.actorId);
      let post = undefined;
      if (notification.postId) {
        post = await this.getPostById(notification.postId);
      }
      
      return {
        ...notification,
        actor: actor!,
        post
      };
    }));
  }
  
  async markNotificationAsRead(notificationId: number): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      const updatedNotification = { ...notification, read: true };
      this.notifications.set(notificationId, updatedNotification);
    }
  }
  
  async getUnreadNotificationsCount(userId: number): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.read)
      .length;
  }
}

export const storage = new MemStorage();
