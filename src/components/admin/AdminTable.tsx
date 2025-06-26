import React from 'react';
import { X } from '../../utils/icons';

interface Column<T> {
  header: string;
  accessor: keyof T | ((data: T) => React.ReactNode);
  className?: string;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  actions?: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

export function AdminTable<T>({
  columns,
  data,
  actions,
  keyExtractor,
  loading = false,
  error = null,
  emptyMessage = 'No hay elementos para mostrar'
}: AdminTableProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg shadow-sm">
        <div className="flex">
          <X className="w-5 h-5 mr-2 flex-shrink-0 text-red-500" />
          <div>
            <p className="font-medium">Error al cargar los datos</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-dark-400 italic">
        {emptyMessage}
      </div>
    );
  }  return (
    <div className="overflow-x-auto w-full rounded-lg bg-white dark:bg-dark-900 shadow-sm">
      <table className="w-full divide-y divide-gray-200 dark:divide-dark-700 rounded-lg overflow-hidden">
        <thead className="bg-gray-50 dark:bg-dark-800">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={`px-3 py-2.5 text-left text-xs font-medium text-gray-600 dark:text-dark-300 uppercase tracking-wider ${column.className || ''}`}
              >
                {column.header}
              </th>
            ))}
            {actions && (
              <th className="px-2 py-2.5 text-right text-xs font-medium text-gray-600 dark:text-dark-300 uppercase tracking-wider w-20 md:w-24">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-dark-900 divide-y divide-gray-200 dark:divide-dark-700">
          {data.map((item) => (
            <tr key={keyExtractor(item)} className="hover:bg-gray-50 hover:bg-opacity-70 dark:hover:bg-dark-800 transition-colors duration-150">
              {columns.map((column, colIndex) => (
                <td key={colIndex} className={`px-3 py-2.5 ${column.className || ''} text-sm`}>
                  <div className="line-clamp-2">
                    {typeof column.accessor === 'function'
                      ? column.accessor(item)
                      : String(item[column.accessor] || '')}
                  </div>
                </td>
              ))}
              {actions && (
                <td className="px-2 py-2 text-right w-20 md:w-24">
                  {actions(item)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
