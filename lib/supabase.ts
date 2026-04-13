import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vshvzjxgivmnlpbilyph.supabase.co";

const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzaHZ6anhnaXZtbmxwYmlseXBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNDAxNTcsImV4cCI6MjA5MTYxNjE1N30.eCinawGYEXkcshzAOnSEgkRd7TmOAVJju7mKOCDkHXo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);