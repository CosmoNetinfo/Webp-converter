
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase credentials. Cloud features will not work.');
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
);

// Helper to check if supabase is configured
export const isSupabaseConfigured = () => {
    return !!supabaseUrl && !!supabaseAnonKey;
}
