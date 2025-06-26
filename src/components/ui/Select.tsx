import React, { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <select
      className={`block w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm 
                 focus:outline-none focus:ring-primary-500 focus:border-primary-500 
                 text-gray-900 dark:text-white bg-white dark:bg-dark-800 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};
