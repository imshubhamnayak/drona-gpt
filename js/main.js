// ==================== DRONA GPT - FULL MAIN LOGIC ====================

let retailers = [];
let currentContextRetailer = null;
let allSKUs = [];

// ==================== INITIALIZE APP ====================
async function initializeApp() {
    console.log('%c[Drona GPT] Initializing...', 'color:#22c55e');
    
    await loadRetailersFromJSON();
    
    updateUserHeader('Ramesh', 'Salesman');
    
    // Default view
    const dronaView = document.getElementById('drona-gpt-view');
    const strategyView = document.getElementById('strategy-x-view');
    if (dronaView && strategyView) {
        dronaView.classList.remove('hidden');
        strategyView.classList.add('hidden');
    }

    // Welcome message
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = `
            <div class="flex gap-3 mb-4">
                <div class="w-8 h-8 bg-orange-600 rounded-2xl flex-shrink-0 flex items-center justify-center">
                    <i class="fa-solid fa-robot text-white text-sm"></i>
                </div>
                <div class="bg-slate-800 px-4 py-3 rounded-3xl text-sm max-w-[80%]">
                    Hi Ramesh! How can I help you today?
                </div>
            </div>
        `;
    }

    console.log(`%cLoaded ${retailers.length} retailers`, 'color:#22c55e');
}

async function loadRetailersFromJSON() {
    try {
        const response = await fetch('data/retailers.json');
        const data = await response.json();
        retailers = data.retailers || [];
        console.log(`%c✅ Loaded ${retailers.length} retailers from JSON`, 'color:#22c55e');
    } catch (err) {
        console.error("Failed to load retailers.json", err);
        retailers = [];
    }
}

// ==================== UI FUNCTIONS ====================
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

    if (!dronaView || !strategyView) return;

    if (tab === 'drona-gpt') {
        dronaView.classList.remove('hidden');
        strategyView.classList.add('hidden');
        tabDrona.classList.add('tab-active');
        tabStrategy.classList.remove('tab-active');
        updateUserHeader('Ramesh', 'Salesman');
    } else if (tab === 'strategy-x') {
        dronaView.classList.add('hidden');
        strategyView.classList.remove('hidden');
        tabDrona.classList.remove('tab-active');
        tabStrategy.classList.add('tab-active');
        updateUserHeader('Admin', 'Owner');

        if (window.initializeStrategyX && !window.strategyXInitialized) {
            setTimeout(() => {
                window.initializeStrategyX();
                window.strategyXInitialized = true;
            }, 300);
        }
    }
}

// ==================== RETAILER FUNCTIONS ====================
function openRetailerSearch() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4';
    modal.innerHTML = `
        <div class="bg-slate-900 rounded-3xl w-full max-w-md p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-semibold text-lg">Search Retailer</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white">✕</button>
            </div>
            <input type="text" id="retailer-search-input" placeholder="Type retailer name..." 
                   class="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 mb-4" 
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

function showQuickView(retailerId) {
    const retailer = retailers.find(r => r.id === retailerId);
    if (!retailer) return;

    currentContextRetailer = retailer;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4';
    modal.innerHTML = `
        <div class="bg-slate-900 rounded-3xl w-full max-w-lg p-6">
            <div class="flex justify-between mb-4">
                <div>
                    <h3 class="font-semibold text-xl">${retailer.name}</h3>
                    <p class="text-sm text-slate-400">${retailer.area}</p>
                </div>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400">✕</button>
            </div>

            <div class="space-y-4">
                <div class="bg-slate-800 p-4 rounded-2xl">
                    <div class="text-xs text-slate-400 mb-1">OUTSTANDING</div>
                    <div class="text-2xl font-semibold">₹${(retailer.outstanding || 0).toLocaleString()}</div>
                </div>
                <div class="flex gap-3">
                    <button onclick="setChatContextFromQuickView(${retailer.id}); this.closest('.fixed').remove();" 
                            class="flex-1 py-3 bg-orange-600 rounded-2xl font-medium">Talk to Drona</button>
                    <button onclick="this.closest('.fixed').remove()" 
                            class="flex-1 py-3 bg-slate-700 rounded-2xl">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function setChatContextFromQuickView(retailerId) {
    const retailer = retailers.find(r => r.id === retailerId);
    if (!retailer) return;

    currentContextRetailer = retailer;
    
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML += `
            <div class="flex justify-end mb-3">
                <div class="bg-orange-600 px-4 py-2 rounded-3xl text-sm max-w-[80%]">
                    Tell me about ${retailer.name}
                </div>
            </div>
        `;
    }
    
    setTimeout(() => {
        const response = generateSmartResponse(`Tell me about ${retailer.name}`);
        if (chatMessages) {
            chatMessages.innerHTML += response;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }, 600);
}

// ==================== CHAT ====================
function sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input || !input.value.trim()) return;

    const chatMessages = document.getElementById('chat-messages');
    const userMessage = input.value.trim();

    chatMessages.innerHTML += `
        <div class="flex justify-end mb-3">
            <div class="bg-orange-600 px-4 py-2 rounded-3xl text-sm max-w-[80%]">${userMessage}</div>
        </div>
    `;

    const response = generateSmartResponse(userMessage);
    setTimeout(() => {
        chatMessages.innerHTML += response;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 700);

    input.value = '';
}

function generateSmartResponse(message) {
    const lowerMsg = message.toLowerCase();
    
    if (currentContextRetailer && lowerMsg.includes(currentContextRetailer.name.toLowerCase())) {
        return `
            <div class="flex gap-3 mb-4">
                <div class="w-8 h-8 bg-orange-600 rounded-2xl flex-shrink-0 flex items-center justify-center">
                    <i class="fa-solid fa-robot text-white text-sm"></i>
                </div>
                <div class="bg-slate-800 px-4 py-3 rounded-3xl text-sm max-w-[80%]">
                    ${currentContextRetailer.name} has ₹${currentContextRetailer.outstanding} outstanding.
                </div>
            </div>
        `;
    }
    
    return `
        <div class="flex gap-3 mb-4">
            <div class="w-8 h-8 bg-orange-600 rounded-2xl flex-shrink-0 flex items-center justify-center">
                <i class="fa-solid fa-robot text-white text-sm"></i>
            </div>
            <div class="bg-slate-800 px-4 py-3 rounded-3xl text-sm max-w-[80%]">
                Got it. What specific detail do you need?
            </div>
        </div>
    `;
}

// ==================== TARGET SUMMARY ====================
function showTargetSummary() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4';
    
    modal.innerHTML = `
        <div class="bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div class="flex justify-between items-center p-6 border-b border-slate-700 flex-shrink-0">
                <h3 class="font-semibold text-2xl">My Targets 2026</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">×</button>
            </div>

            <div class="flex-1 overflow-y-auto p-6 space-y-6">
                <div class="bg-slate-800 rounded-3xl p-6">
                    <div class="flex justify-between mb-3">
                        <div>
                            <div class="text-sm text-slate-400">ANNUAL TARGET</div>
                            <div class="text-3xl font-semibold">₹32.5 Cr / ₹50 Cr</div>
                        </div>
                        <div class="text-right">
                            <div class="text-emerald-400 text-2xl font-medium">65%</div>
                            <div class="text-sm text-slate-400">1625 / 2500 Pressure Cookers</div>
                        </div>
                    </div>
                    <div class="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div class="h-3 bg-emerald-500 rounded-full w-[65%]"></div>
                    </div>
                </div>

                <div>
                    <div class="text-sm text-slate-400 mb-3">RETAILER SCHEME PROGRESS</div>
                    <div id="retailer-target-list" class="space-y-3"></div>
                </div>
            </div>

            <div class="p-6 border-t border-slate-700 flex-shrink-0">
                <button onclick="this.closest('.fixed').remove()" class="w-full py-4 bg-slate-700 hover:bg-slate-600 rounded-2xl font-medium">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    renderAllRetailers();
}

function renderAllRetailers() {
    const container = document.getElementById('retailer-target-list');
    if (!container) return;

    if (!retailers || retailers.length === 0) {
        container.innerHTML = `<div class="text-slate-400 text-center py-8">No retailer data loaded</div>`;
        return;
    }

    let html = '';

    retailers.forEach(retailer => {
        const progress = Math.max(15, 100 - Math.floor((retailer.outstanding || 0) / 800));
        const achieved = Math.floor((progress / 100) * 500);
        const colorClass = progress >= 70 ? 'emerald' : progress >= 40 ? 'orange' : 'red';
        const status = progress >= 70 ? 'On Track' : progress >= 40 ? 'Average' : 'At Risk';

        html += `
            <div onclick="showQuickView(${retailer.id}); this.closest('.fixed').remove();" 
                 class="bg-slate-800 p-4 rounded-2xl cursor-pointer hover:bg-slate-700 flex justify-between items-center">
                <div class="flex-1 min-w-0">
                    <div class="font-medium truncate">${retailer.name}</div>
                    <div class="text-xs text-slate-400">${retailer.area}</div>
                </div>
                <div class="text-right flex-shrink-0">
                    <div class="font-semibold">${achieved} / 500</div>
                    <div class="text-xs text-${colorClass}-400">${progress}% • ${status}</div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ==================== SKU INTELLIGENCE ====================
function openSKUIntelligence() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4';
    
    modal.innerHTML = `
        <div class="bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div class="flex justify-between items-center p-6 border-b border-slate-700 flex-shrink-0">
                <h3 class="font-semibold text-2xl">SKU Intelligence</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl leading-none">×</button>
            </div>
            <div class="p-6 border-b border-slate-700 flex-shrink-0">
                <input type="text" id="sku-search-input" placeholder="Search SKU..." 
                       class="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-sm focus:outline-none"
                       onkeyup="filterSKUs(this.value)">
            </div>
            <div class="flex-1 overflow-y-auto p-6 space-y-4" id="sku-list"></div>
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
            <div class="bg-slate-800 rounded-3xl p-5">
                <div class="font-semibold">${sku.name}</div>
                <div class="text-sm text-slate-400">MRP: ₹${sku.mrp}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function filterSKUs(query) {
    // Simple version for now
    renderSKUs();
}

// ==================== AUTO INITIALIZE ====================
window.onload = initializeApp;
