// ==================== STRATEGY X - FULLY FIXED ====================

let allRetailers = [];
let currentMap = null;

// Load Data
async function loadStrategyData() {
    try {
        const response = await fetch('data/retailers.json');
        const data = await response.json();
        allRetailers = data.retailers || [];
        console.log(`%c✅ Strategy X: Loaded ${allRetailers.length} retailers`, 'color:#22c55e');
    } catch (err) {
        console.error("Failed to load retailers.json", err);
        allRetailers = [];
    }
}

// Initialize Everything
async function initializeStrategyX() {
    await loadStrategyData();
    initializeMap();
    populateTerritoryList();
    console.log("%c✅ Strategy X Fully Initialized", "color:#22c55e");
}

// Initialize Map
function initializeMap() {
    const mapContainer = document.getElementById('strategy-map');
    if (!mapContainer) return;

    mapContainer.innerHTML = '';

    currentMap = L.map('strategy-map').setView([12.92, 77.60], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(currentMap);

    plotRetailersOnMap();
}

// Plot Retailers
function plotRetailersOnMap() {
    if (!currentMap || !allRetailers.length) return;

    allRetailers.forEach(retailer => {
        if (!retailer.lat || !retailer.lng) return;

        const color = retailer.outstanding > 30000 ? "#ef4444" : 
                     (retailer.outstanding > 15000 ? "#f59e0b" : "#22c55e");

        const marker = L.circleMarker([retailer.lat, retailer.lng], {
            radius: 5,
            fillColor: color,
            color: "#fff",
            weight: 1.5,
            opacity: 1,
            fillOpacity: 0.85
        }).addTo(currentMap);

        marker.bindPopup(`
            <b>${retailer.name}</b><br>
            ${retailer.area}<br><br>
            Outstanding: <b>₹${retailer.outstanding}</b>
        `);
    });
}

// Populate Territory List
function populateTerritoryList() {
    const container = document.getElementById('territory-list');
    if (!container) return;

    const areas = {};
    allRetailers.forEach(r => {
        if (!areas[r.area]) areas[r.area] = [];
        areas[r.area].push(r);
    });

    let html = '';
    Object.keys(areas).forEach(area => {
        const count = areas[area].length;
        html += `
            <div onclick="showTerritoryDetails('${area}')" 
                 class="p-3 hover:bg-slate-800 rounded-2xl cursor-pointer border border-slate-700">
                <div class="font-medium">${area}</div>
                <div class="text-xs text-slate-400">${count} retailers</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Show Territory Details
function showTerritoryDetails(areaName) {
    const retailersInArea = allRetailers.filter(r => r.area === areaName);
    const panel = document.getElementById('territory-details-panel');
    if (!panel) return;

    panel.innerHTML = `
        <div class="p-4">
            <h4 class="font-semibold text-xl mb-2">${areaName}</h4>
            <p class="text-sm text-slate-400 mb-4">${retailersInArea.length} retailers</p>
            <button onclick="createFocusPlanForArea('${areaName}')" 
                    class="w-full py-3 bg-orange-600 hover:bg-orange-500 rounded-2xl font-medium">
                Create Focus Plan
            </button>
        </div>
    `;
    panel.classList.remove('hidden');
}

// Create Focus Plan
function createFocusPlanForArea(areaName) {
    const retailersInArea = allRetailers.filter(r => r.area === areaName)
        .sort((a, b) => b.outstanding - a.outstanding);

    const priority = retailersInArea.slice(0, 6).map(r => r.name);

    alert(`✅ Focus Plan Created for ${areaName}\n\nPriority Retailers:\n${priority.join("\n")}`);
    console.log("Focus Plan Draft for", areaName, priority);
}

// Make functions globally available
window.initializeStrategyX = initializeStrategyX;
window.showTerritoryDetails = showTerritoryDetails;
window.createFocusPlanForArea = createFocusPlanForArea;
