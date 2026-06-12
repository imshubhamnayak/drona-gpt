// ==================== SUPABASE CONFIG ====================
const SUPABASE_URL = 'https://tnqtejdulwlnajnaxtyq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRucXRlamR1bHdsbmFqbmF4dHlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNjY5OTMsImV4cCI6MjA5Njg0Mjk5M30.f0PWnl0eswhODndtv8Kw6a_A26m2uxIwCnNoDJZQwpk';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.supabaseClient = supabase;

console.log("[Supabase] Connected successfully");
