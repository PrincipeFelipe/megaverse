export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image_url?: string;
  author_id: number;
  author_name: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  category: string;
  status: 'draft' | 'published';
  comments_count?: number;
  featured?: boolean;
}

export interface BlogComment {
  id: number;
  post_id: number;
  user_id: number;
  user_name: string;
  content: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'approved' | 'spam';
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  posts_count?: number;
}

export interface BlogTag {
  id: number;
  name: string;
  slug: string;
  posts_count?: number;
}

export interface BlogAuthor {
  id: number;
  name: string;
  bio?: string;
  avatar_url?: string;
  posts_count?: number;
}

export interface BlogFilters {
  category?: string;
  tag?: string;
  author_id?: number;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
