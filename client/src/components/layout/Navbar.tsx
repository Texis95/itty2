import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Bell, MessageSquare, Home, User, LogOut, Search, Menu } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Get notification count
  const { data: notificationData } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  const notificationCount = notificationData?.count || 0;
  
  // Get unread messages count
  const { data: messageData } = useQuery({
    queryKey: ["/api/messages/unread-count"],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  const messageCount = messageData?.count || 0;
  
  // Close mobile menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);
  
  if (!user) {
    return (
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <span className="text-primary font-bold text-2xl">itty</span>
              </Link>
            </div>
            <div className="flex items-center">
              <Link href="/auth">
                <Button variant="outline" className="mr-2">Login</Button>
              </Link>
              <Link href="/auth">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const userInitials = user.username ? user.username.slice(0, 2).toUpperCase() : "U";
  
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-primary font-bold text-2xl">itty</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              <Link href="/">
                <Button
                  variant={location === "/" ? "default" : "ghost"}
                  className="text-sm font-medium"
                >
                  Home
                </Button>
              </Link>
              <Link href={`/profile/${user.username}`}>
                <Button
                  variant={location.startsWith("/profile") ? "default" : "ghost"}
                  className="text-sm font-medium"
                >
                  Profile
                </Button>
              </Link>
              {user.isAdmin && (
                <Link href="/admin">
                  <Button
                    variant={location === "/admin" ? "default" : "ghost"}
                    className="text-sm font-medium"
                  >
                    Admin
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0 relative hidden md:block">
              <Input
                type="text"
                placeholder="Search Itty"
                className="bg-gray-100 rounded-full py-2 px-4 text-sm text-gray-900 w-64"
              />
              <Search className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>
            
            <div className="hidden md:ml-4 md:flex items-center md:space-x-2">
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                      {notificationCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/messages">
                <Button variant="ghost" size="icon" className="relative">
                  <MessageSquare className="h-5 w-5" />
                  {messageCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                      {messageCount}
                    </span>
                  )}
                </Button>
              </Link>
              <div className="relative ml-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        {user.profileImage ? (
                          <AvatarImage 
                            src={user.profileImage.startsWith('http') ? user.profileImage : `${window.location.origin}${user.profileImage}`} 
                            alt={user.username} 
                          />
                        ) : (
                          <AvatarFallback>{userInitials}</AvatarFallback>
                        )}
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${user.username}`} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      {logoutMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="mr-2 h-4 w-4" />
                      )}
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          
          <div className="flex items-center md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="grid grid-cols-4 px-2">
            <Link href="/" className="inline-block text-center pt-2 pb-1">
              <Button
                variant={location === "/" ? "default" : "ghost"}
                size="icon"
                className="mx-auto"
              >
                <Home className="h-6 w-6" />
              </Button>
              <span className="text-xs block mt-1">Home</span>
            </Link>
            <Link href={`/profile/${user.username}`} className="inline-block text-center pt-2 pb-1">
              <Button
                variant={location.startsWith("/profile") ? "default" : "ghost"}
                size="icon"
                className="mx-auto"
              >
                <User className="h-6 w-6" />
              </Button>
              <span className="text-xs block mt-1">Profile</span>
            </Link>
            <Link href="/notifications" className="inline-block text-center pt-2 pb-1 relative">
              <Button
                variant={location === "/notifications" ? "default" : "ghost"}
                size="icon"
                className="mx-auto"
              >
                <Bell className="h-6 w-6" />
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-1/4 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                    {notificationCount}
                  </span>
                )}
              </Button>
              <span className="text-xs block mt-1">Notifications</span>
            </Link>
            <Link href="/messages" className="inline-block text-center pt-2 pb-1 relative">
              <Button
                variant={location.startsWith("/messages") ? "default" : "ghost"}
                size="icon"
                className="mx-auto"
              >
                <MessageSquare className="h-6 w-6" />
                {messageCount > 0 && (
                  <span className="absolute top-0 right-1/4 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                    {messageCount}
                  </span>
                )}
              </Button>
              <span className="text-xs block mt-1">Messages</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
