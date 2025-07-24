import { createClient } from '@supabase/supabase-js';
 
const supabaseUrl = 'https://tqnrzyqmddtmtiuehxtg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbnJ6eXFtZGR0bXRpdWVoeHRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNjY1NjksImV4cCI6MjA2ODg0MjU2OX0.JykyUGJnsiktuzaY9A6UmlGaAS4JmOxI25gkqxK6Dd0';
export const supabase = createClient(supabaseUrl, supabaseKey); 