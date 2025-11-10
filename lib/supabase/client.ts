import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    // Provide fallback values during build time to prevent errors
    // At runtime, these will be properly set via Vercel environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

    return createBrowserClient(supabaseUrl, supabaseKey)
}

