import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Send } from 'lucide-react';

interface BlogCommentFormProps {
  onSubmit: (content: string) => Promise<boolean>;
}

export const BlogCommentForm: React.FC<BlogCommentFormProps> = ({ onSubmit }) => {
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      const success = await onSubmit(content);
      
      if (success) {
        setContent('');
        setMessage({
          text: 'Comentario enviado correctamente. Será visible después de ser aprobado.',
          type: 'success'
        });
        
        // Limpiar mensaje después de 5 segundos
        setTimeout(() => {
          setMessage(null);
        }, 5000);
      } else {
        setMessage({
          text: 'Hubo un error al enviar el comentario. Por favor, inténtelo de nuevo.',
          type: 'error'
        });
      }
    } catch (error) {
      setMessage({
        text: 'Hubo un error al enviar el comentario. Por favor, inténtelo de nuevo.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <h3 className="font-medium mb-3">Deja tu comentario</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            rows={4}
            placeholder="Escribe tu comentario aquí..."
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        
        {message && (
          <div className={`mb-4 p-3 rounded ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' 
              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
          }`}>
            {message.text}
          </div>
        )}
        
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            className="flex items-center"
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting ? 'Enviando...' : (
              <>
                <Send className="w-4 h-4 mr-1" />
                Enviar comentario
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
