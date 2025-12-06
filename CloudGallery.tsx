import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { CloudImage } from './types';

const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const CloudGallery: React.FC = () => {
    const [images, setImages] = useState<CloudImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [copyState, setCopyState] = useState<string | null>(null);

    const fetchImages = async () => {
        try {
            const { data, error } = await supabase
                .from('images')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setImages(data);
        } catch (error) {
            console.error('Error fetching cloud images:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();

        // Real-time subscription
        const channel = supabase
            .channel('public:images')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'images' }, (payload) => {
                setImages(prev => [payload.new as CloudImage, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const copyToClipboard = (url: string, id: string) => {
        navigator.clipboard.writeText(url);
        setCopyState(id);
        setTimeout(() => setCopyState(null), 2000);
    };

    const deleteImage = async (id: string, url: string) => {
        if (!confirm('Are you sure you want to delete this image from the cloud?')) return;

        try {
            // 1. Delete from Storage
            const path = url.split('/').pop(); // simplistic path extraction
            if (path) {
                const { error: storageError } = await supabase.storage.from('images').remove([path]);
                if (storageError) console.error('Storage delete error:', storageError);
            }

            // 2. Delete from DB
            const { error: dbError } = await supabase.from('images').delete().eq('id', id);
            if (dbError) throw dbError;

            setImages(prev => prev.filter(img => img.id !== id));
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('Failed to delete image');
        }
    };

    if (loading) return <div className="text-center py-8 text-slate-400">Loading cloud gallery...</div>;

    if (images.length === 0) return (
        <div className="text-center py-12 border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-800/30">
            <p className="text-slate-400">No images in cloud storage yet.</p>
        </div>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map(img => (
                <div key={img.id} className="bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-700 group">
                    <div className="relative h-48 bg-slate-900/50">
                        <img src={img.url} alt={img.original_name} className="w-full h-full object-contain" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                            <button
                                onClick={() => deleteImage(img.id, img.url)}
                                className="p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-md transition-colors"
                                title="Delete from cloud"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-white truncate flex-1" title={img.original_name}>{img.original_name}</h3>
                            <span className="text-xs text-slate-500 uppercase ml-2">{img.format}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>{formatBytes(img.size)}</span>
                            <span>{new Date(img.created_at).toLocaleDateString()}</span>
                        </div>
                        <button
                            onClick={() => copyToClipboard(img.url, img.id)}
                            className={`w-full py-2 px-3 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${copyState === img.id ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}
                        >
                            {copyState === img.id ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                    </svg>
                                    Copy URL
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
