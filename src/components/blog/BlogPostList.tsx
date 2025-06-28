import React, { useState } from 'react';
import { BlogPost } from '../../types/blog';
import { Pagination } from '../ui/Pagination';
import { BlogPostCard } from './BlogPostCard';

interface BlogPostListProps {
  posts: BlogPost[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onPostClick: (post: BlogPost) => void;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  onPageChange?: (page: number) => void;
}

export const BlogPostList: React.FC<BlogPostListProps> = ({
  posts,
  loading,
  error,
  onRetry,
  onPostClick,
  pagination,
  onPageChange
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-40 bg-gray-200 dark:bg-gray-700 mb-4 rounded"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 mb-2 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 mb-4 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 mb-2 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="col-span-full p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <button 
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-800/30 dark:hover:bg-red-800/50 text-red-700 dark:text-red-300 rounded"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }
  
  if (posts.length === 0) {
    return (
      <div className="col-span-full p-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
        <p className="text-gray-600 dark:text-gray-400">
          No se encontraron posts que coincidan con los criterios de búsqueda.
        </p>
      </div>
    );
  }
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <BlogPostCard
            key={post.id}
            post={post}
            onClick={onPostClick}
          />
        ))}
      </div>
      
      {pagination && onPageChange && pagination.pages > 1 && (
        <div className="mt-10 flex justify-center">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </>
  );
};
