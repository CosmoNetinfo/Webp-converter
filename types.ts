
export interface ProcessedImage {
  id: string;
  originalFile: File;
  previewUrl: string;
  newName: string;
  status: 'pending' | 'converting' | 'done' | 'error';
  convertedUrl?: string;
  originalSize: number;
  convertedSize?: number;
  error?: string;
  convertedFormat?: string;
  // Cloud state
  isUploading?: boolean;
  cloudUrl?: string;
}

export interface CloudImage {
  id: string;
  created_at: string;
  original_name: string;
  url: string;
  format: string;
  size: number;
}