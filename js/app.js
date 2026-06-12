// ==================== GLOBAL VARIABLES ====================
let retailers = [];
let currentContextRetailer = null;
// Tab switching between Drona GPT and Strategy X
function switchTab(tab) {
    const dronaSection = document.getElementById('section-drona-gpt');
    const strategySection = document.getElementById('section-strategy-x');

    const dronaTab = document.getElementById('tab-drona-gpt');
    const strategyTab = document.getElementById('tab-strategy-x');

    if (tab === 'drona-gpt') {
        dronaSection.classList.remove('hidden');
        strategySection.classList.add('hidden');
        dronaTab.classList.add('active', 'bg-slate-700');
        strategyTab.classList.remove('active', 'bg-slate-700');
    } else {
        dronaSection.classList.add('hidden');
        strategySection.classList.remove('hidden');
        strategyTab.classList.add('active', 'bg-slate-700');
        dronaTab.classList.remove('active', 'bg-slate-700');

        // Initialize map only when Strategy X tab is opened for the first time
        if (!window.strategyXInitialized) {
            if (typeof initializeStrategyX === 'function') {
                initializeStrategyX();
                window.strategyXInitialized = true;
            }
        }
    }
}
// ==================== LOAD DATA ====================
async function loadRetailers() {
    try {
        const response = await fetch('data/retailers.json');
        if (!response.ok) throw new Error('Failed to load retailers.json');
        retailers = await response.json();
        console.log(`[Drona GPT] Loaded ${retailers.length} retailers`);
    } catch (error) {
        console.error("Error loading retailers:", error);
        const container = document.getElementById('chat-messages');
        if (container) {
            container.innerHTML = `<div class="text-red-400 p-4">Error loading data. Please check data/retailers.json</div>`;
        }
    }
}

// ==================== CHAT ====================
function addMessage(text, isUser = false) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`;

    const bubble = document.createElement('div');
    bubble.className = `max-w-[82%] px-4 py-3 rounded-3xl text-sm leading-relaxed ${isUser 
        ? 'message-user text-white' 
        : 'bg-slate-800 text-slate-200'}`;
    bubble.innerHTML = text;

    div.appendChild(bubble);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    addMessage(text, true);
    input.value = '';

    setTimeout(() => {
        const response = generateSmartResponse(text);
        addMessage(response);
    }, 500);
}

function generateSmartResponse(query) {
    const q = query.toLowerCase();

    if (currentContextRetailer) {
        const r = currentContextRetailer;

        if (q.includes("payment") || q.includes("outstanding") || q.includes("due")) {
            return `For <strong>${r.name}</strong>:<br>
                    Outstanding: <strong>₹${r.outstanding.toLocaleString()}</strong><br>
                    0-7 days: ₹${r.paymentAging["0-7"]} | 8-15: ₹${r.paymentAging["8-15"]} | 
                    16-30: ₹${r.paymentAging["16-30"]} | 30+: ₹${r.paymentAging["30+"]}`;
        }

        if (q.includes("pattern") || q.includes("sku") || q.includes("declining") || q.includes("risk")) {
            let html = `SKU Patterns for <strong>${r.name}</strong>:<br><br>`;
            r.skuPatterns.forEach(p => {
                const color = (p.status === "Declining" || p.status === "At Risk") ? "text-red-400" : "text-emerald-400";
                html += `• <strong>${p.sku}</strong> — <span class="${color}">${p.status}</span><br>${p.insight}<br>`;
            });
            return html;
        }
    }

    if (q.includes("behind on payment") || q.includes("high outstanding")) {
        const behind = retailers.filter(r => r.outstanding > 15000)
            .map(r => `${r.name} (₹${r.outstanding.toLocaleString()})`);
        return `Retailers with high outstanding:<br>${behind.join("<br>")}`;
    }

    if (q.includes("declining") || q.includes("at risk")) {
        const risky = retailers.filter(r => 
            r.skuPatterns.some(p => p.status === "Declining" || p.status === "At Risk")
        );
        return `Retailers with declining/at-risk SKUs: ${risky.map(r => r.name).join(", ")}`;
    }

    return `I can help with retailer details, payment status, SKU patterns, targets & sampling.<br>
            Try: "Payment status of Sharma Kirana" or "Show declining SKUs"`;
}

// ==================== CONTEXT ====================
function setChatContext(retailer) {
    currentContextRetailer = retailer;
    const indicator = document.getElementById('context-indicator');
    const nameEl = document.getElementById('context-name');

    if (indicator && nameEl) {
        nameEl.innerText = retailer.name;
        indicator.classList.remove('hidden');
        indicator.classList.add('flex');
    }
    addMessage(`Now focused on <strong>${retailer.name}</strong>. Ask me anything specific.`);
}

function clearContext() {
    currentContextRetailer = null;
    const indicator = document.getElementById('context-indicator');
    if (indicator) {
        indicator.classList.add('hidden');
        indicator.classList.remove('flex');
    }
}

// ==================== RETAILER SEARCH & QUICK VIEW ====================
function openRetailerSearch() {
    const modal = document.createElement('div');
    modal.id = 'search-modal';
    modal.className = `fixed inset-0 bg-black/70 flex items-center justify-center z-50`;
    modal.innerHTML = `
        <div onclick="event.target.id === 'search-modal' && closeSearchModal()" 
             class="bg-slate-900 border border-slate-700 w-full max-w-lg mx-4 rounded-3xl overflow-hidden">
            <div class="p-5 border-b border-slate-800 flex justify-between items-center">
                <div class="font-semibold">Search Retailers (${retailers.length})</div>
                <button onclick="closeSearchModal()" class="text-slate-400 hover:text-white text-2xl">×</button>
            </div>
            <div class="p-4">
                <input id="search-input" type="text" placeholder="Type name or area..." 
                       class="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm mb-4 focus:outline-none focus:border-orange-600"
                       onkeyup="filterRetailers()">
                <div id="retailer-list" class="max-h-[420px] overflow-y-auto space-y-1 pr-1"></div>
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

// Quick View Modal
function showQuickView(retailer) {
    const modal = document.createElement('div');
    modal.id = 'quickview-modal';
    modal.className = `fixed inset-0 bg-black/70 flex items-center justify-center z-[60]`;

    let contentHTML = `
        <div onclick="event.target.id === 'quickview-modal' && closeQuickView()" 
             class="bg-slate-900 border border-slate-700 w-full max-w-2xl mx-4 rounded-3xl max-h-[92vh] overflow-hidden flex flex-col">
            
            <div class="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                <div>
                    <div class="font-semibold text-xl">${retailer.name}</div>
                    <div class="text-sm text-slate-400">${retailer.area} • ${retailer.contact}</div>
                </div>
                <div class="flex items-center gap-x-2">
                    <button onclick="setChatContextFromModal(${retailer.id}); closeQuickView()" 
                            class="text-xs px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-2xl flex items-center gap-x-2">
                        <i class="fa-solid fa-comments"></i>
                        <span>Chat about this</span>
                    </button>
                    <button onclick="closeQuickView()" class="text-slate-400 hover:text-white px-3 text-xl">×</button>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto p-6 space-y-6 text-sm quickview-content">
    `;

    // Payment
    contentHTML += `
        <div>
            <div class="section-header mb-2">Payment Position</div>
            <div class="bg-slate-800 rounded-2xl p-4">
                <div class="text-3xl font-semibold">₹${retailer.outstanding.toLocaleString()}</div>
                <div class="text-xs text-slate-400 mb-3">Total Outstanding</div>
                <div class="grid grid-cols-2 gap-x-4 text-xs">
                    <div>0-7 days: ₹${retailer.paymentAging["0-7"]}</div>
                    <div>8-15 days: ₹${retailer.paymentAging["8-15"]}</div>
                    <div>16-30 days: ₹${retailer.paymentAging["16-30"]}</div>
                    <div class="text-red-400">30+ days: ₹${retailer.paymentAging["30+"]}</div>
                </div>
            </div>
        </div>
    `;

    // SKU Patterns
    contentHTML += `<div><div class="section-header mb-2">SKU Pattern Recognition</div><div class="space-y-3">`;
    retailer.skuPatterns.forEach(p => {
        const color = (p.status === "Declining" || p.status === "At Risk") ? "bg-red-900/60 text-red-400" : "bg-emerald-900/60 text-emerald-400";
        contentHTML += `
            <div class="bg-slate-800 rounded-2xl p-4">
                <div class="flex justify-between">
                    <div class="font-medium">${p.sku}</div>
                    <span class="${color} text-xs px-3 py-0.5 rounded-full">${p.status}</span>
                </div>
                <div class="text-xs text-slate-300 mt-1">${p.insight}</div>
            </div>
        `;
    });
    contentHTML += `</div></div>`;

    // Recent Orders
    contentHTML += `<div><div class="section-header mb-2">Recent Orders</div><div class="bg-slate-800 rounded-2xl overflow-hidden">`;
    retailer.recentOrders.forEach(o => {
        contentHTML += `
            <div class="px-4 py-3 border-b border-slate-700 last:border-b-0 flex justify-between">
                <div><div class="font-medium">${o.date}</div><div class="text-xs text-slate-400">${o.skus.join(", ")}</div></div>
                <div class="font-mono">₹${o.amount.toLocaleString()}</div>
            </div>
        `;
    });
    contentHTML += `</div></div>`;

    modal.innerHTML = contentHTML + `</div></div>`;
    document.body.appendChild(modal);
}

function closeQuickView() {
    const modal = document.getElementById('quickview-modal');
    if (modal) modal.remove();
}

function setChatContextFromModal(id) {
    const retailer = retailers.find(r => r.id === id);
    if (retailer) setChatContext(retailer);
}

// ==================== QUICK ACTIONS ====================
function showPaymentSummary() {
    const total = retailers.reduce((sum, r) => sum + r.outstanding, 0);
    const high = retailers.filter(r => r.outstanding > 15000).length;
    addMessage(`Total Outstanding: <strong>₹${total.toLocaleString()}</strong><br>Retailers with high dues: <strong>${high}</strong>`);
}

function showTargetSummary() {
    let target = 0, achieved = 0;
    retailers.forEach(r => { target += r.monthlyTarget; achieved += r.achievedThisMonth; });
    const pct = ((achieved / target) * 100).toFixed(1);
    addMessage(`Overall Achievement: <strong>${pct}%</strong><br>Target: ₹${target.toLocaleString()} | Achieved: ₹${achieved.toLocaleString()}`);
}

function showSamplingView() {
    let newSKUs = 0, existing = 0;
    retailers.forEach(r => {
        newSKUs += r.sampling.newSKUs.length;
        existing += r.sampling.existingSKUs.length;
    });
    addMessage(`New SKUs placed: <strong>${newSKUs}</strong><br>Existing SKUs placed: <strong>${existing}</strong>`);
}

function showAllRetailers() {
    openRetailerSearch();
}

function highlightDecliningRetailers() {
    const declining = retailers.filter(r => 
        r.skuPatterns.some(p => p.status === "Declining" || p.status === "At Risk")
    );
    if (declining.length === 0) {
        addMessage("No retailers with declining SKUs right now.");
        return;
    }
    addMessage(`Retailers with declining/at-risk SKUs:<br>${declining.map(r => r.name).join("<br>")}`);
}

// ==================== INITIALIZE ====================
function initializeApp() {
    loadRetailers().then(() => {
        const container = document.getElementById('chat-messages');
        if (container) {
            container.innerHTML = `
                <div class="flex justify-start">
                    <div class="max-w-[82%] px-4 py-3 rounded-3xl bg-slate-800 text-sm">
                        Hi Ramesh! I'm <strong>Drona GPT</strong> for TTK Prestige.<br><br>
                        Click <strong>Search Retailer</strong> or ask me anything about payments, SKU patterns, or targets.
                    </div>
                </div>
            `;
        }
    });

    // Enter key for chat
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    }

    console.log("%c[Drona GPT] App ready", "color:#64748b");
}

window.onload = initializeApp;
