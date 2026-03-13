-- MediaGraph Database Schema
-- Based on Section 3 of the Architecture Plan

-- ============================================================
-- 1. BOOKS
-- ============================================================
create table books (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  author        text not null,
  isbn          text,
  page_count    integer,
  published_date date,
  description   text,
  cover_image_url text,
  series_name   text,
  series_position integer,
  open_library_key text,
  created_at    timestamptz not null default now()
);

create index idx_books_title on books using gin (to_tsvector('english', title));
create index idx_books_author on books using gin (to_tsvector('english', author));

-- ============================================================
-- 2. SCREEN MEDIA (films + TV series in one table)
-- ============================================================
create type screen_media_type as enum ('film', 'series');

create table screen_media (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  type            screen_media_type not null,
  director        text,
  synopsis        text,
  release_date    date,
  poster_url      text,
  trailer_url     text,
  tmdb_id         integer,
  runtime_minutes integer,
  seasons_count   integer,
  created_at      timestamptz not null default now()
);

create index idx_screen_media_title on screen_media using gin (to_tsvector('english', title));

-- ============================================================
-- 3. ADAPTATIONS (the critical link between books and screen media)
-- ============================================================
create type adaptation_type as enum ('film', 'series', 'miniseries');

create table adaptations (
  id               uuid primary key default gen_random_uuid(),
  book_id          uuid not null references books(id) on delete cascade,
  screen_media_id  uuid not null references screen_media(id) on delete cascade,
  adaptation_type  adaptation_type not null,
  release_year     integer,
  notes            text,
  created_at       timestamptz not null default now(),

  unique (book_id, screen_media_id)
);

create index idx_adaptations_book on adaptations(book_id);
create index idx_adaptations_screen on adaptations(screen_media_id);

-- ============================================================
-- 4. USERS (extends Supabase Auth)
-- ============================================================
create table users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text unique not null,
  username     text unique not null,
  display_name text,
  avatar_url   text,
  bio          text,
  created_at   timestamptz not null default now()
);

create index idx_users_username on users(username);

-- ============================================================
-- 5. USER LOGS (track, rate, review media)
-- ============================================================
create type media_type as enum ('book', 'screen');
create type log_status as enum ('want', 'in_progress', 'completed');

create table user_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  media_type  media_type not null,
  media_id    uuid not null,
  status      log_status not null default 'want',
  rating      integer check (rating >= 1 and rating <= 5),
  review_text text,
  logged_at   timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (user_id, media_type, media_id)
);

create index idx_user_logs_user on user_logs(user_id);
create index idx_user_logs_media on user_logs(media_type, media_id);

-- ============================================================
-- 6. SHELVES
-- ============================================================
create table shelves (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  name        text not null,
  description text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index idx_shelves_user on shelves(user_id);

-- ============================================================
-- 7. SHELF ITEMS
-- ============================================================
create table shelf_items (
  id          uuid primary key default gen_random_uuid(),
  shelf_id    uuid not null references shelves(id) on delete cascade,
  media_type  media_type not null,
  media_id    uuid not null,
  added_at    timestamptz not null default now(),

  unique (shelf_id, media_type, media_id)
);

create index idx_shelf_items_shelf on shelf_items(shelf_id);

-- ============================================================
-- 8. FRIENDSHIPS
-- ============================================================
create type friendship_status as enum ('pending', 'accepted', 'blocked');

create table friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references users(id) on delete cascade,
  addressee_id  uuid not null references users(id) on delete cascade,
  status        friendship_status not null default 'pending',
  created_at    timestamptz not null default now(),

  unique (requester_id, addressee_id),
  check (requester_id != addressee_id)
);

create index idx_friendships_requester on friendships(requester_id);
create index idx_friendships_addressee on friendships(addressee_id);

-- ============================================================
-- 9. ACTIVITY FEED (denormalised for fast queries)
-- ============================================================
create type action_type as enum ('logged', 'rated', 'reviewed', 'shelved');

create table activity_feed (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  action_type action_type not null,
  media_type  media_type not null,
  media_id    uuid not null,
  metadata    jsonb default '{}',
  created_at  timestamptz not null default now()
);

create index idx_activity_feed_user on activity_feed(user_id);
create index idx_activity_feed_created on activity_feed(created_at desc);

-- ============================================================
-- 10. ROW-LEVEL SECURITY POLICIES
-- ============================================================

-- Books and screen_media: publicly readable
alter table books enable row level security;
create policy "Books are publicly readable" on books for select using (true);

alter table screen_media enable row level security;
create policy "Screen media is publicly readable" on screen_media for select using (true);

alter table adaptations enable row level security;
create policy "Adaptations are publicly readable" on adaptations for select using (true);

-- Users: public profiles
alter table users enable row level security;
create policy "User profiles are publicly readable" on users for select using (true);
create policy "Users can update their own profile" on users for update using (auth.uid() = id);
create policy "Users can insert their own profile" on users for insert with check (auth.uid() = id);

-- User logs: private to the user
alter table user_logs enable row level security;
create policy "Users can read their own logs" on user_logs for select using (auth.uid() = user_id);
create policy "Users can insert their own logs" on user_logs for insert with check (auth.uid() = user_id);
create policy "Users can update their own logs" on user_logs for update using (auth.uid() = user_id);
create policy "Users can delete their own logs" on user_logs for delete using (auth.uid() = user_id);

-- Shelves: private to the user
alter table shelves enable row level security;
create policy "Users can read their own shelves" on shelves for select using (auth.uid() = user_id);
create policy "Users can insert their own shelves" on shelves for insert with check (auth.uid() = user_id);
create policy "Users can update their own shelves" on shelves for update using (auth.uid() = user_id);
create policy "Users can delete their own shelves" on shelves for delete using (auth.uid() = user_id);

-- Shelf items: tied to shelf ownership
alter table shelf_items enable row level security;
create policy "Users can read their own shelf items" on shelf_items for select
  using (shelf_id in (select id from shelves where user_id = auth.uid()));
create policy "Users can insert into their own shelves" on shelf_items for insert
  with check (shelf_id in (select id from shelves where user_id = auth.uid()));
create policy "Users can delete from their own shelves" on shelf_items for delete
  using (shelf_id in (select id from shelves where user_id = auth.uid()));

-- Friendships: visible to both parties
alter table friendships enable row level security;
create policy "Users can see their own friendships" on friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "Users can send friend requests" on friendships for insert
  with check (auth.uid() = requester_id);
create policy "Users can update friendships they are part of" on friendships for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Activity feed: readable by friends
alter table activity_feed enable row level security;
create policy "Users can read their own activity" on activity_feed for select
  using (auth.uid() = user_id);
create policy "Users can read friends activity" on activity_feed for select
  using (
    user_id in (
      select case
        when requester_id = auth.uid() then addressee_id
        else requester_id
      end
      from friendships
      where status = 'accepted'
        and (requester_id = auth.uid() or addressee_id = auth.uid())
    )
  );

-- ============================================================
-- 11. TRIGGERS: auto-update updated_at on user_logs
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_logs_updated_at
  before update on user_logs
  for each row execute function update_updated_at();

-- ============================================================
-- 12. TRIGGER: write to activity_feed on user_logs changes
-- ============================================================
create or replace function write_activity_on_log()
returns trigger as $$
begin
  insert into activity_feed (user_id, action_type, media_type, media_id, metadata)
  values (
    new.user_id,
    case
      when new.review_text is not null and (old is null or old.review_text is null) then 'reviewed'
      when new.rating is not null and (old is null or old.rating is null) then 'rated'
      else 'logged'
    end,
    new.media_type,
    new.media_id,
    jsonb_build_object(
      'status', new.status,
      'rating', new.rating
    )
  );
  return new;
end;
$$ language plpgsql;

create trigger activity_on_log_insert
  after insert on user_logs
  for each row execute function write_activity_on_log();

create trigger activity_on_log_update
  after update on user_logs
  for each row execute function write_activity_on_log();

-- ============================================================
-- 13. TRIGGER: write to activity_feed on shelf_items insert
-- ============================================================
create or replace function write_activity_on_shelve()
returns trigger as $$
begin
  insert into activity_feed (user_id, action_type, media_type, media_id, metadata)
  values (
    (select user_id from shelves where id = new.shelf_id),
    'shelved',
    new.media_type,
    new.media_id,
    jsonb_build_object('shelf_id', new.shelf_id)
  );
  return new;
end;
$$ language plpgsql;

create trigger activity_on_shelve
  after insert on shelf_items
  for each row execute function write_activity_on_shelve();
