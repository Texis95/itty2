import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { 
  X, 
  Info, 
  Send, 
  Smile, 
  Image,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, MessageWithUser } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ChatWindowProps {
  contact: User;
  onClose: () => void;
}

export default function ChatWindow({ contact, onClose }: ChatWindowProps) {
  const { user } = useAuth();
  const { sendMessage, markMessagesRead } = useWebSocket();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch messages between users
  const { data: messages = [], isLoading } = useQuery<MessageWithUser[]>({
    queryKey: [`/api/messages/${contact.id}`],
    enabled: !!user,
    refetchInterval: 15000, // Refetch every 15 seconds
  });
  
  // Mark messages as read when chat window is opened
  useEffect(() => {
    if (user) {
      markMessagesRead(contact.id);
    }
  }, [contact.id, markMessagesRead, user]);
  
  // Listen for new messages via WebSocket
  useEffect(() => {
    const handleNewMessage = (event: CustomEvent) => {
      const message = event.detail;
      
      // Only process messages from this conversation
      if ((message.senderId === contact.id && message.receiverId === user?.id) ||
          (message.senderId === user?.id && message.receiverId === contact.id)) {
        
        // Update the messages in the cache
        queryClient.setQueryData([`/api/messages/${contact.id}`], (oldData: MessageWithUser[] | undefined) => {
          if (!oldData) return [message];
          return [...oldData, message];
        });
        
        // Mark message as read if it's from the contact
        if (message.senderId === contact.id) {
          markMessagesRead(contact.id);
        }
      }
    };
    
    window.addEventListener('ws-message', handleNewMessage as EventListener);
    
    return () => {
      window.removeEventListener('ws-message', handleNewMessage as EventListener);
    };
  }, [contact.id, markMessagesRead, queryClient, user?.id]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = () => {
    if (!messageText.trim() || !user) return;
    
    sendMessage(contact.id, messageText);
    setMessageText("");
  };
  
  // Get initials for avatar fallback
  const contactInitials = contact.username.slice(0, 2).toUpperCase();
  
  return (
    <div className="bg-white rounded-t-lg shadow-lg w-80 border border-gray-300">
      {/* Chat header */}
      <div className="flex items-center justify-between bg-primary text-white p-2 rounded-t-lg">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            {contact.profileImage ? (
              <AvatarImage src={contact.profileImage} alt={contact.username} />
            ) : (
              <AvatarFallback>{contactInitials}</AvatarFallback>
            )}
          </Avatar>
          <span className="font-medium">{contact.username}</span>
          <span className="bg-green-500 rounded-full h-2 w-2 ml-2"></span>
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-primary-foreground/20">
            <Info className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-white hover:bg-primary-foreground/20"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="h-80 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation with {contact.username}</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-3">
            {messages.map(message => {
              const isSentByMe = message.senderId === user?.id;
              const formattedTime = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });
              
              return (
                <div key={message.id} className={`flex items-end ${isSentByMe ? 'justify-end' : ''}`}>
                  {!isSentByMe && (
                    <Avatar className="h-6 w-6 mr-2">
                      {contact.profileImage ? (
                        <AvatarImage src={contact.profileImage} alt={contact.username} />
                      ) : (
                        <AvatarFallback>{contactInitials}</AvatarFallback>
                      )}
                    </Avatar>
                  )}
                  <div 
                    className={`py-2 px-3 rounded-lg max-w-xs ${
                      isSentByMe 
                        ? 'bg-primary text-white rounded-br-none' 
                        : 'bg-gray-100 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-right text-xs mt-1 ${
                      isSentByMe ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {formattedTime}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message input */}
      <div className="p-3 border-t">
        <div className="relative">
          <input
            type="text"
            placeholder="Type a message..."
            className="w-full rounded-full pl-3 pr-10 py-2 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <div className="absolute right-3 top-2 flex space-x-1">
            <Button variant="ghost" size="icon" className="h-5 w-5 text-gray-500 hover:text-primary">
              <Smile className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-gray-500 hover:text-primary">
              <Image className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 text-primary"
              onClick={handleSendMessage}
              disabled={!messageText.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
