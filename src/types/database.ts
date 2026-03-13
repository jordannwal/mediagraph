export type ScreenMediaType = "film" | "series";
export type AdaptationType = "film" | "series" | "miniseries";
export type MediaType = "book" | "screen";
export type LogStatus = "want" | "in_progress" | "completed";
export type FriendshipStatus = "pending" | "accepted" | "blocked";
export type ActionType = "logged" | "rated" | "reviewed" | "shelved";

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  page_count: number | null;
  published_date: string | null;
  description: string | null;
  cover_image_url: string | null;
  series_name: string | null;
  series_position: number | null;
  open_library_key: string | null;
  created_at: string;
}

export interface ScreenMedia {
  id: string;
  title: string;
  type: ScreenMediaType;
  director: string | null;
  synopsis: string | null;
  release_date: string | null;
  poster_url: string | null;
  trailer_url: string | null;
  tmdb_id: number | null;
  runtime_minutes: number | null;
  seasons_count: number | null;
  created_at: string;
}

export interface Adaptation {
  id: string;
  book_id: string;
  screen_media_id: string;
  adaptation_type: AdaptationType;
  release_year: number | null;
  notes: string | null;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface UserLog {
  id: string;
  user_id: string;
  media_type: MediaType;
  media_id: string;
  status: LogStatus;
  rating: number | null;
  review_text: string | null;
  logged_at: string;
  updated_at: string;
}

export interface Shelf {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
}

export interface ShelfItem {
  id: string;
  shelf_id: string;
  media_type: MediaType;
  media_id: string;
  added_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
}

export interface ActivityFeedItem {
  id: string;
  user_id: string;
  action_type: ActionType;
  media_type: MediaType;
  media_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
