import React from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

interface AdminFormProps {
  fields: FormField[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitText: string;
  loading?: boolean;
  error?: string | null;
}

export const AdminForm: React.FC<AdminFormProps> = ({
  fields,
  values,
  onChange,
  onSubmit,
  submitText,
  loading = false,
  error = null,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded">
          {error}
        </div>
      )}

      {fields.map((field) => (
        <div key={field.name} className="space-y-1">          <label
            htmlFor={field.name}
            className="block text-sm font-medium text-dark-700 dark:text-secondary-300"
          >
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>

          {field.type === 'select' ? (
            <select
              id={field.name}
              name={field.name}
              value={values[field.name] || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              required={field.required}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-dark-700 dark:bg-dark-800 rounded-md shadow-sm focus:outline-none focus:ring-primary-400 focus:border-primary-400"
            >
              <option value="" disabled>
                Seleccionar...
              </option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              id={field.name}
              name={field.name}
              value={values[field.name] || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              required={field.required}
              placeholder={field.placeholder}
              rows={3}
              className="mt-1 block w-full border border-gray-300 dark:border-dark-700 dark:bg-dark-800 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-400 focus:border-primary-400"
            />
          ) : (
            <Input
              id={field.name}
              name={field.name}
              type={field.type}
              value={values[field.name] || (field.type === 'number' ? 0 : '')}
              onChange={(e) => onChange(field.name, e.target.value)}
              required={field.required}
              placeholder={field.placeholder}
            />
          )}
        </div>
      ))}

      <div className="pt-3">
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Procesando...' : submitText}
        </Button>
      </div>
    </form>
  );
};
