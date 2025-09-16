"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink, Coins, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface ArtistTokenInfoProps {
  userId: string
}

export function ArtistTokenInfo({ userId }: ArtistTokenInfoProps) {
  const [tokenData, setTokenData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadTokenData = async () => {
    try {
      const response = await fetch('/api/artist/token-status')
      const data = await response.json()
      setTokenData(data)
    } catch (error) {
      console.error("Error loading token data:", error)
    } finally {
      setLoading(false)
    }
  }

  const refreshToken = async () => {
    setRefreshing(true)
    await loadTokenData()
    setRefreshing(false)
    toast.success("Token data refreshed")
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const openInExplorer = (publicKey: string, network: string) => {
    const explorerUrl = network === 'mainnet' 
      ? `https://stellar.expert/explorer/public/account/${publicKey}`
      : `https://testnet.stellar.expert/explorer/public/account/${publicKey}`
    window.open(explorerUrl, '_blank')
  }

  useEffect(() => {
    loadTokenData()
  }, [userId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Artist Token
          </CardTitle>
          <CardDescription>Loading token information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!tokenData || tokenData.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Artist Token
          </CardTitle>
          <CardDescription>Error loading token data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {tokenData?.error || "Unable to load token information"}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (tokenData.profile?.role !== "DJ") {
    return null // Don't show for non-DJs
  }

  if (!tokenData.hasToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Artist Token
          </CardTitle>
          <CardDescription>No artist token found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Your artist token will be created automatically when you log in as a DJ.
          </p>
        </CardContent>
      </Card>
    )
  }

  const { artistToken, stellarAsset } = tokenData

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            <CardTitle>Artist Token</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshToken}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          Your artist token for fan engagement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Token Symbol</span>
            <Badge variant="default">
              {artistToken.symbol}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Display Name</span>
            <span className="text-sm">{artistToken.display_name}</span>
          </div>

          {stellarAsset && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Network</span>
                  <Badge variant={stellarAsset.network === 'mainnet' ? 'default' : 'secondary'}>
                    {stellarAsset.network.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium">Asset Code</span>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <code className="text-xs flex-1">
                      {stellarAsset.asset_code}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(stellarAsset.asset_code, 'Asset code')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium">Issuer Public Key</span>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <code className="text-xs flex-1 truncate">
                      {stellarAsset.issuer_public_key}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(stellarAsset.issuer_public_key, 'Issuer key')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openInExplorer(stellarAsset.issuer_public_key, stellarAsset.network)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium">Distributor Public Key</span>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <code className="text-xs flex-1 truncate">
                      {stellarAsset.distributor_public_key}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(stellarAsset.distributor_public_key, 'Distributor key')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openInExplorer(stellarAsset.distributor_public_key, stellarAsset.network)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="text-xs text-muted-foreground">
            Created: {new Date(artistToken.created_at).toLocaleDateString()}
          </div>
        </div>

        {stellarAsset?.network === 'testnet' && (
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Testnet Asset:</strong> This is a test token on Stellar's testnet. 
                For production, assets would be deployed on mainnet.
              </p>
            </div>
            
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                <strong>Issue Token on Blockchain:</strong> Your token exists in the database but needs to be issued on Stellar.
              </p>
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/artist/fund-and-issue', { method: 'POST' })
                    const result = await response.json()
                    if (result.success) {
                      toast.success('Token successfully issued on Stellar blockchain!')
                      await loadTokenData() // Refresh data
                    } else {
                      toast.error(result.error || 'Failed to issue token')
                    }
                  } catch (error) {
                    toast.error('Error issuing token')
                    console.error('Issue token error:', error)
                  }
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Issue Token on Stellar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
