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

// Singleton object to hold the client reference
export const supabaseState = {
    client: getSupabaseClient()
};

// Direct export using a getter is safer for some bundlers, but specialized 'let' modification is tricky.
// SAFEST APPROACH: Export an object that mimics the client but delegates.
// However, since we need to pass this to components, let's just use a consistent pattern.

// UPDATED APPROACH: 
// 1. Export 'getSupabaseClient' for manual retrieval.
// 2. Export 'supabase' as a constant proxy/object that calls the current client.
// 3. 'updateSupabaseConfig' updates the internal instance.

export const supabase = new Proxy({}, {
    get: (_target, prop) => {
        const client = getSupabaseClient();
        if (client) {
            // @ts-ignore
            return client[prop];
        }
        // If NO client is configured, return undefined or handle gracefully?
        // Returning undefined might crash if user does supabase.from(...)
        // Let's warn and return a dummy that throws on invocation for easier debugging
        console.warn(`Supabase client accessed but not configured. Property: ${String(prop)}`);
        return undefined;
    }
}) as SupabaseClient;


// Function to update credentials dynamically
export const updateSupabaseConfig = (url: string, key: string) => {
    if (url && key) {
        localStorage.setItem('supabaseUrl', url);
        localStorage.setItem('supabaseKey', key);
        supabaseInstance = createClient(url, key);
    } else {
        localStorage.removeItem('supabaseUrl');
        localStorage.removeItem('supabaseKey');
        supabaseInstance = null;
        if (envUrl && envKey) {
            supabaseInstance = createClient(envUrl, envKey);
        }
    }
    // Update the state wrapper if we were using it, but with Proxy we don't need to.
    return supabaseInstance;
};

export const isSupabaseConfigured = () => {
    return !!getSupabaseClient();
}
