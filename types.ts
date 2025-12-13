
export interface ProcessedImage {
  id: string;
  originalFile: File;
  previewUrl: string;
  newName: string;
  status: 'pending' | 'converting' | 'done' | 'error';
  convertedUrl?: string;
  originalSize: number;
  convertedSize?: number;
  width: number;
  height: number;
  convertedWidth?: number;
  convertedHeight?: number;
  error?: string;
  convertedFormat?: string;
  isSaved?: boolean;
}

export interface GalleryItem {
  id: string;
  name: string;
  blob: Blob;
  format: string;
  date: number;
  width: number;
  height: number;
  size: number;
}
