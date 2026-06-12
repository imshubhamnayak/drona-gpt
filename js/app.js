// ==================== GLOBAL VARIABLES ====================
let retailers = [];
let currentContextRetailer = null;
let currentQuickViewRetailer = null;

// Load retailers
async function loadRetailers() {
    const res = await fetch('data/retailers.json');
    retailers = await res.json();
}

// ==================== CHAT ====================
function addMessage(text, isUser = false) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`;
    const bubble = document.createElement('div');
    bubble.className = `max-w-[82%] px-4 py-3 rounded-3xl text-sm ${isUser ? 'message-user text-white' : 'bg-slate-800'}`;
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
    }, 500);
}

function generateSmartResponse(query) {
    const q = query.toLowerCase();

    if (currentContextRetailer) {
        const r = currentContextRetailer;
        if (q.includes("payment") || q.includes("outstanding")) {
            return `For <strong>${r.name}</strong>: Outstanding ₹${r.outstanding.toLocaleString()}`;
        }
        if (q.includes("pattern") || q.includes("sku")) {
            return `SKU patterns for <strong>${r.name}</strong> are visible in the Retailers tab.`;
        }
    }

    if (q.includes("behind on payment")) {
        const behind = retailers.filter(r => r.outstanding > 15000).map(r => r.name);
        return `High outstanding retailers: ${behind.join(", ")}`;
    }

    return "I can help with retailer details, payment status, and SKU patterns.";
}

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
    if (indicator) indicator.classList.add('hidden');
}

// ==================== QUICK VIEW ====================
function showQuickView(retailer) {
    currentQuickViewRetailer = retailer;

    const modal = document.createElement('div');
    modal.id = 'quickview-modal';
    modal.className = `fixed inset-0 bg-black/70 flex items-center justify-center z-[60]`;

    let html = `
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

    modal.innerHTML = html;
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

// ==================== QUICK ACTIONS (FIXED) ====================
function showPaymentSummary() {
    const total = retailers.reduce((sum, r) => sum + r.outstanding, 0);
    addMessage(`Total Outstanding: <strong>₹${total.toLocaleString()}</strong>`);
}

function showTargetSummary() {
    let target = 0, achieved = 0;
    retailers.forEach(r => {
        target += r.monthlyTarget || 0;
        achieved += r.achievedThisMonth || 0;
    });
    const pct = target > 0 ? ((achieved / target) * 100).toFixed(1) : 0;
    addMessage(`Overall Target Achievement: <strong>${pct}%</strong>`);
}

function showSamplingView() {
    addMessage("Showcase a particular SKU to retailer as per Strategy X plans.");
}

function showAllRetailers() {
    openRetailerSearch();
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

// ==================== SKU INTELLIGENCE ====================
function loadSKUTags() {
    const container = document.getElementById('sku-tags');
    if (!container) return;

    fetch('data/skus.json')
        .then(res => res.json())
        .then(skus => {
            container.innerHTML = '';
            skus.forEach(sku => {
                const tag = document.createElement('button');
                tag.className = `px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-2xl text-sm transition-colors`;
                tag.innerText = sku.name;
                tag.onclick = () => {
                    document.getElementById('sku-search-input').value = sku.name;
                    searchSKU();
                };
                container.appendChild(tag);
            });
        });
}

function searchSKU() {
    const query = document.getElementById('sku-search-input').value.toLowerCase().trim();
    const resultDiv = document.getElementById('sku-result');

    fetch('data/skus.json')
        .then(res => res.json())
        .then(skus => {
            const sku = skus.find(s => s.name.toLowerCase().includes(query));
            if (sku) {
                resultDiv.innerHTML = `
                    <div class="font-semibold text-lg">${sku.name}</div>
                    <div class="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>MRP: <span class="font-mono">₹${sku.mrp}</span></div>
                        <div>E-commerce: <span class="font-mono">₹${sku.ecom_price}</span></div>
                        <div>Q-commerce: <span class="font-mono">₹${sku.qcom_price}</span></div>
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
        });
}

function switchDronaSubTab(tab) {
    document.getElementById('drona-sub-chat').classList.add('hidden');
    document.getElementById('drona-sub-retailers').classList.add('hidden');
    document.getElementById('drona-sub-sku-intelligence').classList.add('hidden');

    document.querySelectorAll('.subtab-button').forEach(el => el.classList.remove('active'));

    if (tab === 'chat') {
        document.getElementById('drona-sub-chat').classList.remove('hidden');
        document.getElementById('subtab-chat').classList.add('active');
    } else if (tab === 'retailers') {
        document.getElementById('drona-sub-retailers').classList.remove('hidden');
        document.getElementById('subtab-retailers').classList.add('active');
    } else if (tab === 'sku-intelligence') {
        document.getElementById('drona-sub-sku-intelligence').classList.remove('hidden');
        document.getElementById('subtab-sku').classList.add('active');
        loadSKUTags();
    }
}

// Tab switching
function switchTab(tab) {
    const drona = document.getElementById('section-drona-gpt');
    const strategy = document.getElementById('section-strategy-x');

    if (tab === 'drona-gpt') {
        drona.classList.remove('hidden');
        strategy.classList.add('hidden');
        document.getElementById('tab-drona-gpt').classList.add('active');
        document.getElementById('tab-strategy-x').classList.remove('active');
    } else {
        drona.classList.add('hidden');
        strategy.classList.remove('hidden');
        document.getElementById('tab-drona-gpt').classList.remove('active');
        document.getElementById('tab-strategy-x').classList.add('active');

        if (typeof initializeStrategyX === 'function' && !window.strategyXLoaded) {
            initializeStrategyX();
            window.strategyXLoaded = true;
        }
    }
}

// Initialize
async function initializeApp() {
    await loadRetailers();

    const container = document.getElementById('chat-messages');
    if (container) {
        container.innerHTML = `
            <div class="flex justify-start">
                <div class="max-w-[82%] px-4 py-3 rounded-3xl bg-slate-800 text-sm">
                    Hi Ramesh! I'm <strong>Drona GPT</strong>.<br>
                    I can help with retailer details, payment status, and SKU patterns.
                </div>
            </div>
        `;
    }
}

window.onload = initializeApp;
