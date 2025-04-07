import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationWithData } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useWebSocket } from "@/hooks/use-websocket";

interface NotificationToastProps {
  notification: NotificationWithData;
  onClose: () => void;
}

export default function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const { markNotificationRead } = useWebSocket();
  const [visible, setVisible] = useState(true);
  
  // Auto dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Allow time for fade out animation
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  // Mark notification as read when dismissed
  const handleClose = () => {
    markNotificationRead(notification.id);
    setVisible(false);
    setTimeout(onClose, 300); // Allow time for fade out animation
  };
  
  // Format time
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
  
  // Get notification message based on type
  let notificationMessage = "";
  let linkPath = "";
  
  switch (notification.type) {
    case "like":
      notificationMessage = "liked your post";
      linkPath = notification.post ? `/posts/${notification.post.id}` : "/";
      break;
    case "comment":
      notificationMessage = "commented on your post";
      linkPath = notification.post ? `/posts/${notification.post.id}` : "/";
      break;
    case "message":
      notificationMessage = "sent you a message";
      linkPath = `/messages/${notification.actor.id}`;
      break;
    default:
      notificationMessage = "interacted with you";
      linkPath = "/";
  }
  
  // Get actor's initials for avatar fallback
  const actorInitials = notification.actor.username.slice(0, 2).toUpperCase();
  
  return (
    <div 
      className={`fixed bottom-5 left-5 z-50 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <Card className="w-80 border-l-4 border-primary shadow-lg">
        <CardContent className="p-4 flex items-start">
          <Link href={`/profile/${notification.actor.username}`}>
            <Avatar className="h-10 w-10 mr-3 cursor-pointer">
              {notification.actor.profileImage ? (
                <AvatarImage src={notification.actor.profileImage} alt={notification.actor.username} />
              ) : (
                <AvatarFallback>{actorInitials}</AvatarFallback>
              )}
            </Avatar>
          </Link>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <Link href={`/profile/${notification.actor.username}`}>
                  <p className="font-semibold cursor-pointer">{notification.actor.username}</p>
                </Link>
                <Link href={linkPath}>
                  <p className="text-gray-500 text-sm cursor-pointer">{notificationMessage}</p>
                </Link>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-gray-500 text-xs mt-1">{timeAgo}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
