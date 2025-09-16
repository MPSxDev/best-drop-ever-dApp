"use client"

import { useState, useEffect } from "react"
import { MobileLayout } from "@/components/mobile-layout"
import { Header } from "@/components/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { TokenBuyDrawer } from "@/components/token-buy-drawer"
import { Music, Users, DollarSign, TrendingUp, Coins } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { Profile, ArtistToken } from "@/lib/types"

export default function ExplorePage() {
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [artists, setArtists] = useState<(Profile & { token?: ArtistToken; followersCount: number })[]>([])
  const [tokens, setTokens] = useState<(ArtistToken & { artist: Profile })[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCurrentProfile()
    loadExploreData()
  }, [])

  const loadCurrentProfile = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

        setCurrentProfile(profileData)
      }
    } catch (error) {
      console.error("Error loading current profile:", error)
    }
  }

  const loadExploreData = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // Load artists (DJs)
      const { data: artistsData, error: artistsError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "DJ")
        .order("created_at", { ascending: false })

      if (artistsError) throw artistsError

      // Load tokens for artists
      const { data: tokensData, error: tokensError } = await supabase
        .from("artist_tokens")
        .select(`
          *,
          artist:profiles(*)
        `)
        .order("price", { ascending: false })

      if (tokensError) throw tokensError

      // Load followers count for each artist
      const artistsWithData = await Promise.all(
        (artistsData || []).map(async (artist: any) => {
          const { count: followersCount } = await supabase
            .from("follows")
            .select("*", { count: "exact" })
            .eq("following_id", artist.id)

          const token = tokensData?.find((t: any) => t.artist_id === artist.id)

          return {
            ...artist,
            token,
            followersCount: followersCount || 0,
          }
        }),
      )

      setArtists(artistsWithData)
      setTokens(tokensData || [])
    } catch (error) {
      console.error("Error loading explore data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!currentProfile) {
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
          <div>
            <h1 className="text-2xl font-bold mb-2">Explore</h1>
            <p className="text-muted-foreground text-sm">Discover new artists and their tokens</p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="artists" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl">
              <TabsTrigger value="artists" className="rounded-xl">
                <Music className="h-4 w-4 mr-2" />
                Artists
              </TabsTrigger>
              <TabsTrigger value="tokens" className="rounded-xl">
                <DollarSign className="h-4 w-4 mr-2" />
                Tokens
              </TabsTrigger>
            </TabsList>

            <TabsContent value="artists" className="space-y-4 mt-6">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-4 rounded-2xl border border-border/50">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : artists.length > 0 ? (
                <div className="space-y-3">
                  {artists.map((artist) => (
                    <Card key={artist.id} className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <Link href={`/profile/${artist.handle}`} className="flex items-center space-x-3 flex-1">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={artist.avatar_url || "/placeholder.svg"} alt={artist.display_name} />
                              <AvatarFallback>{artist.display_name[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-sm truncate">{artist.display_name}</h3>
                                <Badge variant="default" className="text-xs">
                                  DJ
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">@{artist.handle}</p>
                              <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <Users className="h-3 w-3" />
                                  <span>{artist.followersCount} followers</span>
                                </div>
                                {artist.token && (
                                  <div className="flex items-center space-x-1">
                                    <DollarSign className="h-3 w-3" />
                                    <span>${artist.token.price.toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                          {artist.token && (
                            <TokenBuyDrawer
                              token={{ ...artist.token, artist }}
                              currentProfile={currentProfile}
                              onPurchaseComplete={loadExploreData}
                              trigger={
                                <Button variant="outline" size="sm" className="rounded-full text-xs bg-transparent">
                                  Buy {artist.token.symbol}
                                </Button>
                              }
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Music className="h-12 w-12" />}
                  title="No artists yet"
                  description="Artists will appear here as they join the platform."
                />
              )}
            </TabsContent>

            <TabsContent value="tokens" className="space-y-4 mt-6">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-4 rounded-2xl border border-border/50">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : tokens.length > 0 ? (
                <div className="space-y-3">
                  {tokens.map((token) => (
                    <Card key={token.id} className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <Link href={`/profile/${token.artist.handle}`} className="flex items-center space-x-3 flex-1">
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={token.artist.avatar_url || "/placeholder.svg"}
                                alt={token.artist.display_name}
                              />
                              <AvatarFallback>{token.artist.display_name[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-sm">{token.display_name}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {token.symbol}
                                </Badge>
                                <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                                  <Coins className="h-3 w-3 mr-1" />
                                  Stellar
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">by {token.artist.display_name}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <TrendingUp className="h-3 w-3 text-green-500" />
                                <span className="text-sm font-medium">${token.price.toFixed(2)}</span>
                              </div>
                            </div>
                          </Link>
                          <TokenBuyDrawer
                            token={token}
                            currentProfile={currentProfile}
                            onPurchaseComplete={loadExploreData}
                            trigger={<Button className="rounded-full px-4 text-xs">Buy {token.symbol}</Button>}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<DollarSign className="h-12 w-12" />}
                  title="No tokens available"
                  description="Artist tokens will appear here as they become available for trading."
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </MobileLayout>
  )
}
