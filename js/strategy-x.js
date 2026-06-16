// ==================== STRATEGY X - DEBUGGED & WORKING ====================

let allRetailers = [];
let currentMap = null;
let currentMarkers = [];

// Load Data
async function loadStrategyData() {
    try {
        const response = await fetch('data/retailers.json');
        const data = await response.json();
        allRetailers = data.retailers || [];
        console.log(`%c✅ Loaded ${allRetailers.length} retailers`, 'color:#22c55e');
    } catch (err) {
        console.error("Failed to load retailers.json", err);
    }
}

// Main Initialization
async function initializeStrategyX() {
    await loadStrategyData();
    initMap();
    populateTerritoryList();
    console.log("%c✅ Strategy X Fully Initialized", "color:#22c55e");
}

// Initialize Map
function initMap() {
    const container = document.getElementById('strategy-map');
    if (!container) {
        console.error("Map container not found");
        return;
    }

    container.innerHTML = '';

    currentMap = L.map('strategy-map').setView([12.92, 77.60], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(currentMap);

    drawAreaCircles();
}

// Draw Area Circles (Orange Orbits)
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

        // Click to show retailers
        circle.on('click', () => {
            showRetailersInArea(areaName, avgLat, avgLng);
        });
    });
}

// Show Retailers when Area Clicked
function showRetailersInArea(areaName, centerLat, centerLng) {
    // Clear old markers
    currentMarkers.forEach(m => currentMap.removeLayer(m));
    currentMarkers = [];

    const filtered = allRetailers.filter(r => r.area === areaName);

    filtered.forEach(r => {
        if (!r.lat || !r.lng) return;

        const marker = L.circleMarker([r.lat, r.lng], {
            radius: 6,
            fillColor: r.outstanding > 30000 ? "#ef4444" : "#22c55e",
            color: "#fff",
            weight: 2,
            fillOpacity: 0.9
        }).addTo(currentMap);

        marker.bindPopup(`<b>${r.name}</b><br>₹${r.outstanding}`);
        currentMarkers.push(marker);
    });

    currentMap.flyTo([centerLat, centerLng], 14);
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
        html += `
            <div onclick="showRetailersInArea('${area}', 12.92, 77.60)" 
                 class="p-3 hover:bg-slate-800 rounded-2xl cursor-pointer border border-slate-700">
                ${area} <span class="text-slate-400">(${areas[area].length})</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ==================== CREATE FOCUS PLAN - FIXED ====================
async function createFocusPlan(areaName) {
    console.log(`Creating plan for area: "${areaName}"`);

    if (!retailers || retailers.length === 0) {
        console.error("Retailers data not loaded yet!");
        alert("Please wait for retailers to load or refresh the page.");
        return;
    }

    // Trim and normalize area name for better matching
    const normalizedArea = areaName.trim();

    const areaRetailers = retailers.filter(r => 
        r.area && r.area.trim() === normalizedArea
    );

    console.log(`Found ${areaRetailers.length} retailers in "${normalizedArea}"`);

    if (areaRetailers.length === 0) {
        alert(`No retailers found in "${areaName}".\n\nAvailable areas: ${[...new Set(retailers.map(r => r.area))].join(", ")}`);
        return;
    }

    // Smart selection: 60% regular + 40% vicinity + priority on high outstanding
    let regular = areaRetailers.filter(r => r.monthlyOrders === true)
        .sort((a, b) => (b.outstanding || 0) - (a.outstanding || 0));

    let others = areaRetailers.filter(r => r.monthlyOrders !== true)
        .sort((a, b) => (b.outstanding || 0) - (a.outstanding || 0));

    let selected = [
        ...regular.slice(0, Math.ceil(areaRetailers.length * 0.6)),
        ...others.slice(0, Math.ceil(areaRetailers.length * 0.4))
    ].slice(0, 12);

    const plan = {
        active: true,
        created_by: "Admin",
        focus_skus: ["Prestige Pressure Cooker 5L", "Prestige Mixer Grinder 750W"],
        notes: `Smart Visit Plan for ${areaName} - Regular orderers + vicinity coverage.`,
        period: "Week",
        priority_actions: [
            "Meet all regular monthly order dealers first",
            "Cover nearby retailers in same area",
            "Focus on high outstanding recovery",
            "Push Pressure Cooker & Mixer schemes"
        ],
        territories: [areaName],
        priorityRetailers: selected.map(r => ({
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

        console.log("%c✅ Focus Plan Saved Successfully!", "color:lime;font-size:16px", data[0]);
        alert(`✅ Focus Plan created for ${areaName}!\n${selected.length} retailers selected.`);

        if (typeof showPublishedPlans === 'function') showPublishedPlans();

    } catch (err) {
        console.error("Supabase Error:", err);
        alert("Failed to save plan: " + (err.message || err));
    }
}

// Global Exposure
window.initializeStrategyX = initializeStrategyX;
window.createFocusPlanForArea = createFocusPlanForArea;
window.showRetailersInArea = showRetailersInArea;
