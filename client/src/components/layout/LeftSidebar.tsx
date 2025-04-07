import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  User,
  Users, 
  Calendar, 
  Settings, 
  Clock
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { User as UserType } from "@shared/schema";

export default function LeftSidebar() {
  const { user } = useAuth();
  
  // Get online friends (for now, just get a few random users)
  const { data: onlineFriends } = useQuery<UserType[]>({
    queryKey: ["/api/users/online"],
    enabled: !!user,
    // For now, we'll just return the user as we don't have a real online status
    queryFn: async () => {
      try {
        const res = await fetch("/api/users/online");
        // If not OK, just return empty array instead of throwing error
        if (!res.ok) {
          console.info('Online users endpoint not available, using empty array');
          return [];
        }
        return await res.json();
      } catch (error) {
        console.warn('Failed to fetch online users:', error);
        return []; // Return empty array on any error
      }
    },
    // Don't retry on 404 errors
    retry: (failureCount, error: any) => {
      // If it's a 404, don't retry
      if (error?.status === 404) return false;
      // Otherwise, retry up to 3 times
      return failureCount < 3;
    }
  });
  
  if (!user) return null;
  
  const userInitials = user.username.slice(0, 2).toUpperCase();
  
  return (
    <div className="md:w-1/4 hidden md:block space-y-4">
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex items-center mb-4">
          <Avatar className="h-10 w-10 mr-3">
            {user.profileImage ? (
              <AvatarImage src={user.profileImage} alt={user.username} />
            ) : (
              <AvatarFallback>{userInitials}</AvatarFallback>
            )}
          </Avatar>
          <div>
            <p className="font-semibold">{user.username}</p>
            <p className="text-gray-500 text-sm">@{user.username}</p>
          </div>
        </div>
        <ul className="space-y-2">
          <li>
            <Link href={`/profile/${user.username}`} className="flex items-center px-2 py-2 text-gray-900 rounded-md hover:bg-gray-100">
              <User className="h-5 w-5 mr-3 text-gray-500" />
              Profile
            </Link>
          </li>
          <li>
            <Link href="/friends" className="flex items-center px-2 py-2 text-gray-900 rounded-md hover:bg-gray-100">
              <Users className="h-5 w-5 mr-3 text-gray-500" />
              Friends
            </Link>
          </li>
          <li>
            <Link href="/activity" className="flex items-center px-2 py-2 text-gray-900 rounded-md hover:bg-gray-100">
              <Clock className="h-5 w-5 mr-3 text-gray-500" />
              Recent Activity
            </Link>
          </li>
          <li>
            <Link href="/settings" className="flex items-center px-2 py-2 text-gray-900 rounded-md hover:bg-gray-100">
              <Settings className="h-5 w-5 mr-3 text-gray-500" />
              Settings
            </Link>
          </li>
        </ul>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="font-semibold mb-3">Online Friends</h3>
        
        {/* For now, just display a few placeholder items */}
        <div className="flex items-center mb-3">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://randomuser.me/api/portraits/women/1.jpg" alt="User" />
              <AvatarFallback>SW</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-green-500 rounded-full h-2.5 w-2.5 border border-white"></div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Sara Wilson</p>
          </div>
        </div>
        
        <div className="flex items-center mb-3">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://randomuser.me/api/portraits/men/1.jpg" alt="User" />
              <AvatarFallback>MF</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-green-500 rounded-full h-2.5 w-2.5 border border-white"></div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Michael Foster</p>
          </div>
        </div>
        
        <div className="flex items-center mb-3">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://randomuser.me/api/portraits/women/2.jpg" alt="User" />
              <AvatarFallback>LT</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-green-500 rounded-full h-2.5 w-2.5 border border-white"></div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Linda Thompson</p>
          </div>
        </div>
      </div>
    </div>
  );
}
