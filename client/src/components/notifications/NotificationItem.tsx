import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { NotificationWithData } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { ThumbsUp, MessageCircle, MessageSquare } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";

interface NotificationItemProps {
  notification: NotificationWithData;
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  const { markNotificationRead } = useWebSocket();
  
  // Format notification time
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
  
  // Generate notification icon based on type
  const getNotificationIcon = () => {
    switch (notification.type) {
      case "like":
        return <ThumbsUp className="h-5 w-5 text-primary" />;
      case "comment":
        return <MessageCircle className="h-5 w-5 text-green-500" />;
      case "message":
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };
  
  // Generate notification message based on type
  const getNotificationMessage = () => {
    switch (notification.type) {
      case "like":
        return `liked your post`;
      case "comment":
        return `commented on your post`;
      case "message":
        return `sent you a message`;
      default:
        return `interacted with you`;
    }
  };
  
  // Generate notification link based on type
  const getNotificationLink = () => {
    switch (notification.type) {
      case "like":
      case "comment":
        return notification.post ? `/posts/${notification.post.id}` : "/";
      case "message":
        return `/messages/${notification.actor.id}`;
      default:
        return "/";
    }
  };
  
  // Mark notification as read when clicked
  const handleClick = () => {
    if (!notification.read) {
      markNotificationRead(notification.id);
    }
  };
  
  // Get actor's initials for avatar fallback
  const actorInitials = notification.actor.username.slice(0, 2).toUpperCase();
  
  return (
    <Link href={getNotificationLink()}>
      <div 
        className={`flex items-start p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
          !notification.read ? "bg-blue-50" : ""
        }`}
        onClick={handleClick}
      >
        <div className="mr-4">
          {getNotificationIcon()}
        </div>
        <div className="flex-1">
          <div className="flex items-start">
            <Avatar className="h-10 w-10 mr-3">
              {notification.actor.profileImage ? (
                <AvatarImage src={notification.actor.profileImage} alt={notification.actor.username} />
              ) : (
                <AvatarFallback>{actorInitials}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="text-sm">
                <span className="font-semibold">{notification.actor.username}</span>
                {" "}
                <span>{getNotificationMessage()}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
            </div>
          </div>
        </div>
        {!notification.read && (
          <div className="ml-2 h-2 w-2 rounded-full bg-primary"></div>
        )}
      </div>
    </Link>
  );
}
