"use client"

import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, DollarSign, Heart, MessageCircle, Star } from "lucide-react"
import type { Notification } from "@/lib/types"
import { cn } from "@/lib/utils"

interface NotificationItemProps {
  notification: Notification
  isRead?: boolean
}

export function NotificationItem({ notification, isRead = false }: NotificationItemProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "REWARD_UNLOCKED":
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case "BUY":
        return <DollarSign className="h-5 w-5 text-green-500" />
      case "LIKE":
        return <Heart className="h-5 w-5 text-red-500" />
      case "COMMENT":
        return <MessageCircle className="h-5 w-5 text-blue-500" />
      case "FOLLOW":
        return <Star className="h-5 w-5 text-purple-500" />
      default:
        return <Star className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "REWARD_UNLOCKED":
        return "from-yellow-500/10 to-orange-500/10 border-yellow-500/30"
      case "BUY":
        return "from-green-500/10 to-emerald-500/10 border-green-500/30"
      case "LIKE":
        return "from-red-500/10 to-pink-500/10 border-red-500/30"
      case "COMMENT":
        return "from-blue-500/10 to-cyan-500/10 border-blue-500/30"
      case "FOLLOW":
        return "from-purple-500/10 to-violet-500/10 border-purple-500/30"
      default:
        return "bg-card/50 border-border/50"
    }
  }

  return (
    <Card
      className={cn(
        "rounded-2xl backdrop-blur-sm transition-all",
        notification.type === "REWARD_UNLOCKED"
          ? `bg-gradient-to-br ${getNotificationColor(notification.type)}`
          : "bg-card/50 border-border/50",
        !isRead && "ring-2 ring-primary/20",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-relaxed">{notification.message}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {notification.type.replace("_", " ").toLowerCase()}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
          {!isRead && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
        </div>
      </CardContent>
    </Card>
  )
}
