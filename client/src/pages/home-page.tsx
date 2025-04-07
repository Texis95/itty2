import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import CreatePost from "@/components/posts/CreatePost";
import PostCard from "@/components/posts/PostCard";
import MessagingOverlay from "@/components/messages/MessagingOverlay";
import NotificationToast from "@/components/notifications/NotificationToast";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PostWithUser, NotificationWithData } from "@shared/schema";
import { useWebSocket } from "@/hooks/use-websocket";

export default function HomePage() {
  const { user } = useAuth();
  const [activeNotification, setActiveNotification] = useState<NotificationWithData | null>(null);
  
  // Fetch posts
  const { data: posts, isLoading, error } = useQuery<PostWithUser[]>({
    queryKey: ["/api/posts"],
    enabled: !!user,
  });
  
  // Listen for new notifications via WebSocket
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail;
      setActiveNotification(notification);
    };
    
    window.addEventListener('ws-notification', handleNewNotification as EventListener);
    
    return () => {
      window.removeEventListener('ws-notification', handleNewNotification as EventListener);
    };
  }, []);
  
  // Hide notification toast
  const hideNotification = () => {
    setActiveNotification(null);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Sidebar */}
            <LeftSidebar />
            
            {/* Main Content */}
            <div className="md:w-2/4 flex-grow">
              {/* Create Post Component */}
              <CreatePost />
              
              {/* Posts Feed */}
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  Failed to load posts. Please try again later.
                </div>
              ) : !posts || posts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-xl font-semibold">No posts yet</p>
                  <p className="mt-2">Be the first to share something!</p>
                </div>
              ) : (
                posts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
            </div>
            
            {/* Right Sidebar */}
            <RightSidebar />
          </div>
        </div>
      </main>
      
      {/* Messaging Overlay */}
      <MessagingOverlay />
      
      {/* Notification Toast */}
      {activeNotification && (
        <NotificationToast 
          notification={activeNotification} 
          onClose={hideNotification} 
        />
      )}
    </div>
  );
}
