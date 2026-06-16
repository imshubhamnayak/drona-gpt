// ==================== STRATEGY X - FINAL FIXED VERSION ====================

let allRetailers = [];

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

// Initialize Strategy X Map
function initializeStrategyX() {
    const mapContainer = document.getElementById('strategy-map');
    if (!mapContainer) {
        console.error("Map container not found");
        return;
    }

    mapContainer.innerHTML = '';

    const map = L.map('strategy-map').setView([12.92, 77.60], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    plotRetailersOnMap(map);
    populateTerritoryList();

    console.log("%c✅ Strategy X Map Initialized Successfully", "color:#22c55e");
}

function plotRetailersOnMap(map) {
    if (!allRetailers.length) return;

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
        }).addTo(map);

        marker.bindPopup(`
            <b>${retailer.name}</b><br>
            ${retailer.area}<br><br>
            Outstanding: <b>₹${retailer.outstanding}</b><br>
            Last Visit: ${retailer.lastVisitDaysAgo} days ago
        `);
    });
}

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

function showTerritoryDetails(areaName) {
    alert(`Showing details for ${areaName} (Feature coming soon)`);
}

function createFocusPlanForArea(areaName) {
    alert(`Focus Plan created for ${areaName}`);
}

// Global
window.initializeStrategyX = initializeStrategyX;
