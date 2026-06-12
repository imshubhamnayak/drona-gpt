// js/supabase.js
const SUPABASE_URL = 'https://tnqtejdulwlnajnaxtyq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRucXRlamR1bHdsbmFqbmF4dHlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNjY5OTMsImV4cCI6MjA5Njg0Mjk5M30.f0PWnl0eswhODndtv8Kw6a_A26m2uxIwCnNoDJZQwpk';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabase;

console.log('%c✅ [Supabase] Client initialized and ready', 'color:#22c55e; font-weight:bold');
