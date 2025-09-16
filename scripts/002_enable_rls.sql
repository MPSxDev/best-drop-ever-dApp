-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.artist_tokens enable row level security;
alter table public.holdings enable row level security;
alter table public.transactions enable row level security;
alter table public.rewards enable row level security;
alter table public.user_rewards enable row level security;
alter table public.certifications_catalog enable row level security;
alter table public.artist_certifications enable row level security;
alter table public.notifications enable row level security;

-- Profiles policies
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = user_id);

-- Posts policies
create policy "posts_select_all" on public.posts for select using (true);
create policy "posts_insert_own" on public.posts for insert with check (
  auth.uid() = (select user_id from public.profiles where id = author_id)
);
create policy "posts_update_own" on public.posts for update using (
  auth.uid() = (select user_id from public.profiles where id = author_id)
);
create policy "posts_delete_own" on public.posts for delete using (
  auth.uid() = (select user_id from public.profiles where id = author_id)
);

-- Comments policies
create policy "comments_select_all" on public.comments for select using (true);
create policy "comments_insert_own" on public.comments for insert with check (
  auth.uid() = (select user_id from public.profiles where id = author_id)
);
create policy "comments_update_own" on public.comments for update using (
  auth.uid() = (select user_id from public.profiles where id = author_id)
);
create policy "comments_delete_own" on public.comments for delete using (
  auth.uid() = (select user_id from public.profiles where id = author_id)
);

-- Follows policies
create policy "follows_select_all" on public.follows for select using (true);
create policy "follows_insert_own" on public.follows for insert with check (
  auth.uid() = (select user_id from public.profiles where id = follower_id)
);
create policy "follows_delete_own" on public.follows for delete using (
  auth.uid() = (select user_id from public.profiles where id = follower_id)
);

-- Artist tokens policies (public read, owner can manage)
create policy "artist_tokens_select_all" on public.artist_tokens for select using (true);
create policy "artist_tokens_insert_own" on public.artist_tokens for insert with check (
  auth.uid() = (select user_id from public.profiles where id = artist_id)
);
create policy "artist_tokens_update_own" on public.artist_tokens for update using (
  auth.uid() = (select user_id from public.profiles where id = artist_id)
);

-- Holdings policies (owner can see their own)
create policy "holdings_select_own" on public.holdings for select using (
  auth.uid() = (select user_id from public.profiles where id = owner_id)
);
create policy "holdings_insert_own" on public.holdings for insert with check (
  auth.uid() = (select user_id from public.profiles where id = owner_id)
);
create policy "holdings_update_own" on public.holdings for update using (
  auth.uid() = (select user_id from public.profiles where id = owner_id)
);

-- Transactions policies (buyer can see their own)
create policy "transactions_select_own" on public.transactions for select using (
  auth.uid() = (select user_id from public.profiles where id = buyer_id)
);
create policy "transactions_insert_own" on public.transactions for insert with check (
  auth.uid() = (select user_id from public.profiles where id = buyer_id)
);

-- Rewards policies (public read, artist can manage their own)
create policy "rewards_select_all" on public.rewards for select using (true);
create policy "rewards_insert_own" on public.rewards for insert with check (
  auth.uid() = (select user_id from public.profiles where id = artist_id)
);
create policy "rewards_update_own" on public.rewards for update using (
  auth.uid() = (select user_id from public.profiles where id = artist_id)
);
create policy "rewards_delete_own" on public.rewards for delete using (
  auth.uid() = (select user_id from public.profiles where id = artist_id)
);

-- User rewards policies (user can see their own)
create policy "user_rewards_select_own" on public.user_rewards for select using (
  auth.uid() = (select user_id from public.profiles where id = user_id)
);
create policy "user_rewards_insert_own" on public.user_rewards for insert with check (
  auth.uid() = (select user_id from public.profiles where id = user_id)
);

-- Certifications catalog policies (public read)
create policy "certifications_catalog_select_all" on public.certifications_catalog for select using (true);

-- Artist certifications policies (public read, artist can manage their own)
create policy "artist_certifications_select_all" on public.artist_certifications for select using (true);
create policy "artist_certifications_insert_own" on public.artist_certifications for insert with check (
  auth.uid() = (select user_id from public.profiles where id = artist_id)
);

-- Notifications policies (user can see their own)
create policy "notifications_select_own" on public.notifications for select using (
  auth.uid() = (select user_id from public.profiles where id = user_id)
);
create policy "notifications_insert_own" on public.notifications for insert with check (
  auth.uid() = (select user_id from public.profiles where id = user_id)
);
create policy "notifications_update_own" on public.notifications for update using (
  auth.uid() = (select user_id from public.profiles where id = user_id)
);
