export interface Document {
  id: number;
  title: string;
  description: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  category: DocumentCategory;
  created_at: string;
  updated_at: string;
  uploaded_by: number;
  uploaded_by_name?: string;
}

export type DocumentCategory = 
  | 'acta'
  | 'legal'
  | 'normativa'
  | 'reglamento'
  | 'estatuto'
  | 'otro';

export const DOCUMENT_CATEGORIES = [
  { value: 'acta', label: 'Actas de reuniones' },
  { value: 'legal', label: 'Documentos legales' },
  { value: 'normativa', label: 'Normativas' },
  { value: 'reglamento', label: 'Reglamentos' },
  { value: 'estatuto', label: 'Estatutos' },
  { value: 'otro', label: 'Otros documentos' }
];

export interface DocumentFilters {
  title?: string;
  category?: DocumentCategory;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
