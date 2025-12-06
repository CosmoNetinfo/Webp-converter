import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default env variables (optional fallback)
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
    if (supabaseInstance) return supabaseInstance;

    // Try to get from localStorage first (User Settings)
    const storedUrl = localStorage.getItem('supabaseUrl');
    const storedKey = localStorage.getItem('supabaseKey');

    if (storedUrl && storedKey) {
        supabaseInstance = createClient(storedUrl, storedKey);
        return supabaseInstance;
    }

    // Fallback to env variables if available
    if (envUrl && envKey) {
        supabaseInstance = createClient(envUrl, envKey);
        return supabaseInstance;
    }

    return null;
};

// Function to update credentials dynamically
export const updateSupabaseConfig = (url: string, key: string) => {
    if (url && key) {
        localStorage.setItem('supabaseUrl', url);
        localStorage.setItem('supabaseKey', key);
        supabaseInstance = createClient(url, key);
    } else {
        // Clear custom settings
        localStorage.removeItem('supabaseUrl');
        localStorage.removeItem('supabaseKey');
        supabaseInstance = null;

        // Attempt to reset to env if available
        if (envUrl && envKey) {
            supabaseInstance = createClient(envUrl, envKey);
        }
    }
    // Reload page to ensure all components pick up new client? 
    // Or better, components should be reactive. For now, simple reload or we let components call getSupabaseClient() again.
    return supabaseInstance;
};

// Keep the direct export for backward compatibility where possible, but it might be null now or default env
export const supabase = getSupabaseClient() as SupabaseClient; // WARNING: acts as singleton, might be stale if updated. prefer using getSupabaseClient() in components or context.

export const isSupabaseConfigured = () => {
    return !!getSupabaseClient();
}
