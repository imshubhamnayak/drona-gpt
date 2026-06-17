// ==================== DRONA GPT - COMPLETE REFACTORED WITH STRONG RAG ====================

let retailers = [];
let currentContextRetailer = null;
let allSKUs = [];

// New API Key
const GROK_API_KEY = "xai-APCxJXdH2aCVQEEpbQEX1aYjA00HWhf3CQli9ynDvxn1suRYRta64Cz7fKqZAyymJ2RzpC5LmfBaXy4O";

// Load Retailers
async function loadRetailers() {
    try {
        const res = await fetch('data/retailers.json');
        const data = await res.json();
        retailers = data.retailers || [];
        console.log(`%c✅ Loaded ${retailers.length} retailers for RAG`, 'color:#22c55e');
    } catch (e) {
        console.error("Failed to load retailers", e);
        retailers = [];
    }
}

// Dynamic Greeting
function setDynamicGreeting() {
    const hour = new Date().getHours();
    let main = "", sub = "";

    if (hour >= 5 && hour < 12) {
        main = "Good morning, Ramesh";
        sub = "Ready for today's field visits?";
    } else if (hour >= 12 && hour < 17) {
        main = "Good afternoon, Ramesh";
        sub = "Let me help you with anything you need!";
    } else {
        main = "Good evening, Ramesh";
        sub = "Check Today's plan to ensure everything is taken care of";
    }

    document.getElementById('greeting-main').textContent = main;
    document.getElementById('greeting-sub').textContent = sub;
}

// Add Message
function addMessage(text, sender) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = `mb-4 flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
    div.innerHTML = `
        <div class="${sender === 'user' ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-200'} rounded-2xl px-4 py-3 max-w-[75%]">
            ${text}
        </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// Strong RAG Context
function buildRAGContext(query) {
    const lowerQuery = query.toLowerCase();
    const relevant = retailers.filter(r => 
        r.name.toLowerCase().includes(lowerQuery) || 
        r.area.toLowerCase().includes(lowerQuery) ||
        (r.outstanding && r.outstanding > 10000)
    ).slice(0, 6);

    if (relevant.length === 0) return "";

    let context = "\nRelevant Retailers:\n";
    relevant.forEach(r => {
        context += `- ${r.name} (${r.area}): ₹${r.outstanding || 0} outstanding, Last visit: ${r.lastVisitDaysAgo || 'N/A'} days ago\n`;
    });
    return context;
}

// Generate Smart Response
async function generateSmartResponse(message) {
    const context = buildRAGContext(message);

    try {
        const res = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROK_API_KEY}`
            },
            body: JSON.stringify({
                model: "grok-2",
                messages: [
                    { 
                        role: "system", 
                        content: `You are Drona, a practical AI sales coach for field salesmen. Be direct and actionable.${context}` 
                    },
                    { role: "user", content: message }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!res.ok) throw new Error(`API Error ${res.status}`);

        const data = await res.json();
        return data.choices?.[0]?.message?.content || "I couldn't generate a response.";

    } catch (e) {
        console.error("Grok API Error:", e);
        return "I'm having trouble connecting right now. Ask me about any retailer or plan.";
    }
}

// Send Message
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    input.value = "";

    const typing = document.createElement('div');
    typing.className = "flex justify-start mb-4";
    typing.innerHTML = `<div class="bg-slate-700 rounded-2xl px-4 py-3">Drona is thinking...</div>`;
    document.getElementById('chat-messages').appendChild(typing);

    const reply = await generateSmartResponse(text);
    typing.remove();
    addMessage(reply, 'bot');
}

// ==================== YOUR ORIGINAL FUNCTIONS ====================

function updateUserHeader(name, role) {
    const userInfo = document.getElementById('user-info');
    if (!userInfo) return;

    const isAdmin = role === 'Owner' || role === 'Admin';
    userInfo.innerHTML = `
        <div class="flex items-center gap-x-3 bg-slate-800 px-4 py-1.5 rounded-2xl">
            <div class="text-right">
                <div class="font-medium">${name}</div>
                <div class="text-xs ${isAdmin ? 'text-orange-400' : 'text-blue-400'}">${role}</div>
            </div>
            <div class="w-9 h-9 ${isAdmin ? 'bg-orange-600' : 'bg-blue-600'} rounded-2xl flex items-center justify-center">
                <i class="fa-solid fa-user text-white text-sm"></i>
            </div>
        </div>
    `;
}

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
        tabDrona.classList.remove('tab-active');
        tabStrategy.classList.add('tab-active');
        updateUserHeader('Admin', 'Owner');
           // Initialize Strategy X when switching
        if (window.initializeStrategyX && !window.strategyXInitialized) {
            setTimeout(() => {
                window.initializeStrategyX();
                window.strategyXInitialized = true;
            }, 300);
        }
    }
}

function openRetailerSearch() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4';
    modal.innerHTML = `
        <div class="bg-slate-900 rounded-3xl w-full max-w-md p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-semibold text-lg">Search Retailer</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <input type="text" id="retailer-search-input" placeholder="Type retailer name..." 
                   class="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 mb-4 focus:outline-none" 
                   onkeyup="filterRetailers(this.value)">
            <div id="retailer-search-results" class="max-h-80 overflow-y-auto space-y-2"></div>
        </div>
    `;
    document.body.appendChild(modal);
    filterRetailers('');
}

function filterRetailers(query) {
    const container = document.getElementById('retailer-search-results');
    if (!container) return;

    const filtered = retailers.filter(r => 
        r.name.toLowerCase().includes(query.toLowerCase()) || 
        r.area.toLowerCase().includes(query.toLowerCase())
    );

    container.innerHTML = filtered.map(r => `
        <div onclick="showQuickView(${r.id}); this.closest('.fixed').remove();" 
             class="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl cursor-pointer flex justify-between items-center">
            <div>
                <div class="font-medium">${r.name}</div>
                <div class="text-xs text-slate-400">${r.area}</div>
            </div>
            <i class="fa-solid fa-chevron-right text-slate-500"></i>
        </div>
    `).join('');
}

function showTargetSummary() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4';
    modal.innerHTML = `
        <div class="bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div class="p-6 border-b flex justify-between items-center">
                <h3 class="text-2xl font-bold">My Targets 2026</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-3xl text-slate-400">×</button>
            </div>
            <div class="flex-1 overflow-y-auto p-6 space-y-4" id="retailer-target-list"></div>
        </div>
    `;
    document.body.appendChild(modal);
    renderAllRetailers();
}

function renderAllRetailers() {
    const container = document.getElementById('retailer-target-list');
    if (!container) return;

    let html = '';
    retailers.forEach(r => {
        html += `
            <div onclick="showQuickView(${r.id}); this.closest('.fixed').remove()" class="bg-slate-800 p-4 rounded-2xl cursor-pointer hover:bg-slate-700">
                <div class="flex justify-between">
                    <div>
                        <div class="font-medium">${r.name}</div>
                        <div class="text-xs text-slate-400">${r.area}</div>
                    </div>
                    <div class="text-right">
                        <div class="font-semibold">₹${r.outstanding}</div>
                        <div class="text-xs text-red-400">${r.paymentStatus || ''}</div>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function openSKUIntelligence() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4';
    modal.innerHTML = `
        <div class="bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div class="p-6 border-b flex justify-between">
                <h3 class="text-2xl font-bold">SKU Intelligence</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-3xl text-slate-400">×</button>
            </div>
            <div class="flex-1 overflow-y-auto p-6" id="sku-list"></div>
        </div>
    `;
    document.body.appendChild(modal);
    renderSKUs();
}

function renderSKUs() {
    const container = document.getElementById('sku-list');
    if (!container) return;

    let html = '';
    allSKUs.forEach(sku => {
        html += `
            <div class="bg-slate-800 p-5 rounded-3xl mb-4">
                <div class="font-semibold">${sku.name}</div>
                <div class="text-sm text-emerald-400">MRP ₹${sku.mrp} | Online ₹${sku.ecomPrice}</div>
                <div class="text-xs text-slate-400 mt-2">${sku.talkingPoint}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function showQuickView(id) {
    const retailer = retailers.find(r => r.id === id);
    if (!retailer) return;
    currentContextRetailer = retailer;
    alert(`Quick View for ${retailer.name}\nOutstanding: ₹${retailer.outstanding}`);
}

function showPublishedPlan() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4';
    modal.innerHTML = `
        <div class="bg-slate-900 rounded-3xl w-full max-w-lg p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="font-semibold text-xl">Today's Focus Plan</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-2xl">×</button>
            </div>
            <div class="bg-slate-800 rounded-2xl p-5 mb-6">
                <div class="text-emerald-400 text-sm mb-2">📅 Today</div>
                <div class="text-lg font-medium">10 Visits Recommended</div>
            </div>
            <button onclick="this.closest('.fixed').remove()" class="w-full py-4 bg-orange-600 hover:bg-orange-500 rounded-2xl font-medium">
                Got it, I'll follow this plan
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Initialize
async function initializeApp() {
    console.log("%c[Drona GPT] Initializing with Strong RAG...", "color:#22c55e");
    
    await loadRetailers();

    allSKUs = [
        { name: "Prestige Pressure Cooker 5L", mrp: 2499, ecomPrice: 1899, talkingPoint: "High demand item." },
        { name: "Prestige Mixer Grinder", mrp: 4299, ecomPrice: 3199, talkingPoint: "Push combo offer." }
    ];

    setDynamicGreeting();
    addMessage("Hi Ramesh! I'm Drona GPT. How can I help you today? Ask about any retailer, SKU, or plan.", 'bot');
    
    updateUserHeader('Ramesh', 'Salesman');
    
    console.log("%c✅ Drona GPT Ready with Strong RAG", "color:lime");
}

window.onload = initializeApp;

// Global functions
window.sendMessage = sendMessage;
window.showTargetSummary = showTargetSummary;
window.openSKUIntelligence = openSKUIntelligence;
window.switchTab = switchTab;
window.showQuickView = showQuickView;
window.showPublishedPlan = showPublishedPlan;
