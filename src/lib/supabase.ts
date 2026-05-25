import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Pixel = {
  id: number;
  x: number;
  y: number;
  claimed: boolean;
  user_id: string | null;
  username: string | null;
  display_name: string | null;
  profile_pic_url: string | null;
  message: string | null;
  claimed_at: string | null;
};
