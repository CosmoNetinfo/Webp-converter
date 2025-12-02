
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
}