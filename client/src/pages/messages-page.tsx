import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import Navbar from "@/components/layout/Navbar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, User, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { User as UserType, MessageWithUser } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function MessagesPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { sendMessage, markMessagesRead } = useWebSocket();
  const [messageText, setMessageText] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(userId ? parseInt(userId) : null);
  
  // Fetch user's message contacts
  const { data: contacts = [] } = useQuery<UserType[]>({
    queryKey: ["/api/messages/contacts"],
    enabled: !!user,
  });
  
  // Get selected contact
  const selectedContact = selectedUserId 
    ? contacts.find(contact => contact.id === selectedUserId) 
    : null;
  
  // Fetch messages with selected user
  const { data: messages = [], isLoading: messagesLoading } = useQuery<MessageWithUser[]>({
    queryKey: [`/api/messages/${selectedUserId}`],
    enabled: !!user && !!selectedUserId,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
  
  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (user && selectedUserId) {
      markMessagesRead(selectedUserId);
    }
  }, [selectedUserId, markMessagesRead, user]);
  
  // Set selected user from URL param
  useEffect(() => {
    if (userId) {
      setSelectedUserId(parseInt(userId));
    }
  }, [userId]);
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (!messageText.trim() || !user || !selectedUserId) return;
    
    sendMessage(selectedUserId, messageText);
    setMessageText("");
  };
  
  // Handle selecting a contact
  const handleSelectContact = (contactId: number) => {
    setSelectedUserId(contactId);
    markMessagesRead(contactId);
  };
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden flex h-[calc(100vh-9rem)]">
            {/* Contacts sidebar */}
            <div className="w-1/3 border-r border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-lg">Messages</h2>
              </div>
              
              <div className="p-3">
                <div className="relative">
                  <Input
                    placeholder="Search conversations"
                    className="pr-8 pl-3"
                  />
                  <Search className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                </div>
              </div>
              
              <div className="overflow-y-auto h-[calc(100%-5rem)]">
                {contacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4 text-center">
                    <User className="h-12 w-12 mb-2 text-gray-400" />
                    <p className="font-medium">No conversations yet</p>
                    <p className="text-sm mt-1">Start a new conversation by visiting a user's profile</p>
                  </div>
                ) : (
                  contacts.map(contact => (
                    <div 
                      key={contact.id}
                      className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                        selectedUserId === contact.id ? 'bg-gray-100' : ''
                      }`}
                      onClick={() => handleSelectContact(contact.id)}
                    >
                      <Avatar className="h-12 w-12 mr-3">
                        {contact.profileImage ? (
                          <AvatarImage src={contact.profileImage} alt={contact.username} />
                        ) : (
                          <AvatarFallback>{contact.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <p className="font-medium">{contact.username}</p>
                          <p className="text-xs text-gray-500">
                            {/* Time of last message would go here */}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {/* Preview of last message would go here */}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Conversation area */}
            <div className="flex-grow flex flex-col">
              {!selectedContact ? (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-500 p-4 text-center">
                  <div className="bg-gray-100 p-6 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-xl">Your Messages</h3>
                  <p className="mt-2">Select a conversation or start a new one</p>
                </div>
              ) : (
                <>
                  {/* Conversation header */}
                  <div className="p-4 border-b border-gray-200 flex items-center">
                    <Link href={`/profile/${selectedContact.username}`}>
                      <Avatar className="h-10 w-10 mr-3 cursor-pointer">
                        {selectedContact.profileImage ? (
                          <AvatarImage src={selectedContact.profileImage} alt={selectedContact.username} />
                        ) : (
                          <AvatarFallback>{selectedContact.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        )}
                      </Avatar>
                    </Link>
                    <div>
                      <Link href={`/profile/${selectedContact.username}`}>
                        <p className="font-semibold cursor-pointer">{selectedContact.username}</p>
                      </Link>
                      <div className="flex items-center text-sm text-green-500">
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
                        Online
                      </div>
                    </div>
                  </div>
                  
                  {/* Messages area */}
                  <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
                    {messagesLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
                        <p className="font-medium">No messages yet</p>
                        <p className="text-sm mt-1">Start the conversation with {selectedContact.username}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map(message => {
                          const isSentByMe = message.senderId === user.id;
                          const formattedTime = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });
                          
                          return (
                            <div key={message.id} className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                              <div className="flex items-end max-w-[70%]">
                                {!isSentByMe && (
                                  <Avatar className="h-8 w-8 mr-2">
                                    {selectedContact.profileImage ? (
                                      <AvatarImage src={selectedContact.profileImage} alt={selectedContact.username} />
                                    ) : (
                                      <AvatarFallback>{selectedContact.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    )}
                                  </Avatar>
                                )}
                                <div 
                                  className={`py-2 px-3 rounded-lg ${
                                    isSentByMe 
                                      ? 'bg-primary text-white rounded-br-none' 
                                      : 'bg-white rounded-bl-none'
                                  }`}
                                >
                                  <p>{message.content}</p>
                                  <p className={`text-right text-xs mt-1 ${
                                    isSentByMe ? 'text-blue-200' : 'text-gray-500'
                                  }`}>
                                    {formattedTime}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Message input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex">
                      <Textarea
                        placeholder={`Write a message to ${selectedContact.username}...`}
                        className="resize-none min-h-12 rounded-r-none flex-grow"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button 
                        className="rounded-l-none" 
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
