// ==================== DRONA GPT - MAIN JAVASCRIPT ====================
// This file handles tab switching, user context (Ramesh / Admin), 
// and Supabase initialization.

// ==================== SUPABASE CONFIGURATION ====================
const SUPABASE_URL = 'https://tnqtejdulwlnajnaxtyq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRucXRlamR1bHdsbmFqbmF4dHlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNjY5OTMsImV4cCI6MjA5Njg0Mjk5M30.f0PWnl0eswhODndtv8Kw6a_A26m2uxIwCnNoDJZQwpk';

let supabase = null;

// ==================== INITIALIZE SUPABASE ====================
function initSupabase() {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('%c[Supabase] Client initialized successfully', 'color:#22c55e');
    } else {
        console.warn('%c[Supabase] CDN not loaded. Make sure you included the Supabase script in index.html', 'color:orange');
    }
}

// ==================== TAB SWITCHING ====================
function switchTab(tab) {
    const dronaView = document.getElementById('drona-gpt-view');
    const strategyView = document.getElementById('strategy-x-view');

    const tabDrona = document.getElementById('tab-drona-gpt');
    const tabStrategy = document.getElementById('tab-strategy-x');

    if (tab === 'drona-gpt') {
        // Show Drona GPT View (Mobile Friendly)
        dronaView.classList.remove('hidden');
        strategyView.classList.add('hidden');

        tabDrona.classList.add('tab-active');
        tabStrategy.classList.remove('tab-active');

        updateUserHeader('Ramesh', 'Salesman');

    } else if (tab === 'strategy-x') {
        // Show Strategy X View (Desktop/Web Style)
        dronaView.classList.add('hidden');
        strategyView.classList.remove('hidden');

        tabStrategy.classList.add('tab-active');
        tabDrona.classList.remove('tab-active');

        updateUserHeader('Admin', 'Owner');
    }
}

// ==================== UPDATE USER HEADER ====================
function updateUserHeader(name, role) {
    const userInfoContainer = document.getElementById('user-info');
    if (!userInfoContainer) return;

    const isAdmin = role === 'Owner';
    const badgeColor = isAdmin ? 'bg-orange-600' : 'bg-blue-600';

    userInfoContainer.innerHTML = `
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

// ==================== INITIALIZE APPLICATION ====================
function initializeApp() {
    // Initialize Supabase
    initSupabase();

    const dronaView = document.getElementById('drona-gpt-view');
    const strategyView = document.getElementById('strategy-x-view');
    const tabDrona = document.getElementById('tab-drona-gpt');

    // Set default view to Drona GPT
    if (dronaView && strategyView) {
        dronaView.classList.remove('hidden');
        strategyView.classList.add('hidden');
    }

    // Highlight default tab
    if (tabDrona) {
        tabDrona.classList.add('tab-active');
    }

    // Set default user as Ramesh (Salesman)
    updateUserHeader('Ramesh', 'Salesman');

    console.log('%c[Drona GPT] Application initialized successfully', 'color:#22c55e');
}

// ==================== PLACEHOLDER FUNCTIONS ====================
// You can expand these functions later

function openRetailerSearch() {
    alert("Retailer Search will be implemented here.");
}

// ==================== RUN ON PAGE LOAD ====================
window.onload = initializeApp;
