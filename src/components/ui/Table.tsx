import React, { ReactNode } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
  striped?: boolean;
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  highlight?: boolean;
}

interface TableHeaderCellProps {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
  colSpan?: number;
  align?: 'left' | 'center' | 'right';
  highlight?: boolean;
}

const TableHeader: React.FC<TableHeaderProps> = ({ children, className = '' }) => {
  return <thead className={`bg-gray-100 dark:bg-dark-800 ${className}`}>{children}</thead>;
};

const TableBody: React.FC<TableBodyProps> = ({ children, className = '' }) => {
  return <tbody className={`bg-white dark:bg-dark-900 ${className}`}>{children}</tbody>;
};

const TableRow: React.FC<TableRowProps> = ({ children, className = '', highlight = false }) => {
  return (
    <tr 
      className={`
        hover:bg-gray-50 dark:hover:bg-dark-800 
        transition-colors duration-150 
        ${highlight ? 'bg-blue-50 dark:bg-blue-900/20' : ''} 
        ${className}
      `}
    >
      {children}
    </tr>
  );
};

const TableHeaderCell: React.FC<TableHeaderCellProps> = ({ 
  children, 
  className = '',
  align = 'center'
}) => {
  const textAlign = {
    'left': 'text-left',
    'center': 'text-center',
    'right': 'text-right'
  };

  return (
    <th 
      scope="col" 
      className={`
        px-4 py-3.5 
        ${textAlign[align]}
        text-sm font-semibold text-gray-900 dark:text-gray-100 
        border-b border-gray-200 dark:border-gray-700
        ${className}
      `}
    >
      {children}
    </th>
  );
};

const TableCell: React.FC<TableCellProps> = ({ 
  children, 
  className = '', 
  colSpan, 
  align = 'center',
  highlight = false 
}) => {
  const textAlign = {
    'left': 'text-left',
    'center': 'text-center',
    'right': 'text-right'
  };

  return (
    <td 
      className={`
        px-4 py-4 text-sm 
        ${textAlign[align]}
        ${highlight ? 'font-medium text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'} 
        border-b border-gray-100 dark:border-gray-800
        ${className}
      `}
      colSpan={colSpan}
    >
      {children}
    </td>
  );
};

export const Table: React.FC<TableProps> & {
  Header: typeof TableHeader;
  Body: typeof TableBody;
  Row: typeof TableRow;
  HeaderCell: typeof TableHeaderCell;
  Cell: typeof TableCell;
} = ({ children, className = '', striped = false }) => {
  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className={`
        min-w-full 
        bg-white dark:bg-dark-900 
        border border-gray-200 dark:border-gray-700
        ${striped ? '[&>tbody>tr:nth-child(even)]:bg-gray-50 [&>tbody>tr:nth-child(even)]:dark:bg-dark-800/50' : ''}
        ${className}
      `}>
        {children}
      </table>
    </div>
  );
};

Table.Header = TableHeader;
Table.Body = TableBody;
Table.Row = TableRow;
Table.HeaderCell = TableHeaderCell;
Table.Cell = TableCell;
