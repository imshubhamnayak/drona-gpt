// ==================== STRATEGY X - FIXED & GLOBAL FUNCTIONS ====================

let allRetailers = [];
let currentMap = null;
let currentMarkers = [];
let currentDraftPlan = null;

const BACKEND_URL = 'https://drona-gpt.onrender.com';

// Load Data
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

// Map
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

// Published Plans
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
    alert(`Viewing details for plan ${id}`);
}

// ==================== TARGETS ====================
function setNewTarget() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[10000]';
    modal.innerHTML = `
        <div class="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md mx-4 p-6">
            <h2 class="text-2xl font-bold mb-4">Set Monthly Target</h2>
            
            <select id="target-retailer" class="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 mb-4 text-white">
                <option value="">Select Retailer</option>
                ${allRetailers.map(r => `<option value="${r.id}">${r.name} (${r.area})</option>`).join('')}
            </select>

            <select id="target-type" class="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 mb-4 text-white">
                <option value="revenue">Revenue Target (₹)</option>
                <option value="sku">SKU Quantity (Pressure Cooker)</option>
                <option value="outstanding">Outstanding Recovery (₹)</option>
                <option value="orders">Monthly Orders</option>
            </select>

            <input type="number" id="target-value" placeholder="Target Value" 
                   class="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 mb-6 text-white">

            <div class="flex gap-4">
                <button onclick="this.closest('.fixed').remove()" class="flex-1 py-4 bg-slate-700 rounded-2xl">Cancel</button>
                <button onclick="saveNewTarget()" class="flex-1 py-4 bg-orange-600 rounded-2xl">Save Target</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveNewTarget() {
    const retailerId = document.getElementById('target-retailer').value;
    const type = document.getElementById('target-type').value;
    let value = parseFloat(document.getElementById('target-value').value);

    if (!retailerId || !value) return alert("Please fill all fields");

    const retailer = allRetailers.find(r => r.id == retailerId);

    const target = {
        id: 'target_' + Date.now(),
        retailerId: retailer.id,
        retailerName: retailer.name,
        area: retailer.area,
        targetType: type,
        targetValue: value,
        currentValue: 0,
        period: "2026-06",
        status: "On Track"
    };

    try {
        const res = await fetch(`${BACKEND_URL}/targets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(target)
        });

        if (res.ok) {
            alert("Target saved successfully!");
            this.closest('.fixed').remove();
            showActiveTargets();
        }
    } catch (e) {
        alert("Failed to save target");
    }
}

async function showActiveTargets() {
    const container = document.getElementById('active-targets-list');
    if (!container) return;

    try {
        const res = await fetch(`${BACKEND_URL}/targets`);
        let data = await res.json();

        if (data.length === 0) {
            await seedDefaultTargets();
            const res2 = await fetch(`${BACKEND_URL}/targets`);
            data = await res2.json();
        }

        // Calculate Total
        const totalRevenueTarget = data
            .filter(t => t.targetType === "revenue")
            .reduce((sum, t) => sum + t.targetValue, 0);

        let html = `
            <div class="bg-emerald-900/30 border border-emerald-600 p-4 rounded-2xl mb-4">
                <div class="text-emerald-400 font-medium">Total Target for Ramesh</div>
                <div class="text-2xl font-bold">₹${totalRevenueTarget.toLocaleString()}</div>
                <div class="text-xs text-emerald-400">June 2026</div>
            </div>`;

        // Individual targets
        data.forEach(t => {
            const progress = Math.min(100, Math.round((t.currentValue / t.targetValue) * 100) || 0);
            html += `
                <div class="bg-slate-800 p-4 rounded-2xl mb-3">
                    <div class="flex justify-between mb-1">
                        <div class="font-medium text-sm">${t.retailerName}</div>
                        <div class="text-emerald-400">${progress}%</div>
                    </div>
                    <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div class="h-full bg-emerald-500 transition-all" style="width: ${progress}%"></div>
                    </div>
                    <div class="text-xs text-slate-400 mt-1">${t.targetType} • ₹${t.targetValue.toLocaleString()}</div>
                </div>`;
        });

        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = `<p class="text-slate-400">No active targets</p>`;
    }
}
// ==================== SEED DEFAULT UNIFORM TARGETS ====================
async function seedDefaultTargets() {
    try {
        const res = await fetch(`${BACKEND_URL}/targets`);
        const existing = await res.json();
        if (existing.length > 0) return; // Already seeded

        const revenueTargetPerRetailer = 150000;
        const skuTargetPerRetailer = 80;

        const defaultTargets = allRetailers.map(r => ({
            id: 'target_' + Date.now() + '_' + r.id,
            retailerId: r.id,
            retailerName: r.name,
            area: r.area,
            targetType: "revenue",
            targetValue: revenueTargetPerRetailer,
            currentValue: Math.floor(r.totalSalesThisYear / 12) || 0, // approximate monthly from annual
            period: "2026-06",
            status: "On Track"
        }));

        // Also add SKU target (we can have multiple targets per retailer)
        const skuTargets = allRetailers.map(r => ({
            id: 'target_sku_' + Date.now() + '_' + r.id,
            retailerId: r.id,
            retailerName: r.name,
            area: r.area,
            targetType: "sku",
            targetValue: skuTargetPerRetailer,
            currentValue: 0, // can be calculated later from skuSales
            period: "2026-06",
            status: "On Track"
        }));

        // Save all
        for (let target of [...defaultTargets, ...skuTargets]) {
            await fetch(`${BACKEND_URL}/targets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(target)
            });
        }

        console.log(`%c✅ Seeded uniform targets for ${allRetailers.length} retailers`, "color:#22c55e");
        console.log(`Total Ramesh Target: ₹${(revenueTargetPerRetailer * allRetailers.length).toLocaleString()}`);

    } catch (e) {
        console.error("Seed failed", e);
    }
}


// Initialize
async function initializeStrategyX() {
    await loadStrategyData();
    initMap();
    showPublishedPlans();
    showActiveTargets();
    console.log("%c✅ Strategy X Fully Initialized", "color:#22c55e");
}

// Expose ALL functions globally
window.initializeStrategyX = initializeStrategyX;
window.createFocusPlanForArea = createFocusPlanForArea;
window.saveDraftToSupabase = saveDraftToSupabase;
window.closeDraftModal = closeDraftModal;
window.setNewTarget = setNewTarget;
window.showActiveTargets = showActiveTargets;
window.showPublishedPlans = showPublishedPlans;
window.deletePlan = deletePlan;
window.viewPlan = viewPlan;
