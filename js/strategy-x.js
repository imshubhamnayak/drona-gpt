// ==================== STRATEGY X (Owner Mode) ====================
let territories = [];
let map = null;
let territoryLayers = {};
let activePlans = [];

// Load territories
async function loadTerritories() {
    try {
        const res = await fetch('data/territories.json');
        territories = await res.json();
    } catch (e) {
        console.error("Failed to load territories.json", e);
        territories = [];
    }
}

// Initialize Map
function initializeMap() {
    const container = document.getElementById('strategy-map');
    if (!container) return;

    if (map) map.remove();

    map = L.map('strategy-map').setView([12.912, 77.58], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    addTerritoriesToMap();
    renderTerritoryList();
    loadActivePlansFromSupabase();
}

function addTerritoriesToMap() {
    territories.forEach(t => {
        const color = getTerritoryColor(t);
        const radius = Math.max(t.retailerCount * 50, 300);

        const circle = L.circle([t.lat, t.lng], {
            color, fillColor: color, fillOpacity: 0.55, radius, weight: 2
        }).addTo(map);

        territoryLayers[t.id] = circle;

        circle.on('click', () => {
            showTerritoryDetails(t);
            highlightTerritoryInList(t.id);
        });

        circle.bindTooltip(`<strong>${t.name}</strong><br>${t.retailerCount} retailers`);
    });
}

function getTerritoryColor(t) {
    const score = (t.outstanding / 100000) + (t.decliningSKUs * 2);
    if (score > 5) return '#ef4444';
    if (score > 3.2) return '#f59e0b';
    return '#22c55e';
}

function renderTerritoryList() {
    const container = document.getElementById('territory-list');
    if (!container) return;
    container.innerHTML = '';

    territories.forEach(t => {
        const div = document.createElement('div');
        div.className = `territory-list-item flex justify-between items-center p-3 rounded-2xl cursor-pointer hover:bg-slate-800`;
        div.dataset.id = t.id;

        div.innerHTML = `
            <div>
                <div class="font-medium">${t.name}</div>
                <div class="text-xs text-slate-400">${t.retailerCount} retailers</div>
            </div>
            <div class="text-right">
                <div class="text-sm font-mono">₹${(t.outstanding/100000).toFixed(1)}L</div>
                <div class="text-xs text-orange-400">${t.decliningSKUs} declining</div>
            </div>
        `;
        div.onclick = () => {
            showTerritoryDetails(t);
            highlightTerritoryInList(t.id);
        };
        container.appendChild(div);
    });
}

function highlightTerritoryInList(id) {
    document.querySelectorAll('.territory-list-item').forEach(el => {
        el.classList.remove('bg-slate-700');
        if (el.dataset.id === id) el.classList.add('bg-slate-700');
    });
}

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
                <button onclick="closeTerritoryPanel()" class="text-2xl text-slate-400 hover:text-white">×</button>
            </div>

            <div class="space-y-3">
                <div class="bg-slate-800 rounded-2xl p-4">
                    <div class="text-xs text-slate-400">OUTSTANDING</div>
                    <div class="text-3xl font-semibold">₹${(territory.outstanding/100000).toFixed(1)}L</div>
                </div>
                <div class="bg-slate-800 rounded-2xl p-4">
                    <div class="text-xs text-slate-400">DECLINING SKUs</div>
                    <div class="text-3xl font-semibold text-orange-400">${territory.decliningSKUs}</div>
                </div>
            </div>

            <button onclick="createFocusPlanForTerritory('${territory.id}')"
                    class="mt-5 w-full bg-orange-600 hover:bg-orange-500 py-3 rounded-2xl font-medium">
                Create Focus Plan
            </button>
        </div>
    `;
    panel.classList.remove('hidden');
}

function closeTerritoryPanel() {
    document.getElementById('territory-details-panel')?.classList.add('hidden');
}

// ==================== CREATE FOCUS PLAN (Owner Mode) ====================
function createFocusPlanForTerritory(territoryId) {
    closeTerritoryPanel();

    const modal = document.createElement('div');
    modal.className = `fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]`;

    modal.innerHTML = `
        <div class="bg-slate-900 border border-slate-700 w-full max-w-md mx-4 rounded-3xl p-6">
            <h3 class="text-xl font-semibold mb-4">Create Focus Plan <span class="text-xs text-orange-400">(Owner)</span></h3>
            
            <div class="space-y-4">
                <div>
                    <label class="text-sm text-slate-400">Period</label>
                    <select id="plan-period" class="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2 mt-1">
                        <option value="Week">This Week</option>
                        <option value="Month">This Month</option>
                    </select>
                </div>

                <div>
                    <label class="text-sm text-slate-400">Focus SKUs</label>
                    <input id="focus-skus" type="text" placeholder="Pressure Cooker 5L, Air Fryer 4L" 
                           class="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2 mt-1">
                </div>

                <div>
                    <label class="text-sm text-slate-400">Priority Actions</label>
                    <div class="mt-2 space-y-2 text-sm">
                        <label class="flex items-center gap-x-2"><input type="checkbox" value="Payment Collection" checked> Payment Collection</label>
                        <label class="flex items-center gap-x-2"><input type="checkbox" value="New SKU Push" checked> New SKU Push</label>
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
                <button onclick="saveFocusPlan('${territoryId}', this)" class="flex-1 py-3 bg-orange-600 hover:bg-orange-500 rounded-2xl font-medium">Publish Plan</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Save to Supabase (Owner)
async function saveFocusPlan(territoryId, btn) {
    const modal = btn.closest('.fixed');
    const supabase = window.supabaseClient;

    if (!supabase) {
        alert("Supabase is not connected. Please refresh the page.");
        modal.remove();
        return;
    }

    const period = document.getElementById('plan-period').value;
    const focusSKUs = document.getElementById('focus-skus').value.split(',').map(s => s.trim()).filter(Boolean);
    const notes = document.getElementById('plan-notes').value;

    const checked = modal.querySelectorAll('input[type="checkbox"]:checked');
    const priorityActions = Array.from(checked).map(cb => cb.value);

    const { error } = await supabase.from('focus_plans').insert([{
        period,
        focus_skus: focusSKUs,
        priority_actions: priorityActions,
        territories: [territoryId],
        notes,
        created_by: 'owner',
        active: true
    }]);

    modal.remove();

    if (error) {
        alert("Failed to save plan: " + error.message);
        console.error(error);
    } else {
        alert("Focus Plan published successfully!");
        loadActivePlansFromSupabase();
    }
}

// Load plans from Supabase
async function loadActivePlansFromSupabase() {
    const container = document.getElementById('active-plans-list');
    if (!container) return;

    const supabase = window.supabaseClient;
    if (!supabase) {
        container.innerHTML = `<p class="text-red-400 text-sm">Supabase not connected</p>`;
        return;
    }

    const { data, error } = await supabase
        .from('focus_plans')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        container.innerHTML = `<p class="text-red-400 text-sm">Failed to load plans</p>`;
        return;
    }

    activePlans = data || [];

    if (activePlans.length === 0) {
        container.innerHTML = `<p class="text-slate-400 text-sm">No active focus plans yet.</p>`;
        return;
    }

    let html = '';
    activePlans.forEach(plan => {
        const t = territories.find(x => x.id === plan.territories?.[0]);
        html += `
            <div class="bg-slate-800 rounded-2xl p-4 mb-3 text-sm">
                <div class="font-medium flex justify-between">
                    <span>${plan.period} Focus Plan</span>
                    <span class="text-xs text-orange-400">Owner</span>
                </div>
                <div class="text-xs text-slate-400">${new Date(plan.created_at).toLocaleDateString()}</div>
                <div class="mt-2">Focus: ${plan.focus_skus?.join(', ') || '—'}</div>
                ${t ? `<div class="text-xs text-slate-400 mt-1">${t.name}</div>` : ''}
            </div>
        `;
    });
    container.innerHTML = html;
}

// Main init for Strategy X (automatically Owner)
async function initializeStrategyX() {
    console.log('%c[Strategy X] Running in Owner Mode', 'color:#f59e0b');
    await loadTerritories();
    initializeMap();
}

window.initializeStrategyX = initializeStrategyX;
