import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Friends() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState('');

  const { data: friends, isLoading: friendsLoading } = useQuery({
    queryKey: ['/api/friends'],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: friendActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['/api/friends/activity'],
    enabled: isAuthenticated,
    retry: false,
  });

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('POST', '/api/friends/request', { email });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      setSearchEmail('');
      toast({
        title: "Success",
        description: "Friend request sent successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send friend request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendFriendRequest = () => {
    if (!searchEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    if (searchEmail === user?.email) {
      toast({
        title: "Error",
        description: "You cannot add yourself as a friend.",
        variant: "destructive",
      });
      return;
    }

    sendFriendRequestMutation.mutate(searchEmail);
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout showSidebar={true}>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Friends & Social</h1>
          <p className="text-gray-600 dark:text-gray-400">Connect with others on their health journey</p>
        </div>

        <Tabs defaultValue="friends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">My Friends</TabsTrigger>
            <TabsTrigger value="activity">Activity Feed</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
          </TabsList>

          {/* Friends List */}
          <TabsContent value="friends">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-user-friends text-nutricare-green mr-2"></i>
                  My Friends ({friends?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {friendsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nutricare-green"></div>
                  </div>
                ) : friends && friends.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {friends.map((friend: any) => (
                      <div key={friend.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3 mb-3">
                          {friend.profileImageUrl ? (
                            <img
                              src={friend.profileImageUrl}
                              alt="Profile"
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold">
                              {friend.firstName?.[0] || 'F'}
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {friend.firstName} {friend.lastName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{friend.email}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <i className="fas fa-comment mr-1"></i>
                            Message
                          </Button>
                          <Button variant="outline" size="sm">
                            <i className="fas fa-chart-line"></i>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                      <i className="fas fa-user-friends text-gray-400 text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No friends yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      Start connecting with others to share your health journey.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Feed */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-stream text-nutricare-green mr-2"></i>
                  Friend Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nutricare-green"></div>
                  </div>
                ) : friendActivity && friendActivity.length > 0 ? (
                  <div className="space-y-4">
                    {friendActivity.map((activity: any, index: number) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-semibold">
                          {activity.user?.firstName?.[0] || 'U'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-medium">{activity.user?.firstName}</span> {' '}
                            {activity.post ? 'shared a new post' : t('friends.completed_goal')}
                          </p>
                          {activity.post && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              "{activity.post.content.substring(0, 100)}..."
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatTimeAgo(activity.post?.createdAt || new Date().toISOString())}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <i className="far fa-heart text-gray-400 hover:text-red-500"></i>
                          </Button>
                          <Button variant="ghost" size="sm">
                            <i className="far fa-comment text-gray-400 hover:text-blue-500"></i>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                      <i className="fas fa-stream text-gray-400 text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No activity yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Connect with friends to see their health journey updates.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discover Friends */}
          <TabsContent value="discover">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-search text-nutricare-green mr-2"></i>
                  Find Friends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Friend by Email */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Friend by Email</h3>
                  <div className="flex space-x-4">
                    <Input
                      type="email"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      placeholder="Enter friend's email address"
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendFriendRequest}
                      disabled={sendFriendRequestMutation.isPending}
                      className="bg-nutricare-green hover:bg-nutricare-dark"
                    >
                      {sendFriendRequestMutation.isPending ? 'Sending...' : 'Send Request'}
                    </Button>
                  </div>
                </div>

                {/* Suggested Friends */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Suggested for You</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Mock suggested users - in real app this would come from API */}
                    {Array.from({ length: 6 }, (_, i) => (
                      <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`w-12 h-12 bg-gradient-to-r ${
                            i % 3 === 0 ? 'from-pink-400 to-purple-400' :
                            i % 3 === 1 ? 'from-blue-400 to-cyan-400' :
                            'from-green-400 to-teal-400'
                          } rounded-full flex items-center justify-center text-white font-semibold`}>
                            U{i + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">Health Enthusiast {i + 1}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Joined recently</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <i className="fas fa-user-plus mr-1"></i>
                            Add Friend
                          </Button>
                          <Button variant="ghost" size="sm">
                            <i className="fas fa-times text-gray-400"></i>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Community Guidelines */}
                <div className="bg-gradient-to-r from-nutricare-green/10 to-nutricare-light/10 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    <i className="fas fa-heart text-red-500 mr-2"></i>
                    Community Guidelines
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Be respectful and supportive of others' health journeys</li>
                    <li>• Share positive and motivating content</li>
                    <li>• Respect privacy and personal health information</li>
                    <li>• Report any inappropriate behavior</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
