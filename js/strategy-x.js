// ==================== STRATEGY X MODULE ====================
let territories = [];
let map = null;
let territoryLayers = {};
let activePlans = [];

async function loadTerritories() {
    const res = await fetch('data/territories.json');
    territories = await res.json();
}

function initializeMap() {
    map = L.map('strategy-map').setView([12.912, 77.58], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    addTerritoriesToMap();
    renderTerritoryList();
}

function addTerritoriesToMap() {
    territories.forEach(territory => {
        const color = getTerritoryColor(territory);
        const radius = Math.max(territory.retailerCount * 45, 280);

        const circle = L.circle([territory.lat, territory.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.55,
            radius: radius,
            weight: 2
        }).addTo(map);

        territoryLayers[territory.id] = circle;

        circle.on('click', () => {
            showTerritoryDetails(territory);
            highlightTerritoryInList(territory.id);
        });

        circle.bindTooltip(`<strong>${territory.name}</strong><br>Retailers: ${territory.retailerCount}`);
    });
}

function getTerritoryColor(territory) {
    const score = (territory.outstanding / 100000) + (territory.decliningSKUs * 1.8);
    if (score > 5) return '#ef4444';
    if (score > 3.2) return '#f59e0b';
    return '#22c55e';
}

function renderTerritoryList() { /* ... same as previous refined version ... */ }

function showTerritoryDetails(territory) { /* ... same as previous ... */ }

function closeTerritoryPanel() { /* ... same ... */ }

// ==================== FIXED MODAL (High z-index) ====================
function createFocusPlanForTerritory(territoryId) {
    closeTerritoryPanel();

    const modal = document.createElement('div');
    modal.className = `fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]`;   // ← High z-index fixed

    modal.innerHTML = `...`; // (Use the same modal HTML from previous version)

    document.body.appendChild(modal);
}

function saveFocusPlan(territoryId, element) { /* ... same ... */ }

function showActivePlans() { /* ... same ... */ }

async function initializeStrategyX() {
    await loadTerritories();
    initializeMap();
}

window.initializeStrategyX = initializeStrategyX;
