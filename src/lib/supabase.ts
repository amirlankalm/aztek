import { createClient, SupabaseClient } from '@supabase/supabase-js';

let instance: SupabaseClient | null = null;

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!instance) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        // During build, we might not have these. 
        // We only throw if we actually TRY to use it and they're still missing.
        throw new Error("Supabase environment variables are missing. Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your environment.");
      }
      instance = createClient(supabaseUrl, supabaseServiceKey);
    }
    return (instance as any)[prop];
  }
});
