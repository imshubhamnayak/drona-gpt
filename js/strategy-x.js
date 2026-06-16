// ==================== STRATEGY X - AREA CIRCLES + FILTERED RETAILERS ====================

let allRetailers = [];
let currentMap = null;
let currentAreaMarkers = [];

// Load Data
async function loadStrategyData() {
    try {
        const response = await fetch('data/retailers.json');
        const data = await response.json();
        allRetailers = data.retailers || [];
        console.log(`%c✅ Loaded ${allRetailers.length} retailers`, 'color:#22c55e');
    } catch (err) {
        console.error("Failed to load data", err);
    }
}

// Initialize Map
function initializeStrategyX() {
    const mapContainer = document.getElementById('strategy-map');
    if (!mapContainer) return;

    mapContainer.innerHTML = '';

    currentMap = L.map('strategy-map').setView([12.92, 77.60], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(currentMap);

    drawAreaCircles();
}

// Draw Circular Orbits per Area
function drawAreaCircles() {
    const areas = {};

    allRetailers.forEach(r => {
        if (!areas[r.area]) areas[r.area] = [];
        areas[r.area].push(r);
    });

    Object.keys(areas).forEach(areaName => {
        const retailersInArea = areas[areaName];
        
        // Calculate center of area
        const avgLat = retailersInArea.reduce((sum, r) => sum + (r.lat || 12.91), 0) / retailersInArea.length;
        const avgLng = retailersInArea.reduce((sum, r) => sum + (r.lng || 77.58), 0) / retailersInArea.length;

        // Draw big circle for area
        const areaCircle = L.circle([avgLat, avgLng], {
            color: "#f59e0b",
            fillColor: "#f59e0b",
            fillOpacity: 0.25,
            radius: 1400,
            weight: 3
        }).addTo(currentMap);

        areaCircle.bindPopup(`<b>${areaName}</b><br>${retailersInArea.length} retailers`);

        // Click on area circle → show only retailers in that area
        areaCircle.on('click', () => {
            showRetailersInArea(areaName, avgLat, avgLng);
        });
    });
}

// Show only retailers of selected area
function showRetailersInArea(areaName, centerLat, centerLng) {
    // Remove previous markers
    currentAreaMarkers.forEach(marker => currentMap.removeLayer(marker));
    currentAreaMarkers = [];

    const filtered = allRetailers.filter(r => r.area === areaName);

    filtered.forEach(retailer => {
        if (!retailer.lat || !retailer.lng) return;

        const color = retailer.outstanding > 30000 ? "#ef4444" : "#22c55e";

        const marker = L.circleMarker([retailer.lat, retailer.lng], {
            radius: 6,
            fillColor: color,
            color: "#fff",
            weight: 2,
            fillOpacity: 0.9
        }).addTo(currentMap);

        marker.bindPopup(`
            <b>${retailer.name}</b><br>
            Outstanding: ₹${retailer.outstanding}<br>
            Last Visit: ${retailer.lastVisitDaysAgo} days ago
        `);

        currentAreaMarkers.push(marker);
    });

    // Zoom to area
    currentMap.flyTo([centerLat, centerLng], 14);
}

// Global function
window.initializeStrategyX = initializeStrategyX;
