"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { Header } from "@/components/header"
import { PostCard } from "@/components/post-card"
import { ComposerDialog } from "@/components/composer-dialog"
import { CommentList } from "@/components/comment-list"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import type { Profile, PostWithDetails } from "@/lib/types"

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<PostWithDetails[]>([])
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          setError("User not authenticated")
          return
        }

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (profileError) {
          setError("Profile not found")
          return
        }

        setProfile(profileData)

        // Get posts from followed users and current user
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select(`
            *,
            author:profiles!posts_author_id_fkey(*)
          `)
          .order("created_at", { ascending: false })
          .limit(20)

        if (postsError) {
          console.error("Error loading posts:", postsError)
        } else {
          setPosts(postsData || [])
        }

      } catch (err) {
        console.error("Error loading home data:", err)
        setError("Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const handlePostCreated = () => {
    // Reload posts after creating a new one
    const loadPosts = async () => {
      try {
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select(`
            *,
            author:profiles!posts_author_id_fkey(*)
          `)
          .order("created_at", { ascending: false })
          .limit(20)

        if (postsError) {
          console.error("Error loading posts:", postsError)
        } else {
          setPosts(postsData || [])
        }
      } catch (err) {
        console.error("Error reloading posts:", err)
      }
    }
    
    loadPosts()
  }

  const handleComment = (postId: string) => {
    setSelectedPostId(postId)
  }

  const handleLike = async (postId: string) => {
    // TODO: Implement like functionality
    console.log("[v0] Like post:", postId)
  }

  const handleShare = (postId: string) => {
    // TODO: Implement share functionality
    console.log("[v0] Share post:", postId)
  }

  if (isLoading) {
    return (
      <MobileLayout>
        <Header />
        <main className="py-6 px-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          </div>
        </main>
      </MobileLayout>
    )
  }

  if (error || !profile) {
    return (
      <MobileLayout>
        <Header />
        <main className="py-6 px-4">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Error</h1>
            <p className="text-muted-foreground">{error || "Profile not found"}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
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
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Welcome back, {profile.display_name}!</h2>
              <p className="text-muted-foreground text-sm">
                {profile.role === "DJ"
                  ? "Share your latest tracks with your fans"
                  : "Discover new music from your favorite artists"}
              </p>
            </div>
            {profile.role === "DJ" && (
              <ComposerDialog
                profile={profile}
                onPostCreated={handlePostCreated}
                trigger={
                  <Button size="icon" className="rounded-full h-12 w-12">
                    <Plus className="h-5 w-5" />
                  </Button>
                }
              />
            )}
          </div>

          {/* Posts Feed */}
          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={{
                    ...post,
                    author: post.author ? {
                      ...post.author,
                      avatar_url: post.author.avatar_url || undefined
                    } : {
                      id: "unknown",
                      user_id: "unknown",
                      handle: "unknown",
                      display_name: "Unknown User",
                      role: "FAN" as const,
                      bio: null,
                      avatar_url: undefined,
                      member_since: new Date().toISOString(),
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    },
                    _count: { comments: 0, likes: 0 },
                    isLiked: false
                  }}
                  onLike={handleLike}
                  onComment={handleComment}
                  onShare={handleShare}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No posts yet"
              description={
                profile.role === "DJ"
                  ? "Share your first post with your fans!"
                  : "Follow some artists to see their posts here."
              }
              action={
                profile.role === "DJ"
                  ? {
                      label: "Create Post",
                      onClick: () => {
                        /* ComposerDialog will handle this */
                      },
                    }
                  : {
                      label: "Explore Artists",
                      onClick: () => (window.location.href = "/explore"),
                    }
              }
            />
          )}
        </div>
      </main>

      {/* Comments Dialog */}
      <Dialog open={!!selectedPostId} onOpenChange={() => setSelectedPostId(null)}>
        <DialogContent className="top-[10%] max-w-[380px] rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          {selectedPostId && profile && (
            <CommentList
              postId={selectedPostId}
              currentProfile={profile}
              onCommentAdded={() => {
                console.log("[v0] Comment added (mock)")
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </MobileLayout>
  )
}
