import { useState, useRef, ChangeEvent } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Video, Image, Smile } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function CreatePost() {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createPostMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create post");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Clear the form
      setContent("");
      setSelectedImages([]);
      setImagePreviewUrls([]);
      
      // Invalidate queries to refetch posts
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      
      toast({
        title: "Post created",
        description: "Your post has been published successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  if (!user) {
    return null;
  }
  
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Limit to 5 images
      const newImages = filesArray.slice(0, 5 - selectedImages.length);
      
      setSelectedImages([...selectedImages, ...newImages]);
      
      // Generate preview URLs
      const newPreviewUrls = newImages.map(file => URL.createObjectURL(file));
      setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);
    }
  };
  
  const removeImage = (index: number) => {
    const newImages = [...selectedImages];
    newImages.splice(index, 1);
    setSelectedImages(newImages);
    
    // Revoke the URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviewUrls[index]);
    const newPreviewUrls = [...imagePreviewUrls];
    newPreviewUrls.splice(index, 1);
    setImagePreviewUrls(newPreviewUrls);
  };
  
  const handleSubmit = () => {
    if (!content.trim() && selectedImages.length === 0) {
      toast({
        title: "Empty post",
        description: "Please add some text or images to your post",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append("content", content);
    
    selectedImages.forEach(image => {
      formData.append("images", image);
    });
    
    createPostMutation.mutate(formData);
  };
  
  const userInitials = user.username.slice(0, 2).toUpperCase();
  
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex space-x-4">
          <Avatar className="h-10 w-10">
            {user.profileImage ? (
              <AvatarImage src={user.profileImage} alt={user.username} />
            ) : (
              <AvatarFallback>{userInitials}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex-grow">
            <Textarea
              placeholder={`What's on your mind, ${user.username}?`}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 focus:bg-white resize-none"
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
            />
            
            {imagePreviewUrls.length > 0 && (
              <div className={`grid ${imagePreviewUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mt-2`}>
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={url} 
                      alt={`Upload preview ${index}`} 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeImage(index)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-gray-200 mt-3 pt-3">
          <div className="flex justify-between">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              multiple
              accept="image/*"
              className="hidden"
            />
            <Button 
              variant="ghost" 
              onClick={() => fileInputRef.current?.click()}
              disabled={createPostMutation.isPending}
            >
              <Video className="h-5 w-5 mr-2 text-red-500" />
              Live Video
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => fileInputRef.current?.click()}
              disabled={createPostMutation.isPending || selectedImages.length >= 5}
            >
              <Image className="h-5 w-5 mr-2 text-green-500" />
              Photo/Video
            </Button>
            <Button 
              variant="ghost"
              disabled={createPostMutation.isPending}
            >
              <Smile className="h-5 w-5 mr-2 text-yellow-500" />
              Feeling
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createPostMutation.isPending || (!content.trim() && selectedImages.length === 0)}
            >
              {createPostMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Post
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
