// ==================== STRATEGY X - FINAL VERSION (200 Retailers + Auto Drafting) ====================

let map = null;
let territories = [];
let allRetailers = [];
window.strategyXInitialized = false;

async function loadTerritories() {
    territories = [
        { id: 1, name: "JP Nagar Phase 1", lat: 12.912, lng: 77.58, retailerCount: 20 },
        { id: 2, name: "JP Nagar Phase 2", lat: 12.905, lng: 77.59, retailerCount: 20 },
        { id: 3, name: "JP Nagar Phase 3", lat: 12.898, lng: 77.575, retailerCount: 20 },
        { id: 4, name: "BTM Layout", lat: 12.916, lng: 77.610, retailerCount: 20 },
        { id: 5, name: "Koramangala", lat: 12.935, lng: 77.624, retailerCount: 20 },
        { id: 6, name: "HSR Layout", lat: 12.908, lng: 77.647, retailerCount: 20 },
        { id: 7, name: "Electronic City", lat: 12.845, lng: 77.660, retailerCount: 20 },
        { id: 8, name: "Bannerghatta Road", lat: 12.878, lng: 77.597, retailerCount: 20 },
        { id: 9, name: "Jayanagar", lat: 12.925, lng: 77.593, retailerCount: 20 },
        { id: 10, name: "Wilson Garden", lat: 12.945, lng: 77.585, retailerCount: 20 }
    ];

    allRetailers = generate200Retailers();
}

function generate200Retailers() {
    let retailers = [];
    let id = 1;

    territories.forEach((area) => {
        for (let i = 1; i <= 20; i++) {
            retailers.push({
                id: id++,
                name: `${area.name} Retailer ${i}`,
                area: area.name,
                outstanding: Math.floor(Math.random() * 45000) + 3000,
                lastVisitDaysAgo: Math.floor(Math.random() * 25),
                monthlyOrders: Math.random() > 0.7   // ~30% active orderers
            });
        }
    });
    return retailers;
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
    if (!map) return;

    territories.forEach(territory => {
        const circle = L.circle([territory.lat, territory.lng], {
            color: '#f59e0b',
            fillColor: '#f59e0b',
            fillOpacity: 0.3,
            radius: 900
        }).addTo(map);

        circle.bindPopup(`<b>${territory.name}</b><br>${territory.retailerCount} retailers`);
        circle.on('click', () => showTerritoryDetails(territory.id));
    });
}

// ==================== DEFAULT FOCUS PLAN DRAFTING LOGIC ====================
function createDefaultFocusPlanForNextDay() {
    // Get retailers who placed order this month (~6 per area on average)
    const activeOrderRetailers = allRetailers.filter(r => r.monthlyOrders).slice(0, 60);

    // Create balanced draft plan (10-12 visits)
    const draftPlan = {
        date: "2026-06-15",
        totalVisits: 12,
        priorityRetailers: activeOrderRetailers.slice(0, 6).map(r => r.name),
        nearbyRetailers: allRetailers.slice(6, 12).map(r => r.name),
        message: "Visit all 6 ordering retailers + 6 nearby ones in same geographical vicinity."
    };

    console.log("Auto Draft Created:", draftPlan);
    return draftPlan;
}

function showTerritoryDetails(territoryId) {
    const territory = territories.find(t => t.id === territoryId);
    if (!territory) return;

    const panel = document.getElementById('territory-details-panel');
    if (!panel) return;

    panel.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div>
                <h4 class="font-semibold text-xl">${territory.name}</h4>
                <p class="text-sm text-slate-400">${territory.retailerCount} retailers</p>
            </div>
            <button onclick="createFocusPlanForTerritory(${territory.id})" 
                    class="px-5 py-2 bg-orange-600 hover:bg-orange-500 rounded-2xl text-sm font-medium">
                Create Focus Plan
            </button>
        </div>
    `;
    panel.classList.remove('hidden');
}

async function createFocusPlanForTerritory(territoryId) {
    const draft = createDefaultFocusPlanForNextDay();
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[120] p-4';
    modal.innerHTML = `
        <div class="bg-slate-900 rounded-3xl w-full max-w-md p-6">
            <h3 class="font-semibold mb-4">Default Focus Plan Draft</h3>
            <div class="bg-slate-800 p-4 rounded-2xl text-sm mb-4">
                <div><strong>Date:</strong> ${draft.date}</div>
                <div><strong>Visits:</strong> ${draft.totalVisits}</div>
                <div><strong>Priority:</strong> ${draft.priorityRetailers.length} ordering retailers</div>
                <div><strong>Nearby:</strong> ${draft.nearbyRetailers.length} retailers</div>
            </div>
            <div class="text-xs text-slate-400 mb-4">${draft.message}</div>
            
            <div class="flex gap-3">
                <button onclick="this.closest('.fixed').remove()" 
                        class="flex-1 py-3 bg-slate-700 rounded-2xl">Edit Draft</button>
                <button onclick="alert('Focus Plan Published to Ramesh!'); this.closest('.fixed').remove()" 
                        class="flex-1 py-3 bg-orange-600 rounded-2xl font-medium">Publish to Ramesh</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ==================== INITIALIZE ====================
async function initializeStrategyX() {
    console.log('%c[Strategy X] Loading 200 retailers...', 'color:#f59e0b');
    
    await loadTerritories();
    initializeMap();

    const listContainer = document.getElementById('territory-list');
    if (listContainer) {
        listContainer.innerHTML = territories.map(t => `
            <div onclick="showTerritoryDetails(${t.id})" 
                 class="p-3 hover:bg-slate-800 rounded-2xl cursor-pointer text-sm">
                ${t.name} <span class="text-slate-400">(${t.retailerCount} retailers)</span>
            </div>
        `).join('');
    }

    window.strategyXInitialized = true;
    console.log('%c[Strategy X] Ready with 200 retailers', 'color:#22c55e');
}

window.initializeStrategyX = initializeStrategyX;
