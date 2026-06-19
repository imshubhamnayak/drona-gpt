// ==================== DRONA GPT - COMPLETE REFACTORED WITH STRONG RAG ====================

let retailers = [];           // Full merged retailer data
let transactions = [];
let currentContextRetailer = null;
let allSKUs = [];

const GROQ_API_KEY = "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";

// Load Retailers
async function loadRetailers() {
    try {
        const [masterRes, osRes, transRes] = await Promise.all([
            fetch('data/retailers-master.json'),
            fetch('data/retailers-outstanding.json'),
            fetch('data/tally-transactions.json')
        ]);

        const masterData = await masterRes.json();
        const osData = await osRes.json();
        const transData = await transRes.json();

        transactions = transData.transactions || [];

        retailers = masterData.retailers.map(master => {
            const osInfo = osData.retailers.find(o => o.id === master.id) || {};
            return {
                ...master,
                outstanding: osInfo.outstanding || 0,
                lastPaymentDaysAgo: osInfo.lastPaymentDaysAgo || 15,
                lastVisitDaysAgo: Math.floor(Math.random() * 20),
                monthlyOrders: Math.random() > 0.4,
                paymentTrend: Math.random() > 0.5 ? "85% on time" : "65% on time"
            };
        });

        console.log(`✅ Loaded ${retailers.length} retailers`);
    } catch (e) {
        console.error("Data load failed", e);
    }
}

// Dynamic Greeting
function setDynamicGreeting() {
    const hour = new Date().getHours();
    let main = "", sub = "";

    if (hour >= 5 && hour < 12) {
        main = "Good morning, Ramesh";
        sub = "Ready for today's field visits?";
    } else if (hour >= 12 && hour < 17) {
        main = "Good afternoon, Ramesh";
        sub = "Let me help you with anything you need!";
    } else {
        main = "Good evening, Ramesh";
        sub = "Check Today's plan to ensure everything is taken care of";
    }

    document.getElementById('greeting-main').textContent = main;
    document.getElementById('greeting-sub').textContent = sub;
}

// Improved Add Message - Supports **bold** formatting
function addMessage(text, sender) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    // Convert **bold** to <b> tags
    let formattedText = text
        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')     // **bold text**
        .replace(/\n/g, '<br>');                    // Line breaks

    const div = document.createElement('div');
    div.className = `mb-4 flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;

    if (sender === 'user') {
        div.innerHTML = `
            <div class="bg-orange-600 text-white rounded-3xl px-5 py-3 max-w-[80%]">
                ${formattedText}
            </div>
        `;
    } else {
        // Assistant message - darker background, better readability
        div.innerHTML = `
            <div class="bg-slate-700 text-slate-100 rounded-3xl px-5 py-3 max-w-[80%] leading-relaxed">
                ${formattedText}
            </div>
        `;
    }

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// Strong RAG Context
function buildRAGContext(query) {
    const lowerQuery = query.toLowerCase();
    const relevant = retailers.filter(r => 
        r.name.toLowerCase().includes(lowerQuery) || 
        r.area.toLowerCase().includes(lowerQuery) ||
        (r.outstanding && r.outstanding > 10000)
    ).slice(0, 6);

    if (relevant.length === 0) return "";

    let context = "\nRelevant Retailers:\n";
    relevant.forEach(r => {
        context += `- ${r.name} (${r.area}): ₹${r.outstanding || 0} outstanding, Last visit: ${r.lastVisitDaysAgo || 'N/A'} days ago\n`;
    });
    return context;
}

// Generate Smart Response - Clean Hinglish + Bold Formatting
async function generateSmartResponse(message) {
    const context = buildRAGContext(message);

    try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: `You are Drona - a simple and practical sales coach for field salesmen in India.

Rules:
- Use simple Hinglish (easy Hindi + English)
- Keep responses short and clear
- Use **bold** for important words like **Pressure Cooker**, **outstanding**, **jaao**, **payment**
- Always use bullet points (•)
- Give clear action steps for TODAY
- End with one short question

Example response style:
Bhai Ramesh,

**Raju Kirana** ka outstanding **₹60,024** hai. Last visit 7 din pehle hua tha.

Aaj kya karna chahiye:
• **Raju Kirana** jaao
• Owner se milo aur **payment** collect karo
• **Pressure Cooker** scheme dikhao
• Naya order lene ki baat karo

Kya aaj ja rahe ho?

${context}` 
                    },
                    { role: "user", content: message }
                ],
                temperature: 0.7,
                max_tokens: 600
            })
        });

        if (!res.ok) throw new Error(`API Error ${res.status}`);

        const data = await res.json();
        return data.choices?.[0]?.message?.content || "Bhai, aaj kya plan hai?";

    } catch (e) {
        console.error("Groq API Error:", e);
        return "Bhai, aaj high outstanding wale retailers pe focus karo. **Pressure Cooker** push karo.";
    }
}
// Send Message
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    input.value = "";

    const typing = document.createElement('div');
    typing.className = "flex justify-start mb-4";
    typing.innerHTML = `<div class="bg-slate-700 rounded-2xl px-4 py-3">Drona is thinking...</div>`;
    document.getElementById('chat-messages').appendChild(typing);

    const reply = await generateSmartResponse(text);
    typing.remove();
    addMessage(reply, 'bot');
}

// ==================== YOUR ORIGINAL FUNCTIONS ====================

function updateUserHeader(name, role) {
    const userInfo = document.getElementById('user-info');
    if (!userInfo) return;

    const isAdmin = role === 'Owner' || role === 'Admin';
    userInfo.innerHTML = `
        <div class="flex items-center gap-x-3 bg-slate-800 px-4 py-1.5 rounded-2xl">
            <div class="text-right">
                <div class="font-medium">${name}</div>
                <div class="text-xs ${isAdmin ? 'text-orange-400' : 'text-blue-400'}">${role}</div>
            </div>
            <div class="w-9 h-9 ${isAdmin ? 'bg-orange-600' : 'bg-blue-600'} rounded-2xl flex items-center justify-center">
                <i class="fa-solid fa-user text-white text-sm"></i>
            </div>
        </div>
    `;
}

function switchTab(tab) {
    const dronaView = document.getElementById('drona-gpt-view');
    const strategyView = document.getElementById('strategy-x-view');
    const tabDrona = document.getElementById('tab-drona-gpt');
    const tabStrategy = document.getElementById('tab-strategy-x');

    if (tab === 'drona-gpt') {
        dronaView.classList.remove('hidden');
        strategyView.classList.add('hidden');
        tabDrona.classList.add('tab-active');
        tabStrategy.classList.remove('tab-active');
        updateUserHeader('Ramesh', 'Salesman');
    } else {
        dronaView.classList.add('hidden');
        strategyView.classList.remove('hidden');
        tabDrona.classList.remove('tab-active');
        tabStrategy.classList.add('tab-active');
        updateUserHeader('Admin', 'Owner');
           // Initialize Strategy X when switching
        if (window.initializeStrategyX && !window.strategyXInitialized) {
            setTimeout(() => {
                window.initializeStrategyX();
                window.strategyXInitialized = true;
            }, 300);
        }
    }
}

function openRetailerSearch() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4';
    modal.innerHTML = `
        <div class="bg-slate-900 rounded-3xl w-full max-w-md p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-semibold text-lg">Search Retailer</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <input type="text" id="retailer-search-input" placeholder="Type retailer name..." 
                   class="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 mb-4 focus:outline-none" 
                   onkeyup="filterRetailers(this.value)">
            <div id="retailer-search-results" class="max-h-80 overflow-y-auto space-y-2"></div>
        </div>
    `;
    document.body.appendChild(modal);
    filterRetailers('');
}

function filterRetailers(query) {
    const container = document.getElementById('retailer-search-results');
    if (!container) return;

    const filtered = retailers.filter(r => 
        r.name.toLowerCase().includes(query.toLowerCase()) || 
        r.area.toLowerCase().includes(query.toLowerCase())
    );

    container.innerHTML = filtered.map(r => `
        <div onclick="showQuickView(${r.id}); this.closest('.fixed').remove();" 
             class="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl cursor-pointer flex justify-between items-center">
            <div>
                <div class="font-medium">${r.name}</div>
                <div class="text-xs text-slate-400">${r.area}</div>
            </div>
            <i class="fa-solid fa-chevron-right text-slate-500"></i>
        </div>
    `).join('');
}

// ==================== MY TARGETS - SALESMAN VIEW (Ramesh) ====================
async function showMyTargets() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[10000]';
    modal.innerHTML = `
        <div class="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
            <div class="p-6 border-b border-slate-700">
                <h2 class="text-2xl font-bold">My Monthly Targets</h2>
                <p class="text-slate-400 mt-1">June 2026 • Progress Overview</p>
            </div>
            
            <div id="my-targets-content" class="flex-1 overflow-auto p-6 space-y-6">
                <!-- Filled by JS -->
            </div>
            
            <div class="p-6 border-t border-slate-700">
                <button onclick="this.closest('.fixed').remove()" 
                        class="w-full py-4 bg-slate-700 hover:bg-slate-600 rounded-2xl font-medium">
                    Close
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    await renderMyTargets();
}

async function renderMyTargets() {
    const container = document.getElementById('my-targets-content');
    if (!container) return;

    let totalRevenue = retailers.reduce((sum, r) => sum + (r.totalSalesThisYear || 0), 0);

    let html = `
        <div class="space-y-8">
            <div class="bg-gradient-to-r from-emerald-900 to-slate-800 border border-emerald-500 rounded-3xl p-6">
                <div class="text-emerald-400 font-semibold">MONTHLY TARGET</div>
                <div class="text-3xl font-bold">₹${(totalRevenue/10000000).toFixed(1)} Cr / ₹3 Cr</div>
            </div>
            <div class="text-lg font-semibold">Retailer Progress</div>
            <div class="space-y-4">`;

    retailers.forEach(r => {
        html += `
            <div class="bg-slate-800 p-4 rounded-2xl">
                <div>${r.name} (${r.area})</div>
                <div class="text-orange-400">Outstanding: ₹${(r.outstanding || 0).toLocaleString()}</div>
            </div>`;
    });

    html += `</div></div>`;
    container.innerHTML = html;
}
// Add this Quick Action Button in your HTML (Drona GPT view)

function renderAllRetailers() {
    const container = document.getElementById('retailer-target-list');
    if (!container) return;

    let html = '';
    retailers.forEach(r => {
        html += `
            <div onclick="showQuickView(${r.id}); this.closest('.fixed').remove()" class="bg-slate-800 p-4 rounded-2xl cursor-pointer hover:bg-slate-700">
                <div class="flex justify-between">
                    <div>
                        <div class="font-medium">${r.name}</div>
                        <div class="text-xs text-slate-400">${r.area}</div>
                    </div>
                    <div class="text-right">
                        <div class="font-semibold">₹${r.outstanding}</div>
                        <div class="text-xs text-red-400">${r.paymentStatus || ''}</div>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function openSKUIntelligence() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4';
    modal.innerHTML = `
        <div class="bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div class="p-6 border-b flex justify-between">
                <h3 class="text-2xl font-bold">SKU Intelligence</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-3xl text-slate-400">×</button>
            </div>
            <div class="flex-1 overflow-y-auto p-6" id="sku-list"></div>
        </div>
    `;
    document.body.appendChild(modal);
    renderSKUs();
}

function renderSKUs() {
    const container = document.getElementById('sku-list');
    if (!container) return;

    let html = '';
    allSKUs.forEach(sku => {
        html += `
            <div class="bg-slate-800 p-5 rounded-3xl mb-4">
                <div class="font-semibold">${sku.name}</div>
                <div class="text-sm text-emerald-400">MRP ₹${sku.mrp} | Online ₹${sku.ecomPrice}</div>
                <div class="text-xs text-slate-400 mt-2">${sku.talkingPoint}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function showQuickView(id) {
    const retailer = retailers.find(r => r.id === id);
    if (!retailer) return;
    currentContextRetailer = retailer;
    switchTab('drona-gpt');
    addMessage(`Selected **${retailer.name}**. Outstanding: ₹${retailer.outstanding}. Kya help chahiye?`, 'bot');
}

// Show Today's Plan from Backend (for Ramesh)
async function showPublishedPlan() {
    const today = new Date().toISOString().split('T')[0];

    try {
        const res = await fetch(`${BACKEND_URL}/focus-plans/today`);
        const plans = await res.json();

        if (plans.length === 0) {
            alert("No plan published for today yet.");
            return;
        }

        const plan = plans[0]; // Show the latest plan for today

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4';
        modal.innerHTML = `
            <div class="bg-slate-900 rounded-3xl w-full max-w-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-semibold text-xl">Today's Focus Plan</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-2xl">×</button>
                </div>

                <div class="bg-slate-800 rounded-2xl p-5 mb-6">
                    <div class="text-emerald-400 text-sm mb-2">📅 ${plan.plan_date}</div>
                    <div class="text-lg font-medium">${plan.territories?.[0] || plan.area}</div>
                    <div class="text-xs text-slate-400 mt-1">${plan.totalRetailers || '?'} retailers</div>
                </div>

                <div class="space-y-4 mb-6">
                    <div class="bg-slate-800 p-4 rounded-2xl">
                        <div class="font-medium mb-2">Priority Actions</div>
                        <ul class="text-sm text-slate-300 space-y-1">
                            ${plan.priority_actions.map(a => `<li>• ${a}</li>`).join('')}
                        </ul>
                    </div>
                </div>

                <button onclick="this.closest('.fixed').remove()" 
                        class="w-full py-4 bg-orange-600 hover:bg-orange-500 rounded-2xl font-medium">
                    Got it, I'll follow this plan
                </button>
            </div>
        `;
        document.body.appendChild(modal);

    } catch (err) {
        console.error(err);
        alert("No plan found for today or backend not reachable.");
    }
}

// Initialize
async function initializeApp() {
    console.log("%c[Drona GPT] Initializing with Strong RAG...", "color:#22c55e");
    
    await loadRetailers();

    allSKUs = [
        { name: "Prestige Pressure Cooker 5L", mrp: 2499, ecomPrice: 1899, talkingPoint: "High demand item." },
        { name: "Prestige Mixer Grinder", mrp: 4299, ecomPrice: 3199, talkingPoint: "Push combo offer." }
    ];

    setDynamicGreeting();
    addMessage("Hi Ramesh! I'm Drona GPT. How can I help you today? Ask about any retailer, SKU, or plan.", 'bot');
    
    updateUserHeader('Ramesh', 'Salesman');
    
    console.log("%c✅ Drona GPT Ready with Strong RAG", "color:lime");
}

window.onload = initializeApp;

// Global functions

window.showMyTargets = showMyTargets;
window.sendMessage = sendMessage;
window.showTargetSummary = showTargetSummary;
window.openSKUIntelligence = openSKUIntelligence;
window.switchTab = switchTab;
window.showQuickView = showQuickView;
window.showPublishedPlan = showPublishedPlan;
