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
        console.log(`[Strategy X] Loaded ${territories.length} territories`);
    } catch (error) {
        console.error("Failed to load territories.json", error);
        territories = [];
    }
}

// Initialize Leaflet Map
function initializeMap() {
    // Center on South Bangalore (JP Nagar area)
    map = L.map('strategy-map').setView([12.912, 77.58], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
    }).addTo(map);

    // Add territories to map
    addTerritoriesToMap();
}

// Add territories as colored circles (heat map style)
function addTerritoriesToMap() {
    territories.forEach(territory => {
        const color = getTerritoryColor(territory);
        const radius = Math.max(territory.retailerCount / 2, 300); // Scale by number of retailers

        const circle = L.circle([territory.lat, territory.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.6,
            radius: radius,
            weight: 2
        }).addTo(map);

        // Store reference
        territoryLayers[territory.id] = circle;

        // Click event
        circle.on('click', () => {
            showTerritoryDetails(territory);
        });

        // Tooltip on hover
        circle.bindTooltip(`
            <strong>${territory.name}</strong><br>
            Outstanding: ₹${(territory.outstanding / 100000).toFixed(1)}L<br>
            Declining SKUs: ${territory.decliningSKUs}
        `, { permanent: false, direction: 'top' });
    });
}

// Get color based on performance (Outstanding + Declining SKUs)
function getTerritoryColor(territory) {
    const outstandingScore = territory.outstanding / 100000; // in lakhs
    const decliningScore = territory.decliningSKUs * 2;

    const totalScore = outstandingScore + decliningScore;

    if (totalScore > 4) return '#ef4444';      // Red - Critical
    if (totalScore > 2.5) return '#f59e0b';    // Orange - Needs Attention
    return '#22c55e';                          // Green - Good
}

// Show territory details in right panel
function showTerritoryDetails(territory) {
    const panel = document.getElementById('territory-details-panel');
    if (!panel) return;

    panel.innerHTML = `
        <div class="p-5">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-semibold">${territory.name}</h3>
                    <p class="text-sm text-slate-400">${territory.retailerCount} retailers</p>
                </div>
                <button onclick="closeTerritoryPanel()" class="text-slate-400 hover:text-white text-2xl">×</button>
            </div>

            <!-- Outstanding -->
            <div class="bg-slate-800 rounded-2xl p-4 mb-4">
                <div class="text-xs text-slate-400 mb-1">OUTSTANDING</div>
                <div class="text-3xl font-semibold">₹${(territory.outstanding / 100000).toFixed(1)}L</div>
            </div>

            <!-- Declining SKUs -->
            <div class="bg-slate-800 rounded-2xl p-4 mb-4">
                <div class="text-xs text-slate-400 mb-1">DECLINING / AT-RISK SKUs</div>
                <div class="text-3xl font-semibold text-orange-400">${territory.decliningSKUs}</div>
            </div>

            <button onclick="createFocusPlanForTerritory('${territory.id}')"
                    class="w-full bg-orange-600 hover:bg-orange-500 py-3 rounded-2xl font-medium mt-2">
                Create Focus Plan for this Territory
            </button>
        </div>
    `;

    panel.classList.remove('hidden');
}

// Close territory details panel
function closeTerritoryPanel() {
    const panel = document.getElementById('territory-details-panel');
    if (panel) panel.classList.add('hidden');
}

// Open Create Focus Plan modal for a specific territory
function createFocusPlanForTerritory(territoryId) {
    closeTerritoryPanel();

    const territory = territories.find(t => t.id === territoryId);
    if (!territory) return;

    const modal = document.createElement('div');
    modal.className = `fixed inset-0 bg-black/70 flex items-center justify-center z-50`;
    modal.innerHTML = `
        <div class="bg-slate-900 border border-slate-700 w-full max-w-md mx-4 rounded-3xl p-6">
            <h3 class="text-xl font-semibold mb-4">Create Focus Plan</h3>
            
            <div class="mb-4">
                <label class="text-sm text-slate-400">Territory</label>
                <div class="bg-slate-800 px-4 py-2 rounded-2xl mt-1">${territory.name}</div>
            </div>

            <div class="mb-4">
                <label class="text-sm text-slate-400">Period</label>
                <select id="plan-period" class="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2 mt-1">
                    <option value="Week">This Week</option>
                    <option value="Month">This Month</option>
                </select>
            </div>

            <div class="mb-4">
                <label class="text-sm text-slate-400">Focus SKUs</label>
                <input id="focus-skus" type="text" placeholder="Pressure Cooker 5L, Air Fryer 4L" 
                       class="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2 mt-1">
            </div>

            <div class="mb-4">
                <label class="text-sm text-slate-400">Priority Actions</label>
                <div class="mt-2 space-y-2 text-sm">
                    <label class="flex items-center gap-x-2"><input type="checkbox" value="Payment Collection"> Payment Collection</label>
                    <label class="flex items-center gap-x-2"><input type="checkbox" value="New SKU Push"> New SKU Push</label>
                    <label class="flex items-center gap-x-2"><input type="checkbox" value="Churn Prevention"> Churn Prevention</label>
                    <label class="flex items-center gap-x-2"><input type="checkbox" value="Volume Growth"> Volume Growth</label>
                </div>
            </div>

            <div class="mb-4">
                <label class="text-sm text-slate-400">Notes / Instructions</label>
                <textarea id="plan-notes" rows="3" placeholder="Any specific instructions for the team..."
                          class="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2 mt-1"></textarea>
            </div>

            <div class="flex gap-x-3 mt-6">
                <button onclick="this.closest('.fixed').remove()" 
                        class="flex-1 py-3 rounded-2xl border border-slate-700">Cancel</button>
                <button onclick="saveFocusPlan('${territoryId}', this)" 
                        class="flex-1 py-3 bg-orange-600 hover:bg-orange-500 rounded-2xl font-medium">Publish Plan</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Save Focus Plan
function saveFocusPlan(territoryId, buttonElement) {
    const modal = buttonElement.closest('.fixed');
    
    const period = document.getElementById('plan-period').value;
    const focusSKUs = document.getElementById('focus-skus').value.split(',').map(s => s.trim());
    const notes = document.getElementById('plan-notes').value;

    // Get selected priority actions
    const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
    const priorityActions = Array.from(checkboxes).map(cb => cb.value);

    const newPlan = {
        id: Date.now(),
        period: period,
        focusSKUs: focusSKUs,
        priorityActions: priorityActions,
        territories: [territoryId],
        notes: notes,
        createdAt: new Date().toISOString().split('T')[0],
        active: true
    };

    activePlans.push(newPlan);
    
    // Close modal
    modal.remove();

    // Show success message
    alert("Focus Plan published successfully!");

    // Refresh active plans view (if visible)
    showActivePlans();
}

// Show Active Plans
function showActivePlans() {
    const container = document.getElementById('active-plans-list');
    if (!container) return;

    if (activePlans.length === 0) {
        container.innerHTML = `<p class="text-slate-400 text-sm">No active focus plans yet.</p>`;
        return;
    }

    let html = '';
    activePlans.forEach(plan => {
        const territoryNames = plan.territories.map(id => {
            const t = territories.find(ter => ter.id === id);
            return t ? t.name : id;
        }).join(', ');

        html += `
            <div class="bg-slate-800 rounded-2xl p-4 mb-3">
                <div class="flex justify-between">
                    <div>
                        <span class="font-medium">${plan.period} Focus Plan</span>
                        <div class="text-xs text-slate-400">${plan.createdAt}</div>
                    </div>
                    <button onclick="deactivatePlan(${plan.id})" class="text-xs text-red-400 hover:text-red-300">Deactivate</button>
                </div>
                <div class="mt-2 text-sm">
                    <strong>Focus SKUs:</strong> ${plan.focusSKUs.join(', ')}<br>
                    <strong>Actions:</strong> ${plan.priorityActions.join(', ')}<br>
                    <strong>Territories:</strong> ${territoryNames}
                </div>
                ${plan.notes ? `<div class="mt-2 text-xs text-slate-400">${plan.notes}</div>` : ''}
            </div>
        `;
    });

    container.innerHTML = html;
}

function deactivatePlan(planId) {
    activePlans = activePlans.filter(p => p.id !== planId);
    showActivePlans();
}

// Initialize Strategy X
async function initializeStrategyX() {
    await loadTerritories();
    initializeMap();

    // Show active plans section by default (if element exists)
    const activePlansContainer = document.getElementById('active-plans-list');
    if (activePlansContainer) {
        showActivePlans();
    }

    console.log("[Strategy X] Initialized successfully");
}

// Make functions available globally
window.initializeStrategyX = initializeStrategyX;
window.showActivePlans = showActivePlans;
