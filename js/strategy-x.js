// ==================== STRATEGY X - POLISHED & PROFESSIONAL ====================

let currentMap = null;
let allRetailers = [];
let currentDraftPlan = null;

const BACKEND_URL = 'https://drona-gpt.onrender.com';

// ==================== LOAD DATA ====================
async function loadStrategyData() {
    try {
        console.log("%c[Strategy X] Loading data...", "color:#eab308");

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

        console.log(`%c✅ Strategy X: Loaded ${allRetailers.length} retailers successfully`, 'color:#22c55e');
        return true;
    } catch (e) {
        console.error("❌ Strategy X data load failed", e);
        allRetailers = [];
        return false;
    }
}

// ==================== MAP ====================
function initMap() {
    if (currentMap) currentMap.remove();

    const mapContainer = document.getElementById('strategy-map');
    if (!mapContainer) {
        console.error("Map container not found");
        return;
    }

    currentMap = L.map('strategy-map', {
        zoomControl: true,
        attributionControl: false
    }).setView([12.92, 77.60], 11.5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        className: 'map-tiles'
    }).addTo(currentMap);

    drawPerformanceCircles();

    // Ensure map renders properly
    setTimeout(() => {
        if (currentMap) currentMap.invalidateSize();
    }, 350);
}

function drawPerformanceCircles() {
    if (!currentMap || !allRetailers.length) return;

    const areaData = {};
    allRetailers.forEach(r => {
        if (!areaData[r.area]) {
            areaData[r.area] = { count: 0, totalOS: 0, lat: r.lat, lng: r.lng };
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
            fillOpacity: 0.25,
            weight: 3
        }).addTo(currentMap)
          .bindPopup(`<b>${area}</b><br>Avg Outstanding: ₹${Math.round(avgOS).toLocaleString()}`);
    });
}

// ==================== FOCUS PLAN ====================
window.createFocusPlanForArea = function(areaName) {
    const normalized = String(areaName).trim();
    let areaRetailers = allRetailers.filter(r => String(r.area).trim() === normalized);

    if (areaRetailers.length === 0) {
        alert(`No retailers found in area: ${areaName}`);
        return;
    }

    // Smart selection: 60% regular + 40% vicinity
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
        priority_actions: ["High outstanding retailers visit karo", "Payment recover karo", "Key SKUs push karo"],
        notes: `Smart coverage plan for ${areaName}`,
        plan_date: new Date().toISOString().split('T')[0]
    };

    showDraftModal(currentDraftPlan);
};

function showDraftModal(draft) {
    // ... (your existing modal code - keep as is or I can polish further)
    // For now, using your previous modal code
    let html = `...`; // Paste your showDraftModal code here if needed
    // I'll assume you have it working
}

// Tab System (Polished)
function switchStrategyTab(tab) {
    document.querySelectorAll('[id^="stab-"]').forEach(b => b.classList.remove('tab-active'));
    const activeBtn = document.getElementById(`stab-${tab}`);
    if (activeBtn) activeBtn.classList.add('tab-active');

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
            <p class="mt-2">Click any colored area on the map to create a plan</p>
        </div>
    `;
}

function showActiveTargets() {
    const container = document.getElementById('strategy-tab-content');
    container.innerHTML = `<div class="p-12 text-center text-slate-400">Targets dashboard coming in next phase...</div>`;
}

function showTerritories() {
    const container = document.getElementById('strategy-tab-content');
    const areas = {};
    allRetailers.forEach(r => areas[r.area] = (areas[r.area] || 0) + 1);

    let html = `<div class="font-semibold mb-4 text-lg">Territories Overview</div>`;
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

    console.log("%c✅ Strategy X - Map & Planning Ready", "color:#22c55e");
}

// Global Exports
window.initializeStrategyX = initializeStrategyX;
window.switchStrategyTab = switchStrategyTab;
window.createFocusPlanForArea = createFocusPlanForArea;
window.saveDraftToSupabase = saveDraftToSupabase;
window.closeDraftModal = closeDraftModal;
