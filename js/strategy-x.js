// ==================== STRATEGY X - CLEAN & OPTIMIZED ====================

let allRetailers = [];
let currentMap = null;

// Load Retailers from JSON
async function loadStrategyData() {
    try {
        const response = await fetch('data/retailers.json');
        const data = await response.json();
        allRetailers = data.retailers || [];
        console.log(`%c✅ Strategy X: Loaded ${allRetailers.length} retailers`, 'color:#22c55e');
    } catch (err) {
        console.error("Failed to load retailers.json for Strategy X", err);
        allRetailers = [];
    }
}

// Initialize Map
function initializeStrategyX() {
    const mapContainer = document.getElementById('strategy-map');
    if (!mapContainer) return;

    // Clear previous map
    mapContainer.innerHTML = '';

    currentMap = L.map('strategy-map').setView([12.92, 77.60], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(currentMap);

    plotRetailersOnMap();
    populateTerritoryList();
}

// Plot all retailers as colored markers
function plotRetailersOnMap() {
    if (!currentMap || !allRetailers.length) return;

    allRetailers.forEach(retailer => {
        if (!retailer.lat || !retailer.lng) return;

        const color = retailer.outstanding > 30000 ? "#ef4444" : 
                     (retailer.outstanding > 15000 ? "#f59e0b" : "#22c55e");

        const marker = L.circleMarker([retailer.lat, retailer.lng], {
            radius: 5,
            fillColor: color,
            color: "#ffffff",
            weight: 1.5,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(currentMap);

        marker.bindPopup(`
            <b>${retailer.name}</b><br>
            <span class="text-xs">${retailer.area}</span><br><br>
            Outstanding: <b>₹${retailer.outstanding.toLocaleString()}</b><br>
            Last Visit: ${retailer.lastVisitDaysAgo} days ago<br>
            Payment Trend: ${retailer.paymentTrend || 'N/A'}
        `);
    });
}

// Populate Territory List (Sidebar)
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
        const totalOutstanding = areas[area].reduce((sum, r) => sum + r.outstanding, 0);

        html += `
            <div onclick="showTerritoryDetails('${area}')" 
                 class="p-4 hover:bg-slate-800 rounded-2xl cursor-pointer border border-slate-700">
                <div class="font-medium">${area}</div>
                <div class="text-xs text-slate-400">${count} retailers • ₹${(totalOutstanding/100000).toFixed(1)}L outstanding</div>
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

    let html = `
        <div class="flex justify-between items-start mb-4">
            <div>
                <h4 class="font-semibold text-xl">${areaName}</h4>
                <p class="text-sm text-slate-400">${retailersInArea.length} retailers</p>
            </div>
            <button onclick="createFocusPlanForArea('${areaName}')" 
                    class="px-6 py-2 bg-orange-600 hover:bg-orange-500 rounded-2xl text-sm font-medium">
                Create Focus Plan
            </button>
        </div>
    `;

    panel.innerHTML = html;
    panel.classList.remove('hidden');
}

// Create Focus Plan for Area
function createFocusPlanForArea(areaName) {
    const retailersInArea = allRetailers.filter(r => r.area === areaName);
    
    // Sort by outstanding amount (highest first)
    const sorted = [...retailersInArea].sort((a, b) => b.outstanding - a.outstanding);

    const priority = sorted.slice(0, 6).map(r => r.name);
    const nearby = sorted.slice(6, 10).map(r => r.name);

    const draft = {
        area: areaName,
        date: new Date().toLocaleDateString('en-IN'),
        totalVisits: priority.length + nearby.length,
        priorityRetailers: priority,
        nearbyRetailers: nearby
    };

    alert(`✅ Draft Focus Plan Created for ${areaName}\n\nPriority Visits: ${priority.length}\nTotal Visits: ${draft.totalVisits}`);
    console.log("Focus Plan Draft:", draft);
}

// Initialize
async function initializeStrategyX() {
    await loadStrategyData();
    initializeMap();
    console.log("%c✅ Strategy X Fully Initialized", "color:#22c55e");
}

window.initializeStrategyX = initializeStrategyX;
