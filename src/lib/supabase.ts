import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://iwqtdcellgoanzrifspn.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3cXRkY2VsbGdvYW56cmlmc3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NjAwODQsImV4cCI6MjA4NzEzNjA4NH0.Vog_ctYmdQ9cmiqVS2gSJKdVq5J9s9UmqRfa8Q6Xojo';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

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
