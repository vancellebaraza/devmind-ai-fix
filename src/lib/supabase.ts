// Re-export the Lovable Cloud Supabase client
export { supabase } from "@/integrations/supabase/client";

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
