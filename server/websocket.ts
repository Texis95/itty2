import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
// import { storage } from './storage';
import { pgStorage as storage } from './database';

interface WebSocketWithUser extends WebSocket {
  userId?: number;
  isAlive?: boolean;
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  // Store active connections by user ID
  const connections = new Map<number, WebSocketWithUser>();
  
  wss.on('connection', (ws: WebSocketWithUser) => {
    ws.isAlive = true;
    
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle authentication
        if (data.type === 'auth') {
          const userId = parseInt(data.userId);
          if (isNaN(userId)) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid user ID' }));
            return;
          }
          
          // Store userId in the websocket object
          ws.userId = userId;
          
          // Store connection
          connections.set(userId, ws);
          
          // Send connection success
          ws.send(JSON.stringify({ type: 'auth', success: true }));
          
          return;
        }
        
        // Require authentication for all other message types
        if (!ws.userId) {
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Authentication required' 
          }));
          return;
        }
        
        // Handle messages
        if (data.type === 'message') {
          const { receiverId, content } = data;
          
          if (!receiverId || !content) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Invalid message data' 
            }));
            return;
          }
          
          // Save message to database
          const message = await storage.createMessage({
            senderId: ws.userId,
            receiverId,
            content
          });
          
          // Get user data
          const sender = await storage.getUser(ws.userId);
          
          if (!sender) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Sender not found' 
            }));
            return;
          }
          
          // Format message for sending
          const messageToSend = {
            id: message.id,
            content: message.content,
            senderId: message.senderId,
            receiverId: message.receiverId,
            createdAt: message.createdAt,
            sender: {
              id: sender.id,
              username: sender.username,
              profileImage: sender.profileImage
            }
          };
          
          // Send message to sender (for confirmation)
          ws.send(JSON.stringify({
            type: 'message',
            message: messageToSend
          }));
          
          // Send message to receiver if they're connected
          const receiverWs = connections.get(receiverId);
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            receiverWs.send(JSON.stringify({
              type: 'message',
              message: messageToSend
            }));
          }
          
          return;
        }
        
        // Handle notification acknowledgment
        if (data.type === 'markNotificationRead') {
          const { notificationId } = data;
          
          if (!notificationId) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Invalid notification data' 
            }));
            return;
          }
          
          await storage.markNotificationAsRead(notificationId);
          
          ws.send(JSON.stringify({
            type: 'notificationMarkedRead',
            notificationId
          }));
          
          return;
        }
        
        // Handle message read
        if (data.type === 'markMessagesRead') {
          const { senderId } = data;
          
          if (!senderId) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Invalid message read data' 
            }));
            return;
          }
          
          await storage.markMessagesAsRead(senderId, ws.userId);
          
          ws.send(JSON.stringify({
            type: 'messagesMarkedRead',
            senderId
          }));
          
          return;
        }
        
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    });
    
    ws.on('close', () => {
      if (ws.userId) {
        connections.delete(ws.userId);
      }
    });
  });
  
  // Send notifications to connected clients
  const sendNotification = async (userId: number, notification: any) => {
    const ws = connections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'notification',
        notification
      }));
    }
  };
  
  // Ping clients every 30 seconds to keep connections alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocketWithUser) => {
      if (ws.isAlive === false) return ws.terminate();
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  return { 
    wss,
    sendNotification 
  };
}
