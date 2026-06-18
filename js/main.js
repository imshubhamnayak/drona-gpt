// ==================== DRONA GPT - COMPLETE REFACTORED WITH STRONG RAG ====================

let retailers = [];
let currentContextRetailer = null;
let allSKUs = [];

const GROQ_API_KEY = "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";

// Load Retailers
async function loadRetailers() {
    try {
        const res = await fetch('data/retailers.json');
        const data = await res.json();
        retailers = data.retailers || [];
        console.log(`%c✅ Loaded ${retailers.length} retailers for RAG`, 'color:#22c55e');
    } catch (e) {
        console.error("Failed to load retailers", e);
        retailers = [];
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

    // Annual Targets (Apr 2026 - Mar 2027)
    const annualRevenueTarget = 360000000; // ₹3.6 Cr per year
    let totalRevenueYTD = 0;
    let totalPCYTD = 0;
    let totalMGYTD = 0;

    // Current Month (June 2026)
    const monthlyRevenueTarget = 30000000; // ₹3 Cr per month

    allRetailers.forEach(r => {
        totalRevenueYTD += (r.totalSalesThisYear || 0);
        const pc = r.skuSales?.find(s => s.sku.includes("Pressure Cooker"))?.qty || 0;
        const mg = r.skuSales?.find(s => s.sku.includes("Mixer Grinder"))?.qty || 0;
        totalPCYTD += pc;
        totalMGYTD += mg;
    });

    const annualRevProgress = Math.min(100, Math.round((totalRevenueYTD / annualRevenueTarget) * 100));
    const annualPCTarget = 80 * 12 * allRetailers.length;
    const annualMGTarget = 45 * 12 * allRetailers.length;

    let html = `
        <!-- Overall Annual Target -->
        <div class="bg-gradient-to-r from-emerald-900 to-slate-800 border border-emerald-500 rounded-3xl p-6 mb-8">
            <div class="text-emerald-400 font-semibold mb-3">MY ANNUAL TARGET (Apr 2026 - Mar 2027)</div>
            <div class="flex justify-between mb-3">
                <span class="text-xl">Total Revenue</span>
                <span class="text-3xl font-bold">₹${(totalRevenueYTD/10000000).toFixed(1)} Cr / ₹3.6 Cr</span>
            </div>
            <div class="h-4 bg-slate-700 rounded-full overflow-hidden mb-6">
                <div class="h-full bg-emerald-500" style="width: ${annualRevProgress}%"></div>
            </div>
            <div class="grid grid-cols-2 gap-6 text-sm">
                <div>
                    <div class="flex justify-between mb-1">
                        <span>Pressure Cooker 5L</span>
                        <span>${totalPCYTD} / ${annualPCTarget}</span>
                    </div>
                    <div class="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div class="h-full bg-orange-500" style="width: ${Math.min(100, Math.round(totalPCYTD / annualPCTarget * 100))}%"></div>
                    </div>
                </div>
                <div>
                    <div class="flex justify-between mb-1">
                        <span>Mixer Grinder 750W</span>
                        <span>${totalMGYTD} / ${annualMGTarget}</span>
                    </div>
                    <div class="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div class="h-full bg-blue-500" style="width: ${Math.min(100, Math.round(totalMGYTD / annualMGTarget * 100))}%"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Current Month -->
        <div class="bg-slate-800 rounded-3xl p-6 mb-8">
            <div class="flex justify-between items-center mb-4">
                <div class="text-orange-400 font-semibold">CURRENT MONTH (June 2026)</div>
                <div class="text-sm text-slate-400">Monthly Target</div>
            </div>
            <div class="grid grid-cols-3 gap-4">
                <div class="text-center">
                    <div class="text-2xl font-bold">₹2.1 Cr</div>
                    <div class="text-xs text-emerald-400">70% of ₹3 Cr</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold">920</div>
                    <div class="text-xs">Pressure Cooker / 960</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold">510</div>
                    <div class="text-xs">Mixer Grinder / 540</div>
                </div>
            </div>
        </div>

        <!-- Retailer-wise Breakdown -->
        <div class="text-lg font-semibold mb-4">Retailer-wise Progress</div>
        <div class="space-y-6 max-h-[380px] overflow-auto">`;

    allRetailers.forEach(r => {
        const annualRev = r.totalSalesThisYear || 0;
        const annualRevP = Math.min(100, Math.round((annualRev / 180000) * 100)); // ~₹1.8L annual per retailer

        const pcSales = r.skuSales?.find(s => s.sku.includes("Pressure Cooker"))?.qty || 0;
        const mgSales = r.skuSales?.find(s => s.sku.includes("Mixer Grinder"))?.qty || 0;

        html += `
            <div class="bg-slate-800 rounded-3xl p-5">
                <div class="font-medium">${r.name} <span class="text-xs text-slate-400">(${r.area})</span></div>
                
                <div class="mt-4 grid grid-cols-2 gap-6 text-sm">
                    <div>
                        <div class="flex justify-between mb-1">
                            <span>Annual Revenue</span>
                            <span>₹${(annualRev/100000).toFixed(1)}L / ₹1.8L</span>
                        </div>
                        <div class="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                            <div class="h-full bg-emerald-500" style="width: ${annualRevP}%"></div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>PC: ${pcSales}/80</div>
                        <div>MG: ${mgSales}/45</div>
                    </div>
                </div>
            </div>`;
    });

    html += `</div>`;
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
    alert(`Quick View for ${retailer.name}\nOutstanding: ₹${retailer.outstanding}`);
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
