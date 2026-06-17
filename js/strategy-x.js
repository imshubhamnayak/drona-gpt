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

async function saveDraftToSupabase() {
    if (!currentDraftPlan) return;

    // Read the selected date from the date picker
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
        plan_date: selectedDate,                    // ← This must use selected date
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

        if (!res.ok) throw new Error(data.message || 'Save failed');

        console.log("%c✅ Plan Saved for Date:", "color:lime", selectedDate, data);
        alert(`✅ Focus Plan saved successfully for ${selectedDate}!`);

        if (typeof showPublishedPlans === 'function') showPublishedPlans();

    } catch (err) {
        console.error("Save Error:", err);
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
                <div class="bg-slate-800 p-4 rounded-2xl mb-3 group">
                    <div class="flex justify-between items-start">
                        <div onclick="viewPlan('${plan.id}')" class="cursor-pointer flex-1">
                            <div class="font-medium">${plan.territories?.[0] || plan.area}</div>
                            <div class="text-xs text-slate-400">${plan.plan_date}</div>
                        </div>
                        <button onclick="deletePlan('${plan.id}'); event.stopImmediatePropagation();" 
                                class="text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            🗑
                        </button>
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

// Delete a saved plan
async function deletePlan(planId) {
    if (!confirm("Are you sure you want to delete this plan?")) return;

    try {
        const res = await fetch(`${BACKEND_URL}/focus-plans/${planId}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            alert("Plan deleted successfully!");
            showPublishedPlans();   // Refresh the list
        } else {
            alert("Failed to delete plan");
        }
    } catch (err) {
        console.error(err);
        alert("Error deleting plan");
    }
}

// ==================== NEW: TARGETS FEATURE ====================

// Set New Target
function setNewTarget() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[10000]';
    modal.innerHTML = `
        <div class="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md mx-4">
            <div class="p-6">
                <h2 class="text-2xl font-bold mb-4">Set Monthly Target</h2>
                
                <select id="target-retailer" class="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 mb-4">
                    <option value="">Select Retailer</option>
                    ${allRetailers.map(r => `<option value="${r.id}">${r.name} (${r.area})</option>`).join('')}
                </select>

                <select id="target-type" class="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 mb-4">
                    <option value="revenue">Revenue Target (₹)</option>
                    <option value="sku">SKU Quantity Target</option>
                    <option value="outstanding">Outstanding Recovery (₹)</option>
                    <option value="order">Monthly Order Compliance</option>
                </select>

                <input type="number" id="target-value" placeholder="Target Value" 
                       class="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 mb-6">

                <div class="flex gap-4">
                    <button onclick="this.closest('.fixed').remove()" class="flex-1 py-4 bg-slate-700 hover:bg-slate-600 rounded-2xl">Cancel</button>
                    <button onclick="saveNewTarget()" class="flex-1 py-4 bg-orange-600 hover:bg-orange-500 rounded-2xl">Set Target</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Save New Target
async function saveNewTarget() {
    const retailerId = document.getElementById('target-retailer').value;
    const type = document.getElementById('target-type').value;
    const value = parseFloat(document.getElementById('target-value').value);

    if (!retailerId || !value) {
        alert("Please fill all fields");
        return;
    }

    const retailer = allRetailers.find(r => r.id == retailerId);

    const target = {
        id: 'target_' + Date.now(),
        retailerId: retailer.id,
        retailerName: retailer.name,
        area: retailer.area,
        targetType: type,
        targetValue: value,
        currentValue: 0,
        period: "Month",
        startDate: "2026-06-01",
        endDate: "2026-06-30",
        status: "On Track",
        createdAt: new Date().toISOString()
    };

    try {
        const res = await fetch(`${BACKEND_URL}/targets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(target)
        });

        if (res.ok) {
            alert("Target set successfully!");
            this.closest('.fixed').remove();
            showActiveTargets();
        }
    } catch (e) {
        alert("Failed to save target");
    }
}

// Show Active Targets in Sidebar
async function showActiveTargets() {
    const container = document.getElementById('active-plans'); // Reuse or create new section
    if (!container) return;

    try {
        const res = await fetch(`${BACKEND_URL}/targets`);
        const targets = await res.json();

        let html = `<div class="text-orange-400 font-medium mb-3">Active Targets</div>`;

        targets.forEach(t => {
            const progress = Math.min(Math.round((t.currentValue / t.targetValue) * 100), 100);
            html += `
                <div class="bg-slate-800 p-4 rounded-2xl mb-3">
                    <div class="flex justify-between text-sm">
                        <div class="font-medium">${t.retailerName}</div>
                        <div class="text-orange-400">${progress}%</div>
                    </div>
                    <div class="text-xs text-slate-400">${t.targetType} • ${t.period}</div>
                    <div class="h-2 bg-slate-700 rounded-full mt-2 overflow-hidden">
                        <div class="h-full bg-orange-500" style="width: ${progress}%"></div>
                    </div>
                </div>`;
        });

        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = `<p class="text-slate-400">No active targets</p>`;
    }
}

// ==================== INITIALIZE ====================
async function initializeStrategyX() {
    await loadStrategyData();
    initMap();
    populateTerritoryList();
    showPublishedPlans();           // Load saved plans on start
    showActiveTargets();
    console.log("%c✅ Strategy X Initialized with Saved Plans", "color:#22c55e");
}
// Global exports
window.initializeStrategyX = initializeStrategyX;
window.createFocusPlanForArea = createFocusPlan;
window.showRetailersInArea = showRetailersInArea;
window.saveDraftToSupabase = saveDraftToSupabase;
window.setNewTarget = setNewTarget;
window.showActiveTargets = showActiveTargets;
window.closeDraftModal = closeDraftModal;
