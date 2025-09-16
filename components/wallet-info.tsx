"use client"

import { useState, useEffect } from "react"
import { getStellarWallet, checkWalletBalance } from "@/app/actions/wallet"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink, Wallet, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface WalletInfoProps {
  userId: string
}

export function WalletInfo({ userId }: WalletInfoProps) {
  const [wallet, setWallet] = useState<any>(null)
  const [balance, setBalance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadWalletData = async () => {
    try {
      const [walletResult, balanceResult] = await Promise.all([
        getStellarWallet(userId),
        checkWalletBalance(userId)
      ])

      if (walletResult.data) {
        setWallet(walletResult.data)
      }
      if (balanceResult.data) {
        setBalance(balanceResult.data)
      }
    } catch (error) {
      console.error("Error loading wallet data:", error)
    } finally {
      setLoading(false)
    }
  }

  const refreshWallet = async () => {
    setRefreshing(true)
    await loadWalletData()
    setRefreshing(false)
    toast.success("Wallet data refreshed")
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const openInExplorer = (publicKey: string) => {
    const explorerUrl = wallet?.network === 'mainnet' 
      ? `https://stellar.expert/explorer/public/account/${publicKey}`
      : `https://testnet.stellar.expert/explorer/public/account/${publicKey}`
    window.open(explorerUrl, '_blank')
  }

  useEffect(() => {
    loadWalletData()
  }, [userId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Stellar Wallet
          </CardTitle>
          <CardDescription>Loading wallet information...</CardDescription>
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

  if (!wallet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Stellar Wallet
          </CardTitle>
          <CardDescription>No wallet found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your Stellar wallet will be created automatically when you sign up.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            <CardTitle>Stellar Wallet</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshWallet}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          Your invisible Stellar wallet for transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Network</span>
            <Badge variant={wallet.network === 'mainnet' ? 'default' : 'secondary'}>
              {wallet.network.toUpperCase()}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Account Status</span>
              <Badge variant={balance?.accountExists ? 'default' : 'destructive'}>
                {balance?.accountExists ? 'Active' : 'Not Funded'}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Public Key</span>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <code className="text-xs flex-1 truncate">
                {wallet.public_key}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(wallet.public_key, 'Public key')}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openInExplorer(wallet.public_key)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Account ID</span>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <code className="text-xs flex-1 truncate">
                {wallet.account_id}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(wallet.account_id, 'Account ID')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Created: {new Date(wallet.created_at).toLocaleDateString()}
          </div>
        </div>

        {wallet.network === 'testnet' && !balance?.accountExists && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Testnet Account:</strong> Your account needs to be funded to perform transactions. 
              This usually happens automatically during signup.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
