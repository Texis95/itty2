import { useState } from "react";
import { Link } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

export default function RightSidebar() {
  const [friendRequests, setFriendRequests] = useState([
    {
      id: 1,
      name: "Lindsey Walton",
      image: "https://randomuser.me/api/portraits/women/17.jpg",
      mutualFriends: 3
    },
    {
      id: 2,
      name: "Tom Cook",
      image: "https://randomuser.me/api/portraits/men/6.jpg",
      mutualFriends: 1
    }
  ]);
  
  const acceptFriendRequest = (id: number) => {
    setFriendRequests(prev => prev.filter(request => request.id !== id));
    // In a real app, we'd call the API to accept the request
  };
  
  const declineFriendRequest = (id: number) => {
    setFriendRequests(prev => prev.filter(request => request.id !== id));
    // In a real app, we'd call the API to decline the request
  };
  
  // In a real app, we would fetch these from the API
  const upcomingEvents = [
    {
      id: 1,
      name: "Tech Meetup 2023",
      location: "San Francisco, CA",
      date: "24 JUN",
      attendees: 5
    },
    {
      id: 2,
      name: "Summer Concert Series",
      location: "Central Park, NY",
      date: "30 JUN",
      attendees: 12
    }
  ];
  
  return (
    <div className="md:w-1/4 hidden lg:block space-y-4">
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Friend Requests</h3>
          
          {friendRequests.length === 0 ? (
            <div className="text-gray-500 text-sm py-2">No pending friend requests</div>
          ) : (
            friendRequests.map((request, idx) => (
              <div 
                key={request.id} 
                className={`${idx < friendRequests.length - 1 ? 'border-b border-gray-200 pb-3 mb-3' : ''}`}
              >
                <div className="flex items-start">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={request.image} alt={request.name} />
                    <AvatarFallback>{request.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{request.name}</p>
                    <p className="text-gray-500 text-xs mb-2">{request.mutualFriends} mutual friends</p>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm"
                        onClick={() => acceptFriendRequest(request.id)}
                      >
                        Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => declineFriendRequest(request.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Upcoming Events</h3>
          
          {upcomingEvents.map((event, idx) => (
            <div 
              key={event.id} 
              className={`mb-3 ${idx < upcomingEvents.length - 1 ? 'pb-3 border-b border-gray-200' : ''}`}
            >
              <div className="flex items-start">
                <div className="bg-gray-100 rounded-lg p-2 mr-3 text-center">
                  <p className="text-primary font-bold">{event.date.split(' ')[0]}</p>
                  <p className="text-gray-500 text-xs">{event.date.split(' ')[1]}</p>
                </div>
                <div>
                  <p className="font-semibold">{event.name}</p>
                  <p className="text-gray-500 text-xs">{event.location}</p>
                  <p className="text-gray-500 text-xs mt-1">{event.attendees} friends going</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
