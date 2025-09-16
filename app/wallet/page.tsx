"use client"

import { useState, useEffect } from "react"
import { MobileLayout } from "@/components/mobile-layout"
import { Header } from "@/components/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { TokenBuyDrawer } from "@/components/token-buy-drawer"
import { TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import type { Profile, Holding, Transaction, ArtistToken } from "@/lib/types"

export default function WalletPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [holdings, setHoldings] = useState<(Holding & { token: ArtistToken & { artist: Profile } })[]>([])
  const [transactions, setTransactions] = useState<(Transaction & { token: ArtistToken & { artist: Profile } })[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadWalletData = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

      if (!profileData) return

      setProfile(profileData)

      // Load wallet data
      const [holdingsResult, transactionsResult] = await Promise.all([
        supabase
          .from("holdings")
          .select(`
            *,
            token:artist_tokens(
              *,
              artist:profiles(*)
            )
          `)
          .eq("owner_id", profileData.id)
          .gt("amount", 0),
        supabase
          .from("transactions")
          .select(`
            *,
            token:artist_tokens(
              *,
              artist:profiles(*)
            )
          `)
          .eq("buyer_id", profileData.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ])

      setHoldings(holdingsResult.data || [])
      setTransactions(transactionsResult.data || [])
    } catch (error) {
      console.error("Error loading wallet data:", error)
    }
  }

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user || !isMounted) return

        const { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

        if (!profileData || !isMounted) return

        setProfile(profileData)

        // Load wallet data
        const [holdingsResult, transactionsResult] = await Promise.all([
          supabase
            .from("holdings")
            .select(`
              *,
              token:artist_tokens(
                *,
                artist:profiles(*)
              )
            `)
            .eq("owner_id", profileData.id)
            .gt("amount", 0),
          supabase
            .from("transactions")
            .select(`
              *,
              token:artist_tokens(
                *,
                artist:profiles(*)
              )
            `)
            .eq("buyer_id", profileData.id)
            .order("created_at", { ascending: false })
            .limit(20),
        ])

        if (isMounted) {
          setHoldings(holdingsResult.data || [])
          setTransactions(transactionsResult.data || [])
        }
      } catch (error) {
        console.error("Error loading wallet data:", error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, []) // Empty dependency array to run only once

  const totalPortfolioValue = holdings.reduce((total, holding) => {
    return total + holding.amount * holding.token.price
  }, 0)

  if (isLoading) {
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

  if (!profile) {
    return (
      <MobileLayout>
        <Header />
        <main className="py-6 px-4">
          <div className="text-center space-y-4">
            <p>Unable to load profile. Please try refreshing the page.</p>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
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
          {/* Portfolio Overview */}
          <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="h-5 w-5" />
                <span>Portfolio</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold">${totalPortfolioValue.toFixed(2)}</div>
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span>Total Value</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="tokens" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl">
              <TabsTrigger value="tokens" className="rounded-xl">
                Artist Tokens
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl">
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tokens" className="space-y-4 mt-6">
              {holdings.length > 0 ? (
                <div className="space-y-3">
                  {holdings.map((holding) => (
                    <Card key={holding.id} className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={holding.token.artist.avatar_url || "/placeholder.svg"}
                                alt={holding.token.artist.display_name}
                              />
                              <AvatarFallback>{holding.token.artist.display_name[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold">{holding.token.display_name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  DJ
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <span>{holding.amount.toFixed(1)} tokens</span>
                                <span>•</span>
                                <span>${holding.token.price.toFixed(2)} each</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${(holding.amount * holding.token.price).toFixed(2)}</div>
                            <TokenBuyDrawer
                              token={holding.token}
                              currentProfile={profile}
                              onPurchaseComplete={loadWalletData}
                              trigger={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2 rounded-full text-xs bg-transparent"
                                >
                                  Buy More
                                </Button>
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<DollarSign className="h-12 w-12" />}
                  title="No tokens yet"
                  description="Start supporting your favorite artists by buying their tokens!"
                  action={{
                    label: "Explore Artists",
                    onClick: () => (window.location.href = "/explore"),
                  }}
                />
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-6">
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <Card key={transaction.id} className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                              {transaction.type === "BUY" ? (
                                <ArrowUpRight className="h-5 w-5 text-green-500" />
                              ) : (
                                <ArrowDownRight className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-sm">
                                {transaction.type === "BUY" ? "Bought" : "Sold"} {transaction.token.symbol}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm">
                              {transaction.type === "BUY" ? "-" : "+"}${transaction.total.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.quantity.toFixed(1)} @ ${transaction.unit_price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<TrendingUp className="h-12 w-12" />}
                  title="No transactions yet"
                  description="Your trading history will appear here once you start buying tokens."
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </MobileLayout>
  )
}
