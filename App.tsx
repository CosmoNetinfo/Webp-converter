
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { ProcessedImage } from './types';
import { supabase, isSupabaseConfigured, updateSupabaseConfig } from './supabaseClient';
import { CloudGallery } from './CloudGallery';

// --- Components ---
const SettingsPanel: React.FC<{ onSave: () => void }> = ({ onSave }) => {
  const [url, setUrl] = useState(localStorage.getItem('supabaseUrl') || '');
  const [key, setKey] = useState(localStorage.getItem('supabaseKey') || '');
  const [envUsed, setEnvUsed] = useState(!localStorage.getItem('supabaseUrl'));

  const handleSave = () => {
    updateSupabaseConfig(url, key);
    alert('Configuration saved! Cloud features updated.');
    // Force refresh or just callback
    onSave();
  };

  const handleClear = () => {
    updateSupabaseConfig('', '');
    setUrl('');
    setKey('');
    setEnvUsed(true);
    alert('Configuration cleared. Reverting to default (if available).');
    onSave();
  };

  return (
    <div className="max-w-2xl mx-auto bg-slate-900/60 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
      <h2 className="text-2xl font-bold mb-6 text-white text-center">Cloud Configuration</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-slate-400 text-sm font-medium mb-2">Supabase Project URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-project.supabase.co"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-slate-400 text-sm font-medium mb-2">Supabase Anon Key</label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="your-anon-key"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-cyan-900/20"
          >
            Save Configuration
          </button>
          <button
            onClick={handleClear}
            className="px-6 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 font-medium py-3 rounded-xl transition-all border border-white/5 hover:border-red-500/30"
          >
            Reset to Defaults
          </button>
        </div>

        <div className="mt-8 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 text-sm text-blue-200">
          <p className="font-semibold mb-1">Why configure this?</p>
          <p className="text-blue-200/70">
            Entering your own Supabase credentials allows you to use your personal cloud storage for images.
            This data is saved locally in your browser/app and is never sent to our servers.
          </p>
        </div>
      </div>
    </div>
  );
};

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

const convertImage = (file: File, format: string, quality: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              if (blob.type !== format) {
                reject(new Error(`Browser does not support converting to ${format} (got ${blob.type})`));
              } else {
                resolve(blob);
              }
            } else {
              reject(new Error('Canvas toBlob returned null'));
            }
          },
          format,
          quality
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

const CloudIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
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
      <UploadIcon className="w-16 h-16 mx-auto text-slate-500 mb-4" />
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
  onUpload: (id: string) => void;
}
const ImageCard: React.FC<ImageCardProps> = ({ image, targetFormat, onRename, onConvert, onRemove, onUpload }) => {
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
    switch (image.status) {
      case 'pending':
        return <button onClick={() => onConvert(image.id)} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-md transition-colors">Convert</button>;
      case 'converting':
        return <div className="flex items-center justify-center text-slate-300"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sky-400 mr-2"></div>Converting...</div>;
      case 'done':
        return <div className="text-green-400 flex items-center justify-center"><CheckCircleIcon className="w-5 h-5 mr-2" />Done</div>;
      case 'error':
        return <div className="text-red-400 flex items-center justify-center text-center text-xs" title={image.error}><XCircleIcon className="w-5 h-5 mr-1 mb-0.5 inline" />{image.error || "Error"}</div>;
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg transition-all hover:shadow-sky-500/20">
      <div className="relative">
        <img src={image.previewUrl} alt={image.originalFile.name} className="w-full h-48 object-cover" />
        <button onClick={() => onRemove(image.id)} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors">
          <TrashIcon className="w-5 h-5" />
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
        <div className="text-sm text-slate-400 flex justify-between">
          <span>Original:</span>
          <span className="font-mono">{formatBytes(image.originalSize)}</span>
        </div>
        {image.convertedSize && (
          <div className="text-sm text-green-400 flex justify-between">
            <span>Converted:</span>
            <span className="font-mono">{formatBytes(image.convertedSize)}</span>
          </div>
        )}
        <div className="pt-2 flex flex-col gap-2">
          {image.status === 'done' ? (
            <>
              <button onClick={handleDownload} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center">
                <DownloadIcon className="w-5 h-5 mr-2" /> Download
              </button>
              {isSupabaseConfigured() && (
                <button
                  onClick={() => onUpload(image.id)}
                  disabled={image.isUploading || !!image.cloudUrl}
                  className={`w-full font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center ${image.cloudUrl ? 'bg-indigo-900/50 text-indigo-300 cursor-default' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                >
                  {image.isUploading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : image.cloudUrl ? (
                    <>Uploaded <CheckCircleIcon className="w-5 h-5 ml-2" /></>
                  ) : (
                    <><CloudIcon className="w-5 h-5 mr-2" /> Save to Cloud</>
                  )}
                </button>
              )}
            </>
          ) : getStatusIndicator()}
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [quality, setQuality] = useState(0.8);
  const [outputFormat, setOutputFormat] = useState('image/webp');
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'converter' | 'cloud' | 'settings'>('converter');

  // Force re-render when config changes
  const [configVersion, setConfigVersion] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (files: File[]) => {
    const newImages: ProcessedImage[] = files
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: crypto.randomUUID(),
        originalFile: file,
        previewUrl: URL.createObjectURL(file),
        newName: file.name.split('.').slice(0, -1).join('.') || file.name,
        status: 'pending',
        originalSize: file.size,
      }));

    setImages(prev => [...prev, ...newImages]);
  };

  const handleRename = (id: string, newName: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, newName } : img));
  };

  const handleRemove = (id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.previewUrl);
      if (imageToRemove.convertedUrl) {
        URL.revokeObjectURL(imageToRemove.convertedUrl);
      }
    }
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleConvert = useCallback(async (id: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, status: 'converting', error: undefined } : img));

    // Capture current settings at the start of conversion
    const formatToUse = outputFormat;
    const qualityToUse = quality;

    const imageToConvert = images.find(img => img.id === id);
    if (!imageToConvert) return;

    try {
      const blob = await convertImage(imageToConvert.originalFile, formatToUse, qualityToUse);
      const convertedUrl = URL.createObjectURL(blob);
      setImages(prev => prev.map(img => img.id === id ? {
        ...img,
        status: 'done',
        convertedUrl,
        convertedSize: blob.size,
        convertedFormat: formatToUse
      } : img));
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown conversion error';
      setImages(prev => prev.map(img => img.id === id ? { ...img, status: 'error', error: errorMessage } : img));
    }
  }, [images, quality, outputFormat]);

  const handleConvertAll = async () => {
    setIsProcessingAll(true);
    // Only convert pending images
    const pendingImages = images.filter(img => img.status === 'pending');
    for (const image of pendingImages) {
      setImages(prev => prev.map(img => img.id === image.id ? { ...img, status: 'converting', error: undefined } : img));

      try {
        const blob = await convertImage(image.originalFile, outputFormat, quality);
        const convertedUrl = URL.createObjectURL(blob);
        setImages(prev => prev.map(img => img.id === image.id ? {
          ...img,
          status: 'done',
          convertedUrl,
          convertedSize: blob.size,
          convertedFormat: outputFormat
        } : img));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
        setImages(prev => prev.map(img => img.id === image.id ? { ...img, status: 'error', error: errorMessage } : img));
      }
    }
    setIsProcessingAll(false);
  };

  const handleUpload = async (id: string) => {
    const imageToUpload = images.find(img => img.id === id);
    if (!imageToUpload || !imageToUpload.convertedUrl) return;

    setImages(prev => prev.map(img => img.id === id ? { ...img, isUploading: true } : img));

    try {
      // Fetch blob from blob URL
      const response = await fetch(imageToUpload.convertedUrl);
      const blob = await response.blob();
      const extension = getExtensionFromMimeType(imageToUpload.convertedFormat || 'image/webp');
      const fileName = `${Date.now()}_${imageToUpload.newName}.${extension}`;

      // Upload to Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, blob, {
          contentType: imageToUpload.convertedFormat
        });

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      // Insert into Table
      const { error: dbError } = await supabase
        .from('images')
        .insert({
          original_name: imageToUpload.newName,
          url: publicUrl,
          format: extension,
          size: blob.size
        });

      if (dbError) throw dbError;

      setImages(prev => prev.map(img => img.id === id ? {
        ...img,
        isUploading: false,
        cloudUrl: publicUrl
      } : img));

      alert('Upload successful!');

    } catch (error) {
      console.error('Upload failed:', error);
      const msg = error instanceof Error ? error.message : 'Upload failed';
      alert(`Error uploading: ${msg}`);
      setImages(prev => prev.map(img => img.id === id ? { ...img, isUploading: false } : img));
    }
  };

  return (
    <div className="min-h-screen bg-[#050510] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1c4b] via-[#050510] to-[#000000] text-slate-200 p-4 sm:p-8 selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-indigo-500/20 blur-[100px] -z-10 rounded-full pointer-events-none"></div>
          <h1 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-400 drop-shadow-sm mb-4">
            Cosmo Converter
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Transform your images into high-performance <span className="text-cyan-400 font-medium">WebP</span> & <span className="text-fuchsia-400 font-medium">AVIF</span> assets for the modern web.
          </p>

          <div className="flex justify-center flex-wrap gap-2 mt-8 border-b border-white/10 pb-1 w-fit mx-auto">
            <button
              onClick={() => setActiveTab('converter')}
              className={`px-6 py-3 font-medium text-sm tracking-wide transition-all relative ${activeTab === 'converter' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Converter
              {activeTab === 'converter' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)] rounded-full"></span>}
            </button>

            {/* Show Cloud Gallery ONLY if configured */}
            {isSupabaseConfigured() && (
              <button
                onClick={() => setActiveTab('cloud')}
                className={`px-6 py-3 font-medium text-sm tracking-wide transition-all relative ${activeTab === 'cloud' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Cloud Gallery
                {activeTab === 'cloud' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.7)] rounded-full"></span>}
              </button>
            )}

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 font-medium text-sm tracking-wide transition-all relative ${activeTab === 'settings' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Settings
              {activeTab === 'settings' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.7)] rounded-full"></span>}
            </button>
          </div>
        </header>

        <main>
          {activeTab === 'settings' ? (
            <SettingsPanel onSave={() => {
              setConfigVersion(v => v + 1); // Force re-render to pick up new config state
              // Optionally redirect to converter or stay here
            }} />
          ) : activeTab === 'cloud' ? (
            <CloudGallery key={configVersion} />
          ) : (
            <>
              {images.length === 0 ? (
                <FileUploader onFilesSelected={handleFilesSelected} />
              ) : (
                <>
                  {/* Controls Bar */}
                  <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 mb-10 flex flex-col xl:flex-row gap-8 items-center xl:items-end justify-between border border-white/10 shadow-2xl shadow-black/50">

                    {/* Settings Group */}
                    <div className="flex flex-col md:flex-row gap-8 w-full xl:w-auto items-center xl:items-end">
                      {/* Format Selector */}
                      <div className="w-full md:w-56">
                        <label className="block mb-3 font-semibold text-slate-400 text-xs uppercase tracking-wider">Output Format</label>
                        <div className="flex bg-black/40 rounded-xl p-1.5 border border-white/5">
                          <button
                            onClick={() => setOutputFormat('image/webp')}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${outputFormat === 'image/webp' ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                          >
                            WebP
                          </button>
                          <button
                            onClick={() => setOutputFormat('image/avif')}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${outputFormat === 'image/avif' ? 'bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white shadow-lg shadow-fuchsia-500/25' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                          >
                            AVIF
                          </button>
                        </div>
                      </div>

                      {/* Quality Slider */}
                      <div className="w-full md:w-72">
                        <label htmlFor="quality" className="block mb-3 font-semibold text-slate-400 text-xs uppercase tracking-wider flex justify-between">
                          <span>Quality</span>
                          <span className={`font-mono text-base ${outputFormat === 'image/webp' ? 'text-cyan-400' : 'text-fuchsia-400'}`}>{Math.round(quality * 100)}%</span>
                        </label>
                        <input
                          type="range"
                          id="quality"
                          min="0.1"
                          max="1"
                          step="0.05"
                          value={quality}
                          onChange={e => setQuality(parseFloat(e.target.value))}
                          className={`w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer ${outputFormat === 'image/webp' ? 'accent-cyan-400' : 'accent-fuchsia-400'}`}
                        />
                      </div>
                    </div>

                    {/* Actions Group */}
                    <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 sm:flex-none bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-8 rounded-xl transition-all border border-white/10 hover:border-white/20 backdrop-blur-sm"
                      >
                        Add Images
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
                        className={`flex-1 sm:flex-none font-bold py-3 px-10 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:translate-y-[-2px] active:translate-y-[0px] ${outputFormat === 'image/webp' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-cyan-500/25' : 'bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:shadow-fuchsia-500/25'}`}
                      >
                        {isProcessingAll && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>}
                        Convert All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {images.map(image => (
                      <ImageCard
                        key={image.id}
                        image={image}
                        targetFormat={outputFormat}
                        onRename={handleRename}
                        onConvert={handleConvert}
                        onRemove={handleRemove}
                        onUpload={handleUpload}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </main>

        <footer className="mt-24 text-center border-t border-white/5 pt-10 pb-6">
          <p className="text-slate-500 text-sm">
            Powered by{' '}
            <a
              href="https://www.cosmonet.info/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 hover:opacity-80 transition-opacity"
            >
              CosmoNet.info
            </a>
            {' '}di Daniele Spalletti
          </p>
        </footer>
      </div>
    </div>
  );
}
