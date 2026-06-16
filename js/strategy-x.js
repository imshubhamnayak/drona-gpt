// ==================== STRATEGY X - FULL CLEANED VERSION ====================

let allRetailers = [];
let currentMap = null;
let currentMarkers = [];
let currentDraftPlan = null;

// ==================== LOAD RETAILERS DATA ====================
async function loadStrategyData() {
    try {
        const response = await fetch('data/retailers.json');
        const data = await response.json();
        allRetailers = data.retailers || [];
        console.log(`%c✅ Loaded ${allRetailers.length} retailers from JSON`, 'color:#22c55e');
    } catch (err) {
        console.error("Failed to load retailers.json", err);
        allRetailers = [];
    }
}

// ==================== MAP INITIALIZATION ====================
function initMap() {
    const container = document.getElementById('strategy-map');
    if (!container) {
        console.error("Map container '#strategy-map' not found");
        return;
    }

    container.innerHTML = '';

    currentMap = L.map('strategy-map').setView([12.92, 77.60], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(currentMap);

    drawAreaCircles();
}

// Draw orange area circles
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

        circle.on('click', () => {
            showRetailersInArea(areaName, avgLat, avgLng);
        });
    });
}

// Show retailers in selected area
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

        marker.bindPopup(`<b>${r.name}</b><br>Outstanding: ₹${(r.outstanding || 0).toLocaleString()}`);
        currentMarkers.push(marker);
    });

    currentMap.flyTo([centerLat, centerLng], 14);
}

// Populate territory list in sidebar
function populateTerritoryList() {
    const container = document.getElementById('territory-list');
    if (!container) return;

    const areas = {};
    allRetailers.forEach(r => {
        if (!areas[r.area]) areas[r.area] = 0;
        areas[r.area]++;
    });

    let html = '';
    Object.keys(areas).forEach(area => {
        html += `
            <div onclick="createFocusPlanForArea('${area}')" 
                 class="p-4 hover:bg-slate-800 rounded-2xl cursor-pointer border border-slate-700 flex justify-between items-center">
                <span>${area}</span>
                <span class="text-slate-400">(${areas[area]})</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ==================== FOCUS PLAN - DRAFT FIRST ====================
async function createFocusPlan(areaName) {
    if (!areaName) {
        alert("Area name is missing.");
        return;
    }

    console.log(`Creating draft for: ${areaName}`);

    if (!allRetailers || allRetailers.length === 0) {
        alert("Retailers data not loaded. Please refresh.");
        return;
    }

    const normalizedArea = String(areaName).trim();
    const areaRetailers = allRetailers.filter(r => String(r.area).trim() === normalizedArea);

    if (areaRetailers.length === 0) {
        alert(`No retailers found in "${areaName}".`);
        return;
    }

    // Smart selection: 60% regular orderers + 40% vicinity
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
        priority_actions: [
            "Meet all regular monthly order dealers first",
            "Cover nearby retailers in same area",
            "Focus on high outstanding recovery",
            "Push Pressure Cooker & Mixer schemes"
        ],
        notes: `Smart Visit Plan for ${areaName} - Regular + Vicinity coverage.`
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
                <p class="text-slate-400 mb-6">Area: <strong>${draft.area}</strong> • ${draft.totalRetailers} Retailers</p>

                <div class="mb-6">
                    <h3 class="font-medium mb-3 text-orange-400">Selected Retailers</h3>
                    <div class="max-h-64 overflow-auto space-y-2 text-sm">
                        ${draft.selectedRetailers.map(r => `
                            <div class="bg-slate-800 p-3 rounded-2xl flex justify-between">
                                <div>
                                    <div>${r.name}</div>
                                    <div class="text-xs text-slate-400">${r.monthlyOrders ? 'Regular Order' : 'Vicinity'}</div>
                                </div>
                                <div class="text-right text-orange-400">₹${(r.outstanding || 0).toLocaleString()}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="bg-slate-800 p-4 rounded-2xl mb-6">
                    <h3 class="font-medium mb-2">Key Actions</h3>
                    <ul class="list-disc pl-5 space-y-1">
                        ${draft.priority_actions.map(a => `<li>${a}</li>`).join('')}
                    </ul>
                </div>

                <div class="flex gap-4">
                    <button onclick="closeDraftModal()" class="flex-1 py-4 bg-slate-700 hover:bg-slate-600 rounded-2xl font-medium">Cancel</button>
                    <button onclick="saveDraftToSupabase()" class="flex-1 py-4 bg-orange-600 hover:bg-orange-500 rounded-2xl font-medium">Save to Supabase</button>
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

async function saveDraftToSupabase() {
    if (!currentDraftPlan) return;

    closeDraftModal();

    const plan = {
        active: true,
        created_by: "Admin",
        focus_skus: currentDraftPlan.focus_skus,
        notes: currentDraftPlan.notes,
        period: "Week",
        priority_actions: currentDraftPlan.priority_actions,
        territories: [currentDraftPlan.area],
        priorityRetailers: currentDraftPlan.selectedRetailers.map(r => ({
            id: r.id,
            name: r.name,
            outstanding: r.outstanding || 0,
            lastVisitDaysAgo: r.lastVisitDaysAgo || 0,
            reason: r.monthlyOrders ? "Regular Order Dealer" : "Vicinity Coverage",
            suggestedAction: (r.outstanding || 0) > 15000 ? "Payment Recovery + Scheme Push" : "Order Boost"
        }))
    };

    try {
        const { data, error } = await supabase
            .from('focus_plans')
            .insert([plan])
            .select();

        if (error) throw error;

        console.log("%c✅ Plan Saved to Supabase!", "color:lime", data[0]);
        alert(`✅ Focus Plan for ${currentDraftPlan.area} saved successfully!`);

        if (typeof showPublishedPlans === 'function') showPublishedPlans();

    } catch (err) {
        console.error(err);
        alert("Save failed: " + err.message);
    }
}

// ==================== INITIALIZE ====================
async function initializeStrategyX() {
    await loadStrategyData();
    initMap();
    populateTerritoryList();
    console.log("%c✅ Strategy X Fully Initialized", "color:#22c55e");
}

// Expose functions globally
window.initializeStrategyX = initializeStrategyX;
window.createFocusPlanForArea = createFocusPlan;
window.showRetailersInArea = showRetailersInArea;
window.saveDraftToSupabase = saveDraftToSupabase;
window.closeDraftModal = closeDraftModal;
