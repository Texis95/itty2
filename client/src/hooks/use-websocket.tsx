import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./use-auth";

interface WebSocketContextType {
  sendMessage: (receiverId: number, content: string) => void;
  markNotificationRead: (notificationId: number) => void;
  markMessagesRead: (senderId: number) => void;
  connected: boolean;
  connecting: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Only connect when user is logged in
    if (!user) {
      if (socket.current) {
        socket.current.close();
        socket.current = null;
        setConnected(false);
      }
      return;
    }

    // Don't reconnect if already connected or connecting
    if (socket.current || connecting) return;

    // Track reconnection attempts to implement exponential backoff
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;

    const connectWebSocket = () => {
      setConnecting(true);
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      try {
        const ws = new WebSocket(wsUrl);
        socket.current = ws;

        ws.onopen = () => {
          // Reset reconnect attempts when successfully connected
          reconnectAttempts = 0;
          
          // Authenticate with the server
          ws.send(JSON.stringify({
            type: 'auth',
            userId: user.id
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'auth' && data.success) {
              setConnected(true);
              setConnecting(false);
              console.log('WebSocket connected and authenticated');
            } else if (data.type === 'message') {
              // Handle received message
              const event = new CustomEvent('ws-message', { detail: data.message });
              window.dispatchEvent(event);
            } else if (data.type === 'notification') {
              // Handle received notification
              const event = new CustomEvent('ws-notification', { detail: data.notification });
              window.dispatchEvent(event);
            } else if (data.type === 'error') {
              console.error('WebSocket error message:', data.message);
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        ws.onclose = () => {
          setConnected(false);
          setConnecting(false);
          socket.current = null;
          
          // Implement exponential backoff for reconnection
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && user) {
            const delay = Math.min(3000 * Math.pow(2, reconnectAttempts), 30000);
            reconnectAttempts++;
            
            setTimeout(() => {
              if (user) connectWebSocket();
            }, delay);
          }
        };

        ws.onerror = () => {
          // Silently handle errors - onclose will be called after this
          setConnecting(false);
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection');
        setConnecting(false);
      }
    };

    connectWebSocket();

    return () => {
      if (socket.current) {
        // Prevent reconnection attempts when component unmounts
        reconnectAttempts = MAX_RECONNECT_ATTEMPTS;
        socket.current.close();
      }
    };
  }, [user, connecting]);

  // Safely send message to WebSocket with error handling
  const safeSend = (data: any) => {
    try {
      if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
        return false;
      }
      
      socket.current.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  };

  const sendMessage = (receiverId: number, content: string) => {
    // Send message through WebSocket if connected
    const sent = safeSend({
      type: 'message',
      receiverId,
      content
    });
    
    if (!sent) {
      // If WebSocket is not connected, handle gracefully
      // Could implement a fallback to REST API or queue messages
    }
  };

  const markNotificationRead = (notificationId: number) => {
    safeSend({
      type: 'markNotificationRead',
      notificationId
    });
    
    // Even if WebSocket fails, the UI should still update
    // This provides better UX while asynchronously updating server
  };

  const markMessagesRead = (senderId: number) => {
    safeSend({
      type: 'markMessagesRead',
      senderId
    });
    
    // Similarly, update UI optimistically even if WebSocket fails
  };

  return (
    <WebSocketContext.Provider value={{
      sendMessage,
      markNotificationRead,
      markMessagesRead,
      connected,
      connecting
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
