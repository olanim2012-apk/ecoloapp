import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hmtsxvjpluyqqnevqyak.supabase.co";

export const supabase = createClient(
  supabaseUrl,
  "sb_publishable_8sqRwo3U1_Rz4KcC4W_Z8w_miaQAPq1",
  {
    auth: {
      persistSession: false
    }
  }
);