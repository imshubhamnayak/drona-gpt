// ==================== STRATEGY X - PROFESSIONAL DASHBOARD (Fixed & Refactored) ====================

let currentMap = null;
let allRetailers = [];
let transactions = [];
let currentDraftPlan = null;

const BACKEND_URL = 'https://drona-gpt.onrender.com';

// ==================== LOAD SPLIT DATA ====================
async function loadStrategyData() {
    try {
        const masterRes = await fetch('data/retailers-master.json');
        const masterData = await masterRes.json();

        const osRes = await fetch('data/retailers-outstanding.json');
        const osData = await osRes.json();

        const transRes = await fetch('data/tally-transactions.json');
        const transData = await transRes.json();
        transactions = transData.transactions || [];

        allRetailers = masterData.retailers.map(master => {
            const osInfo = osData.retailers.find(o => o.id === master.id) || {};
            return {
                ...master,
                outstanding: osInfo.outstanding || 0,
                lastPaymentDaysAgo: osInfo.lastPaymentDaysAgo || 15,
                lastVisitDaysAgo: Math.floor(Math.random() * 20),
                monthlyOrders: Math.random() > 0.4,
                paymentTrend: Math.random() > 0.5 ? "85% on time" : "65% on time",
                skuSales: []
            };
        });

        console.log(`%c✅ Strategy X: Loaded ${allRetailers.length} retailers`, 'color:#22c55e');
    } catch (e) {
        console.error("Failed to load strategy data", e);
        allRetailers = [];
    }
}

// ==================== MAP ====================
function initMap() {
    if (currentMap) currentMap.remove();

    currentMap = L.map('strategy-map', { zoomControl: true, attributionControl: false })
        .setView([12.92, 77.60], 11.5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(currentMap);

    drawPerformanceCircles();
    setTimeout(() => currentMap.invalidateSize(), 300);
}

function drawPerformanceCircles() {
    if (!currentMap || !allRetailers.length) return;

    const areaData = {};
    allRetailers.forEach(r => {
        if (!areaData[r.area]) areaData[r.area] = {count: 0, totalOS: 0, lat: r.lat, lng: r.lng};
        areaData[r.area].count++;
        areaData[r.area].totalOS += (r.outstanding || 0);
    });

    Object.keys(areaData).forEach(area => {
        const d = areaData[area];
        const avgOS = d.totalOS / d.count;
        const color = avgOS > 35000 ? '#ef4444' : avgOS > 18000 ? '#f59e0b' : '#22c55e';

        L.circle([d.lat, d.lng], {
            radius: 1100,
            color: color,
            fillColor: color,
            fillOpacity: 0.28,
            weight: 3.5
        }).addTo(currentMap)
          .bindPopup(`<b>${area}</b><br>Avg OS: ₹${Math.round(avgOS).toLocaleString()}`);
    });
}

// ==================== FOCUS PLAN ====================
window.createFocusPlanForArea = function(areaName) {
    const normalized = String(areaName).trim();
    let areaRetailers = allRetailers.filter(r => String(r.area).trim() === normalized);

    if (areaRetailers.length === 0) {
        alert(`No retailers found in "${areaName}"`);
        return;
    }

    let regular = areaRetailers.filter(r => r.monthlyOrders)
        .sort((a, b) => (b.outstanding || 0) - (a.outstanding || 0));

    let others = areaRetailers.filter(r => !r.monthlyOrders)
        .sort((a, b) => (b.outstanding || 0) - (a.outstanding || 0));

    let selected = [
        ...regular.slice(0, Math.ceil(areaRetailers.length * 0.6)),
        ...others.slice(0, Math.ceil(areaRetailers.length * 0.4))
    ].slice(0, 12);

    currentDraftPlan = {
        area: areaName,
        totalRetailers: selected.length,
        totalOutstanding: selected.reduce((sum, r) => sum + (r.outstanding || 0), 0),
        selectedRetailers: selected,
        focus_skus: ["Prestige Pressure Cooker 5L", "Prestige Mixer Grinder 750W"],
        priority_actions: ["Meet high-outstanding retailers", "Push key SKUs", "Recover payments"],
        notes: `Smart coverage for ${areaName}`,
        plan_date: new Date().toISOString().split('T')[0]
    };

    showDraftModal(currentDraftPlan);
};

function showDraftModal(draft) {
    let html = `
    <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000]" id="draft-modal">
        <div class="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
            <div class="p-6 border-b border-slate-700">
                <h2 class="text-2xl font-bold">Draft Focus Plan</h2>
                <p class="text-slate-400 mt-1">Area: <strong>${draft.area}</strong></p>
            </div>

            <div class="flex-1 overflow-auto p-6 space-y-6">
                <div>
                    <label class="block text-sm text-slate-400 mb-2">Plan Date</label>
                    <input type="date" id="plan-date" value="${draft.plan_date}" 
                           class="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-orange-500">
                </div>

                <div>
                    <h3 class="font-medium mb-3 text-orange-400">Selected Retailers (${draft.totalRetailers})</h3>
                    <div class="space-y-3 max-h-60 overflow-auto">
                        ${draft.selectedRetailers.map(r => `
                            <div class="bg-slate-800 p-4 rounded-2xl flex justify-between items-center">
                                <div>
                                    <div class="font-medium">${r.name}</div>
                                    <div class="text-xs text-slate-400">${r.monthlyOrders ? 'Regular' : 'Vicinity'}</div>
                                </div>
                                <div class="text-right text-orange-400 font-medium">₹${(r.outstanding || 0).toLocaleString()}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="p-6 border-t border-slate-700 flex gap-4">
                <button onclick="closeDraftModal()" class="flex-1 py-4 bg-slate-700 hover:bg-slate-600 rounded-2xl font-medium">Cancel</button>
                <button onclick="saveDraftToSupabase()" class="flex-1 py-4 bg-orange-600 hover:bg-orange-500 rounded-2xl font-medium">Save Plan</button>
            </div>
        </div>
    </div>`;

    document.getElementById('draft-modal')?.remove();
    const modal = document.createElement('div');
    modal.innerHTML = html;
    document.body.appendChild(modal);
}

function closeDraftModal() {
    document.getElementById('draft-modal')?.remove();
}

async function saveDraftToSupabase() {
    if (!currentDraftPlan) return;

    const dateInput = document.getElementById('plan-date');
    const selectedDate = dateInput?.value || new Date().toISOString().split('T')[0];

    closeDraftModal();

    const plan = {
        active: true,
        created_by: "Admin",
        focus_skus: currentDraftPlan.focus_skus,
        notes: currentDraftPlan.notes,
        period: "Week",
        priority_actions: currentDraftPlan.priority_actions,
        territories: [currentDraftPlan.area],
        plan_date: selectedDate,
        priorityRetailers: currentDraftPlan.selectedRetailers.map(r => ({
            id: r.id,
            name: r.name,
            outstanding: r.outstanding || 0,
            reason: r.monthlyOrders ? "Regular Order Dealer" : "Vicinity Coverage"
        }))
    };

    try {
        const res = await fetch(`${BACKEND_URL}/focus-plans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(plan)
        });

        if (res.ok) {
            console.log("%c✅ Plan saved", "color:lime");
            alert(`Focus Plan saved for ${selectedDate}`);
            switchStrategyTab(0);
        } else {
            throw new Error('Save failed');
        }
    } catch (err) {
        console.error(err);
        alert("Failed to save plan. Check console.");
    }
}

// ==================== TAB SYSTEM ====================
function switchStrategyTab(tab) {
    document.querySelectorAll('[id^="stab-"]').forEach(b => b.classList.remove('tab-active'));
    const activeTab = document.getElementById(`stab-${tab}`);
    if (activeTab) activeTab.classList.add('tab-active');

    const content = document.getElementById('strategy-tab-content');
    if (!content) return;
    content.innerHTML = '';

    if (tab === 0) showFocusPlans();
    else if (tab === 1) showActiveTargets();
    else if (tab === 2) showTerritories();

    setTimeout(() => { if (currentMap) currentMap.invalidateSize(); }, 150);
}

function showFocusPlans() {
    const content = document.getElementById('strategy-tab-content');
    content.innerHTML = `
        <div class="text-center py-12 text-slate-400">
            <p class="text-lg">No Active Focus Plans Yet</p>
            <p class="text-sm mt-2">Click any area on the map to create one</p>
        </div>
    `;
}

function showActiveTargets() {
    const container = document.getElementById('strategy-tab-content');
    if (!container) return;

    let totalRevenueYTD = 0;
    let totalPCYTD = 0;
    let totalMGYTD = 0;

    allRetailers.forEach(r => {
        totalRevenueYTD += (r.totalSalesThisYear || 0); // fallback if available
    });

    const annualRevenueTarget = 360000000;
    const annualRevProgress = Math.min(100, Math.round((totalRevenueYTD / annualRevenueTarget) * 100));

    let html = `
        <div class="space-y-8">
            <div class="bg-gradient-to-r from-emerald-900 to-slate-800 border border-emerald-500 rounded-3xl p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <div class="text-emerald-400 font-semibold">OVERALL ANNUAL TARGET</div>
                        <div class="text-3xl font-bold mt-1">₹${(totalRevenueYTD/10000000).toFixed(1)} Cr / ₹36 Cr</div>
                    </div>
                    <div class="text-right">
                        <div class="text-emerald-400 text-2xl font-bold">${annualRevProgress}%</div>
                    </div>
                </div>
                <div class="h-4 bg-slate-700 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-500" style="width: ${annualRevProgress}%"></div>
                </div>
            </div>

            <div class="text-lg font-semibold mb-4">Retailer-wise Progress</div>
            <div class="space-y-6 max-h-[420px] overflow-auto">`;

    allRetailers.forEach(r => {
        html += `
            <div class="bg-slate-800 rounded-3xl p-5">
                <div class="font-medium">${r.name} (${r.area})</div>
                <div class="mt-2 text-sm">Outstanding: ₹${(r.outstanding || 0).toLocaleString()}</div>
            </div>`;
    });

    html += `</div></div>`;
    container.innerHTML = html;
}

function showTerritories() {
    const container = document.getElementById('strategy-tab-content');
    const areas = {};
    allRetailers.forEach(r => areas[r.area] = (areas[r.area] || 0) + 1);

    let html = `<div class="font-semibold mb-4">Territories</div>`;
    Object.keys(areas).forEach(area => {
        html += `
            <div onclick="createFocusPlanForArea('${area}')" 
                 class="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl cursor-pointer flex justify-between items-center mb-3">
                <span>${area}</span>
                <span class="text-slate-400">${areas[area]} retailers</span>
            </div>`;
    });
    container.innerHTML = html;
}

// ==================== INITIALIZE ====================
// Force reload data when Strategy X opens
async function initializeStrategyX() {
    console.log("%c[Strategy X] Initializing...", "color:#eab308");
    
    await loadStrategyData();
    
    if (document.getElementById('strategy-map')) {
        initMap();
    }
    
    switchStrategyTab(0);   // Default to Focus Plans tab
    console.log("%c✅ Strategy X Fully Ready", "color:#22c55e");
}

// Global Exports
window.initializeStrategyX = initializeStrategyX;
window.switchStrategyTab = switchStrategyTab;
window.createFocusPlanForArea = createFocusPlanForArea;
window.saveDraftToSupabase = saveDraftToSupabase;
window.closeDraftModal = closeDraftModal;
