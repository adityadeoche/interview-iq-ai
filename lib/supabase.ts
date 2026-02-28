import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing. Check your .env.local file.');
}

// Prevent multiple client instances causing LockManager timeout in Next.js development mode
function getSupabaseClient() {
    if (typeof window === 'undefined') {
        return createBrowserClient(supabaseUrl, supabaseAnonKey);
    }

    // Persist the client on the window object across Fast Refresh
    if (!(window as any)._supabaseClientCache) {
        (window as any)._supabaseClientCache = createBrowserClient(supabaseUrl, supabaseAnonKey);
    }

    return (window as any)._supabaseClientCache;
}

export const supabase = getSupabaseClient();
