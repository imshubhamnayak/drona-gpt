// ==================== GLOBAL VARIABLES ====================
let retailers = [];
let currentContextRetailer = null;
let currentQuickViewRetailer = null;

// Load retailers
async function loadRetailers() {
    const res = await fetch('data/retailers.json');
    retailers = await res.json();
}

// Chat functions (same as before)
function addMessage(text, isUser = false) { /* ... keep your existing code ... */ }
function sendMessage() { /* ... keep your existing code ... */ }
function generateSmartResponse(query) { /* ... keep your existing code ... */ }
function setChatContext(retailer) { /* ... keep your existing code ... */ }
function clearContext() { /* ... keep your existing code ... */ }

// Quick View
function showQuickView(retailer) {
    currentQuickViewRetailer = retailer;
    // ... (keep your existing showQuickView code)
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
        loadSKUTags(); // Load clickable tags
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

// Quick Actions
function showPaymentSummary() { /* ... */ }
function showTargetSummary() { /* ... */ }
function showSamplingView() { /* ... */ }
function showAllRetailers() { openRetailerSearch(); }

// Initialize
async function initializeApp() {
    await loadRetailers();
    // Welcome message...
}

window.onload = initializeApp;
