import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://vshvzjxgivmnlpbilyph.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzaHZ6anhnaXZtbmxwYmlseXBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNDAxNTcsImV4cCI6MjA5MTYxNjE1N30.eCinawGYEXkcshzAOnSEgkRd7TmOAVJju7mKOCDkHXo"
);