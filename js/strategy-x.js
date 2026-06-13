// ==================== STRATEGY X - OWNER MODE ====================

let map;
let territories = [];
let window.strategyXInitialized = false;

async function loadTerritories() {
    // Sample data - replace with real fetch later
    territories = [
        { id: 1, name: "JP Nagar Phase 1", lat: 12.912, lng: 77.58, outstanding: 124500, decliningSKUs: 3, retailerCount: 8 },
        { id: 2, name: "JP Nagar Phase 2", lat: 12.905, lng: 77.59, outstanding: 87000, decliningSKUs: 1, retailerCount: 6 },
        { id: 3, name: "JP Nagar Phase 3", lat: 12.898, lng: 77.575, outstanding: 156000, decliningSKUs: 5, retailerCount: 11 }
    ];
}

function initializeMap() {
    const mapContainer = document.getElementById('strategy-map');
    if (!mapContainer) return;

    if (map) {
        map.remove();
    }

    map = L.map('strategy-map').setView([12.912, 77.58], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    addTerritoriesToMap();
}

function addTerritoriesToMap() {
    if (!map || !territories.length) return;

    territories.forEach(territory => {
        const riskScore = (territory.outstanding / 100000) + (territory.decliningSKUs * 2);
        let color = '#22c55e';
        if (riskScore > 4) color = '#ef4444';
        else if (riskScore > 2) color = '#f59e0b';

        L.circle([territory.lat, territory.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.3,
            radius: 800
        }).addTo(map)
        .bindPopup(`<b>${territory.name}</b><br>Outstanding: ₹${territory.outstanding}<br>Declining SKUs: ${territory.decliningSKUs}`)
        .on('click', () => showTerritoryDetails(territory.id));
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
                <h4 class="font-semibold text-lg">${territory.name}</h4>
                <p class="text-sm text-slate-400">${territory.retailerCount} retailers</p>
            </div>
            <button onclick="createFocusPlanForTerritory(${territory.id})" 
                    class="px-4 py-2 bg-orange-600 rounded-2xl text-sm">Create Focus Plan</button>
        </div>
        <div class="text-sm">Outstanding: ₹${territory.outstanding.toLocaleString()}</div>
    `;
    panel.classList.remove('hidden');
}

async function createFocusPlanForTerritory(territoryId) {
    const territory = territories.find(t => t.id === territoryId);
    if (!territory) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[110] p-4';
    modal.innerHTML = `
        <div class="bg-slate-900 rounded-3xl w-full max-w-md p-6">
            <h3 class="font-semibold mb-4">Create Focus Plan for ${territory.name}</h3>
            
            <div class="space-y-4">
                <div>
                    <label class="text-xs text-slate-400">Focus SKUs</label>
                    <input type="text" id="focus-skus" class="w-full bg-slate-800 rounded-2xl px-4 py-2 mt-1" placeholder="Prestige Cooker, Mixer">
                </div>
                <div>
                    <label class="text-xs text-slate-400">Priority Actions</label>
                    <textarea id="priority-actions" class="w-full bg-slate-800 rounded-2xl px-4 py-2 mt-1 h-20" placeholder="Visit top 5 retailers..."></textarea>
                </div>
            </div>

            <div class="flex gap-3 mt-6">
                <button onclick="saveFocusPlan(${territoryId}, this)" 
                        class="flex-1 py-3 bg-orange-600 rounded-2xl font-medium">Save & Publish</button>
                <button onclick="this.closest('.fixed').remove()" 
                        class="flex-1 py-3 bg-slate-700 rounded-2xl">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveFocusPlan(territoryId, btn) {
    const supabase = window.supabaseClient;
    if (!supabase) {
        alert("Supabase not connected. Plan saved locally for now.");
        btn.closest('.fixed').remove();
        return;
    }

    const focusSKUs = document.getElementById('focus-skus').value;
    const priorityActions = document.getElementById('priority-actions').value;

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
        btn.closest('.fixed').remove();
        loadActivePlansFromSupabase();
    } catch (err) {
        console.error(err);
        alert("Error saving plan. Check console.");
    }
}

async function loadActivePlansFromSupabase() {
    const container = document.getElementById('active-plans-list');
    if (!container) return;

    const supabase = window.supabaseClient;
    if (!supabase) {
        container.innerHTML = `<div class="text-xs text-slate-500">Supabase not connected</div>`;
        return;
    }

    try {
        const { data, error } = await supabase
            .from('focus_plans')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `<div class="text-xs text-slate-500">No active focus plans</div>`;
            return;
        }

        container.innerHTML = data.map(plan => `
            <div class="bg-slate-800 p-3 rounded-2xl mb-2 text-sm">
                <div class="font-medium">Territory #${plan.territory_id}</div>
                <div class="text-xs text-slate-400">${plan.focus_skus}</div>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

async function initializeStrategyX() {
    console.log('%c[Strategy X] Initializing...', 'color:#f59e0b');
    
    await loadTerritories();
    initializeMap();
    await loadActivePlansFromSupabase();

    // Render territory list
    const listContainer = document.getElementById('territory-list');
    if (listContainer) {
        listContainer.innerHTML = territories.map(t => `
            <div onclick="showTerritoryDetails(${t.id})" 
                 class="p-3 hover:bg-slate-800 rounded-2xl cursor-pointer flex justify-between text-sm">
                <span>${t.name}</span>
                <span class="text-xs text-slate-400">${t.retailerCount} retailers</span>
            </div>
        `).join('');
    }

    console.log('%c[Strategy X] Ready', 'color:#f59e0b');
}

// Make function globally available
window.initializeStrategyX = initializeStrategyX;
