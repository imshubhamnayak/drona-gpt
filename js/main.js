// ==================== DRONA GPT - MAIN JS ====================

// Supabase Configuration
const SUPABASE_URL = 'https://tnqtejdulwlnajnaxtyq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRucXRlamR1bHdsbmFqbmF4dHlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNjY5OTMsImV4cCI6MjA5Njg0Mjk5M30.f0PWnl0eswhODndtv8Kw6a_A26m2uxIwCnNoDJZQwpk';

let supabase = null;

// Initialize Supabase
function initSupabase() {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('%c[Supabase] Connected successfully', 'color:#22c55e');
    } else {
        console.warn('Supabase CDN not loaded');
    }
}

// Switch between Drona GPT and Strategy X
function switchTab(tab) {
    const dronaView = document.getElementById('drona-gpt-view');
    const strategyView = document.getElementById('strategy-x-view');

    const tabDrona = document.getElementById('tab-drona-gpt');
    const tabStrategy = document.getElementById('tab-strategy-x');

    if (tab === 'drona-gpt') {
        dronaView.classList.remove('hidden');
        strategyView.classList.add('hidden');

        tabDrona.classList.add('tab-active');
        tabStrategy.classList.remove('tab-active');

        updateUserHeader('Ramesh', 'Salesman');

    } else if (tab === 'strategy-x') {
        dronaView.classList.add('hidden');
        strategyView.classList.remove('hidden');

        tabStrategy.classList.add('tab-active');
        tabDrona.classList.remove('tab-active');

        updateUserHeader('Admin', 'Owner');
    }
}

// Update user name and role in header
function updateUserHeader(name, role) {
    const container = document.getElementById('user-info');
    if (!container) return;

    const isAdmin = role === 'Owner';
    const badgeColor = isAdmin ? 'bg-orange-600' : 'bg-blue-600';

    container.innerHTML = `
        <div class="flex items-center gap-x-3 bg-slate-800 px-4 py-1.5 rounded-2xl">
            <div class="text-right">
                <div class="font-medium">${name}</div>
                <div class="text-xs ${isAdmin ? 'text-orange-400' : 'text-blue-400'}">${role}</div>
            </div>
            <div class="w-9 h-9 ${badgeColor} rounded-2xl flex items-center justify-center">
                <i class="fa-solid fa-user text-white text-sm"></i>
            </div>
        </div>
    `;
}

// Initialize the application
function initializeApp() {
    initSupabase();

    const dronaView = document.getElementById('drona-gpt-view');
    const strategyView = document.getElementById('strategy-x-view');
    const tabDrona = document.getElementById('tab-drona-gpt');

    // Default view
    dronaView.classList.remove('hidden');
    strategyView.classList.add('hidden');
    tabDrona.classList.add('tab-active');

    // Set default user
    updateUserHeader('Ramesh', 'Salesman');

    console.log('%c[Drona GPT] Application initialized', 'color:#22c55e');
}

// Run on page load
window.onload = initializeApp;
