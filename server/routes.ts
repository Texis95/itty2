import type { Express, Request, Response } from "express";
import express from 'express';
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { setupWebSocket } from "./websocket";
// import { storage } from "./storage";
import { pgStorage as storage } from "./database";
import { insertPostSchema, insertCommentSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";

// Helper function for authentication check
function ensureAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Helper function for admin check
function ensureAdmin(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup authentication routes
  setupAuth(app);
  
  // Setup WebSocket server
  const { sendNotification } = setupWebSocket(httpServer);
  
  // Setup file uploads
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    }
  });
  
  const upload = multer({ 
    storage: multerStorage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
    fileFilter: (req, file, cb) => {
      // Accept only images and videos
      if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only images and videos are allowed'));
      }
    }
  });
  
  // Serve static uploads
  app.use('/uploads', express.static(uploadsDir));
  
  // User routes
  app.get('/api/users/:username', async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Post routes
  app.post('/api/posts', ensureAuthenticated, upload.array('images', 5), async (req, res) => {
    try {
      const postData = {
        userId: req.user.id,
        content: req.body.content,
        images: req.files ? (req.files as Express.Multer.File[]).map(file => `/uploads/${file.filename}`) : []
      };
      
      const validatedData = insertPostSchema.parse(postData);
      const post = await storage.createPost(validatedData);
      
      res.status(201).json(post);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/posts', async (req, res) => {
    try {
      const posts = await storage.getAllPosts();
      
      // If user is authenticated, add isLiked property to posts
      if (req.isAuthenticated()) {
        const userId = req.user.id;
        const postsWithLikes = await Promise.all(
          posts.map(async post => {
            const like = await storage.getLikeByUserAndPost(userId, post.id);
            return { ...post, isLiked: !!like };
          })
        );
        return res.json(postsWithLikes);
      }
      
      res.json(posts);
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/posts/:id', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPostById(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // If user is authenticated, add isLiked property
      if (req.isAuthenticated()) {
        const like = await storage.getLikeByUserAndPost(req.user.id, postId);
        return res.json({ ...post, isLiked: !!like });
      }
      
      res.json(post);
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/users/:username/posts', async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const posts = await storage.getPostsByUserId(user.id);
      
      // If user is authenticated, add isLiked property to posts
      if (req.isAuthenticated()) {
        const userId = req.user.id;
        const postsWithLikes = await Promise.all(
          posts.map(async post => {
            const like = await storage.getLikeByUserAndPost(userId, post.id);
            return { ...post, isLiked: !!like };
          })
        );
        return res.json(postsWithLikes);
      }
      
      res.json(posts);
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Like routes
  app.post('/api/posts/:id/like', ensureAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      const like = await storage.createLike(userId, postId);
      res.status(201).json(like);
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.delete('/api/posts/:id/like', ensureAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user.id;
      
      await storage.deleteLike(userId, postId);
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Comment routes
  app.post('/api/posts/:id/comments', ensureAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      const commentData = {
        postId,
        userId: req.user.id,
        content: req.body.content
      };
      
      const validatedData = insertCommentSchema.parse(commentData);
      const comment = await storage.createComment(validatedData);
      
      // Get user data for response
      const user = await storage.getUser(req.user.id);
      
      res.status(201).json({
        ...comment,
        user
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/posts/:id/comments', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      const comments = await storage.getCommentsByPostId(postId);
      res.json(comments);
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Share post
  app.post('/api/posts/:id/share', ensureAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user.id;
      const { content } = req.body;
      
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      const sharedPost = await storage.sharePost(userId, postId, content);
      res.status(201).json(sharedPost);
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Message routes
  app.get('/api/messages/contacts', ensureAuthenticated, async (req, res) => {
    try {
      const contacts = await storage.getMessageContacts(req.user.id);
      res.json(contacts);
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/messages/unread-count', ensureAuthenticated, async (req, res) => {
    try {
      const count = await storage.getUnreadMessagesCount(req.user.id);
      res.json({ count });
    } catch (err) {
      console.error('Error in unread messages count:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/messages/:userId', ensureAuthenticated, async (req, res) => {
    try {
      const otherUserId = parseInt(req.params.userId);
      
      const messages = await storage.getMessagesBetweenUsers(req.user.id, otherUserId);
      res.json(messages);
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Notification routes
  app.get('/api/notifications', ensureAuthenticated, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUserId(req.user.id);
      res.json(notifications);
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/notifications/unread-count', ensureAuthenticated, async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationsCount(req.user.id);
      res.json({ count });
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/notifications/:id/read', ensureAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Admin routes
  app.get('/api/admin/users', ensureAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Seed data endpoint (for development only)
  if (process.env.NODE_ENV === 'development') {
    app.post('/api/seed', async (req, res) => {
      try {
        // Create 10 users
        const users = [];
        for (let i = 1; i <= 10; i++) {
          const user = await storage.createUser({
            username: `user${i}`,
            email: `user${i}@example.com`,
            password: await hashPassword('password123'),
            profileImage: `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${i}.jpg`,
            bio: `This is the bio for user ${i}`
          });
          users.push(user);
        }
        
        // Create 30 posts
        const posts = [];
        for (let i = 1; i <= 30; i++) {
          const randomUser = users[Math.floor(Math.random() * users.length)];
          const post = await storage.createPost({
            userId: randomUser.id,
            content: `This is post ${i} from ${randomUser.username}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
            images: i % 3 === 0 ? [`https://picsum.photos/id/${i+10}/600/400`] : []
          });
          posts.push(post);
          
          // Add some likes
          for (let j = 0; j < 3; j++) {
            const randomLiker = users[Math.floor(Math.random() * users.length)];
            await storage.createLike(randomLiker.id, post.id);
          }
          
          // Add some comments
          for (let j = 0; j < 2; j++) {
            const randomCommenter = users[Math.floor(Math.random() * users.length)];
            await storage.createComment({
              postId: post.id,
              userId: randomCommenter.id,
              content: `Comment ${j+1} on post ${i} from ${randomCommenter.username}`
            });
          }
        }
        
        res.status(200).json({ message: 'Seed data created', users: users.length, posts: posts.length });
      } catch (err) {
        console.error('Seed error:', err);
        res.status(500).json({ message: 'Error creating seed data' });
      }
    });
  }

  return httpServer;
}


