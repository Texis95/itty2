import { useState } from "react";
import { useParams, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/layout/Navbar";
import PostCard from "@/components/posts/PostCard";
import MessagingOverlay from "@/components/messages/MessagingOverlay";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Calendar, Edit, MessageSquare, Image } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PostWithUser, User } from "@shared/schema";
import { format } from "date-fns";

// Define profile update schema
const profileUpdateSchema = z.object({
  bio: z.string().max(160, "Bio must be 160 characters or less").optional(),
  profileImage: z.any().optional(), // Accetta qualsiasi valore per supportare l'upload di file
});

type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user, updateProfileMutation } = useAuth();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  
  // Fetch user profile
  const { data: profileUser, isLoading: profileLoading } = useQuery<User>({
    queryKey: [`/api/users/${username}`],
    enabled: !!username,
  });
  
  // Fetch user posts
  const { data: userPosts, isLoading: postsLoading } = useQuery<PostWithUser[]>({
    queryKey: [`/api/users/${username}/posts`],
    enabled: !!username,
  });
  
  // Initialize profile edit form
  const profileForm = useForm<ProfileUpdateValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      bio: user?.bio || "",
      profileImage: user?.profileImage || "",
    },
  });
  
  // Update form values when user data changes
  useState(() => {
    if (user) {
      profileForm.reset({
        bio: user.bio || "",
        profileImage: user.profileImage || "",
      });
    }
  });
  
  // Handle profile update
  const onProfileUpdate = (values: ProfileUpdateValues) => {
    const formData = new FormData();
    
    // Aggiungi la bio al form data se esiste
    if (values.bio) {
      formData.append('bio', values.bio);
    }
    
    // Aggiungi l'immagine al form data se è un File
    if (values.profileImage instanceof File) {
      formData.append('profileImage', values.profileImage);
    }
    
    updateProfileMutation.mutate(formData as any, {
      onSuccess: () => {
        setIsEditProfileOpen(false);
      },
    });
  };
  
  // Check if profile belongs to logged in user
  const isOwnProfile = user && profileUser && user.id === profileUser.id;
  
  // Get user initials for avatar fallback
  const userInitials = profileUser ? profileUser.username.slice(0, 2).toUpperCase() : "??";
  
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">User not found</h1>
            <p className="mt-2 text-gray-600">The user you're looking for doesn't exist or has been removed.</p>
            <Link href="/">
              <Button className="mt-4">Return to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Format joined date
  const joinedDate = format(new Date(profileUser.createdAt), "MMMM yyyy");
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Profile Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="h-24 w-24 md:h-32 md:w-32">
                  {profileUser.profileImage ? (
                    <AvatarImage 
                      src={`${window.location.origin}${profileUser.profileImage}`} 
                      alt={profileUser.username} 
                    />
                  ) : (
                    <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-grow text-center md:text-left">
                  <h1 className="text-2xl font-bold">{profileUser.username}</h1>
                  
                  {profileUser.bio && (
                    <p className="text-gray-600 mt-2 max-w-md">{profileUser.bio}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 mt-3 justify-center md:justify-start">
                    <div className="flex items-center text-gray-500 text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      Joined {joinedDate}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-3 justify-center md:justify-start">
                    {isOwnProfile ? (
                      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit Profile
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Profile</DialogTitle>
                          </DialogHeader>
                          
                          <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileUpdate)} className="space-y-4">
                              <FormField
                                control={profileForm.control}
                                name="profileImage"
                                render={({ field: { value, onChange, ...fieldProps } }) => (
                                  <FormItem>
                                    <FormLabel>Profile Image</FormLabel>
                                    <FormControl>
                                      <div className="space-y-2">
                                        <Input 
                                          type="file" 
                                          accept="image/*"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              onChange(file);
                                            }
                                          }}
                                          {...fieldProps}
                                        />
                                        {typeof value === 'string' && value && (
                                          <div className="mt-2">
                                            <p className="text-sm text-gray-500 mb-1">Current image:</p>
                                            <img 
                                              src={`${window.location.origin}${value}`} 
                                              alt="Current profile" 
                                              className="w-16 h-16 object-cover rounded-md"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={profileForm.control}
                                name="bio"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Bio</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Tell us about yourself"
                                        className="resize-none"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="flex justify-end gap-2">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  onClick={() => setIsEditProfileOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  type="submit" 
                                  disabled={updateProfileMutation.isPending}
                                >
                                  {updateProfileMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    "Save Changes"
                                  )}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Link href={`/messages/${profileUser.id}`}>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Profile Content */}
          <Tabs defaultValue="posts">
            <TabsList className="mb-6">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts">
              {postsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !userPosts || userPosts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-4">
                    <Image className="h-12 w-12 mx-auto text-gray-400" />
                  </div>
                  <p className="text-xl font-semibold">No posts yet</p>
                  <p className="mt-2">
                    {isOwnProfile ? "You haven't posted anything yet." : `${profileUser.username} hasn't posted anything yet.`}
                  </p>
                </div>
              ) : (
                userPosts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="photos">
              <Card>
                <CardHeader>
                  <CardTitle>Photos</CardTitle>
                </CardHeader>
                <CardContent>
                  {postsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !userPosts || userPosts.filter(post => post.images && post.images.length > 0).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="mb-4">
                        <Image className="h-12 w-12 mx-auto text-gray-400" />
                      </div>
                      <p className="mt-2">No photos to show</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {userPosts
                        .filter(post => post.images && post.images.length > 0)
                        .flatMap(post => 
                          post.images!.map((image, idx) => (
                            <img 
                              key={`${post.id}-${idx}`} 
                              src={image.startsWith('http') ? image : `${window.location.origin}${image}`} 
                              alt={`Posted by ${post.user.username}`}
                              className="rounded-lg w-full h-40 object-cover"
                            />
                          ))
                        )
                      }
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Username</h3>
                      <p>{profileUser.username}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Bio</h3>
                      <p>{profileUser.bio || "No bio provided"}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Joined</h3>
                      <p>{joinedDate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Messaging Overlay */}
      <MessagingOverlay />
    </div>
  );
}
