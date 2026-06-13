// ==================== DRONA GPT - MAIN JS (Full Merged Version) ====================

const SUPABASE_URL = 'https://tnqtejdulwlnajnaxtyq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRucXRlamR1bHdsbmFqbmF4dHlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNjY5OTMsImV4cCI6MjA5Njg0Mjk5M30.f0PWnl0eswhODndtv8Kw6a_A26m2uxIwCnNoDJZQwpk';

let supabase = null;
let retailers = [];
let currentContextRetailer = null;
let currentQuickViewRetailer = null;

// ==================== INITIALIZE ====================
async function initializeApp() {
    initSupabase();
    await loadRetailers();

    // Default view
    document.getElementById('drona-gpt-view').classList.remove('hidden');
    document.getElementById('strategy-x-view').classList.add('hidden');
    document.getElementById('tab-drona-gpt').classList.add('tab-active');

    updateUserHeader('Ramesh', 'Salesman');

    // Initialize chat with welcome message
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
        chatContainer.innerHTML = `
            <div class="flex justify-start">
                <div class="max-w-[82%] px-4 py-3 rounded-3xl bg-slate-800 text-sm">
                    Hi Ramesh! I'm <strong>Drona GPT</strong>.<br>
                    I can help with retailer details, payment status, and SKU patterns.
                </div>
            </div>
        `;
    }

    console.log('%c[Drona GPT] Application initialized successfully', 'color:#22c55e');
}

// ==================== SUPABASE ====================
function initSupabase() {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
}

// ==================== LOAD RETAILERS ====================
async function loadRetailers() {
    try {
        const res = await fetch('data/retailers.json');
        retailers = await res.json();
    } catch (e) {
        console.error("Failed to load retailers.json");
        retailers = [];
    }
}

// ==================== TAB SWITCHING ====================
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
    } else {
        dronaView.classList.add('hidden');
        strategyView.classList.remove('hidden');
        tabStrategy.classList.add('tab-active');
        tabDrona.classList.remove('tab-active');
        updateUserHeader('Admin', 'Owner');

        // Initialize Strategy X when first opened
        if (typeof initializeStrategyX === 'function' && !window.strategyXInitialized) {
            initializeStrategyX();
            window.strategyXInitialized = true;
        }
    }
}

// ==================== USER HEADER ====================
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

// ==================== CHAT ====================
function addMessage(text, isUser = false) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`;
    const bubble = document.createElement('div');
    bubble.className = `max-w-[82%] px-4 py-3 rounded-3xl text-sm ${isUser ? 'bg-orange-600 text-white' : 'bg-slate-800'}`;
    bubble.innerHTML = text;
    div.appendChild(bubble);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, true);
    input.value = '';

    setTimeout(() => {
        const response = generateSmartResponse(text);
        addMessage(response);
    }, 600);
}

function generateSmartResponse(query) {
    const q = query.toLowerCase();

    if (currentContextRetailer) {
        const r = currentContextRetailer;
        if (q.includes("payment") || q.includes("outstanding")) {
            return `Outstanding for <strong>${r.name}</strong>: ₹${r.outstanding.toLocaleString()}`;
        }
        if (q.includes("pattern") || q.includes("sku")) {
            return `SKU patterns for <strong>${r.name}</strong> are available in the Retailers tab.`;
        }
    }

    if (q.includes("behind on payment")) {
        const behind = retailers.filter(r => r.outstanding > 15000).map(r => r.name);
        return `Retailers with high outstanding: ${behind.join(", ")}`;
    }

    return "I can help with retailer details, payments, and SKU patterns.";
}

// ==================== RETAILER SEARCH ====================
function openRetailerSearch() {
    const modal = document.createElement('div');
    modal.id = 'search-modal';
    modal.className = `fixed inset-0 bg-black/70 flex items-center justify-center z-50`;

    modal.innerHTML = `
        <div onclick="event.target.id === 'search-modal' && closeSearchModal()" 
             class="bg-slate-900 border border-slate-700 w-full max-w-lg mx-4 rounded-3xl overflow-hidden">
            <div class="p-5 border-b border-slate-800 flex justify-between items-center">
                <div class="font-semibold">Search Retailers</div>
                <button onclick="closeSearchModal()" class="text-slate-400 hover:text-white text-2xl">×</button>
            </div>
            <div class="p-4">
                <input id="search-input" type="text" placeholder="Type retailer name or area..." 
                       class="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm mb-4 focus:outline-none"
                       onkeyup="filterRetailers()">
                <div id="retailer-list" class="max-h-[420px] overflow-y-auto space-y-1"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('search-input').focus();
    renderRetailerList(retailers);
}

function closeSearchModal() {
    const modal = document.getElementById('search-modal');
    if (modal) modal.remove();
}

function filterRetailers() {
    const term = document.getElementById('search-input').value.toLowerCase();
    const filtered = retailers.filter(r => 
        r.name.toLowerCase().includes(term) || r.area.toLowerCase().includes(term)
    );
    renderRetailerList(filtered);
}

function renderRetailerList(list) {
    const container = document.getElementById('retailer-list');
    if (!container) return;
    container.innerHTML = '';

    list.forEach(retailer => {
        const div = document.createElement('div');
        div.className = `flex justify-between items-center p-3 hover:bg-slate-800 rounded-2xl cursor-pointer`;
        div.innerHTML = `
            <div>
                <div class="font-medium">${retailer.name}</div>
                <div class="text-xs text-slate-400">${retailer.area}</div>
            </div>
            <div class="text-right">
                <div class="text-sm font-mono">₹${retailer.outstanding.toLocaleString()}</div>
                <div class="text-[10px] text-slate-500">Outstanding</div>
            </div>
        `;
        div.onclick = () => {
            closeSearchModal();
            showQuickView(retailer);
        };
        container.appendChild(div);
    });
}

// ==================== QUICK VIEW ====================
function showQuickView(retailer) {
    currentQuickViewRetailer = retailer;

    const modal = document.createElement('div');
    modal.id = 'quickview-modal';
    modal.className = `fixed inset-0 bg-black/70 flex items-center justify-center z-[60]`;

    modal.innerHTML = `
        <div onclick="event.target.id === 'quickview-modal' && closeQuickView()" 
             class="bg-slate-900 border border-slate-700 w-full max-w-2xl mx-4 rounded-3xl overflow-hidden">
            
            <div class="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                <div>
                    <div class="font-semibold text-xl">${retailer.name}</div>
                    <div class="text-sm text-slate-400">${retailer.area} • ${retailer.contact}</div>
                </div>
                <div>
                    <button onclick="setChatContextFromQuickView()" 
                            class="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-2xl text-sm flex items-center gap-x-2">
                        <i class="fa-solid fa-comments"></i>
                        <span>Chat about this</span>
                    </button>
                </div>
            </div>

            <div class="p-6" id="quickview-content"></div>
        </div>
    `;
    document.body.appendChild(modal);
    populateQuickViewContent(retailer);
}

function populateQuickViewContent(retailer) {
    const content = document.getElementById('quickview-content');
    content.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <div class="section-header mb-2">Payment Position</div>
                <div class="bg-slate-800 rounded-2xl p-4">
                    <div class="text-3xl font-semibold">₹${retailer.outstanding.toLocaleString()}</div>
                    <div class="text-xs text-slate-400">Total Outstanding</div>
                </div>
            </div>
            <div>
                <div class="section-header mb-2">SKU Pattern Recognition</div>
                <div class="bg-slate-800 rounded-2xl p-4 text-sm">
                    ${retailer.skuPatterns.map(p => `
                        <div class="mb-2">
                            <strong>${p.sku}</strong> — <span class="${p.status === 'Declining' ? 'text-red-400' : 'text-emerald-400'}">${p.status}</span><br>
                            <span class="text-xs text-slate-400">${p.insight}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function setChatContextFromQuickView() {
    if (currentQuickViewRetailer) {
        closeQuickView();
        setChatContext(currentQuickViewRetailer);
    }
}

function closeQuickView() {
    const modal = document.getElementById('quickview-modal');
    if (modal) modal.remove();
}

// ==================== CHAT CONTEXT ====================
function setChatContext(retailer) {
    currentContextRetailer = retailer;
    addMessage(`Now focused on <strong>${retailer.name}</strong>. What would you like to know?`);
}

function clearContext() {
    currentContextRetailer = null;
}

// ==================== QUICK ACTIONS ====================
function showPaymentSummary() {
    const total = retailers.reduce((sum, r) => sum + r.outstanding, 0);
    addMessage(`Total Outstanding: <strong>₹${total.toLocaleString()}</strong>`);
}

function showTargetSummary() {
    addMessage("Target summary feature coming soon.");
}

function showSamplingView() {
    addMessage("Showcase a particular SKU to retailer as per Strategy X plans.");
}

function showAllRetailers() {
    openRetailerSearch();
}

// ==================== INITIALIZE ====================
window.onload = initializeApp;
