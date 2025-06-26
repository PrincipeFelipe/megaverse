import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className={`bg-white dark:bg-dark-800 rounded-lg shadow-xl w-full overflow-hidden ${
              size === 'sm' ? 'max-w-sm max-h-[90vh]' :
              size === 'md' ? 'max-w-md max-h-[90vh]' :
              size === 'lg' ? 'max-w-lg max-h-[90vh]' :
              size === 'xl' ? 'max-w-xl max-h-[90vh]' :
              size === '2xl' ? 'max-w-2xl max-h-[90vh]' :
              size === 'full' ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-md max-h-[90vh]'
            }`}>
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
                <h2 className="text-xl font-semibold text-dark-800 dark:text-gray-100 truncate mr-4">
                  {title}
                </h2>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className={`overflow-auto ${
                size === 'full' ? 'max-h-[85vh] p-4' : 'max-h-[70vh] p-6'
              }`}>
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};