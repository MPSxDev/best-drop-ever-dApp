export interface Profile {
  id: string
  user_id: string
  handle: string
  display_name: string
  role: "DJ" | "FAN"
  bio?: string | null
  link?: string | null
  avatar_url?: string | null
  cover_url?: string | null
  primary_genre?: string | null
  email?: string | null
  member_since: string
  created_at: string
  updated_at?: string
}

export interface Post {
  id: string
  author_id: string
  content: string
  media_url?: string | null
  created_at: string
  updated_at?: string | null
  author?: Profile
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  author?: Profile
}

export interface ArtistToken {
  id: string
  artist_id: string
  symbol: string
  display_name: string
  price: number
  total_supply?: number | null
  circulating_supply?: number | null
  created_at: string
  updated_at?: string | null
  artist?: Profile
}

export interface Holding {
  id: string
  user_id: string
  token_id: string
  amount: number
  created_at: string
  updated_at?: string | null
  token?: ArtistToken
}

export interface Transaction {
  id: string
  user_id: string
  token_id: string
  type: "BUY" | "SELL"
  amount: number
  price: number
  total_value: number
  created_at: string
  token?: ArtistToken
}

export interface Reward {
  id: string
  artist_id: string
  title: string
  description?: string | null
  required_amount: number
  created_at: string
  artist?: Profile
}

export interface UserReward {
  id: string
  user_id: string
  reward_id: string
  unlocked_at: string
  reward?: Reward
}

export interface Certification {
  id: string
  code: string
  title: string
  description?: string | null
  icon_url?: string | null
}

export interface ArtistCertification {
  id: string
  artist_id: string
  cert_id: string
  awarded_at: string
  certification?: Certification
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title?: string | null
  message: string
  is_read: boolean
  created_at: string
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
  follower?: Profile
  following?: Profile
}

// Extended types for UI components
export interface PostWithDetails extends Post {
  _count?: {
    comments: number
    likes: number
  }
  isLiked?: boolean
}

export interface ProfileWithStats extends Profile {
  followers_count?: number
  following_count?: number
  posts_count?: number
}
