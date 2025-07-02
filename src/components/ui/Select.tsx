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
                 text-gray-900 dark:text-white bg-white dark:bg-dark-800 
                 appearance-none bg-no-repeat
                 bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20viewBox%3d%220%200%2024%2024%22%20fill%3d%22none%22%20stroke%3d%22currentColor%22%20stroke-width%3d%222%22%20stroke-linecap%3d%22round%22%20stroke-linejoin%3d%22round%22%3e%3cpolyline%20points%3d%226%209%2012%2015%2018%209%22%3e%3c%2fpolyline%3e%3c%2fsvg%3e')] 
                 bg-[length:1em_1em] [background-position:right_0.5em_center] [padding-right:2.5em]
                 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};
