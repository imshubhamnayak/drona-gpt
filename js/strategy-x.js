// ==================== STRATEGY X - FULLY REFACTORED & ALIGNED WITH INDEX.HTML ====================

let allRetailers = [];
let currentMap = null;
let currentMarkers = [];
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
        console.error("Failed to load retailers.json", err);
    }
}

// ==================== MAP ====================
function initMap() {
    const container = document.getElementById('strategy-map');
    if (!container) return;
    container.innerHTML = '';

    currentMap = L.map('strategy-map').setView([12.92, 77.60], 11.5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(currentMap);
    drawTerritoryCircles();
}

function drawTerritoryCircles() {
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

        const circle = L.circle([avgLat, avgLng], {
            color: "#f59e0b",
            fillColor: "#f59e0b",
            fillOpacity: 0.18,
            radius: 1600,
            weight: 3
        }).addTo(currentMap);

        circle.bindPopup(`<b>${areaName}</b><br>${group.length} retailers`);
        circle.on('click', () => createFocusPlanForArea(areaName));
    });
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
        showPublishedPlans();
    } catch (err) {
        console.error(err);
        alert("Save failed. Check console.");
    }
}

// ==================== PUBLISHED PLANS & TARGETS ====================
async function showPublishedPlans() {
    const container = document.getElementById('active-plans-list');
    if (!container) return;

    try {
        const res = await fetch(`${BACKEND_URL}/focus-plans`);
        const plans = await res.json();

        let html = '';
        plans.forEach(plan => {
            html += `
                <div class="bg-slate-800 p-4 rounded-2xl mb-3 group cursor-pointer" onclick="viewPlan('${plan.id}')">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="font-medium">${plan.territories?.[0] || plan.area}</div>
                            <div class="text-xs text-slate-400">${plan.plan_date}</div>
                        </div>
                        <button onclick="event.stopImmediatePropagation(); deletePlan('${plan.id}');" class="text-red-400 hover:text-red-500">🗑</button>
                    </div>
                </div>`;
        });

        container.innerHTML = html || '<p class="text-slate-400 text-sm">No active plans yet</p>';
    } catch (e) {
        container.innerHTML = '<p class="text-red-400 text-sm">Failed to load plans</p>';
    }
}

async function deletePlan(id) {
    if (!confirm("Delete this plan?")) return;
    try {
        await fetch(`${BACKEND_URL}/focus-plans/${id}`, { method: 'DELETE' });
        showPublishedPlans();
    } catch (e) {
        alert("Delete failed");
    }
}

function viewPlan(id) {
    alert(`Viewing details for plan ${id} (expand later)`);
}

// Targets (Basic)
async function showActiveTargets() {
    const container = document.getElementById('active-targets-list');
    if (!container) return;
    container.innerHTML = `<p class="text-slate-400 text-sm">No active targets yet</p>`;
}

function setNewTarget() {
    alert("Set Monthly Target modal will open here (to be fully implemented)");
}

// ==================== INITIALIZE ====================
async function initializeStrategyX() {
    await loadStrategyData();
    initMap();
    showPublishedPlans();
    showActiveTargets();
    console.log("%c✅ Strategy X Fully Initialized", "color:#22c55e");
}

// Expose to window
window.initializeStrategyX = initializeStrategyX;
window.createFocusPlanForArea = createFocusPlanForArea;
window.saveDraftToSupabase = saveDraftToSupabase;
window.closeDraftModal = closeDraftModal;
window.setNewTarget = setNewTarget;
window.showActiveTargets = showActiveTargets;
window.showPublishedPlans = showPublishedPlans;
window.deletePlan = deletePlan;
window.viewPlan = viewPlan;
