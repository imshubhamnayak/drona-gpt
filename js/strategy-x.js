// ==================== STRATEGY X - FIXED MAP + TABS ====================

let allRetailers = [];
let currentMap = null;
let currentDraftPlan = null;

const BACKEND_URL = 'https://drona-gpt.onrender.com';

// ==================== LOAD DATA ====================
async function loadStrategyData() {
    try {
        const res = await fetch('data/retailers.json');
        const data = await res.json();
        allRetailers = data.retailers || [];
        console.log(`✅ Loaded ${allRetailers.length} retailers`);
    } catch (err) {
        console.error(err);
    }
}

// ==================== MAP ====================
function initMap() {
    const container = document.getElementById('strategy-map');
    if (!container) return;
    container.innerHTML = '';

    currentMap = L.map('strategy-map', { zoomControl: true }).setView([12.92, 77.60], 11.5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(currentMap);
    drawPerformanceCircles();
}

function drawPerformanceCircles() {
    if (!currentMap || !allRetailers.length) return;

    const areas = {};
    allRetailers.forEach(r => {
        if (!areas[r.area]) areas[r.area] = [];
        areas[r.area].push(r);
    });

    Object.keys(areas).forEach(areaName => {
        const group = areas[areaName];
        const avgLat = group.reduce((sum, r) => sum + (r.lat || 12.92), 0) / group.length;
        const avgLng = group.reduce((sum, r) => sum + (r.lng || 77.60), 0) / group.length;
        const avgOS = group.reduce((sum, r) => sum + (r.outstanding || 0), 0) / group.length;

        let color = "#22c55e";
        if (avgOS > 30000) color = "#ef4444";
        else if (avgOS > 18000) color = "#f59e0b";

        const circle = L.circle([avgLat, avgLng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.25,
            radius: 1650,
            weight: 3.5
        }).addTo(currentMap);

        circle.bindPopup(`<b>${areaName}</b><br>${group.length} retailers<br>Avg O/S: ₹${Math.round(avgOS).toLocaleString()}`);
        circle.on('click', () => createFocusPlanForArea(areaName));
    });
}

function toggleMap() {
    const container = document.getElementById('map-container');
    const text = document.getElementById('map-toggle-text');
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        text.textContent = 'Hide Map';
    } else {
        container.style.display = 'none';
        text.textContent = 'Show Map';
    }
    
    // Important: Refresh map size after toggle
    setTimeout(() => {
        if (currentMap) currentMap.invalidateSize();
    }, 300);
}

// ==================== FOCUS PLAN ====================
window.createFocusPlanForArea = async function(areaName) {
    const normalized = String(areaName).trim();
    let areaRetailers = allRetailers.filter(r => String(r.area).trim() === normalized);

    if (areaRetailers.length === 0) {
        alert(`No retailers found in "${areaName}"`);
        return;
    }

    let regular = areaRetailers.filter(r => r.monthlyOrders === true)
        .sort((a, b) => (b.outstanding || 0) - (a.outstanding || 0));

    let others = areaRetailers.filter(r => r.monthlyOrders !== true)
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
    const selectedDate = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split('T')[0];

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

        if (!res.ok) throw new Error('Save failed');

        console.log("%c✅ Plan saved for", "color:lime", selectedDate);
        alert(`✅ Focus Plan saved for ${selectedDate}!`);
        switchStrategyTab(0); // Refresh Focus Plans
    } catch (err) {
        console.error(err);
        alert("Save failed. Check console.");
    }
}

// ==================== TAB SYSTEM ====================
async function switchStrategyTab(tab) {
    document.querySelectorAll('[id^="stab-"]').forEach(btn => btn.classList.remove('tab-active'));
    document.getElementById(`stab-${tab}`).classList.add('tab-active');

    const content = document.getElementById('strategy-tab-content');

    if (tab === 0) {
        await showPublishedPlans();
    } else if (tab === 1) {
        await showActiveTargets();
    } else if (tab === 2) {
        populateTerritoryList();
    }
}

// Focus Plans
async function showPublishedPlans() {
    const container = document.getElementById('strategy-tab-content');
    try {
        const res = await fetch(`${BACKEND_URL}/focus-plans`);
        const plans = await res.json();

        let html = `<div class="font-semibold mb-4">Active Focus Plans (${plans.length})</div>`;

        if (plans.length === 0) {
            html += `<p class="text-slate-400 text-center py-12">No active focus plans yet.<br>Click on any area on the map to create one.</p>`;
        } else {
            plans.forEach(plan => {
                html += `
                    <div class="bg-slate-800 p-4 rounded-2xl mb-3 cursor-pointer hover:bg-slate-700" onclick="viewPlan('${plan.id}')">
                        <div class="flex justify-between items-start">
                            <div>
                                <div class="font-medium">${plan.territories?.[0] || plan.area}</div>
                                <div class="text-xs text-slate-400">${plan.plan_date}</div>
                            </div>
                            <button onclick="event.stopImmediatePropagation(); deletePlan('${plan.id}');" class="text-red-400 text-xl">🗑</button>
                        </div>
                    </div>`;
            });
        }
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = `<p class="text-red-400">Failed to load plans</p>`;
    }
}

// Targets Tab (SKU Breakdown)
async function showActiveTargets() {
    const container = document.getElementById('strategy-tab-content');
    const revTarget = 150000;
    const pcTarget = 80;
    const mgTarget = 45;

    let html = `<div class="bg-emerald-900/30 border border-emerald-600 p-5 rounded-3xl mb-6">
        <div class="text-emerald-400 font-medium">Ramesh Overall Target</div>
        <div class="text-3xl font-bold">₹3.0 Cr / Month</div>
    </div>`;

    allRetailers.forEach(r => {
        const revCurrent = Math.floor((r.totalSalesThisYear || 0) / 12);
        const revProg = Math.min(100, Math.round((revCurrent / revTarget) * 100));

        const pcSales = r.skuSales?.find(s => s.sku.includes("Pressure Cooker"))?.qty || 0;
        const pcProg = Math.min(100, Math.round((pcSales / pcTarget) * 100));

        const mgSales = r.skuSales?.find(s => s.sku.includes("Mixer Grinder"))?.qty || 0;
        const mgProg = Math.min(100, Math.round((mgSales / mgTarget) * 100));

        html += `
            <div class="bg-slate-800 p-5 rounded-3xl mb-4">
                <div class="font-medium">${r.name}</div>
                <div class="text-xs text-slate-400">${r.area}</div>
                <div class="space-y-4 mt-4">
                    <div>
                        <div class="flex justify-between text-xs mb-1">
                            <span class="text-emerald-400">Revenue</span>
                            <span>₹${revCurrent.toLocaleString()} / ₹${revTarget.toLocaleString()}</span>
                        </div>
                        <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div class="h-full bg-emerald-500" style="width:${revProg}%"></div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <div class="flex justify-between text-xs mb-1">
                                <span>Pressure Cooker</span>
                                <span>${pcSales} / ${pcTarget}</span>
                            </div>
                            <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div class="h-full bg-orange-500" style="width:${pcProg}%"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between text-xs mb-1">
                                <span>Mixer Grinder</span>
                                <span>${mgSales} / ${mgTarget}</span>
                            </div>
                            <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div class="h-full bg-blue-500" style="width:${mgProg}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    });

    container.innerHTML = html;
}

function populateTerritoryList() {
    const container = document.getElementById('strategy-tab-content');
    const areas = {};
    allRetailers.forEach(r => areas[r.area] = (areas[r.area]||0) + 1);

    let html = `<div class="font-semibold mb-4">Territories</div>`;
    Object.keys(areas).forEach(area => {
        html += `
            <div onclick="createFocusPlanForArea('${area}')" 
                 class="p-4 hover:bg-slate-700 rounded-2xl cursor-pointer border border-slate-700 flex justify-between items-center mb-2">
                <span>${area}</span>
                <span class="text-slate-400">${areas[area]} retailers</span>
            </div>`;
    });
    container.innerHTML = html;
}

// ==================== INITIALIZE ====================
async function initializeStrategyX() {
    await loadStrategyData();
    initMap();
    switchStrategyTab(0);
    console.log("%c✅ Strategy X Fixed & Ready", "color:#22c55e");
}

// Global Exports
window.initializeStrategyX = initializeStrategyX;
window.createFocusPlanForArea = createFocusPlanForArea;
window.saveDraftToSupabase = saveDraftToSupabase;
window.closeDraftModal = closeDraftModal;
window.toggleMap = toggleMap;
window.switchStrategyTab = switchStrategyTab;
window.showPublishedPlans = showPublishedPlans;
window.showActiveTargets = showActiveTargets;
window.populateTerritoryList = populateTerritoryList;
window.deletePlan = deletePlan;
window.viewPlan = viewPlan;
