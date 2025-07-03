import React from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AvatarPreview } from './AvatarPreview';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'tel' | 'date' | 'file';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  accept?: string;
}

interface AdminFormProps {
  fields: FormField[];
  values: Record<string, string | number | boolean | File | null>;
  onChange: (name: string, value: string | number | boolean | File | null) => void;
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
              value={String(values[field.name] || '')}
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
              value={String(values[field.name] || '')}
              onChange={(e) => onChange(field.name, e.target.value)}
              required={field.required}
              placeholder={field.placeholder}
              rows={3}
              className="mt-1 block w-full border border-gray-300 dark:border-dark-700 dark:bg-dark-800 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-400 focus:border-primary-400"
            />
          ) : field.type === 'file' ? (
            <div>
              {field.accept?.includes('image/') && (
                <div className="mb-3 flex items-center">
                  <div className="mr-3">
                    <AvatarPreview 
                      file={values[field.name] as File | null} 
                      size="sm"
                    />
                  </div>
                  {values[field.name] && (
                    <button
                      type="button"
                      onClick={() => onChange(field.name, null)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Eliminar imagen
                    </button>
                  )}
                </div>
              )}
              <input
                id={field.name}
                name={field.name}
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  onChange(field.name, file);
                }}
                required={field.required}
                accept={field.accept}
                className="mt-1 block w-full border border-gray-300 dark:border-dark-700 dark:bg-dark-800 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-400 focus:border-primary-400"
              />
              <p className="mt-1 text-sm text-gray-500">
                {field.accept?.includes('image/') && 'Formatos recomendados: JPG, PNG. Tamaño máximo: 2MB'}
              </p>
            </div>
          ) : (
            <Input
              id={field.name}
              name={field.name}
              type={field.type}
              value={field.type === 'number' 
                ? (values[field.name] !== null ? String(values[field.name]) : '0') 
                : (values[field.name] !== null && typeof values[field.name] !== 'boolean' && !(values[field.name] instanceof File) 
                  ? String(values[field.name]) 
                  : '')}
              onChange={(e) => {
                const value = field.type === 'number' ? parseFloat(e.target.value) : e.target.value;
                onChange(field.name, value);
              }}
              required={field.required}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              step={field.step}
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
