"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, TrendingUp, DollarSign, Coins, AlertCircle, CheckCircle, ExternalLink } from "lucide-react" 
import { createClient } from "@/lib/supabase/client"
import type { ArtistToken, Profile } from "@/lib/types"

interface TokenBuyDrawerProps {
  token: ArtistToken & {
    artist: Profile
  }
  currentProfile: Profile
  onPurchaseComplete?: () => void
  trigger?: React.ReactNode
}

export function TokenBuyDrawer({ token, currentProfile, onPurchaseComplete, trigger }: TokenBuyDrawerProps) {
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState("1.0")
  const [isLoading, setIsLoading] = useState(false)
  const [stellarQuantity, setStellarQuantity] = useState("100")
  const [isStellarLoading, setIsStellarLoading] = useState(false)
  const [stellarError, setStellarError] = useState<string | null>(null)
  const [stellarSuccess, setStellarSuccess] = useState<string | null>(null)

  const quantityNum = Number.parseFloat(quantity) || 0
  const total = quantityNum * token.price
  const stellarQuantityNum = Number.parseFloat(stellarQuantity) || 0

  const handlePurchase = async () => {
    if (quantityNum <= 0) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      // Create transaction
      const { error: transactionError } = await supabase.from("transactions").insert({
        buyer_id: currentProfile.id,
        token_id: token.id,
        quantity: quantityNum,
        unit_price: token.price,
        type: "BUY",
      })

      if (transactionError) throw transactionError

      // Update or create holding
      const { data: existingHolding } = await supabase
        .from("holdings")
        .select("*")
        .eq("owner_id", currentProfile.id)
        .eq("token_id", token.id)
        .single()

      if (existingHolding) {
        // Update existing holding
        const { error: updateError } = await supabase
          .from("holdings")
          .update({
            amount: existingHolding.amount + quantityNum,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingHolding.id)

        if (updateError) throw updateError
      } else {
        // Create new holding
        const { error: insertError } = await supabase.from("holdings").insert({
          owner_id: currentProfile.id,
          token_id: token.id,
          amount: quantityNum,
        })

        if (insertError) throw insertError
      }

      // Check for rewards to unlock
      const { data: rewards } = await supabase
        .from("rewards")
        .select("*")
        .eq("artist_id", token.artist_id)
        .lte("required_amount", (existingHolding?.amount || 0) + quantityNum)

      if (rewards && rewards.length > 0) {
        for (const reward of rewards) {
          // Check if user already has this reward
          const { data: existingReward } = await supabase
            .from("user_rewards")
            .select("*")
            .eq("user_id", currentProfile.id)
            .eq("reward_id", reward.id)
            .single()

          if (!existingReward) {
            // Unlock reward
            await supabase.from("user_rewards").insert({
              user_id: currentProfile.id,
              reward_id: reward.id,
            })

            // Create notification
            await supabase.from("notifications").insert({
              user_id: currentProfile.id,
              type: "REWARD_UNLOCKED",
              ref_id: reward.id,
              message: `You unlocked "${reward.title}" by holding ${reward.required_amount} ${token.symbol}!`,
            })
          }
        }
      }

      // Create purchase notification
      await supabase.from("notifications").insert({
        user_id: currentProfile.id,
        type: "BUY",
        ref_id: token.id,
        message: `You bought ${quantityNum} ${token.symbol} for $${total.toFixed(2)}`,
      })

      setQuantity("1.0")
      setOpen(false)
      onPurchaseComplete?.()
    } catch (error) {
      console.error("Error purchasing token:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStellarPurchase = async () => {
    if (stellarQuantityNum <= 0) return

    setIsStellarLoading(true)
    setStellarError(null)
    setStellarSuccess(null)

    try {
      // First, check if artist has a token listing
      const listingResponse = await fetch('/api/marketplace/tokens')
      const listingData = await listingResponse.json()

      if (!listingData.success) {
        throw new Error('Failed to fetch token listings')
      }

      // Find listing for this artist's token
      const listing = listingData.listings.find((l: any) => 
        l.token.id === token.id && l.is_active && l.available_supply > 0
      )

      if (!listing) {
        throw new Error('This artist\'s token is not available for purchase on Stellar yet. Ask the artist to list their tokens!')
      }

      if (listing.available_supply < stellarQuantityNum) {
        throw new Error(`Only ${listing.available_supply} tokens available. Please reduce quantity.`)
      }

      // Make the purchase
      const purchaseResponse = await fetch('/api/marketplace/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listing.id,
          quantity: stellarQuantityNum
        })
      })

      const purchaseData = await purchaseResponse.json()

      if (purchaseData.success) {
        setStellarSuccess(
          `🎉 Successfully purchased ${stellarQuantityNum} ${purchaseData.purchase.token.symbol} tokens on Stellar blockchain!\n\nTransaction: ${purchaseData.purchase.transactionHash}`
        )
        setStellarQuantity("100")
        onPurchaseComplete?.()
      } else {
        // Handle specific error cases
        if (purchaseData.fundingUrl) {
          setStellarError(`${purchaseData.error}\n\nWould you like to fund your wallet?`)
        } else {
          setStellarError(purchaseData.error || 'Purchase failed')
        }
      }
    } catch (error) {
      console.error('Stellar purchase error:', error)
      setStellarError(error instanceof Error ? error.message : 'Network error during purchase')
    } finally {
      setIsStellarLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {trigger || <Button className="rounded-full px-6">Buy {token.symbol}</Button>}
      </DrawerTrigger>
      <DrawerContent className="max-w-[430px] mx-auto">
        <DrawerHeader>
          <DrawerTitle>Buy {token.symbol}</DrawerTitle>
        </DrawerHeader>
        <div className="p-6 space-y-6">
          {/* Token Info */}
          <div className="flex items-center space-x-4 p-4 rounded-2xl bg-muted/50">
            <Avatar className="h-12 w-12">
              <AvatarImage src={token.artist.avatar_url || "/placeholder.svg"} alt={token.artist.display_name} />
              <AvatarFallback>{token.artist.display_name[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">{token.display_name}</h3>
                <Badge variant="secondary" className="text-xs">
                  DJ
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">@{token.artist.handle}</p>
              <div className="flex items-center space-x-2 mt-1">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="font-medium">${token.price.toFixed(2)}</span>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </div>
          </div>

          {/* Purchase Tabs */}
          <Tabs defaultValue="demo" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="demo" className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Purchase</span>
              </TabsTrigger>
              {/* <TabsTrigger value="stellar" className="flex items-center space-x-2">
                <Coins className="h-4 w-4" />
                <span>Stellar Blockchain</span>
              </TabsTrigger> */}
            </TabsList>

            {/* Demo Purchase Tab */}
            <TabsContent value="demo" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="h-12 rounded-xl text-center text-lg font-medium"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-muted/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Price per token:</span>
                    <span>${token.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quantity:</span>
                    <span>{quantityNum.toFixed(1)}</span>
                  </div>
                  <div className="border-t border-border/50 pt-2 flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handlePurchase}
                  disabled={quantityNum <= 0 || isLoading}
                  className="w-full h-12 rounded-xl font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Buy ${quantityNum.toFixed(1)} ${token.symbol}`
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  This is a simulated purchase for demo purposes. No real money is involved.
                </p>
              </div>
            </TabsContent>

            {/* Stellar Purchase Tab */}
            <TabsContent value="stellar" className="space-y-4 mt-6">
              {stellarError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="whitespace-pre-line">{stellarError}</AlertDescription>
                </Alert>
              )}

              {stellarSuccess && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="whitespace-pre-line">{stellarSuccess}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stellarQuantity">Quantity (Tokens)</Label>
                  <Input
                    id="stellarQuantity"
                    type="number"
                    step="1"
                    min="1"
                    value={stellarQuantity}
                    onChange={(e) => setStellarQuantity(e.target.value)}
                    className="h-12 rounded-xl text-center text-lg font-medium"
                    placeholder="100"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/50 space-y-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <Coins className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Stellar Blockchain Purchase</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Payment Method:</span>
                    <span className="font-medium">XLM (Stellar Lumens)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quantity:</span>
                    <span>{stellarQuantityNum.toLocaleString()} tokens</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Network:</span>
                    <span>Stellar Testnet</span>
                  </div>
                </div>

                <Button
                  onClick={handleStellarPurchase}
                  disabled={stellarQuantityNum <= 0 || isStellarLoading}
                  className="w-full h-12 rounded-xl font-medium bg-blue-600 hover:bg-blue-700"
                >
                  {isStellarLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing on Stellar...
                    </>
                  ) : (
                    <>
                      <Coins className="mr-2 h-4 w-4" />
                      Buy {stellarQuantityNum.toLocaleString()} {token.symbol} on Stellar
                    </>
                  )}
                </Button>

                <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200/50">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="text-xs text-amber-800">
                      <p className="font-medium mb-1">Real Blockchain Purchase</p>
                      <p>This will create actual transactions on the Stellar blockchain. You need:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>A funded Stellar wallet</li>
                        <li>XLM for transaction fees</li>
                        <li>The artist must have listed tokens for sale</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
