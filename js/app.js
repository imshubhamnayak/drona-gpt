// ==================== GLOBAL VARIABLES ====================
let retailers = [];
let currentContextRetailer = null;

// ==================== LOAD DATA ====================
async function loadRetailers() {
    try {
        const response = await fetch('data/retailers.json');
        retailers = await response.json();
        console.log(`[Drona GPT] Loaded ${retailers.length} retailers successfully`);
    } catch (error) {
        console.error("Failed to load retailers.json", error);
        // Fallback: show error in chat
        const container = document.getElementById('chat-messages');
        if (container) {
            container.innerHTML = `<div class="text-red-400 p-4">Error loading retailer data. Please check data/retailers.json</div>`;
        }
    }
}

// ==================== CHAT FUNCTIONS ====================
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
    }, 550);
}

function generateSmartResponse(query) {
    const q = query.toLowerCase();

    // If a retailer is in context
    if (currentContextRetailer) {
        const r = currentContextRetailer;

        if (q.includes("payment") || q.includes("outstanding") || q.includes("due")) {
            return `For <strong>${r.name}</strong>:<br>
                    Outstanding: <strong>₹${r.outstanding.toLocaleString()}</strong><br>
                    Aging → 0-7 days: ₹${r.paymentAging["0-7"].toLocaleString()} | 
                    8-15: ₹${r.paymentAging["8-15"].toLocaleString()} | 
                    16-30: ₹${r.paymentAging["16-30"].toLocaleString()} | 
                    30+: ₹${r.paymentAging["30+"].toLocaleString()}`;
        }

        if (q.includes("pattern") || q.includes("sku") || q.includes("declining") || q.includes("risk")) {
            let html = `SKU Patterns for <strong>${r.name}</strong>:<br><br>`;
            r.skuPatterns.forEach(p => {
                const statusColor = p.status === "Declining" || p.status === "At Risk" ? "text-red-400" : "text-emerald-400";
                html += `• <strong>${p.sku}</strong> — <span class="${statusColor}">${p.status}</span><br>
                         ${p.insight}<br>
                         <span class="text-xs text-slate-400">${p.frequency} | Last: ${p.lastOrder}</span><br><br>`;
            });
            return html;
        }

        if (q.includes("target") || q.includes("scheme")) {
            if (r.schemes.length === 0) return `No active schemes for ${r.name} this month.`;
            let html = `Schemes for <strong>${r.name}</strong>:<br>`;
            r.schemes.forEach(s => {
                html += `• ${s.name} — Target: ₹${s.target.toLocaleString()} | Achieved: ₹${s.achieved.toLocaleString()} (${s.status})<br>`;
            });
            return html;
        }
    }

    // Global queries
    if (q.includes("behind on payment") || q.includes("high outstanding")) {
        const behind = retailers.filter(r => r.outstanding > 15000)
            .map(r => `${r.name} (₹${r.outstanding.toLocaleString()})`);
        return `Retailers with high outstanding (>₹15k):<br>${behind.join("<br>")}`;
    }

    if (q.includes("declining") || q.includes("at risk")) {
        const risky = retailers.filter(r => r.skuPatterns.some(p => p.status === "Declining" || p.status === "At Risk"));
        return `Retailers with declining/at-risk SKUs: ${risky.map(r => r.name).join(", ")}`;
    }

    if (q.includes("payment summary") || q.includes("total outstanding")) {
        const total = retailers.reduce((sum, r) => sum + r.outstanding, 0);
        return `Total outstanding across all retailers: <strong>₹${total.toLocaleString()}</strong>`;
    }

    return `I can help with:<br>
            • Retailer details & payment status<br>
            • SKU patterns (declining/growing)<br>
            • Targets & schemes<br>
            • Sampling status<br><br>
            Try: "Payment status of Sharma Kirana" or "Show declining SKUs"`;
}

// ==================== CONTEXT MANAGEMENT ====================
function setChatContext(retailer) {
    currentContextRetailer = retailer;
    
    const indicator = document.getElementById('context-indicator');
    const nameEl = document.getElementById('context-name');
    
    if (indicator && nameEl) {
        nameEl.innerText = retailer.name;
        indicator.classList.remove('hidden');
        indicator.classList.add('flex');
    }
    
    addMessage(`Now focused on <strong>${retailer.name}</strong>. You can ask specific questions about this retailer.`);
}

function clearContext() {
    currentContextRetailer = null;
    
    const indicator = document.getElementById('context-indicator');
    if (indicator) {
        indicator.classList.add('hidden');
        indicator.classList.remove('flex');
    }
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
                <div class="font-semibold">Search Retailers (${retailers.length})</div>
                <button onclick="closeSearchModal()" class="text-slate-400 hover:text-white text-xl">×</button>
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
        div.className = `flex justify-between items-center p-3 hover:bg-slate-800 rounded-2xl cursor-pointer border border-transparent hover:border-slate-700`;
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

// ==================== QUICK VIEW MODAL ====================
function showQuickView(retailer) {
    const modal = document.createElement('div');
    modal.id = 'quickview-modal';
    modal.className = `fixed inset-0 bg-black/70 flex items-center justify-center z-[60]`;

    let html = `
        <div onclick="event.target.id === 'quickview-modal' && closeQuickView()" 
             class="bg-slate-900 border border-slate-700 w-full max-w-2xl mx-4 rounded-3xl max-h-[92vh] overflow-hidden flex flex-col">
            
            <!-- Header -->
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

            <div class="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
    `;

    // Payment Position
    html += `
        <div>
            <div class="section-header mb-2">Payment Position</div>
            <div class="bg-slate-800 rounded-2xl p-4">
                <div class="text-3xl font-semibold mb-1">₹${retailer.outstanding.toLocaleString()}</div>
                <div class="text-xs text-slate-400 mb-4">Total Outstanding</div>
                
                <div class="grid grid-cols-2 gap-x-4 text-xs">
                    <div>0-7 days: <span class="font-mono">₹${retailer.paymentAging["0-7"].toLocaleString()}</span></div>
                    <div>8-15 days: <span class="font-mono">₹${retailer.paymentAging["8-15"].toLocaleString()}</span></div>
                    <div>16-30 days: <span class="font-mono">₹${retailer.paymentAging["16-30"].toLocaleString()}</span></div>
                    <div class="text-red-400">30+ days: <span class="font-mono">₹${retailer.paymentAging["30+"].toLocaleString()}</span></div>
                </div>
            </div>
        </div>
    `;

    // SKU Pattern Recognition
    html += `
        <div>
            <div class="section-header mb-2">SKU Pattern Recognition</div>
            <div class="space-y-3">
    `;
    retailer.skuPatterns.forEach(p => {
        const color = (p.status === "Declining" || p.status === "At Risk") ? "bg-red-900/60 text-red-400" : "bg-emerald-900/60 text-emerald-400";
        html += `
            <div class="bg-slate-800 rounded-2xl p-4">
                <div class="flex justify-between items-start">
                    <div class="font-medium">${p.sku}</div>
                    <span class="${color} text-xs px-3 py-1 rounded-full">${p.status}</span>
                </div>
                <div class="text-xs text-slate-300 mt-2">${p.insight}</div>
                <div class="text-[10px] text-slate-500 mt-1">${p.frequency} • Last ordered: ${p.lastOrder}</div>
            </div>
        `;
    });
    html += `</div></div>`;

    // Recent Orders
    html += `
        <div>
            <div class="section-header mb-2">Recent Orders</div>
            <div class="bg-slate-800 rounded-2xl overflow-hidden">
    `;
    retailer.recentOrders.forEach(order => {
        html += `
            <div class="px-4 py-3 border-b border-slate-700 last:border-b-0 flex justify-between items-center">
                <div>
                    <div class="font-medium">${order.date}</div>
                    <div class="text-xs text-slate-400">${order.skus.join(", ")}</div>
                </div>
                <div class="font-mono text-right">₹${order.amount.toLocaleString()}</div>
            </div>
        `;
    });
    html += `</div></div>`;

    // Targets & Schemes
    if (retailer.schemes.length > 0) {
        html += `
            <div>
                <div class="section-header mb-2">Schemes Standing</div>
                <div class="bg-slate-800 rounded-2xl p-4 space-y-2 text-xs">
        `;
        retailer.schemes.forEach(s => {
            html += `<div>${s.name} — Target: ₹${s.target.toLocaleString()} | Achieved: ₹${s.achieved.toLocaleString()} <span class="text-emerald-400">(${s.status})</span></div>`;
        });
        html += `</div></div>`;
    }

    // Sampling
    html += `
        <div>
            <div class="section-header mb-2">Sampling Status</div>
            <div class="bg-slate-800 rounded-2xl p-4 text-xs">
                <div class="mb-1 font-medium">New SKUs</div>
                ${retailer.sampling.newSKUs.length > 0 
                    ? retailer.sampling.newSKUs.map(s => `• ${s.sku} (placed on ${s.date})`).join("<br>") 
                    : "No new SKU samples placed yet."}
                
                <div class="mt-3 mb-1 font-medium">Existing SKUs</div>
                ${retailer.sampling.existingSKUs.length > 0 
                    ? retailer.sampling.existingSKUs.map(s => `• ${s.sku} (placed on ${s.date})`).join("<br>") 
                    : "No existing SKU samples placed yet."}
            </div>
        </div>
    `;

    html += `</div></div>`;
    modal.innerHTML = html;
    document.body.appendChild(modal);
}

function closeQuickView() {
    const modal = document.getElementById('quickview-modal');
    if (modal) modal.remove();
}

function setChatContextFromModal(id) {
    const retailer = retailers.find(r => r.id === id);
    if (retailer) {
        setChatContext(retailer);
    }
}

// ==================== QUICK ACTIONS ====================
function showPaymentSummary() {
    const total = retailers.reduce((sum, r) => sum + r.outstanding, 0);
    const high = retailers.filter(r => r.outstanding > 15000).length;
    addMessage(`Total Outstanding: <strong>₹${total.toLocaleString()}</strong><br>
                Retailers with high dues (>₹15k): <strong>${high}</strong>`);
}

function showTargetSummary() {
    let totalTarget = 0;
    let totalAchieved = 0;
    retailers.forEach(r => {
        totalTarget += r.monthlyTarget;
        totalAchieved += r.achievedThisMonth;
    });
    const achievement = ((totalAchieved / totalTarget) * 100).toFixed(1);
    addMessage(`Overall Target Achievement: <strong>${achievement}%</strong><br>
                Total Target: ₹${totalTarget.toLocaleString()} | Achieved: ₹${totalAchieved.toLocaleString()}`);
}

function showSamplingView() {
    let newCount = 0;
    let existingCount = 0;
    retailers.forEach(r => {
        newCount += r.sampling.newSKUs.length;
        existingCount += r.sampling.existingSKUs.length;
    });
    addMessage(`Sampling Status:<br>
                New SKUs placed: <strong>${newCount}</strong><br>
                Existing SKUs placed: <strong>${existingCount}</strong>`);
}

function showAllRetailers() {
    openRetailerSearch();
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
                        I can help you with retailer details, payment status, SKU patterns, targets & sampling.<br><br>
                        Click <strong>Search Retailer</strong> or ask me anything.
                    </div>
                </div>
            `;
        }
    });

    // Enter key support for chat
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    }

    console.log("%c[Drona GPT] App initialized successfully", "color:#64748b");
}

// Boot the application
window.onload = initializeApp;
