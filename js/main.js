// ==================== DRONA GPT - MAIN LOGIC ====================

let retailers = [];
let currentContextRetailer = null;

// Sample data (replace with fetch from data/retailers.json later)
const sampleRetailers = [
    { id: 1, name: "Sharma Kirana Store", area: "JP Nagar 1st Phase", phone: "9876543210", outstanding: 24500, paymentStatus: "Overdue 12 days", skuPatterns: [{ sku: "Prestige Pressure Cooker 5L", status: "Declining", insight: "Orders dropped 35% last month" }], recentOrders: [{ date: "2026-06-10", amount: 12500 }] },
    { id: 2, name: "Gupta General Stores", area: "JP Nagar 2nd Phase", phone: "9876543211", outstanding: 8700, paymentStatus: "Due in 5 days", skuPatterns: [{ sku: "Prestige Mixer Grinder", status: "Growing", insight: "Strong repeat orders" }], recentOrders: [{ date: "2026-06-11", amount: 5600 }] },
    { id: 3, name: "Lakshmi Provision Store", area: "JP Nagar 3rd Phase", phone: "9876543212", outstanding: 15200, paymentStatus: "Paid on time", skuPatterns: [{ sku: "Prestige Non-Stick Pan", status: "At Risk", insight: "No order in 18 days" }], recentOrders: [] }
];

function initializeApp() {
    console.log('%c[Drona GPT] Initializing...', 'color:#22c55e');
    
    // Load sample data
    retailers = sampleRetailers;

    // Set default user as Ramesh (Salesman)
    updateUserHeader('Ramesh', 'Salesman');

    // Show Drona GPT view by default
    const dronaView = document.getElementById('drona-gpt-view');
    const strategyView = document.getElementById('strategy-x-view');
    
    if (dronaView && strategyView) {
        dronaView.classList.remove('hidden');
        strategyView.classList.add('hidden');
    }

    // Initialize chat with welcome message
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = `
            <div class="flex gap-3 mb-4">
                <div class="w-8 h-8 bg-orange-600 rounded-2xl flex-shrink-0 flex items-center justify-center">
                    <i class="fa-solid fa-robot text-white text-sm"></i>
                </div>
                <div class="bg-slate-800 px-4 py-3 rounded-3xl text-sm max-w-[80%]">
                    Hi Ramesh! How can I help you today? You can ask about any retailer, SKU, or today's plan.
                </div>
            </div>
        `;
    }

    console.log('%c[Drona GPT] App initialized successfully', 'color:#22c55e');
}

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

        // Initialize Strategy X only once
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
                <!-- Payment Summary -->
                <div class="bg-slate-800 p-4 rounded-2xl">
                    <div class="text-xs text-slate-400 mb-1">OUTSTANDING</div>
                    <div class="text-2xl font-semibold">₹${retailer.outstanding.toLocaleString()}</div>
                    <div class="text-sm ${retailer.paymentStatus.includes('Overdue') ? 'text-red-400' : 'text-emerald-400'}">${retailer.paymentStatus}</div>
                </div>

                <!-- SKU Pattern -->
                <div>
                    <div class="text-xs text-slate-400 mb-2">SKU PATTERN RECOGNITION</div>
                    ${retailer.skuPatterns.map(p => `
                        <div class="bg-slate-800 p-3 rounded-2xl mb-2">
                            <div class="font-medium">${p.sku}</div>
                            <div class="text-sm ${p.status === 'Declining' || p.status === 'At Risk' ? 'text-red-400' : 'text-emerald-400'}">${p.status}</div>
                            <div class="text-xs text-slate-400 mt-1">${p.insight}</div>
                        </div>
                    `).join('')}
                </div>

                <div class="flex gap-3">
                    <button onclick="setChatContextFromQuickView(${retailer.id}); this.closest('.fixed').remove();" 
                            class="flex-1 py-3 bg-orange-600 rounded-2xl font-medium">Talk to Drona about this retailer</button>
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
    
    // Auto respond with context
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
                    Their ${currentContextRetailer.skuPatterns[0]?.sku} is ${currentContextRetailer.skuPatterns[0]?.status.toLowerCase()}.
                </div>
            </div>
        `;
    }
    
    if (lowerMsg.includes('outstanding') || lowerMsg.includes('payment')) {
        return `
            <div class="flex gap-3 mb-4">
                <div class="w-8 h-8 bg-orange-600 rounded-2xl flex-shrink-0 flex items-center justify-center">
                    <i class="fa-solid fa-robot text-white text-sm"></i>
                </div>
                <div class="bg-slate-800 px-4 py-3 rounded-3xl text-sm max-w-[80%]">
                    Sharma Kirana has the highest outstanding at ₹24,500 (Overdue 12 days). Would you like me to suggest a recovery script?
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
                Got it. I'm analyzing this. What specific detail do you need?
            </div>
        </div>
    `;
}
// ==================== TODAY'S PLAN / TARGET SUMMARY (Fixed Scrolling) ====================
function showTargetSummary() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4';
    
    modal.innerHTML = `
        <div class="bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            
            <!-- Header -->
            <div class="flex justify-between items-center p-6 border-b border-slate-700 flex-shrink-0">
                <h3 class="font-semibold text-2xl">My Targets 2026</h3>
                <button onclick="this.closest('.fixed').remove()" 
                        class="text-slate-400 hover:text-white text-3xl leading-none">×</button>
            </div>

            <!-- Scrollable Content -->
            <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll">
                
                <!-- Overall Annual Target -->
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

                <!-- Monthly Progress -->
                <div>
                    <div class="text-sm text-slate-400 mb-3">MONTHLY PROGRESS (2026)</div>
                    <div class="grid grid-cols-3 gap-3 text-center text-sm">
                        <div class="bg-slate-800 p-4 rounded-2xl">
                            <div class="text-emerald-400">Apr</div>
                            <div class="font-medium">₹4.8 Cr</div>
                            <div class="text-xs text-emerald-400">96%</div>
                        </div>
                        <div class="bg-slate-800 p-4 rounded-2xl">
                            <div class="text-emerald-400">May</div>
                            <div class="font-medium">₹5.2 Cr</div>
                            <div class="text-xs text-emerald-400">104%</div>
                        </div>
                        <div class="bg-slate-800 p-4 rounded-2xl">
                            <div class="text-orange-400">Jun</div>
                            <div class="font-medium">₹3.1 Cr</div>
                            <div class="text-xs text-orange-400">62%</div>
                        </div>
                    </div>
                </div>

                <!-- Retailer Scheme Progress -->
                <div>
                    <div class="text-sm text-slate-400 mb-3">RETAILER SCHEME PROGRESS (Annual - 500 pcs target each)</div>
                    <div id="retailer-target-list" class="space-y-3"></div>
                </div>

            </div>

            <!-- Footer Button -->
            <div class="p-6 border-t border-slate-700 flex-shrink-0">
                <button onclick="this.closest('.fixed').remove()" 
                        class="w-full py-4 bg-slate-700 hover:bg-slate-600 rounded-2xl font-medium">
                    Close
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    renderAllRetailers();
}
function renderAllRetailers() {
    const container = document.getElementById('retailer-target-list');
    if (!container) return;

    const retailersData = [
        {name: "Sharma Kirana Store", achieved: 312, status: "On Track"},
        {name: "Gupta General Stores", achieved: 428, status: "Strong"},
        {name: "Lakshmi Provision Store", achieved: 95, status: "At Risk"},
        {name: "Bharat Traders", achieved: 245, status: "Average"},
        {name: "Royal Kirana", achieved: 389, status: "On Track"},
        {name: "Anand Super Market", achieved: 156, status: "At Risk"},
        {name: "Balaji Enterprises", achieved: 467, status: "Strong"},
        {name: "Mohan Provision Store", achieved: 278, status: "Average"},
        {name: "Sri Venkateshwara Stores", achieved: 342, status: "On Track"},
        {name: "New Bangalore Mart", achieved: 189, status: "At Risk"},
        {name: "Karnataka Traders", achieved: 412, status: "Strong"},
        {name: "Sai Ram Kirana", achieved: 267, status: "Average"},
        {name: "Ganesh General Store", achieved: 398, status: "On Track"},
        {name: "Laxmi Narayana Stores", achieved: 134, status: "At Risk"},
        {name: "Modern Provision Store", achieved: 456, status: "Strong"},
        {name: "Vijayalakshmi Traders", achieved: 289, status: "Average"},
        {name: "Krishna Super Market", achieved: 367, status: "On Track"},
        {name: "Raju Kirana Store", achieved: 98, status: "At Risk"},
        {name: "Srinivasa Enterprises", achieved: 445, status: "Strong"},
        {name: "New India Mart", achieved: 312, status: "On Track"},
        {name: "Bhavani Provision Store", achieved: 267, status: "Average"},
        {name: "Uma Shankar Traders", achieved: 189, status: "At Risk"},
        {name: "Maa Durga Kirana", achieved: 398, status: "On Track"},
        {name: "Golden Mart", achieved: 456, status: "Strong"},
        {name: "Classic Provision Store", achieved: 245, status: "Average"}
    ];

    let html = '';

    retailersData.forEach((retailer, index) => {
        const percent = Math.floor((retailer.achieved / 500) * 100);
        let colorClass = percent >= 70 ? 'emerald' : percent >= 40 ? 'orange' : 'red';
        let statusText = percent >= 70 ? 'On Track' : percent >= 40 ? 'Average' : 'At Risk';

        html += `
            <div onclick="showQuickView(${index + 1}); this.closest('.fixed').remove();" 
                 class="bg-slate-800 p-4 rounded-2xl cursor-pointer hover:bg-slate-700 flex justify-between items-center">
                <div class="flex-1 min-w-0">
                    <div class="font-medium truncate">${retailer.name}</div>
                    <div class="text-xs text-slate-400">Target: 500 pcs</div>
                </div>
                <div class="text-right flex-shrink-0">
                    <div class="font-semibold">${retailer.achieved} / 500</div>
                    <div class="text-xs text-${colorClass}-400">${percent}% • ${statusText}</div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}
// ==================== SKU INTELLIGENCE (Enhanced) ====================
function openSKUIntelligence() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4';
    
    modal.innerHTML = `
        <div class="bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            
            <!-- Header -->
            <div class="flex justify-between items-center p-6 border-b border-slate-700 flex-shrink-0">
                <h3 class="font-semibold text-2xl">SKU Intelligence</h3>
                <button onclick="this.closest('.fixed').remove()" 
                        class="text-slate-400 hover:text-white text-3xl leading-none">×</button>
            </div>

            <!-- Search Bar -->
            <div class="p-6 border-b border-slate-700 flex-shrink-0">
                <input type="text" id="sku-search-input" 
                       placeholder="Search SKU (e.g. Pressure Cooker, Mixer...)" 
                       class="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-sm focus:outline-none"
                       onkeyup="filterSKUs(this.value)">
            </div>

            <!-- Scrollable SKU List -->
            <div class="flex-1 overflow-y-auto p-6 space-y-4" id="sku-list">
                <!-- Populated by JS -->
            </div>

            <div class="p-6 border-t border-slate-700 flex-shrink-0 text-center text-xs text-slate-500">
                Data compared with Amazon, Flipkart & Local Market • Updated today
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    renderSKUs();
}
let allSKUs = [];

function renderSKUs(filteredSKUs = null) {
    const container = document.getElementById('sku-list');
    if (!container) return;

    const skusToShow = filteredSKUs || allSKUs;

    let html = '';

    skusToShow.forEach(sku => {
        const savings = sku.mrp - sku.ecomPrice;
        const savingsPercent = Math.round((savings / sku.mrp) * 100);

        html += `
            <div class="bg-slate-800 rounded-3xl p-5 hover:bg-slate-700 transition-all">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <div class="font-semibold text-lg">${sku.name}</div>
                        <div class="text-xs text-slate-400">MRP: ₹${sku.mrp}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-emerald-400 font-medium text-lg">₹${savings} Gap</div>
                        <div class="text-xs text-emerald-400">${savingsPercent}% cheaper online</div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 text-sm bg-slate-900/50 rounded-2xl p-4">
                    <div>
                        <div class="text-slate-400 text-xs">Amazon</div>
                        <div class="font-medium">₹${sku.ecomPrice}</div>
                    </div>
                    <div>
                        <div class="text-slate-400 text-xs">Flipkart</div>
                        <div class="font-medium">₹${Math.round(sku.ecomPrice * 0.97)}</div>
                    </div>
                </div>

                <div class="mt-4 text-sm text-slate-300 bg-slate-900/70 p-4 rounded-2xl">
                    <strong>Talking Point:</strong> ${sku.talkingPoint}
                </div>
            </div>
        `;
    });

    container.innerHTML = html || `<div class="text-center py-12 text-slate-400">No matching SKUs found</div>`;
}

function filterSKUs(query) {
    if (!query) {
        renderSKUs();
        return;
    }

    const filtered = allSKUs.filter(sku => 
        sku.name.toLowerCase().includes(query.toLowerCase())
    );
    renderSKUs(filtered);
}
// Initialize SKU Data
allSKUs = [
    { name: "Prestige Pressure Cooker 5L", mrp: 2499, ecomPrice: 1899, talkingPoint: "High demand item. Retailers can easily sell at ₹2199-2299 with good margin." },
    { name: "Prestige Mixer Grinder 750W", mrp: 4299, ecomPrice: 3199, talkingPoint: "Push combo offer with cooker. Good for gifting season." },
    { name: "Prestige Non-Stick Pan 30cm", mrp: 1299, ecomPrice: 899, talkingPoint: "Best margin product right now. Highlight durability to customers." },
    { name: "Prestige Induction Base Kadai", mrp: 1899, ecomPrice: 1399, talkingPoint: "Popular in modern kitchens. Target young families." },
    { name: "Prestige Stainless Steel Cookware Set", mrp: 5999, ecomPrice: 4499, talkingPoint: "Premium segment. Good for upselling." },
    { name: "Prestige Rice Cooker 1.8L", mrp: 2199, ecomPrice: 1699, talkingPoint: "Steady seller. Stock up before festival season." }
];

// ==================== AUTO INITIALIZE ====================
window.onload = initializeApp;
