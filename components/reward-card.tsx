"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Star, Gift, Lock } from "lucide-react"
import type { Reward, Profile } from "@/lib/types"
import { cn } from "@/lib/utils"

interface RewardCardProps {
  reward: Reward & {
    artist: Profile
  }
  isUnlocked?: boolean
  progress?: number
}

export function RewardCard({ reward, isUnlocked = false, progress = 0 }: RewardCardProps) {
  const getRewardIcon = (type: string) => {
    switch (type) {
      case "EXCLUSIVE_CONTENT":
        return <Star className="h-5 w-5" />
      case "MEET_GREET":
        return <Gift className="h-5 w-5" />
      case "EARLY_ACCESS":
        return <Trophy className="h-5 w-5" />
      default:
        return <Gift className="h-5 w-5" />
    }
  }

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case "EXCLUSIVE_CONTENT":
        return "Exclusive Content"
      case "MEET_GREET":
        return "Meet & Greet"
      case "EARLY_ACCESS":
        return "Early Access"
      default:
        return "Reward"
    }
  }

  return (
    <Card
      className={cn(
        "rounded-2xl border-border/50 backdrop-blur-sm transition-all",
        isUnlocked ? "bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30" : "bg-card/50",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div
            className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center",
              isUnlocked ? "bg-yellow-500/20 text-yellow-500" : "bg-muted text-muted-foreground",
            )}
          >
            {isUnlocked ? getRewardIcon(reward.type) : <Lock className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className={cn("font-semibold text-sm", isUnlocked && "text-yellow-500")}>{reward.title}</h3>
              <Badge variant={isUnlocked ? "default" : "secondary"} className="text-xs">
                {getRewardTypeLabel(reward.type)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{reward.description}</p>
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={reward.artist.avatar_url || "/placeholder.svg"} alt={reward.artist.display_name} />
                <AvatarFallback className="text-xs">{reward.artist.display_name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">by {reward.artist.display_name}</span>
            </div>
          </div>
        </div>

        {!isUnlocked && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>
                {progress.toFixed(1)} / {reward.required_amount} tokens
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min((progress / reward.required_amount) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {isUnlocked && (
          <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center space-x-2 text-yellow-600">
              <Trophy className="h-4 w-4" />
              <span className="text-sm font-medium">Reward Unlocked!</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
