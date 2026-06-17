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

// Draft Modal
function showDraftModal(draft) {
    let html = `
    <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000]" id="draft-modal">
        <div class="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div class="p-6">
                <h2 class="text-2xl font-bold mb-2">Draft Focus Plan</h2>
                <p class="text-slate-400 mb-4">Area: <strong>${draft.area}</strong></p>

                <div class="mb-6">
                    <label class="block text-sm text-slate-400 mb-2">Plan Date</label>
                    <input type="date" id="plan-date" value="${draft.plan_date}" class="bg-slate-800 border border-slate-600 rounded-2xl px-4 py-4 w-full text-white">
                </div>

                <div class="mb-6">
                    <h3 class="font-medium mb-3 text-orange-400">Selected Retailers (${draft.totalRetailers})</h3>
                    <div class="max-h-64 overflow-auto space-y-2 text-sm">
                        ${draft.selectedRetailers.map(r => `
                            <div class="bg-slate-800 p-3 rounded-2xl flex justify-between">
                                <div><div>${r.name}</div><div class="text-xs text-slate-400">${r.monthlyOrders ? 'Regular' : 'Vicinity'}</div></div>
                                <div class="text-right text-orange-400">₹${(r.outstanding || 0).toLocaleString()}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="flex gap-4">
                    <button onclick="closeDraftModal()" class="flex-1 py-4 bg-slate-700 hover:bg-slate-600 rounded-2xl font-medium">Cancel</button>
                    <button onclick="saveDraftToSupabase()" class="flex-1 py-4 bg-orange-600 hover:bg-orange-500 rounded-2xl font-medium">Save Plan</button>
                </div>
            </div>
        </div>
    </div>`;

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

// Save to Render Backend
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
        alert(`✅ Focus Plan for ${currentDraftPlan.area} saved!`);

    } catch (err) {
        console.error(err);
        alert("Save failed: " + err.message);
    }
}

// Initialize
async function initializeStrategyX() {
    await loadStrategyData();
    initMap();
    populateTerritoryList();
    console.log("%c✅ Strategy X Initialized", "color:#22c55e");
}

// Global exports
window.initializeStrategyX = initializeStrategyX;
window.createFocusPlanForArea = createFocusPlan;
window.showRetailersInArea = showRetailersInArea;
window.saveDraftToSupabase = saveDraftToSupabase;
window.closeDraftModal = closeDraftModal;
