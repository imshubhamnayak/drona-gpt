// ==================== STRATEGY X - PROFESSIONAL DASHBOARD + FULL FOCUS PLAN ====================

let currentMap = null;
let allRetailers = [];        // Merged full data
let transactions = [];
let currentDraftPlan = null;

const BACKEND_URL = 'https://drona-gpt.onrender.com';

// ==================== LOAD DATA ====================
async function loadStrategyData() {
    try {
        // 1. Master Data
        const masterRes = await fetch('data/retailers-master.json');
        const masterData = await masterRes.json();

        // 2. Outstanding Data
        const osRes = await fetch('data/retailers-outstanding.json');
        const osData = await osRes.json();

        // 3. Transactions
        const transRes = await fetch('data/tally-transactions.json');
        const transData = await transRes.json();
        transactions = transData.transactions || [];

        // Merge into full retailer objects
        allRetailers = masterData.retailers.map(master => {
            const osInfo = osData.retailers.find(o => o.id === master.id) || {};
            return {
                ...master,
                outstanding: osInfo.outstanding || 0,
                lastPaymentDaysAgo: osInfo.lastPaymentDaysAgo || 15,
                lastVisitDaysAgo: Math.floor(Math.random() * 20),
                monthlyOrders: Math.random() > 0.4,
                paymentTrend: Math.random() > 0.5 ? "85% on time" : "65% on time",
                skuSales: [] // Can be derived from transactions if needed later
            };
        });

        console.log(`%c✅ Strategy X: Loaded ${allRetailers.length} retailers (merged)`, 'color:#22c55e');
    } catch (e) {
        console.error("Failed to load strategy data", e);
        allRetailers = [];
    }
}


// ==================== MAP ====================
function initMap() {
    if (currentMap) currentMap.remove();

    currentMap = L.map('strategy-map', {
        zoomControl: true,
        attributionControl: false
    }).setView([12.92, 77.60], 11.5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(currentMap);

    drawPerformanceCircles();
    setTimeout(() => { if (currentMap) currentMap.invalidateSize(); }, 400);
}

function drawPerformanceCircles() {
    if (!currentMap || !allRetailers.length) return;

    const areaData = {};
    allRetailers.forEach(r => {
        if (!areaData[r.area]) areaData[r.area] = {count:0, totalOS:0, lat:r.lat, lng:r.lng};
        areaData[r.area].count++;
        areaData[r.area].totalOS += (r.outstanding || 0);
    });

    Object.keys(areaData).forEach(area => {
        const d = areaData[area];
        const avgOS = d.totalOS / d.count;
        let color = avgOS > 35000 ? '#ef4444' : avgOS > 18000 ? '#f59e0b' : '#22c55e';

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
        switchStrategyTab(0);
    } catch (err) {
        console.error(err);
        alert("Save failed. Check console.");
    }
}

// ==================== TAB SYSTEM ====================
function switchStrategyTab(tab) {
    document.querySelectorAll('[id^="stab-"]').forEach(b => b.classList.remove('tab-active'));
    document.getElementById(`stab-${tab}`).classList.add('tab-active');

    const content = document.getElementById('strategy-tab-content');
    content.innerHTML = '';

    if (tab === 0) showFocusPlans();
    else if (tab === 1) showActiveTargets();
    else if (tab === 2) showTerritories();

    setTimeout(() => { if (currentMap) currentMap.invalidateSize(); }, 100);
}

// Focus Plans Tab
function showFocusPlans() {
    const content = document.getElementById('strategy-tab-content');
    content.innerHTML = `
        <div class="text-center py-12 text-slate-400">
            <p class="text-lg">No Active Focus Plans Yet</p>
            <p class="text-sm mt-2">Click on any area on the map to create one</p>
        </div>
    `;
}

function showActiveTargets() {
    const container = document.getElementById('strategy-tab-content');
    if (!container) return;

    // Annual Targets
    const annualRevenueTarget = 360000000; // ₹3.6 Cr per year (example)
    let totalRevenueYTD = 0;
    let totalPCYTD = 0;
    let totalMGYTD = 0;

    // Monthly Targets (Current month)
    const monthlyRevenueTarget = 30000000; // ₹30 Cr per month
    let totalRevenueCurrentMonth = 0; // We'll simulate or use logic later

    allRetailers.forEach(r => {
        totalRevenueYTD += (r.totalSalesThisYear || 0);
        const pc = r.skuSales?.find(s => s.sku.includes("Pressure Cooker"))?.qty || 0;
        const mg = r.skuSales?.find(s => s.sku.includes("Mixer Grinder"))?.qty || 0;
        totalPCYTD += pc;
        totalMGYTD += mg;
    });

    const annualRevProgress = Math.min(100, Math.round((totalRevenueYTD / annualRevenueTarget) * 100));
    const annualPCTarget = 80 * 12 * allRetailers.length; // rough yearly
    const annualMGTarget = 45 * 12 * allRetailers.length;

    let html = `
        <div class="space-y-8">
            <!-- Overall Annual Target -->
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

            <!-- Current Month -->
            <div class="bg-slate-800 rounded-3xl p-6">
                <div class="text-orange-400 font-semibold mb-4">CURRENT MONTH (June 2026)</div>
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <div class="text-sm text-slate-400">Revenue</div>
                        <div class="text-2xl font-bold">₹2.1 Cr</div>
                        <div class="text-xs text-emerald-400">70% of ₹3 Cr</div>
                    </div>
                    <div>
                        <div class="text-sm text-slate-400">Pressure Cooker</div>
                        <div class="text-2xl font-bold">920 / 960</div>
                    </div>
                    <div>
                        <div class="text-sm text-slate-400">Mixer Grinder</div>
                        <div class="text-2xl font-bold">510 / 540</div>
                    </div>
                </div>
            </div>

            <!-- Retailer-wise -->
            <div class="text-lg font-semibold mb-4">Retailer-wise Progress</div>
            <div class="space-y-6 max-h-[420px] overflow-auto">`;

    allRetailers.forEach(r => {
        const annualRev = r.totalSalesThisYear || 0;
        const annualRevP = Math.min(100, Math.round((annualRev / 180000) * 100)); // per retailer annual ~1.8L

        const pc = r.skuSales?.find(s => s.sku.includes("Pressure Cooker"))?.qty || 0;
        const mg = r.skuSales?.find(s => s.sku.includes("Mixer Grinder"))?.qty || 0;

        html += `
            <div class="bg-slate-800 rounded-3xl p-5">
                <div class="font-medium">${r.name} <span class="text-xs text-slate-400">(${r.area})</span></div>
                
                <div class="mt-4 grid grid-cols-2 gap-6 text-sm">
                    <div>
                        <div class="flex justify-between mb-1">
                            <span>Annual Revenue</span>
                            <span>₹${(annualRev/100000).toFixed(1)}L / ₹1.8L</span>
                        </div>
                        <div class="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                            <div class="h-full bg-emerald-500" style="width: ${annualRevP}%"></div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>PC: ${pc}/80</div>
                        <div>MG: ${mg}/45</div>
                    </div>
                </div>
            </div>`;
    });

    html += `</div></div>`;
    container.innerHTML = html;
}

// Territories Tab
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

// Initialize
async function initializeStrategyX() {
    await loadStrategyData();
    initMap();
    switchStrategyTab(0);
    console.log("%c✅ Strategy X Professional Dashboard Ready", "color:#22c55e");
}

// Global Exports
window.initializeStrategyX = initializeStrategyX;
window.switchStrategyTab = switchStrategyTab;
window.createFocusPlanForArea = createFocusPlanForArea;
window.saveDraftToSupabase = saveDraftToSupabase;
window.closeDraftModal = closeDraftModal;
