import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Use the auto-generated client when env vars are available, otherwise create a safe fallback
let supabaseClient: ReturnType<typeof createClient>;

try {
  // Try the auto-generated client first
  const { supabase: autoClient } = await import('@/integrations/supabase/client');
  supabaseClient = autoClient;
} catch {
  // Fallback: create client with available env vars
  supabaseClient = createClient(
    SUPABASE_URL || 'https://iwqtdcellgoanzrifspn.supabase.co',
    SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3cXRkY2VsbGdvYW56cmlmc3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NjAwODQsImV4cCI6MjA4NzEzNjA4NH0.Vog_ctYmdQ9cmiqVS2gSJKdVq5J9s9UmqRfa8Q6Xojo',
    {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    }
  );
}

export const supabase = supabaseClient;

export type Profile = {
  id: string;
  email: string;
  stack_context: string[];
  created_at: string;
};

export type Session = {
  id: string;
  user_id: string;
  input_code: string;
  error_message: string | null;
  fixed_code: string;
  explanation: string;
  summary: string;
  mode: "expert" | "eli5";
  language: string;
  is_public: boolean;
  created_at: string;
};

export type Insight = {
  id: string;
  user_id: string;
  insight_text: string;
  related_session_ids: string[];
  generated_at: string;
};
