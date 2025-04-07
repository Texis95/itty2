import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { 
  ChevronDown, 
  ChevronUp, 
  MoreVertical 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatWindow from "./ChatWindow";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

export default function MessagingOverlay() {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeChats, setActiveChats] = useState<number[]>([]);
  
  // Fetch user's message contacts
  const { data: contacts = [] } = useQuery<User[]>({
    queryKey: ["/api/messages/contacts"],
    enabled: !!user,
  });
  
  // Get unread messages count
  const { data: unreadData } = useQuery({
    queryKey: ["/api/messages/unread-count"],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  const unreadCount = unreadData?.count || 0;
  
  // Toggle chat window
  const toggleChat = (userId: number) => {
    if (activeChats.includes(userId)) {
      setActiveChats(activeChats.filter(id => id !== userId));
    } else {
      if (activeChats.length < 3) { // Limit to 3 active chats
        setActiveChats([...activeChats, userId]);
      } else {
        // Replace the first chat with the new one
        setActiveChats([...activeChats.slice(1), userId]);
      }
    }
  };
  
  if (!user) return null;
  
  return (
    <div className="fixed bottom-0 right-6 z-40">
      {/* Messaging header (collapsed view) */}
      <div 
        className="flex items-center justify-between bg-primary text-white p-2 rounded-t-lg w-72 cursor-pointer shadow-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <span className="font-medium">Messages</span>
          {unreadCount > 0 && (
            <span className="bg-white text-primary rounded-full px-1.5 text-xs font-bold ml-2">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-primary-foreground/20">
            <MoreVertical className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-primary-foreground/20">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Contact list (expanded view) */}
      {isExpanded && (
        <div className="bg-white border-x border-b border-gray-300 rounded-b-lg shadow-lg">
          <div className="max-h-80 overflow-y-auto">
            {contacts.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">
                No recent conversations
              </div>
            ) : (
              contacts.map(contact => (
                <div 
                  key={contact.id}
                  className="flex items-center p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-0"
                  onClick={() => toggleChat(contact.id)}
                >
                  <div className="relative">
                    <img 
                      src={contact.profileImage || "https://randomuser.me/api/portraits/men/1.jpg"} 
                      alt={contact.username} 
                      className="h-10 w-10 rounded-full"
                    />
                    <div className="absolute bottom-0 right-0 bg-green-500 rounded-full h-2.5 w-2.5 border border-white"></div>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-sm">{contact.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Active chat windows */}
      <div className="flex space-x-2 absolute bottom-0 right-full mr-2">
        {activeChats.map(contactId => {
          const contact = contacts.find(c => c.id === contactId);
          if (!contact) return null;
          
          return (
            <ChatWindow 
              key={contactId} 
              contact={contact}
              onClose={() => toggleChat(contactId)}
            />
          );
        })}
      </div>
    </div>
  );
}
