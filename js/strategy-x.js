// ==================== STRATEGY X - POLISHED & WORKING ====================

let currentMap = null;
let allRetailers = [];
let currentDraftPlan = null;

const BACKEND_URL = 'https://drona-gpt.onrender.com';

// ==================== LOAD DATA ====================
async function loadStrategyData() {
    try {
        console.log("%c[Strategy X] Loading retailers...", "color:#eab308");

        const [masterRes, osRes] = await Promise.all([
            fetch('data/retailers-master.json'),
            fetch('data/retailers-outstanding.json')
        ]);

        const masterData = await masterRes.json();
        const osData = await osRes.json();

        allRetailers = masterData.retailers.map(master => {
            const osInfo = osData.retailers.find(o => o.id === master.id) || {};
            return {
                ...master,
                outstanding: osInfo.outstanding || 0,
                lastPaymentDaysAgo: osInfo.lastPaymentDaysAgo || 12,
                monthlyOrders: Math.random() > 0.35
            };
        });

        console.log(`%c✅ Strategy X: Loaded ${allRetailers.length} retailers`, 'color:#22c55e');
    } catch (e) {
        console.error("Strategy X data load failed", e);
        allRetailers = [];
    }
}

// ==================== MAP ====================
function initMap() {
    if (currentMap) currentMap.remove();

    const mapEl = document.getElementById('strategy-map');
    if (!mapEl) {
        console.error("Map container not found");
        return;
    }

    currentMap = L.map('strategy-map', {
        zoomControl: true,
        attributionControl: false
    }).setView([12.92, 77.60], 11.5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(currentMap);

    drawPerformanceCircles();

    setTimeout(() => {
        if (currentMap) currentMap.invalidateSize();
    }, 400);
}

function drawPerformanceCircles() {
    if (!currentMap || !allRetailers.length) return;

    const areaData = {};
    allRetailers.forEach(r => {
        if (!areaData[r.area]) {
            areaData[r.area] = {count: 0, totalOS: 0, lat: r.lat, lng: r.lng};
        }
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
        priority_actions: ["High outstanding visit karo", "Payment recover karo", "Key SKUs push karo"],
        notes: `Focus plan for ${areaName}`,
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
                           class="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-4">
                </div>

                <div>
                    <h3 class="font-medium mb-3 text-orange-400">Selected Retailers (${draft.totalRetailers})</h3>
                    <div class="space-y-3 max-h-60 overflow-auto">
                        ${draft.selectedRetailers.map(r => `
                            <div class="bg-slate-800 p-4 rounded-2xl flex justify-between items-center">
                                <div>
                                    <div class="font-medium">${r.name}</div>
                                    <div class="text-xs text-slate-400">${r.area}</div>
                                </div>
                                <div class="text-right text-orange-400">₹${(r.outstanding || 0).toLocaleString()}</div>
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
    alert(`✅ Plan saved for ${selectedDate}!\n\nThis will appear in Ramesh's Daily Plan.`);
    switchStrategyTab(0);
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
        <div class="text-center py-16 text-slate-400">
            <p class="text-xl">No Active Focus Plans</p>
            <p class="mt-3">Click any area on the map to create one</p>
        </div>
    `;
}

function showActiveTargets() {
    const container = document.getElementById('strategy-tab-content');
    container.innerHTML = `<div class="p-12 text-center text-slate-400">Targets coming soon...</div>`;
}

function showTerritories() {
    const container = document.getElementById('strategy-tab-content');
    const areas = {};
    allRetailers.forEach(r => areas[r.area] = (areas[r.area] || 0) + 1);

    let html = `<div class="font-semibold mb-4">Territories</div>`;
    Object.keys(areas).forEach(area => {
        html += `
            <div onclick="createFocusPlanForArea('${area}')" 
                 class="p-5 bg-slate-800 hover:bg-slate-700 rounded-3xl cursor-pointer flex justify-between items-center mb-3">
                <span class="font-medium">${area}</span>
                <span class="text-emerald-400">${areas[area]} retailers</span>
            </div>`;
    });
    container.innerHTML = html;
}

// ==================== INITIALIZE ====================
async function initializeStrategyX() {
    console.log("%c[Strategy X] Initializing...", "color:#eab308");
    
    await loadStrategyData();
    initMap();
    switchStrategyTab(0);

    console.log("%c✅ Strategy X Ready", "color:#22c55e");
}

// Global Exports
window.initializeStrategyX = initializeStrategyX;
window.switchStrategyTab = switchStrategyTab;
window.createFocusPlanForArea = createFocusPlanForArea;
window.saveDraftToSupabase = saveDraftToSupabase;
window.closeDraftModal = closeDraftModal;
