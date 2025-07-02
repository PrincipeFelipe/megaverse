import React from 'react';
import { BlogPost } from '../../types/blog';
import { Calendar, User } from 'lucide-react';
import { formatLongDate } from '../../utils/formatters';

interface BlogPostCardProps {
  post: BlogPost;
  onClick: (post: BlogPost) => void;
}

export const BlogPostCard: React.FC<BlogPostCardProps> = ({ post, onClick }) => {
  return (
    <article 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full cursor-pointer border border-gray-200 dark:border-gray-700"
      onClick={() => onClick(post)}
    >
      {post.image_url && (
        <div className="h-40 overflow-hidden">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}
      
      <div className="flex-grow p-4">
        <div className="mb-3">
          <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200 rounded">
            {post.category}
          </span>
          {post.featured && (
            <span className="inline-block ml-2 px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200 rounded">
              Destacado
            </span>
          )}
        </div>
        
        <h2 className="text-xl font-semibold mb-2 line-clamp-2">{post.title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
          {post.excerpt}
        </p>
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3 mr-1" />
            <span>{formatLongDate(post.created_at)}</span>
          </div>
          
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <User className="w-3 h-3 mr-1" />
            <span>{post.author_name}</span>
          </div>
        </div>
      </div>
    </article>
  );
};
