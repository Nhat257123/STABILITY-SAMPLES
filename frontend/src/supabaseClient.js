import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ecqcsackkmnpzwslbzgr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcWNzYWNra21ucHp3c2xiemdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMzg1MDQsImV4cCI6MjA5MDcxNDUwNH0.lZhiBtfRwmsfT_ZO4RY73iRlNxialWElEIS2UlbGuEc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
