// ==================== STRATEGY X MODULE ====================
let territories = [];
let map = null;
let territoryLayers = {};
let activePlans = [];

// Load territories data
async function loadTerritories() {
    try {
        const response = await fetch('data/territories.json');
        territories = await response.json();
    } catch (error) {
        console.error("Failed to load territories.json", error);
        territories = [];
    }
}

// Initialize Leaflet Map
function initializeMap() {
    const mapContainer = document.getElementById('strategy-map');
    if (!mapContainer) return;

    map = L.map('strategy-map').setView([12.912, 77.58], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
    }).addTo(map);

    addTerritoriesToMap();
    renderTerritoryList();
}

// Add territories to map as colored circles
function addTerritoriesToMap() {
    territories.forEach(territory => {
        const color = getTerritoryColor(territory);
        const radius = Math.max(territory.retailerCount / 1.8, 280);

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

        circle.bindTooltip(`
            <strong>${territory.name}</strong><br>
            Outstanding: ₹${(territory.outstanding / 100000).toFixed(1)}L<br>
            Declining SKUs: ${territory.decliningSKUs}
        `);
    });
}

// Color logic
function getTerritoryColor(territory) {
    const score = (territory.outstanding / 100000) + (territory.decliningSKUs * 1.5);
    
    if (score > 4.5) return '#ef4444';      // Red
    if (score > 3) return '#f59e0b';        // Orange
    return '#22c55e';                       // Green
}

// Render territory list in sidebar
function renderTerritoryList() {
    const container = document.getElementById('territory-list');
    if (!container) return;

    container.innerHTML = '';

    territories.forEach(territory => {
        const div = document.createElement('div');
        div.className = `flex justify-between items-center p-3 rounded-2xl cursor-pointer hover:bg-slate-800 transition-colors territory-list-item`;
        div.dataset.id = territory.id;

        div.innerHTML = `
            <div>
                <div class="font-medium">${territory.name}</div>
                <div class="text-xs text-slate-400">${territory.retailerCount} retailers</div>
            </div>
            <div class="text-right">
                <div class="text-sm font-mono">₹${(territory.outstanding / 100000).toFixed(1)}L</div>
                <div class="text-xs text-orange-400">${territory.decliningSKUs} declining</div>
            </div>
        `;

        div.onclick = () => {
            showTerritoryDetails(territory);
            highlightTerritoryInList(territory.id);
        };

        container.appendChild(div);
    });
}

function highlightTerritoryInList(territoryId) {
    document.querySelectorAll('.territory-list-item').forEach(el => {
        el.classList.remove('bg-slate-700');
        if (el.dataset.id === territoryId) {
            el.classList.add('bg-slate-700');
        }
    });
}

// Show territory details
function showTerritoryDetails(territory) {
    const panel = document.getElementById('territory-details-panel');
    if (!panel) return;

    panel.innerHTML = `
        <div>
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-semibold">${territory.name}</h3>
                    <p class="text-sm text-slate-400">${territory.retailerCount} retailers</p>
                </div>
                <button onclick="closeTerritoryPanel()" class="text-slate-400 hover:text-white text-2xl">×</button>
            </div>

            <div class="space-y-4">
                <!-- Outstanding -->
                <div class="bg-slate-800 rounded-2xl p-4">
                    <div class="text-xs text-slate-400">OUTSTANDING</div>
                    <div class="text-3xl font-semibold mt-1">₹${(territory.outstanding / 100000).toFixed(1)}L</div>
                </div>

                <!-- Declining SKUs -->
                <div class="bg-slate-800 rounded-2xl p-4">
                    <div class="text-xs text-slate-400">DECLINING / AT-RISK SKUs</div>
                    <div class="text-3xl font-semibold text-orange-400 mt-1">${territory.decliningSKUs}</div>
                </div>
            </div>

            <button onclick="createFocusPlanForTerritory('${territory.id}')"
                    class="mt-5 w-full bg-orange-600 hover:bg-orange-500 py-3 rounded-2xl font-medium">
                Create Focus Plan for this Territory
            </button>
        </div>
    `;

    panel.classList.remove('hidden');
}

function closeTerritoryPanel() {
    const panel = document.getElementById('territory-details-panel');
    if (panel) panel.classList.add('hidden');
}

// Create Focus Plan
function createFocusPlanForTerritory(territoryId) {
    closeTerritoryPanel();

    const modal = document.createElement('div');
    modal.className = `fixed inset-0 bg-black/70 flex items-center justify-center z-50`;

    modal.innerHTML = `
        <div class="bg-slate-900 border border-slate-700 w-full max-w-md mx-4 rounded-3xl p-6">
            <h3 class="text-xl font-semibold mb-4">Create Focus Plan</h3>
            
            <div class="space-y-4">
                <div>
                    <label class="text-sm text-slate-400">Period</label>
                    <select id="plan-period" class="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2 mt-1">
                        <option value="Week">This Week</option>
                        <option value="Month">This Month</option>
                    </select>
                </div>

                <div>
                    <label class="text-sm text-slate-400">Focus SKUs (comma separated)</label>
                    <input id="focus-skus" type="text" placeholder="Pressure Cooker 5L, Air Fryer 4L" 
                           class="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2 mt-1">
                </div>

                <div>
                    <label class="text-sm text-slate-400">Priority Actions</label>
                    <div class="mt-2 space-y-2 text-sm">
                        <label class="flex items-center gap-x-2"><input type="checkbox" value="Payment Collection"> Payment Collection</label>
                        <label class="flex items-center gap-x-2"><input type="checkbox" value="New SKU Push"> New SKU Push</label>
                        <label class="flex items-center gap-x-2"><input type="checkbox" value="Churn Prevention"> Churn Prevention</label>
                    </div>
                </div>

                <div>
                    <label class="text-sm text-slate-400">Notes</label>
                    <textarea id="plan-notes" rows="2" class="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2 mt-1"></textarea>
                </div>
            </div>

            <div class="flex gap-x-3 mt-6">
                <button onclick="this.closest('.fixed').remove()" class="flex-1 py-3 rounded-2xl border border-slate-700">Cancel</button>
                <button onclick="saveFocusPlan('${territoryId}', this)" class="flex-1 py-3 bg-orange-600 hover:bg-orange-500 rounded-2xl font-medium">Publish</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function saveFocusPlan(territoryId, element) {
    const modal = element.closest('.fixed');

    const period = document.getElementById('plan-period').value;
    const focusSKUs = document.getElementById('focus-skus').value.split(',').map(s => s.trim());
    const notes = document.getElementById('plan-notes').value;

    const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
    const priorityActions = Array.from(checkboxes).map(cb => cb.value);

    const newPlan = {
        id: Date.now(),
        period,
        focusSKUs,
        priorityActions,
        territories: [territoryId],
        notes,
        createdAt: new Date().toISOString().split('T')[0],
        active: true
    };

    activePlans.push(newPlan);
    modal.remove();
    alert("Focus Plan published successfully!");
    showActivePlans();
}

function showActivePlans() {
    const container = document.getElementById('active-plans-list');
    if (!container) return;

    if (activePlans.length === 0) {
        container.innerHTML = `<p class="text-slate-400 text-sm">No active focus plans.</p>`;
        return;
    }

    let html = '';
    activePlans.forEach(plan => {
        html += `
            <div class="bg-slate-800 rounded-2xl p-4 mb-3 text-sm">
                <div class="font-medium">${plan.period} Focus Plan</div>
                <div class="text-xs text-slate-400 mt-1">${plan.createdAt}</div>
                <div class="mt-2">Focus: ${plan.focusSKUs.join(', ')}</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Initialize Strategy X
async function initializeStrategyX() {
    await loadTerritories();
    initializeMap();
}

// Make available globally
window.initializeStrategyX = initializeStrategyX;
window.showActivePlans = showActivePlans;
