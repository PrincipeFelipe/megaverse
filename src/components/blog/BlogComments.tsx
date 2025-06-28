import React from 'react';
import { BlogComment } from '../../types/blog';
import { User, Clock, RefreshCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatLongDate } from '../../utils/formatters';

interface BlogCommentsProps {
  comments: BlogComment[];
  loading: boolean;
  onReload: () => void;
}

export const BlogComments: React.FC<BlogCommentsProps> = ({ 
  comments, 
  loading, 
  onReload 
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="animate-pulse bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="ml-2 h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          No hay comentarios todavía. ¡Sé el primero en comentar!
        </p>
        <Button onClick={onReload} variant="outline" className="flex items-center mx-auto">
          <RefreshCcw className="w-4 h-4 mr-1" />
          Actualizar comentarios
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">{comments.length} Comentario{comments.length !== 1 ? 's' : ''}</h3>
        <Button onClick={onReload} size="sm" variant="outline" className="flex items-center">
          <RefreshCcw className="w-3 h-3 mr-1" />
          Actualizar
        </Button>
      </div>
      
      {comments.map(comment => (
        <div 
          key={comment.id} 
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="ml-2 font-medium">{comment.user_name}</span>
            </div>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              <span>{formatLongDate(comment.created_at)}</span>
            </div>
          </div>
          <div className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
            {comment.content}
          </div>
        </div>
      ))}
    </div>
  );
};
