-- Create profiles table
create table public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references auth.users(id) on delete cascade,
  handle text unique not null,
  display_name text not null,
  role text not null check (role in ('DJ','FAN')),
  bio text,
  link text,
  avatar_url text,
  cover_url text,
  primary_genre text,
  member_since date default now(),
  created_at timestamptz default now()
);

-- Create posts table
create table public.posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  media_url text,
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- Create comments table
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- Create follows table
create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

-- Create artist_tokens table
create table public.artist_tokens (
  id uuid primary key default uuid_generate_v4(),
  artist_id uuid unique references public.profiles(id) on delete cascade,
  symbol text unique not null,
  display_name text not null,
  price numeric(12,4) not null default 1.00,
  created_at timestamptz default now()
);

-- Create holdings table
create table public.holdings (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.profiles(id) on delete cascade,
  token_id uuid references public.artist_tokens(id) on delete cascade,
  amount numeric(18,6) not null default 0,
  unique (owner_id, token_id),
  updated_at timestamptz default now()
);

-- Create transactions table
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  buyer_id uuid references public.profiles(id) on delete set null,
  token_id uuid references public.artist_tokens(id) on delete set null,
  quantity numeric(18,6) not null,
  unit_price numeric(12,4) not null,
  total numeric(14,4) generated always as (quantity * unit_price) stored,
  type text not null check (type in ('BUY','SELL')),
  created_at timestamptz default now()
);

-- Create rewards table
create table public.rewards (
  id uuid primary key default uuid_generate_v4(),
  artist_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  required_amount numeric(18,6) not null default 1,
  created_at timestamptz default now()
);

-- Create user_rewards table
create table public.user_rewards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  reward_id uuid references public.rewards(id) on delete cascade,
  unlocked_at timestamptz default now(),
  unique (user_id, reward_id)
);

-- Create certifications_catalog table
create table public.certifications_catalog (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  title text not null,
  description text,
  icon_url text
);

-- Create artist_certifications table
create table public.artist_certifications (
  id uuid primary key default uuid_generate_v4(),
  artist_id uuid references public.profiles(id) on delete cascade,
  cert_id uuid references public.certifications_catalog(id) on delete cascade,
  awarded_at timestamptz default now(),
  unique (artist_id, cert_id)
);

-- Create notifications table
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  ref_id uuid,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Create indexes for performance
create index on public.posts (created_at desc);
create index on public.comments (post_id, created_at desc);
create index on public.transactions (buyer_id, created_at desc);
create index on public.notifications (user_id, created_at desc);
create index on public.profiles (handle);
