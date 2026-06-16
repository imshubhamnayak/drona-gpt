// ==================== STRATEGY X - FIXED & CLEAN ====================

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

// Initialize Map
function initializeStrategyX() {
    const mapContainer = document.getElementById('strategy-map');
    if (!mapContainer) {
        console.error("Map container not found");
        return;
    }

    // Clear previous map
    mapContainer.innerHTML = '';

    // Create map
    const map = L.map('strategy-map').setView([12.92, 77.60], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Plot retailers
    plotRetailers(map);

    // Populate sidebar list
    populateTerritoryList();
}

function plotRetailers(map) {
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
            <span class="text-xs">${retailer.area}</span><br><br>
            Outstanding: <b>₹${retailer.outstanding.toLocaleString()}</b><br>
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
        const totalOut = areas[area].reduce((sum, r) => sum + (r.outstanding || 0), 0);
        
        html += `
            <div onclick="showTerritoryDetails('${area}')" class="p-3 hover:bg-slate-800 rounded-2xl cursor-pointer border border-slate-700">
                <div class="font-medium">${area}</div>
                <div class="text-xs text-slate-400">${count} retailers • ₹${(totalOut/100000).toFixed(1)}L</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function showTerritoryDetails(areaName) {
    const retailersInArea = allRetailers.filter(r => r.area === areaName);
    const panel = document.getElementById('territory-details-panel');
    if (!panel) return;

    let html = `
        <div class="p-4">
            <h4 class="font-semibold text-xl mb-2">${areaName}</h4>
            <p class="text-sm text-slate-400 mb-4">${retailersInArea.length} retailers</p>
            
            <button onclick="createFocusPlanForArea('${areaName}')" 
                    class="w-full py-3 bg-orange-600 hover:bg-orange-500 rounded-2xl font-medium">
                Create Focus Plan for ${areaName}
            </button>
        </div>
    `;

    panel.innerHTML = html;
    panel.classList.remove('hidden');
}

function createFocusPlanForArea(areaName) {
    const retailersInArea = allRetailers.filter(r => r.area === areaName)
        .sort((a, b) => b.outstanding - a.outstanding);

    const priority = retailersInArea.slice(0, 6).map(r => r.name);
    
    alert(`✅ Focus Plan Created for ${areaName}\n\nPriority Retailers:\n${priority.join("\n")}`);
    console.log("Focus Plan for", areaName, priority);
}

// Global Initialization
async function initializeStrategyX() {
    await loadStrategyData();
    initializeMap();
    console.log("%c✅ Strategy X Fully Initialized", "color:#22c55e");
}

window.initializeStrategyX = initializeStrategyX;
