"use client"

import { useState } from "react"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, Share, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Post } from "@/lib/types"
import { cn } from "@/lib/utils"

interface PostCardProps {
  post: Post & {
    author: {
      handle: string
      display_name: string
      avatar_url?: string
      role: "DJ" | "FAN"
    }
    _count?: {
      comments: number
      likes: number
    }
    isLiked?: boolean
  }
  onLike?: (postId: string) => void
  onComment?: (postId: string) => void
  onShare?: (postId: string) => void
}

export function PostCard({ post, onLike, onComment, onShare }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [likesCount, setLikesCount] = useState(post._count?.likes || 0)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1))
    onLike?.(post.id)
  }

  return (
    <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.avatar_url || "/placeholder.svg"} alt={post.author.display_name} />
              <AvatarFallback>{post.author.display_name[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm">{post.author.display_name}</span>
                {post.author.role === "DJ" && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    DJ
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>@{post.author.handle}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="mb-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Media */}
        {post.media_url && (
          <div className="mb-3 rounded-xl overflow-hidden">
            <Image
              src={post.media_url || "/placeholder.svg"}
              alt="Post media"
              width={400}
              height={300}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8 px-3 rounded-full text-xs", isLiked && "text-red-500 hover:text-red-600")}
              onClick={handleLike}
            >
              <Heart className={cn("h-4 w-4 mr-1", isLiked && "fill-current")} />
              {likesCount > 0 && likesCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 rounded-full text-xs"
              onClick={() => onComment?.(post.id)}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              {post._count?.comments || 0}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 rounded-full text-xs"
            onClick={() => onShare?.(post.id)}
          >
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
