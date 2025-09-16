"use client"

import { useState, useEffect } from "react"
import { MobileLayout } from "@/components/mobile-layout"
import { Header } from "@/components/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NotificationItem } from "@/components/notification-item"
import { RewardCard } from "@/components/reward-card"
import { EmptyState } from "@/components/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Bell, Trophy, BellOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Profile, Notification, Reward } from "@/lib/types"

export default function ActivityPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [rewards, setRewards] = useState<(Reward & { artist: Profile; isUnlocked: boolean; progress: number })[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (profile) {
      loadActivityData()
    }
  }, [profile])

  const loadProfile = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

        setProfile(profileData)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    }
  }

  const loadActivityData = async () => {
    if (!profile) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      // Load notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (notificationsError) throw notificationsError

      // Load all rewards with user progress
      const { data: rewardsData, error: rewardsError } = await supabase
        .from("rewards")
        .select(`
          *,
          artist:profiles(*)
        `)
        .order("required_amount", { ascending: true })

      if (rewardsError) throw rewardsError

      // Load user's unlocked rewards
      const { data: userRewards, error: userRewardsError } = await supabase
        .from("user_rewards")
        .select("reward_id")
        .eq("user_id", profile.id)

      if (userRewardsError) throw userRewardsError

      // Load user's holdings to calculate progress
      const { data: holdings, error: holdingsError } = await supabase
        .from("holdings")
        .select(`
          *,
          token:artist_tokens(artist_id)
        `)
        .eq("owner_id", profile.id)

      if (holdingsError) throw holdingsError

      // Process rewards with unlock status and progress
      const processedRewards =
        rewardsData?.map((reward) => {
          const isUnlocked = userRewards?.some((ur) => ur.reward_id === reward.id) || false
          const userHolding = holdings?.find((h) => h.token.artist_id === reward.artist_id)
          const progress = userHolding?.amount || 0

          return {
            ...reward,
            isUnlocked,
            progress,
          }
        }) || []

      setNotifications(notificationsData || [])
      setRewards(processedRewards)
    } catch (error) {
      console.error("Error loading activity data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAllAsRead = async () => {
    if (!profile) return

    const supabase = createClient()
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", profile.id).eq("is_read", false)

    loadActivityData()
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const unlockedRewards = rewards.filter((r) => r.isUnlocked)
  const availableRewards = rewards.filter((r) => !r.isUnlocked)

  if (!profile) {
    return (
      <MobileLayout>
        <Header />
        <main className="py-6 px-4">
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Activity</h1>
              <p className="text-muted-foreground text-sm">Your notifications and rewards</p>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead} className="rounded-full bg-transparent">
                <BellOff className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="notifications" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl">
              <TabsTrigger value="notifications" className="rounded-xl">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="rewards" className="rounded-xl">
                <Trophy className="h-4 w-4 mr-2" />
                Rewards
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="space-y-4 mt-6">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-4 rounded-2xl border border-border/50">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} isRead={notification.is_read} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Bell className="h-12 w-12" />}
                  title="No notifications yet"
                  description="Your activity and updates will appear here as you interact with the platform."
                />
              )}
            </TabsContent>

            <TabsContent value="rewards" className="space-y-6 mt-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 rounded-2xl border border-border/50">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-2/3" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-2 w-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Unlocked Rewards */}
                  {unlockedRewards.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold flex items-center space-x-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <span>Unlocked Rewards ({unlockedRewards.length})</span>
                      </h2>
                      <div className="space-y-3">
                        {unlockedRewards.map((reward) => (
                          <RewardCard key={reward.id} reward={reward} isUnlocked={true} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Available Rewards */}
                  {availableRewards.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold">Available Rewards</h2>
                      <div className="space-y-3">
                        {availableRewards.map((reward) => (
                          <RewardCard key={reward.id} reward={reward} progress={reward.progress} />
                        ))}
                      </div>
                    </div>
                  )}

                  {rewards.length === 0 && (
                    <EmptyState
                      icon={<Trophy className="h-12 w-12" />}
                      title="No rewards available"
                      description="Rewards will be available as artists create them. Start following artists to see their exclusive rewards!"
                      action={{
                        label: "Explore Artists",
                        onClick: () => (window.location.href = "/explore"),
                      }}
                    />
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </MobileLayout>
  )
}
