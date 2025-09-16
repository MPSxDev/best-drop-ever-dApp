"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { MobileLayout } from "@/components/mobile-layout"
import { Header } from "@/components/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PostCard } from "@/components/post-card"
import { TokenBuyDrawer } from "@/components/token-buy-drawer"
import { EmptyState } from "@/components/empty-state"
import { Settings, UserPlus, UserCheck, Music, DollarSign, Users, Calendar, Edit3 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import type { Profile, ArtistToken } from "@/lib/types"

// Profile editing state
interface ProfileEditData {
  display_name: string
  bio: string
  avatar_url: string
}

export default function ProfilePage() {
  const params = useParams()
  const handle = params.handle as string
  const supabase = createClient()

  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [profileUser, setProfileUser] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [token, setToken] = useState<ArtistToken | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<ProfileEditData>({
    display_name: "",
    bio: "",
    avatar_url: ""
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      console.log("[v0] Loading profile data for handle:", handle)
      setIsLoading(true)
      setError(null)

      try {
        // Get current user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: currentProfileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .single()
          setCurrentProfile(currentProfileData)
        }

        // Get profile by handle
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("handle", handle)
          .single()

        if (profileError) {
          console.error("Profile not found:", profileError)
          setError("Profile not found")
          setIsLoading(false)
          return
        }

        setProfileUser(profileData)
        setEditData({
          display_name: profileData.display_name,
          bio: profileData.bio || "",
          avatar_url: profileData.avatar_url || ""
        })

        // Get posts for this profile
        const { data: postsData } = await supabase
          .from("posts")
          .select(`
            *,
            author:profiles!posts_user_id_fkey(*)
          `)
          .eq("user_id", profileData.user_id)
          .order("created_at", { ascending: false })

        setPosts(postsData || [])

        // Get artist token if DJ
        if (profileData.role === "DJ") {
          const { data: tokenData } = await supabase
            .from("artist_tokens")
            .select("*")
            .eq("artist_id", profileData.user_id)
            .single()
          setToken(tokenData)
        }

        // Get follow status and counts
        if (currentProfile && currentProfile.id !== profileData.id) {
          const { data: followData } = await supabase
            .from("follows")
            .select("*")
            .eq("follower_id", currentProfile.user_id)
            .eq("following_id", profileData.user_id)
            .single()
          setIsFollowing(!!followData)
        }

        // Get follower count
        const { count: followersCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", profileData.user_id)
        setFollowersCount(followersCount || 0)

        // Get following count
        const { count: followingCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", profileData.user_id)
        setFollowingCount(followingCount || 0)

      } catch (err) {
        console.error("Error loading profile data:", err)
        setError("Failed to load profile data")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [handle, supabase])

  const handleFollow = async () => {
    if (!currentProfile || !profileUser) return

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentProfile.user_id)
          .eq("following_id", profileUser.user_id)
        
        if (!error) {
          setIsFollowing(false)
          setFollowersCount((prev) => prev - 1)
        }
      } else {
        // Follow
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: currentProfile.user_id,
            following_id: profileUser.user_id
          })
        
        if (!error) {
          setIsFollowing(true)
          setFollowersCount((prev) => prev + 1)
        }
      }
    } catch (err) {
      console.error("Error updating follow status:", err)
    }
  }

  const handleSaveProfile = async () => {
    if (!profileUser) return

    setIsSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: editData.display_name,
          bio: editData.bio,
          avatar_url: editData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq("id", profileUser.id)

      if (error) {
        setError("Failed to update profile")
        return
      }

      // Update local state
      setProfileUser({
        ...profileUser,
        display_name: editData.display_name,
        bio: editData.bio,
        avatar_url: editData.avatar_url
      })

      setIsEditing(false)
    } catch (err) {
      console.error("Error saving profile:", err)
      setError("Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (profileUser) {
      setEditData({
        display_name: profileUser.display_name,
        bio: profileUser.bio || "",
        avatar_url: profileUser.avatar_url || ""
      })
    }
    setIsEditing(false)
    setError(null)
  }

  const isOwnProfile = currentProfile?.id === profileUser?.id

  if (isLoading) {
    return (
      <MobileLayout>
        <Header />
        <main className="py-6 px-4">
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <Skeleton className="h-24 w-24 rounded-full mx-auto" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32 mx-auto" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
              <div className="flex justify-center space-x-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </main>
      </MobileLayout>
    )
  }

  if (error || !profileUser) {
    return (
      <MobileLayout>
        <Header />
        <main className="py-6 px-4">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Profile Not Found</h1>
            <p className="text-muted-foreground">
              The profile you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </main>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <Header />
      <main className="py-6 px-4">
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="text-center space-y-4">
            <Avatar className="h-24 w-24 mx-auto">
              <AvatarImage src={profileUser.avatar_url || "/placeholder.svg"} alt={profileUser.display_name} />
              <AvatarFallback className="text-2xl">{profileUser.display_name[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.display_name}
                    onChange={(e) => setEditData({ ...editData, display_name: e.target.value })}
                    className="text-2xl font-bold text-center bg-transparent border-b border-border focus:outline-none focus:border-primary"
                  />
                ) : (
                  <h1 className="text-2xl font-bold">{profileUser.display_name}</h1>
                )}
                <Badge variant={profileUser.role === "DJ" ? "default" : "secondary"} className="text-xs">
                  {profileUser.role}
                </Badge>
              </div>
              <p className="text-muted-foreground">@{profileUser.handle}</p>
              {isEditing ? (
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  className="text-sm leading-relaxed max-w-sm mx-auto w-full bg-transparent border border-border rounded-lg p-2 focus:outline-none focus:border-primary resize-none"
                  rows={3}
                />
              ) : (
                profileUser.bio && <p className="text-sm leading-relaxed max-w-sm mx-auto">{profileUser.bio}</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex justify-center space-x-6 text-sm">
              <div className="text-center">
                <div className="font-semibold">{posts.length}</div>
                <div className="text-muted-foreground">Posts</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{followersCount}</div>
                <div className="text-muted-foreground">Followers</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{followingCount}</div>
                <div className="text-muted-foreground">Following</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">
                  {formatDistanceToNow(new Date(profileUser.created_at), { addSuffix: false })}
                </div>
                <div className="text-muted-foreground">Joined</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-3">
              {isOwnProfile ? (
                isEditing ? (
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleSaveProfile} 
                      disabled={isSaving}
                      className="rounded-full px-6"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button 
                      onClick={handleCancelEdit}
                      variant="outline" 
                      className="rounded-full px-6"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    variant="outline" 
                    className="rounded-full px-6 bg-transparent"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )
              ) : (
                <>
                  <Button
                    onClick={handleFollow}
                    variant={isFollowing ? "outline" : "default"}
                    className="rounded-full px-6"
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                  {token && currentProfile && (
                    <TokenBuyDrawer
                      token={{ ...token, artist: profileUser }}
                      currentProfile={currentProfile}
                      onPurchaseComplete={() => {}}
                      trigger={
                        <Button className="rounded-full px-6">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Buy {token.symbol}
                        </Button>
                      }
                    />
                  )}
                </>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="text-center">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>

          {/* Token Info for DJs */}
          {profileUser.role === "DJ" && token && (
            <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{token.display_name}</h3>
                      <p className="text-sm text-muted-foreground">Artist Token • {token.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${token.price.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">per token</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Tabs */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl">
              <TabsTrigger value="posts" className="rounded-xl">
                <Music className="h-4 w-4 mr-2" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="about" className="rounded-xl">
                <Users className="h-4 w-4 mr-2" />
                About
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4 mt-6">
              {posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={{
                        ...post,
                        _count: { comments: 0, likes: 0 },
                        isLiked: false
                      }} 
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Music className="h-12 w-12" />}
                  title="No posts yet"
                  description={
                    isOwnProfile
                      ? "Share your first post with your followers!"
                      : `${profileUser.display_name} hasn't posted anything yet.`
                  }
                />
              )}
            </TabsContent>

            <TabsContent value="about" className="space-y-4 mt-6">
              <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">
                      Joined {formatDistanceToNow(new Date(profileUser.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">
                      {profileUser.role === "DJ" ? "Music Artist & Producer" : "Music Fan & Supporter"}
                    </span>
                  </div>

                  {profileUser.role === "DJ" && token && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">
                        Token: {token.symbol} (${token.price.toFixed(2)})
                      </span>
                    </div>
                  )}

                  {profileUser.bio && (
                    <div className="pt-4 border-t border-border/50">
                      <p className="text-sm leading-relaxed">{profileUser.bio}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </MobileLayout>
  )
}
