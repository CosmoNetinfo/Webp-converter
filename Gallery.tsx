import React, { useEffect, useState, useRef } from 'react';
import { GalleryItem } from './types';
import { getGallery, deleteFromGallery } from './db';

// Reuse helpers/icons or import them if extracted. 
// For simplicity, defining specific ones here to avoid huge refactors, 
// but in a real app these would be shared.

const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

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

const EmptyGalleryIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  
  // Ref to track latest previewUrls for cleanup
  const previewUrlsRef = useRef(previewUrls);
  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  useEffect(() => {
    loadGallery();
    // Cleanup URLs on unmount
    return () => {
      Object.values(previewUrlsRef.current).forEach(url => URL.revokeObjectURL(url as string));
    };
  }, []);

  const loadGallery = async () => {
    setLoading(true);
    try {
      const galleryItems = await getGallery();
      setItems(galleryItems);
      
      // Create preview URLs
      const newUrls: Record<string, string> = {};
      galleryItems.forEach(item => {
        if (!previewUrls[item.id]) {
          newUrls[item.id] = URL.createObjectURL(item.blob);
        } else {
          newUrls[item.id] = previewUrls[item.id];
        }
      });
      setPreviewUrls(newUrls);
    } catch (e) {
      console.error("Failed to load gallery", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      await deleteFromGallery(id);
      URL.revokeObjectURL(previewUrls[id]);
      const newUrls = { ...previewUrls };
      delete newUrls[id];
      setPreviewUrls(newUrls);
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleDownload = (item: GalleryItem) => {
    const url = previewUrls[item.id];
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    // item.format is strictly MIME type, convert to ext
    const ext = item.format.split('/')[1] || 'webp'; 
    a.download = `${item.name}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400">Loading gallery...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <EmptyGalleryIcon className="w-24 h-24 mb-4 opacity-50"/>
        <p className="text-xl">Your gallery is empty.</p>
        <p className="text-sm">Convert some images and save them to see them here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
      {items.map(item => (
        <div key={item.id} className="bg-slate-800 rounded-lg overflow-hidden shadow-lg transition-all hover:shadow-indigo-500/20 group">
          <div className="relative aspect-square bg-slate-900">
            {previewUrls[item.id] ? (
              <img src={previewUrls[item.id]} alt={item.name} className="w-full h-full object-cover"/>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600">No Preview</div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button 
                onClick={() => handleDownload(item)} 
                className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-full transition-transform hover:scale-110"
                title="Download"
              >
                <DownloadIcon className="w-6 h-6"/>
              </button>
              <button 
                onClick={() => handleDelete(item.id)} 
                className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-full transition-transform hover:scale-110"
                title="Delete"
              >
                <TrashIcon className="w-6 h-6"/>
              </button>
            </div>
            <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-indigo-400 font-mono uppercase">
               {item.format.split('/')[1] || 'img'}
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-white truncate mb-1" title={item.name}>{item.name}</h3>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{new Date(item.date).toLocaleDateString()}</span>
              <span className="font-mono">{formatBytes(item.size)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}