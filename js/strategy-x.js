// ==================== STRATEGY X - FULLY REFACTORED (Render Backend) ====================

let allRetailers = [];
let currentMap = null;
let currentMarkers = [];
let currentDraftPlan = null;

// ==================== RENDER BACKEND URL ====================
const BACKEND_URL = 'https://drona-gpt.onrender.com';  

// ==================== LOAD DATA ====================
async function loadStrategyData() {
    try {
        const response = await fetch('data/retailers.json');
        const data = await response.json();
        allRetailers = data.retailers || [];
        console.log(`%c✅ Loaded ${allRetailers.length} retailers`, 'color:#22c55e');
    } catch (err) {
        console.error("Failed to load retailers.json", err);
    }
}

// ==================== MAP FUNCTIONS ====================
function initMap() {
    const container = document.getElementById('strategy-map');
    if (!container) return;
    container.innerHTML = '';

    currentMap = L.map('strategy-map').setView([12.92, 77.60], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(currentMap);
    drawAreaCircles();
}

function drawAreaCircles() {
    if (!currentMap || !allRetailers.length) return;

    const areas = {};
    allRetailers.forEach(r => {
        if (!areas[r.area]) areas[r.area] = [];
        areas[r.area].push(r);
    });

    Object.keys(areas).forEach(areaName => {
        const group = areas[areaName];
        const avgLat = group.reduce((sum, r) => sum + (r.lat || 12.91), 0) / group.length;
        const avgLng = group.reduce((sum, r) => sum + (r.lng || 77.58), 0) / group.length;

        const circle = L.circle([avgLat, avgLng], {
            color: "#f59e0b",
            fillColor: "#f59e0b",
            fillOpacity: 0.25,
            radius: 1400,
            weight: 3
        }).addTo(currentMap);

        circle.bindPopup(`<b>${areaName}</b><br>${group.length} retailers`);
        circle.on('click', () => showRetailersInArea(areaName, avgLat, avgLng));
    });
}

function showRetailersInArea(areaName, centerLat, centerLng) {
    currentMarkers.forEach(m => currentMap.removeLayer(m));
    currentMarkers = [];

    const filtered = allRetailers.filter(r => r.area === areaName);
    filtered.forEach(r => {
        if (!r.lat || !r.lng) return;
        const marker = L.circleMarker([r.lat, r.lng], {
            radius: 7,
            fillColor: (r.outstanding || 0) > 30000 ? "#ef4444" : "#22c55e",
            color: "#fff",
            weight: 2,
            fillOpacity: 0.9
        }).addTo(currentMap);
        marker.bindPopup(`<b>${r.name}</b><br>₹${(r.outstanding || 0).toLocaleString()}`);
        currentMarkers.push(marker);
    });

    currentMap.flyTo([centerLat, centerLng], 14);
}

function populateTerritoryList() {
    const container = document.getElementById('territory-list');
    if (!container) return;

    const areas = {};
    allRetailers.forEach(r => areas[r.area] = (areas[r.area] || 0) + 1);

    let html = '';
    Object.keys(areas).forEach(area => {
        html += `<div onclick="createFocusPlanForArea('${area}')" class="p-4 hover:bg-slate-800 rounded-2xl cursor-pointer border border-slate-700">${area} <span class="text-slate-400">(${areas[area]})</span></div>`;
    });
    container.innerHTML = html;
}

// ==================== FOCUS PLAN DRAFT ====================
async function createFocusPlan(areaName) {
    if (!areaName) return;

    const normalizedArea = String(areaName).trim();
    const areaRetailers = allRetailers.filter(r => String(r.area).trim() === normalizedArea);

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
        priority_actions: ["Meet regular dealers", "Cover vicinity", "Recover outstanding", "Push key SKUs"],
        notes: `Smart plan for ${areaName}`,
        plan_date: new Date().toISOString().split('T')[0]
    };

    showDraftModal(currentDraftPlan);
}

function showDraftModal(draft) {
    let html = `
    <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000]" id="draft-modal">
        <div class="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
            
            <!-- Header -->
            <div class="p-6 border-b border-slate-700">
                <h2 class="text-2xl font-bold">Draft Focus Plan</h2>
                <p class="text-slate-400 mt-1">Area: <strong>${draft.area}</strong></p>
            </div>

            <!-- Scrollable Content -->
            <div class="flex-1 overflow-auto p-6 space-y-6">
                
                <!-- Date -->
                <div>
                    <label class="block text-sm text-slate-400 mb-2">Plan Date</label>
                    <input type="date" id="plan-date" value="${draft.plan_date}" 
                           class="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-orange-500">
                </div>

                <!-- Selected Retailers -->
                <div>
                    <h3 class="font-medium mb-3 text-orange-400">Selected Retailers (${draft.totalRetailers})</h3>
                    <div class="space-y-3 max-h-60 overflow-auto">
                        ${draft.selectedRetailers.map(r => `
                            <div class="bg-slate-800 p-4 rounded-2xl flex justify-between items-center">
                                <div>
                                    <div class="font-medium">${r.name}</div>
                                    <div class="text-xs text-slate-400">${r.monthlyOrders ? 'Regular Order' : 'Vicinity'}</div>
                                </div>
                                <div class="text-right text-orange-400 font-medium">₹${(r.outstanding || 0).toLocaleString()}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

            </div>

            <!-- Footer Buttons -->
            <div class="p-6 border-t border-slate-700 flex gap-4">
                <button onclick="closeDraftModal()" 
                        class="flex-1 py-4 bg-slate-700 hover:bg-slate-600 rounded-2xl font-medium transition-colors">
                    Cancel
                </button>
                <button onclick="saveDraftToSupabase()" 
                        class="flex-1 py-4 bg-orange-600 hover:bg-orange-500 rounded-2xl font-medium transition-colors">
                    Save Plan
                </button>
            </div>
        </div>
    </div>`;

    // Remove old modal
    const old = document.getElementById('draft-modal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.innerHTML = html;
    document.body.appendChild(modal);
}

function closeDraftModal() {
    const modal = document.getElementById('draft-modal');
    if (modal) modal.remove();
}

// ==================== SAVE PLAN ====================
async function saveDraftToSupabase() {
    if (!currentDraftPlan) return;
    closeDraftModal();

    const selectedDate = document.getElementById('plan-date')?.value || new Date().toISOString().split('T')[0];

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

        const data = await res.json();

        if (!res.ok) throw new Error('Save failed');

        console.log("%c✅ Plan Saved!", "color:lime", data);
        alert(`✅ Focus Plan saved for ${selectedDate}!`);

        showPublishedPlans();   // Refresh the list

    } catch (err) {
        console.error(err);
        alert("Save failed: " + err.message);
    }
}

async function showPublishedPlans() {
    const container = document.getElementById('active-plans');
    if (!container) return;

    try {
        const res = await fetch(`${BACKEND_URL}/focus-plans`);
        const plans = await res.json();

        if (plans.length === 0) {
            container.innerHTML = `<p class="text-slate-400 text-sm">No active plans yet.</p>`;
            return;
        }

        let html = `<div class="text-sm text-slate-400 mb-3">${plans.length} Active Plan(s)</div>`;

        plans.forEach(plan => {
            html += `
                <div onclick="viewPlan('${plan.id}')" 
                     class="bg-slate-800 p-4 rounded-2xl mb-3 cursor-pointer hover:bg-slate-700 transition-colors">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="font-medium">${plan.territories?.[0] || plan.area}</div>
                            <div class="text-xs text-slate-400">${plan.plan_date}</div>
                        </div>
                        <div class="text-right text-orange-400 text-sm">${plan.totalRetailers || '?'} retailers</div>
                    </div>
                </div>`;
        });

        container.innerHTML = html;

    } catch (e) {
        console.error(e);
        container.innerHTML = `<p class="text-red-400 text-sm">Failed to load plans</p>`;
    }
}

// View Plan Details (Clickable)
function viewPlan(planId) {
    // For now, show alert. Later we can show full details modal
    alert(`Plan ID: ${planId}\n\nOpen full details modal here in future.`);
}

// ==================== INITIALIZE ====================
async function initializeStrategyX() {
    await loadStrategyData();
    initMap();
    populateTerritoryList();
    showPublishedPlans();           // Load saved plans on start
    console.log("%c✅ Strategy X Initialized with Saved Plans", "color:#22c55e");
}
// Global exports
window.initializeStrategyX = initializeStrategyX;
window.createFocusPlanForArea = createFocusPlan;
window.showRetailersInArea = showRetailersInArea;
window.saveDraftToSupabase = saveDraftToSupabase;
window.closeDraftModal = closeDraftModal;
