import { useState } from "react";
import { Link } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  ThumbsUp, 
  MessageCircle, 
  Share, 
  MoreHorizontal,
  Loader2,
  Smile,
  Image
} from "lucide-react";
import { PostWithUser, CommentWithUser } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import PostComment from "./PostComment";

interface PostCardProps {
  post: PostWithUser;
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Format post date
  const formattedDate = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  
  // Get post comments
  const postComments = post.comments || [];
  
  // Like post mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to like posts");
      
      if (post.isLiked) {
        // Unlike post
        await fetch(`/api/posts/${post.id}/like`, {
          method: "DELETE",
          credentials: "include"
        });
      } else {
        // Like post
        await fetch(`/api/posts/${post.id}/like`, {
          method: "POST",
          credentials: "include"
        });
      }
    },
    onSuccess: () => {
      // Update posts in cache to reflect the like/unlike
      queryClient.setQueryData(["/api/posts"], (oldData: PostWithUser[] | undefined) => {
        if (!oldData) return;
        
        return oldData.map(p => {
          if (p.id === post.id) {
            return {
              ...p,
              likeCount: post.isLiked ? p.likeCount - 1 : p.likeCount + 1,
              isLiked: !p.isLiked
            };
          }
          return p;
        });
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to like post",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("You must be logged in to comment");
      
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content }),
        credentials: "include"
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add comment");
      }
      
      return await response.json();
    },
    onSuccess: (newComment) => {
      // Clear comment input
      setComment("");
      
      // Update post comments in cache
      queryClient.setQueryData(["/api/posts"], (oldData: PostWithUser[] | undefined) => {
        if (!oldData) return;
        
        return oldData.map(p => {
          if (p.id === post.id) {
            const updatedComments = p.comments ? [...p.comments, newComment] : [newComment];
            return {
              ...p,
              commentCount: p.commentCount + 1,
              comments: updatedComments
            };
          }
          return p;
        });
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add comment",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Share post mutation
  const shareMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to share posts");
      
      const response = await fetch(`/api/posts/${post.id}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({}),
        credentials: "include"
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to share post");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Refetch posts
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      
      toast({
        title: "Post shared",
        description: "The post has been shared to your profile",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to share post",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleCommentSubmit = () => {
    if (!comment.trim()) return;
    commentMutation.mutate(comment);
  };
  
  // Get initials for avatar fallback
  const userInitials = post.user.username.slice(0, 2).toUpperCase();
  
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center">
            <Link href={`/profile/${post.user.username}`} className="flex items-center">
              <Avatar className="h-10 w-10 mr-3">
                {post.user.profileImage ? (
                  <AvatarImage 
                    src={post.user.profileImage.startsWith('http') ? post.user.profileImage : `${window.location.origin}${post.user.profileImage}`} 
                    alt={post.user.username} 
                  />
                ) : (
                  <AvatarFallback>{userInitials}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="font-semibold">{post.user.username}</p>
                <p className="text-gray-500 text-xs">{formattedDate}</p>
              </div>
            </Link>
          </div>
          <Button variant="ghost" size="icon" className="text-gray-500">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="mb-3">
          <p>{post.content}</p>
        </div>
        
        {post.images && post.images.length > 0 && (
          <div className={`mb-3 grid ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
            {post.images.map((image, index) => (
              <img 
                key={index} 
                src={image.startsWith('http') ? image : `${window.location.origin}${image}`} 
                alt={`Post image ${index}`} 
                className="w-full rounded-lg"
              />
            ))}
          </div>
        )}
        
        <div className="flex justify-between text-sm text-gray-500 border-b border-gray-200 pb-3 mb-3">
          <div>
            {post.likeCount > 0 && (
              <span className="flex items-center">
                <span className="bg-primary text-white rounded-full p-1 mr-1">
                  <ThumbsUp className="h-3 w-3" />
                </span>
                {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}
              </span>
            )}
          </div>
          <div>
            {post.commentCount > 0 && (
              <span>{post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}</span>
            )}
          </div>
        </div>
        
        <div className="flex justify-between text-sm font-medium mb-3">
          <Button
            variant="ghost"
            className={post.isLiked ? "text-primary" : "text-gray-500"}
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
          >
            {likeMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ThumbsUp className="h-5 w-5 mr-1" />
            )}
            Like
          </Button>
          <Button 
            variant="ghost" 
            className="text-gray-500"
            onClick={() => document.getElementById(`comment-input-${post.id}`)?.focus()}
          >
            <MessageCircle className="h-5 w-5 mr-1" />
            Comment
          </Button>
          <Button 
            variant="ghost" 
            className="text-gray-500"
            onClick={() => shareMutation.mutate()}
            disabled={shareMutation.isPending}
          >
            {shareMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Share className="h-5 w-5 mr-1" />
            )}
            Share
          </Button>
        </div>
        
        {/* Comments section */}
        {postComments.length > 0 && (
          <div className="space-y-2 mb-3">
            {postComments.map((comment) => (
              <PostComment key={comment.id} comment={comment} />
            ))}
          </div>
        )}
        
        {/* Comment input */}
        {user && (
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              {user.profileImage ? (
                <AvatarImage 
                  src={user.profileImage.startsWith('http') ? user.profileImage : `${window.location.origin}${user.profileImage}`} 
                  alt={user.username} 
                />
              ) : (
                <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              )}
            </Avatar>
            <div className="relative flex-grow">
              <Textarea
                id={`comment-input-${post.id}`}
                placeholder="Write a comment..."
                className="w-full px-3 py-2 rounded-full bg-gray-100 focus:bg-white resize-none min-h-0"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCommentSubmit();
                  }
                }}
              />
              <div className="absolute right-3 top-2 flex space-x-1 text-gray-500">
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Image className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {commentMutation.isPending && (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
