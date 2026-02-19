import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase env vars not set. Using placeholder values.");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

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
