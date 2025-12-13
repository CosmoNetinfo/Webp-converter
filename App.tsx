
import React, { useState, useCallback, useRef } from 'react';
import type { ProcessedImage, GalleryItem } from './types';
import { saveToGallery } from './db';
import Gallery from './Gallery';

// --- Helper Functions ---
const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getExtensionFromMimeType = (mimeType: string): string => {
  switch (mimeType) {
    case 'image/webp': return 'webp';
    case 'image/avif': return 'avif';
    case 'image/jpeg': return 'jpg';
    case 'image/png': return 'png';
    default: return 'img';
  }
};

interface ResizeConfig {
  mode: 'original' | 'percentage' | 'dimensions';
  width?: number;
  height?: number;
  percentage?: number;
  maintainAspectRatio?: boolean;
}

const convertImage = (file: File, format: string, quality: number, resizeConfig: ResizeConfig, lossless: boolean): Promise<{ blob: Blob, width: number, height: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let targetWidth = img.width;
        let targetHeight = img.height;

        // Calculate new dimensions
        if (resizeConfig.mode === 'percentage' && resizeConfig.percentage) {
          const ratio = resizeConfig.percentage / 100;
          targetWidth = Math.max(1, Math.round(img.width * ratio));
          targetHeight = Math.max(1, Math.round(img.height * ratio));
        } else if (resizeConfig.mode === 'dimensions') {
          const w = resizeConfig.width;
          const h = resizeConfig.height;
          const ratio = img.width / img.height;

          if (w && h) {
            if (resizeConfig.maintainAspectRatio) {
              // Fit within box (contain logic)
              const scale = Math.min(w / img.width, h / img.height);
              targetWidth = Math.round(img.width * scale);
              targetHeight = Math.round(img.height * scale);
            } else {
              // Stretch
              targetWidth = w;
              targetHeight = h;
            }
          } else if (w) {
            targetWidth = w;
            if (resizeConfig.maintainAspectRatio) {
              targetHeight = Math.round(w / ratio);
            }
          } else if (h) {
            targetHeight = h;
            if (resizeConfig.maintainAspectRatio) {
              targetWidth = Math.round(h * ratio);
            }
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        
        // High quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        // Note: Canvas API automatically strips metadata (EXIF) when exporting to Blob.
        // There is no standard flag to preserve it, so "Strip Metadata" is implicitly true.
        
        const outputQuality = lossless ? 1.0 : quality;

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, width: targetWidth, height: targetHeight });
            } else {
              reject(new Error('Canvas toBlob returned null'));
            }
          },
          format,
          outputQuality
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

// --- SVG Icons ---

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const ArchiveBoxIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);

const LockOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const LockClosedIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const AdjustmentsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5" />
  </svg>
);


// --- Components ---

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
}
const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };
  
  return (
    <div 
      className={`w-full max-w-4xl mx-auto border-4 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${isDragging ? 'border-sky-400 bg-slate-800' : 'border-slate-600 hover:border-sky-500 hover:bg-slate-800/50'}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <UploadIcon className="w-16 h-16 mx-auto text-slate-500 mb-4"/>
      <p className="text-xl font-semibold">Drag & Drop images here</p>
      <p className="text-slate-400">Supported: JPG, PNG, GIF, BMP, WebP, AVIF</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/png, image/jpeg, image/gif, image/bmp, image/webp, image/avif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};


interface ImageCardProps {
  image: ProcessedImage;
  targetFormat: string;
  onRename: (id: string, newName: string) => void;
  onConvert: (id: string) => void;
  onRemove: (id: string) => void;
  onSave: (id: string) => void;
}
const ImageCard: React.FC<ImageCardProps> = ({ image, targetFormat, onRename, onConvert, onRemove, onSave }) => {
  
  // If conversion is done, use the format it was converted to. Otherwise, use the current global target.
  const activeFormat = image.status === 'done' && image.convertedFormat ? image.convertedFormat : targetFormat;
  const extension = getExtensionFromMimeType(activeFormat);

  const handleDownload = () => {
    if (!image.convertedUrl) return;
    const a = document.createElement('a');
    a.href = image.convertedUrl;
    a.download = `${image.newName}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getStatusIndicator = () => {
    switch(image.status) {
      case 'pending':
        return <button onClick={() => onConvert(image.id)} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-md transition-colors">Convert</button>;
      case 'converting':
        return <div className="flex items-center justify-center text-slate-300"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sky-400 mr-2"></div>Converting...</div>;
      case 'done':
        return <div className="text-green-400 flex items-center justify-center"><CheckCircleIcon className="w-5 h-5 mr-2"/>Done</div>;
      case 'error':
        return <div className="text-red-400 flex items-center justify-center text-center text-xs" title={image.error}><XCircleIcon className="w-5 h-5 mr-1 mb-0.5 inline"/>{image.error || "Error"}</div>;
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg transition-all hover:shadow-sky-500/20">
      <div className="relative">
        <img src={image.previewUrl} alt={image.originalFile.name} className="w-full h-48 object-cover"/>
        <button onClick={() => onRemove(image.id)} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors" title="Remove">
          <TrashIcon className="w-5 h-5"/>
        </button>
        {image.status === 'done' && (
           <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-green-400 font-mono uppercase">
             {extension}
           </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center bg-slate-900 rounded-md">
          <input 
            type="text" 
            value={image.newName}
            onChange={(e) => onRename(image.id, e.target.value)}
            className="bg-transparent w-full p-2 focus:outline-none min-w-0"
          />
          <span className="text-slate-500 p-2 pr-3 select-none">.{extension}</span>
        </div>
        <div className="flex justify-between items-start text-sm">
           <div className="text-slate-400">
             <div className="text-xs uppercase tracking-wider mb-0.5">Original</div>
             <div>{image.width} x {image.height}</div>
             <div className="font-mono text-xs">{formatBytes(image.originalSize)}</div>
           </div>
           {image.status === 'done' && (
              <div className="text-green-400 text-right">
                <div className="text-xs uppercase tracking-wider mb-0.5">Converted</div>
                <div>{image.convertedWidth} x {image.convertedHeight}</div>
                <div className="font-mono text-xs">{formatBytes(image.convertedSize || 0)}</div>
              </div>
           )}
        </div>
        
        <div className="pt-2 flex gap-2">
          {image.status === 'done' ? (
             <>
              <button onClick={handleDownload} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-2 rounded-md transition-colors flex items-center justify-center" title="Download">
                <DownloadIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={() => onSave(image.id)} 
                disabled={image.isSaved}
                className={`flex-1 font-bold py-2 px-2 rounded-md transition-colors flex items-center justify-center ${image.isSaved ? 'bg-slate-600 text-slate-400 cursor-default' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                title={image.isSaved ? "Saved to Gallery" : "Save to Gallery"}
              >
                {image.isSaved ? <CheckCircleIcon className="w-5 h-5" /> : <ArchiveBoxIcon className="w-5 h-5" />}
              </button>
             </>
          ) : getStatusIndicator()}
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [view, setView] = useState<'converter' | 'gallery'>('converter');
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [quality, setQuality] = useState(0.8);
  const [outputFormat, setOutputFormat] = useState('image/webp');
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resize State
  const [resizeMode, setResizeMode] = useState<'original' | 'percentage' | 'dimensions'>('original');
  const [resizeWidth, setResizeWidth] = useState<string>('');
  const [resizeHeight, setResizeHeight] = useState<string>('');
  const [resizePercentage, setResizePercentage] = useState<number>(100);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);

  // Optimization State
  const [stripMetadata, setStripMetadata] = useState<boolean>(true);
  const [lossless, setLossless] = useState<boolean>(false);

  const handleFilesSelected = async (files: File[]) => {
    // Process files to get dimensions using createImageBitmap
    const newImagesPromises = files
    .filter(file => file.type.startsWith('image/'))
    .map(async file => {
      let width = 0;
      let height = 0;
      try {
        const bmp = await createImageBitmap(file);
        width = bmp.width;
        height = bmp.height;
        bmp.close(); // Clean up
      } catch (e) {
        console.warn("Could not read image dimensions", e);
      }

      return {
        id: crypto.randomUUID(),
        originalFile: file,
        previewUrl: URL.createObjectURL(file),
        newName: file.name.split('.').slice(0, -1).join('.') || file.name,
        status: 'pending',
        originalSize: file.size,
        width,
        height
      } as ProcessedImage;
    });

    const newImages = await Promise.all(newImagesPromises);
    setImages(prev => [...prev, ...newImages]);
  };

  const handleRename = (id: string, newName: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, newName } : img));
  };
  
  const handleRemove = (id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if(imageToRemove) {
      URL.revokeObjectURL(imageToRemove.previewUrl);
      if(imageToRemove.convertedUrl) {
        URL.revokeObjectURL(imageToRemove.convertedUrl);
      }
    }
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const getResizeConfig = (): ResizeConfig => {
    return {
      mode: resizeMode,
      width: resizeWidth ? parseInt(resizeWidth) : undefined,
      height: resizeHeight ? parseInt(resizeHeight) : undefined,
      percentage: resizePercentage,
      maintainAspectRatio
    };
  };

  const handleConvert = useCallback(async (id: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, status: 'converting', error: undefined } : img));
    
    // Capture current settings at the start of conversion
    const formatToUse = outputFormat;
    const qualityToUse = quality;
    const currentResizeConfig = getResizeConfig();
    const isLossless = lossless;

    const imageToConvert = images.find(img => img.id === id);
    if (!imageToConvert) return;

    try {
      const { blob, width, height } = await convertImage(imageToConvert.originalFile, formatToUse, qualityToUse, currentResizeConfig, isLossless);
      const convertedUrl = URL.createObjectURL(blob);
      setImages(prev => prev.map(img => img.id === id ? { 
        ...img, 
        status: 'done', 
        convertedUrl, 
        convertedSize: blob.size,
        convertedWidth: width,
        convertedHeight: height,
        convertedFormat: formatToUse,
        isSaved: false 
      } : img));
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown conversion error';
      setImages(prev => prev.map(img => img.id === id ? { ...img, status: 'error', error: errorMessage } : img));
    }
  }, [images, quality, outputFormat, resizeMode, resizeWidth, resizeHeight, resizePercentage, maintainAspectRatio, lossless]);

  const handleConvertAll = async () => {
    setIsProcessingAll(true);
    // Only convert pending images
    const pendingImages = images.filter(img => img.status === 'pending');
    for (const image of pendingImages) {
      setImages(prev => prev.map(img => img.id === image.id ? { ...img, status: 'converting', error: undefined } : img));
      
      const currentResizeConfig = getResizeConfig();

      try {
        const { blob, width, height } = await convertImage(image.originalFile, outputFormat, quality, currentResizeConfig, lossless);
        const convertedUrl = URL.createObjectURL(blob);
        setImages(prev => prev.map(img => img.id === image.id ? { 
          ...img, 
          status: 'done', 
          convertedUrl, 
          convertedSize: blob.size,
          convertedWidth: width,
          convertedHeight: height,
          convertedFormat: outputFormat,
          isSaved: false 
        } : img));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
        setImages(prev => prev.map(img => img.id === image.id ? { ...img, status: 'error', error: errorMessage } : img));
      }
    }
    setIsProcessingAll(false);
  };

  const handleSaveToGallery = async (id: string) => {
    const img = images.find(i => i.id === id);
    if (!img || !img.convertedUrl || img.status !== 'done') return;

    try {
      const response = await fetch(img.convertedUrl);
      const blob = await response.blob();
      
      const galleryItem: GalleryItem = {
        id: crypto.randomUUID(),
        name: img.newName,
        blob: blob,
        format: img.convertedFormat || 'image/webp',
        date: Date.now(),
        width: img.convertedWidth || 0,
        height: img.convertedHeight || 0,
        size: blob.size
      };

      await saveToGallery(galleryItem);
      setImages(prev => prev.map(i => i.id === id ? { ...i, isSaved: true } : i));
    } catch (e) {
      console.error("Failed to save to gallery", e);
      alert("Failed to save image to gallery database.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500 mb-4">WebP & AVIF Converter</h1>
          
          {/* View Toggles */}
          <div className="inline-flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button 
              onClick={() => setView('converter')}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${view === 'converter' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
            >
              Converter
            </button>
            <button 
              onClick={() => setView('gallery')}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${view === 'gallery' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
            >
              Gallery
            </button>
          </div>
        </header>

        <main>
          {view === 'gallery' ? (
            <Gallery />
          ) : (
            <>
              {images.length === 0 ? (
                <FileUploader onFilesSelected={handleFilesSelected} />
              ) : (
                <>
                  {/* Controls Bar */}
                  <div className="bg-slate-800/50 rounded-xl p-6 mb-8 border border-slate-700/50 flex flex-col xl:flex-row gap-6 justify-between items-start">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                        
                        {/* 1. Format */}
                        <div>
                          <label className="block mb-2 font-medium text-slate-300 text-xs uppercase tracking-wide">Output Format</label>
                          <div className="flex bg-slate-700 rounded-lg p-1">
                            <button 
                              onClick={() => setOutputFormat('image/webp')} 
                              className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-all ${outputFormat === 'image/webp' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-600'}`}
                            >
                              WebP
                            </button>
                            <button 
                              onClick={() => setOutputFormat('image/avif')} 
                              className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-all ${outputFormat === 'image/avif' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-600'}`}
                            >
                              AVIF
                            </button>
                          </div>
                        </div>

                        {/* 2. Resize Settings */}
                        <div className="lg:col-span-1">
                           <label className="block mb-2 font-medium text-slate-300 text-xs uppercase tracking-wide flex justify-between">
                             <span>Resize</span>
                           </label>
                           <div className="space-y-2">
                             {/* Resize Mode Selector */}
                             <select 
                               value={resizeMode}
                               onChange={(e) => setResizeMode(e.target.value as any)}
                               className="w-full bg-slate-700 text-white text-sm rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-600"
                             >
                               <option value="original">Original Size</option>
                               <option value="percentage">Scale Percentage</option>
                               <option value="dimensions">Custom Dimensions</option>
                             </select>

                             {/* Dynamic Inputs */}
                             {resizeMode === 'percentage' && (
                               <div className="flex items-center gap-2 bg-slate-700 p-2 rounded-lg border border-slate-600">
                                 <input 
                                   type="range" 
                                   min="1" max="200" 
                                   value={resizePercentage}
                                   onChange={(e) => setResizePercentage(parseInt(e.target.value))}
                                   className="w-full accent-sky-500 h-1.5 bg-slate-500 rounded-lg appearance-none cursor-pointer"
                                 />
                                 <span className="text-sm font-mono w-12 text-right">{resizePercentage}%</span>
                               </div>
                             )}

                             {resizeMode === 'dimensions' && (
                               <div className="flex gap-2 items-center">
                                  <input 
                                    type="number" 
                                    placeholder="W" 
                                    value={resizeWidth}
                                    onChange={(e) => setResizeWidth(e.target.value)}
                                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  />
                                  <span className="text-slate-500">x</span>
                                  <input 
                                    type="number" 
                                    placeholder="H" 
                                    value={resizeHeight}
                                    onChange={(e) => setResizeHeight(e.target.value)}
                                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  />
                                  <button 
                                    onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
                                    className={`p-2 rounded-lg border ${maintainAspectRatio ? 'bg-sky-600/20 border-sky-500 text-sky-400' : 'bg-slate-700 border-slate-600 text-slate-400'}`}
                                    title="Maintain Aspect Ratio"
                                  >
                                    {maintainAspectRatio ? <LockClosedIcon className="w-4 h-4" /> : <LockOpenIcon className="w-4 h-4" />}
                                  </button>
                               </div>
                             )}
                           </div>
                        </div>

                        {/* 3. Optimization */}
                        <div className="lg:col-span-1">
                          <label className="block mb-2 font-medium text-slate-300 text-xs uppercase tracking-wide">
                            Optimization
                          </label>
                          <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600 space-y-2">
                            <label className="flex items-center justify-between cursor-pointer group">
                              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Strip Metadata</span>
                              <div className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={stripMetadata} onChange={(e) => setStripMetadata(e.target.checked)} className="sr-only peer" />
                                <div className="w-9 h-5 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                              </div>
                            </label>
                            
                            <label className="flex items-center justify-between cursor-pointer group">
                              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Lossless</span>
                              <div className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={lossless} onChange={(e) => setLossless(e.target.checked)} className="sr-only peer" />
                                <div className="w-9 h-5 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* 4. Quality */}
                        <div className={lossless ? 'opacity-50 pointer-events-none' : ''}>
                          <label htmlFor="quality" className="block mb-2 font-medium text-slate-300 text-xs uppercase tracking-wide flex justify-between">
                            <span>Quality</span>
                            <span className={`font-bold ${outputFormat === 'image/webp' ? 'text-sky-400' : 'text-indigo-400'}`}>{lossless ? 'Max' : `${Math.round(quality * 100)}%`}</span>
                          </label>
                          <div className="bg-slate-700 p-3 rounded-lg border border-slate-600">
                            <input 
                              type="range" 
                              id="quality"
                              min="0.1"
                              max="1"
                              step="0.05"
                              value={quality}
                              onChange={e => setQuality(parseFloat(e.target.value))}
                              disabled={lossless}
                              className={`w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer ${outputFormat === 'image/webp' ? 'accent-sky-500' : 'accent-indigo-500'}`}
                            />
                          </div>
                        </div>

                      </div>

                      {/* Actions Group */}
                      <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-4 xl:mt-6">
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 sm:flex-none bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors border border-slate-600 hover:border-slate-500"
                        >
                          Add More
                        </button>
                        <input 
                          ref={fileInputRef} 
                          type="file" 
                          multiple 
                          accept="image/png, image/jpeg, image/gif, image/bmp, image/webp, image/avif" 
                          className="hidden" 
                          onChange={(e) => e.target.files && handleFilesSelected(Array.from(e.target.files))}
                        />
                        <button 
                          onClick={handleConvertAll}
                          disabled={isProcessingAll || !images.some(img => img.status === 'pending')}
                          className={`flex-1 sm:flex-none font-bold py-3 px-8 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg whitespace-nowrap ${outputFormat === 'image/webp' ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-900/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20'}`}
                        >
                          {isProcessingAll && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>}
                          Convert All
                        </button>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {images.map(image => (
                      <ImageCard 
                        key={image.id} 
                        image={image} 
                        targetFormat={outputFormat}
                        onRename={handleRename} 
                        onConvert={handleConvert}
                        onRemove={handleRemove}
                        onSave={handleSaveToGallery}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
