-- Phase 3: Social features - RLS policy updates
-- Allow users to view other users' logs (for friend profiles and aggregate reviews)
create policy "Anyone can read user logs" on user_logs for select using (true);

-- Allow users to view other users' shelves
create policy "Anyone can read shelves" on shelves for select using (true);
create policy "Anyone can read shelf items" on shelf_items for select using (true);

-- Allow activity_feed insert from triggers (service role)
create policy "System can insert activity" on activity_feed for insert
  with check (auth.uid() = user_id);

-- Allow users to delete friendships they are part of
create policy "Users can delete friendships" on friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Index for user search by username
create index if not exists idx_users_username_text on users using gin (to_tsvector('english', username));
