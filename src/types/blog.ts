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
  // Los tags pueden ser:
  // - string[] cuando se usan para mostrarlos como texto simple
  // - number[] cuando se envían al backend como IDs
  // - objetos completos {id, name, slug} cuando vienen de la API
  tags?: (string | number | {id: number; name: string; slug: string})[];
  category: string;
  category_id?: number;
  // En la base de datos solo existen 'draft' y 'published'
  status: 'draft' | 'published';
  featured?: boolean;
  // Para uso interno en el formulario (no parte del modelo de BD)
  imageFile?: File;
  image?: string | null;
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
