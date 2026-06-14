// ==================== STRATEGY X - FIXED VERSION ====================

let map = null;
let allRetailers = [];
window.strategyXInitialized = false;

async function loadData() {
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

function initializeMap() {
    const mapContainer = document.getElementById('strategy-map');
    if (!mapContainer) return;

    if (map) map.remove();

    map = L.map('strategy-map').setView([12.912, 77.58], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    addTerritoriesToMap();
}

function addTerritoriesToMap() {
    if (!map || !allRetailers.length) return;

    const areaMap = {};
    allRetailers.forEach(r => {
        if (!areaMap[r.area]) areaMap[r.area] = [];
        areaMap[r.area].push(r);
    });

    Object.keys(areaMap).forEach(areaName => {
        const retailersInArea = areaMap[areaName];
        const avgLat = retailersInArea.reduce((sum, r) => sum + (r.lat || 12.91), 0) / retailersInArea.length;
        const avgLng = retailersInArea.reduce((sum, r) => sum + (r.lng || 77.58), 0) / retailersInArea.length;

        const circle = L.circle([avgLat, avgLng], {
            color: '#f59e0b',
            fillColor: '#f59e0b',
            fillOpacity: 0.3,
            radius: 950
        }).addTo(map);

        circle.bindPopup(`<b>${areaName}</b><br>${retailersInArea.length} retailers`);
        circle.on('click', () => showTerritoryDetails(areaName));
    });
}

function showTerritoryDetails(areaName) {
    const retailersInArea = allRetailers.filter(r => r.area === areaName);
    const panel = document.getElementById('territory-details-panel');
    if (!panel) return;

    panel.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div>
                <h4 class="font-semibold text-xl">${areaName}</h4>
                <p class="text-sm text-slate-400">${retailersInArea.length} retailers</p>
            </div>
            <button onclick="createFocusPlanForArea('${areaName}')" 
                    class="px-5 py-2 bg-orange-600 hover:bg-orange-500 rounded-2xl text-sm font-medium">
                Create Focus Plan
            </button>
        </div>
    `;
    panel.classList.remove('hidden');
}

function createFocusPlanForArea(areaName) {
    const retailersInArea = allRetailers.filter(r => r.area === areaName);
    const ordering = retailersInArea.filter(r => r.monthlyOrders).slice(0, 6);
    const nearby = retailersInArea.filter(r => !ordering.includes(r)).slice(0, 4);

    const draft = {
        area: areaName,
        totalVisits: ordering.length + nearby.length,
        priority: ordering.map(r => r.name),
        nearby: nearby.map(r => r.name)
    };

    alert(`✅ Draft Focus Plan for ${areaName}\nTotal Visits: ${draft.totalVisits}`);
    console.log("Draft:", draft);
}

// ==================== INITIALIZE ====================
async function initializeStrategyX() {
    await loadData();
    initializeMap();

    const listContainer = document.getElementById('territory-list');
    if (listContainer) {
        const uniqueAreas = [...new Set(allRetailers.map(r => r.area))];
        listContainer.innerHTML = uniqueAreas.map(area => `
            <div onclick="showTerritoryDetails('${area}')" 
                 class="p-3 hover:bg-slate-800 rounded-2xl cursor-pointer text-sm">
                ${area} <span class="text-slate-400">(${allRetailers.filter(r => r.area === area).length} retailers)</span>
            </div>
        `).join('');
    }

    window.strategyXInitialized = true;
}

window.initializeStrategyX = initializeStrategyX;
