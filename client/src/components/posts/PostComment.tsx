import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CommentWithUser } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

interface PostCommentProps {
  comment: CommentWithUser;
}

export default function PostComment({ comment }: PostCommentProps) {
  // Format comment date
  const formattedDate = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
  
  // Get initials for avatar fallback
  const userInitials = comment.user.username.slice(0, 2).toUpperCase();
  
  return (
    <div className="flex items-start">
      <Link href={`/profile/${comment.user.username}`}>
        <Avatar className="h-8 w-8 mr-2">
          {comment.user.profileImage ? (
            <AvatarImage 
              src={comment.user.profileImage.startsWith('http') ? comment.user.profileImage : `${window.location.origin}${comment.user.profileImage}`} 
              alt={comment.user.username} 
            />
          ) : (
            <AvatarFallback>{userInitials}</AvatarFallback>
          )}
        </Avatar>
      </Link>
      <div className="bg-gray-100 rounded-2xl py-2 px-3 flex-grow">
        <div className="flex justify-between items-center">
          <Link href={`/profile/${comment.user.username}`}>
            <p className="font-semibold text-sm">{comment.user.username}</p>
          </Link>
          <p className="text-gray-500 text-xs">{formattedDate}</p>
        </div>
        <p className="text-sm">{comment.content}</p>
      </div>
    </div>
  );
}
