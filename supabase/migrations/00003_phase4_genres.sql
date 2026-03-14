-- Phase 4: Add genre support for advanced search
alter table books add column if not exists genre text;
alter table screen_media add column if not exists genre text;

-- Index for genre filtering
create index if not exists idx_books_genre on books(genre);
create index if not exists idx_screen_media_genre on screen_media(genre);
