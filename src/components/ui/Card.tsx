import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false 
}) => {
  const Component = hover ? motion.div : 'div';
  const motionProps = hover ? {
    whileHover: { y: -2, scale: 1.02 },
    transition: { duration: 0.2 }
  } : {};

  return (
    <Component
      className={`
        bg-white dark:bg-dark-800 rounded-lg shadow-md border border-gray-200 dark:border-dark-700
        ${hover ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...motionProps}
    >
      {children}
    </Component>
  );
};