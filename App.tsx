
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

// ... (other components like FileUploader, etc.)

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
