// ==================== STRATEGY X - OWNER MODE (Final) ====================

let map;
let territories = [];
window.strategyXInitialized = false;

async function loadTerritories() {
    territories = [
        { id: 1, name: "JP Nagar Phase 1", lat: 12.912, lng: 77.58, outstanding: 124500, decliningSKUs: 3, retailerCount: 8 },
        { id: 2, name: "JP Nagar Phase 2", lat: 12.905, lng: 77.59, outstanding: 87000, decliningSKUs: 1, retailerCount: 6 },
        { id: 3, name: "JP Nagar Phase 3", lat: 12.898, lng: 77.575, outstanding: 156000, decliningSKUs: 5, retailerCount: 11 },
        { id: 4, name: "BTM Layout", lat: 12.916, lng: 77.610, outstanding: 98000, decliningSKUs: 2, retailerCount: 7 },
        { id: 5, name: "Koramangala", lat: 12.935, lng: 77.624, outstanding: 67000, decliningSKUs: 4, retailerCount: 9 },
        { id: 6, name: "HSR Layout", lat: 12.908, lng: 77.647, outstanding: 112000, decliningSKUs: 3, retailerCount: 10 },
        { id: 7, name: "Electronic City", lat: 12.845, lng: 77.660, outstanding: 54000, decliningSKUs: 1, retailerCount: 5 }
    ];
}

function initializeMap() {
    const mapContainer = document.getElementById('strategy-map');
    if (!mapContainer) return;

    if (map) {
        map.remove();
        map = null;
    }

    map = L.map('strategy-map').setView([12.912, 77.58], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    addTerritoriesToMap();
}

function addTerritoriesToMap() {
    if (!map || territories.length === 0) return;

    territories.forEach(territory => {
        const riskScore = (territory.outstanding / 100000) + (territory.decliningSKUs * 2);
        let color = '#22c55e';
        if (riskScore > 4) color = '#ef4444';
        else if (riskScore > 2) color = '#f59e0b';

        const circle = L.circle([territory.lat, territory.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.35,
            radius: 850
        }).addTo(map);

        circle.bindPopup(`
            <b>${territory.name}</b><br>
            Outstanding: ₹${territory.outstanding.toLocaleString()}<br>
            Declining SKUs: ${territory.decliningSKUs}<br>
            Retailers: ${territory.retailerCount}
        `);

        circle.on('click', () => showTerritoryDetails(territory.id));
    });
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
                <p class="text-sm text-slate-400">${territory.retailerCount} retailers • ₹${territory.outstanding.toLocaleString()} outstanding</p>
            </div>
            <button onclick="createFocusPlanForTerritory(${territory.id})" 
                    class="px-5 py-2 bg-orange-600 hover:bg-orange-500 rounded-2xl text-sm font-medium">
                Create Focus Plan
            </button>
        </div>
        <div class="text-sm text-slate-300">Declining SKUs: <span class="font-medium">${territory.decliningSKUs}</span></div>
    `;
    panel.classList.remove('hidden');
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function createFocusPlanForTerritory(territoryId) {
    const territory = territories.find(t => t.id === territoryId);
    if (!territory) return;

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4';
    
    modal.innerHTML = `
        <div class="bg-slate-900 rounded-3xl w-full max-w-md p-6 relative" onclick="event.stopImmediatePropagation()">
            <button onclick="this.closest('.fixed').remove()" 
                    class="absolute top-4 right-4 text-slate-400 hover:text-white text-xl leading-none">×</button>
            
            <h3 class="font-semibold text-lg mb-4 pr-8">Create Focus Plan - ${territory.name}</h3>
            
            <div class="space-y-4">
                <div>
                    <label class="text-xs text-slate-400">Focus SKUs (comma separated)</label>
                    <input type="text" id="focus-skus" class="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2 mt-1" 
                           placeholder="Prestige Pressure Cooker, Mixer Grinder">
                </div>
                <div>
                    <label class="text-xs text-slate-400">Priority Actions</label>
                    <textarea id="priority-actions" class="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2 mt-1 h-24" 
                              placeholder="Visit top 5 retailers this week..."></textarea>
                </div>
            </div>

            <div class="flex gap-3 mt-6">
                <button onclick="saveFocusPlan(${territoryId}, this)" 
                        class="flex-1 py-3 bg-orange-600 hover:bg-orange-500 rounded-2xl font-medium">Save & Publish</button>
                <button onclick="this.closest('.fixed').remove()" 
                        class="flex-1 py-3 bg-slate-700 rounded-2xl">Cancel</button>
            </div>
        </div>
    `;

    // Close modal when clicking on backdrop (outside the white card)
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });

    document.body.appendChild(modal);
}

async function saveFocusPlan(territoryId, btnElement) {
    const supabase = window.supabaseClient;
    const focusSKUs = document.getElementById('focus-skus').value;
    const priorityActions = document.getElementById('priority-actions').value;

    if (!supabase) {
        alert("Supabase not connected. Plan saved locally (demo mode).");
        btnElement.closest('.fixed').remove();
        return;
    }

    try {
        const { error } = await supabase.from('focus_plans').insert([{
            territory_id: territoryId,
            focus_skus: focusSKUs,
            priority_actions: priorityActions,
            created_by: 'Admin',
            active: true
        }]);

        if (error) throw error;

        alert("Focus Plan published successfully!");
        btnElement.closest('.fixed').remove();
        await loadActivePlansFromSupabase();
    } catch (err) {
        console.error(err);
        alert("Failed to save plan.");
    }
}

async function loadActivePlansFromSupabase() {
    const container = document.getElementById('active-plans-list');
    if (!container) return;

    const supabase = window.supabaseClient;
    if (!supabase) {
        container.innerHTML = `<div class="text-xs text-slate-500">Supabase not connected (demo mode)</div>`;
        return;
    }

    try {
        const { data, error } = await supabase
            .from('focus_plans')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `<div class="text-xs text-slate-500">No active focus plans yet.</div>`;
            return;
        }

        container.innerHTML = data.map(plan => `
            <div class="bg-slate-800 p-3 rounded-2xl mb-2 text-sm">
                <div class="font-medium">Territory #${plan.territory_id}</div>
                <div class="text-xs text-slate-400 mt-0.5">${plan.focus_skus || 'No SKUs specified'}</div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<div class="text-xs text-red-400">Failed to load plans</div>`;
    }
}

async function initializeStrategyX() {
    console.log('%c[Strategy X] Initializing...', 'color:#f59e0b');

    await loadTerritories();
    initializeMap();
    await loadActivePlansFromSupabase();

    const listContainer = document.getElementById('territory-list');
    if (listContainer) {
        listContainer.innerHTML = territories.map(t => `
            <div onclick="showTerritoryDetails(${t.id})" 
                 class="p-3 hover:bg-slate-800 rounded-2xl cursor-pointer flex justify-between items-center text-sm border border-transparent hover:border-slate-700">
                <span class="font-medium">${t.name}</span>
                <span class="text-xs px-2 py-0.5 bg-slate-800 rounded-full">${t.retailerCount} retailers</span>
            </div>
        `).join('');
    }

    window.strategyXInitialized = true;
    console.log('%c[Strategy X] Ready', 'color:#22c55e');
}

window.initializeStrategyX = initializeStrategyX;
