// ==================== DRONA GPT - MAIN JS ====================

let retailers = [];
let currentContextRetailer = null;
let currentQuickViewRetailer = null;

// ==================== INITIALIZE ====================
async function initializeApp() {
    await loadRetailers();

    // Default view
    document.getElementById('drona-gpt-view').classList.remove('hidden');
    document.getElementById('strategy-x-view').classList.add('hidden');
    document.getElementById('tab-drona-gpt').classList.add('tab-active');

    updateUserHeader('Ramesh', 'Salesman');

    // Welcome message
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
}

// ==================== LOAD RETAILERS ====================
async function loadRetailers() {
    try {
        const res = await fetch('data/retailers.json');
        retailers = await res.json();
    } catch (e) {
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
        // Show Drona GPT View
        dronaView.classList.remove('hidden');
        strategyView.classList.add('hidden');

        tabDrona.classList.add('tab-active');
        tabStrategy.classList.remove('tab-active');

        updateUserHeader('Ramesh', 'Salesman');

    } else if (tab === 'strategy-x') {
        // Show Strategy X View
        dronaView.classList.add('hidden');
        strategyView.classList.remove('hidden');

        tabStrategy.classList.add('tab-active');
        tabDrona.classList.remove('tab-active');

        updateUserHeader('Admin', 'Owner');

        // ✅ Initialize Strategy X only once
        setTimeout(() => {
            if (typeof initializeStrategyX === 'function' && !window.strategyXInitialized) {
                initializeStrategyX();
                window.strategyXInitialized = true;
                console.log('%c[Strategy X] Initialized successfully', 'color:#22c55e');
            } else if (typeof initializeStrategyX === 'function') {
                // If already initialized, just refresh the map (optional)
                console.log('%c[Strategy X] Already initialized', 'color:#f59e0b');
            } else {
                console.warn('%c[Strategy X] initializeStrategyX function not found. Make sure strategy-x.js is loaded.', 'color:orange');
            }
        }, 300); // Small delay to ensure DOM is ready
    }
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
    }
    if (q.includes("behind on payment")) {
        const behind = retailers.filter(r => r.outstanding > 15000).map(r => r.name);
        return `High outstanding: ${behind.join(", ")}`;
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
                <button onclick="closeSearchModal()" class="text-2xl text-slate-400">×</button>
            </div>
            <div class="p-4">
                <input id="search-input" type="text" placeholder="Type retailer name or area..." 
                       class="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm mb-4"
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
        <div class="bg-slate-900 border border-slate-700 w-full max-w-2xl mx-4 rounded-3xl overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                <div>
                    <div class="font-semibold text-xl">${retailer.name}</div>
                    <div class="text-sm text-slate-400">${retailer.area}</div>
                </div>
                <button onclick="setChatContextFromQuickView()" class="bg-emerald-600 px-4 py-2 rounded-2xl text-sm">
                    Chat about this
                </button>
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
                <div class="font-semibold mb-2">Payment Position</div>
                <div class="bg-slate-800 rounded-2xl p-4">
                    <div class="text-3xl font-semibold">₹${retailer.outstanding.toLocaleString()}</div>
                </div>
            </div>
            <div>
                <div class="font-semibold mb-2">SKU Pattern</div>
                <div class="bg-slate-800 rounded-2xl p-4 text-sm">
                    ${retailer.skuPatterns ? retailer.skuPatterns.map(p => `
                        <div class="mb-2">
                            <strong>${p.sku}</strong> — <span class="${p.status === 'Declining' ? 'text-red-400' : 'text-emerald-400'}">${p.status}</span>
                        </div>
                    `).join('') : 'No SKU data available'}
                </div>
            </div>
        </div>
    `;
}

function setChatContextFromQuickView() {
    if (currentQuickViewRetailer) {
        closeQuickView();
        currentContextRetailer = currentQuickViewRetailer;
        addMessage(`Now focused on <strong>${currentQuickViewRetailer.name}</strong>.`);
    }
}

function closeQuickView() {
    const modal = document.getElementById('quickview-modal');
    if (modal) modal.remove();
}

// ==================== QUICK ACTIONS ====================
function showTargetSummary() {
    addMessage("Target achievement summary will be added soon.");
}

// ==================== SKU INTELLIGENCE ====================
function openSKUIntelligence() {
    const modal = document.createElement('div');
    modal.className = `fixed inset-0 bg-black/70 flex items-center justify-center z-[70]`;
    modal.innerHTML = `
        <div class="bg-slate-900 border border-slate-700 w-full max-w-lg mx-4 rounded-3xl overflow-hidden">
            <div class="p-5 border-b border-slate-800 flex justify-between items-center">
                <div class="font-semibold">SKU Intelligence</div>
                <button onclick="this.closest('.fixed').remove()" class="text-2xl text-slate-400">×</button>
            </div>
            <div class="p-5">
                <input id="sku-search-input" type="text" placeholder="Search SKU name..." 
                       class="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm mb-4"
                       onkeyup="if(event.key === 'Enter') searchSKU()">
                <div id="sku-result" class="hidden bg-slate-800 rounded-2xl p-4 text-sm"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('sku-search-input').focus();
}

async function searchSKU() {
    const query = document.getElementById('sku-search-input').value.toLowerCase().trim();
    const resultDiv = document.getElementById('sku-result');

    try {
        const res = await fetch('data/skus.json');
        const skus = await res.json();
        const sku = skus.find(s => s.name.toLowerCase().includes(query));

        if (sku) {
            resultDiv.innerHTML = `
                <div class="font-semibold text-lg">${sku.name}</div>
                <div class="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div>MRP: <span class="font-mono">₹${sku.mrp}</span></div>
                    <div>E-commerce: <span class="font-mono">₹${sku.ecom_price}</span></div>
                    <div class="text-orange-400">Gap vs MRP: <strong>${sku.gap_percent}%</strong></div>
                </div>
                <div class="mt-4 bg-slate-700 p-4 rounded-2xl text-sm">
                    <strong>Talking Point:</strong><br>${sku.talking_points}
                </div>
            `;
            resultDiv.classList.remove('hidden');
        } else {
            resultDiv.innerHTML = `<div class="text-red-400">SKU not found.</div>`;
            resultDiv.classList.remove('hidden');
        }
    } catch (e) {
        resultDiv.innerHTML = `<div class="text-red-400">Error loading SKU data.</div>`;
        resultDiv.classList.remove('hidden');
    }
}

// ==================== INITIALIZE ====================
window.onload = initializeApp;
