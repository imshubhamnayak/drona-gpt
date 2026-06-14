// ==================== DRONA GPT - FULL COMPLETE MAIN.JS ====================

let retailers = [];
let currentContextRetailer = null;
let allSKUs = [];

// Sample fallback
const sampleRetailers = [
    { id: 1, name: "Sharma Kirana Store", area: "JP Nagar 1st Phase", outstanding: 24500, paymentStatus: "Overdue 12 days", skuPatterns: [{ sku: "Pressure Cooker 5L", status: "Declining" }] },
    { id: 2, name: "Gupta General Stores", area: "JP Nagar 2nd Phase", outstanding: 8700, paymentStatus: "Good", skuPatterns: [{ sku: "Mixer Grinder", status: "Growing" }] },
    { id: 3, name: "Lakshmi Provision Store", area: "JP Nagar 3rd Phase", outstanding: 15200, paymentStatus: "Overdue", skuPatterns: [{ sku: "Non-Stick Pan", status: "At Risk" }] }
];

// Load Retailers
async function loadRetailers() {
    try {
        const res = await fetch('data/retailers.json');
        const data = await res.json();
        retailers = data.retailers || sampleRetailers;
    } catch (e) {
        retailers = sampleRetailers;
    }
}

// Add Message
function addMessage(text, sender) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = `mb-4 flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
    div.innerHTML = `
        <div class="${sender === 'user' ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-200'} rounded-2xl px-4 py-3 max-w-[75%]">
            ${text}
        </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// RAG Response
async function generateSmartResponse(message) {
    let context = "You are Drona, practical sales coach.\n\n";
    const relevant = retailers.filter(r => 
        r.name.toLowerCase().includes(message.toLowerCase()) || 
        r.area.toLowerCase().includes(message.toLowerCase())
    );

    if (relevant.length > 0) {
        context += `Context: ${relevant[0].name} has ₹${relevant[0].outstanding} outstanding.\n`;
    }

    try {
        const res = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer xai-4UBN0aOmhm1QzLo0wfLvM8Dkw3wtmEfMaj7bN1FluxfK75gtslQJCHBA6RlWdoJ7xLwWTbIgW89TSVQ5'
            },
            body: JSON.stringify({
                model: "grok-beta",
                messages: [
                    { role: "system", content: context },
                    { role: "user", content: message }
                ],
                temperature: 0.7,
                max_tokens: 300
            })
        });

        const data = await res.json();
        return data.choices[0].message.content;
    } catch (e) {
        return "Focus on high-outstanding retailers. Push Pressure Cooker today.";
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

// User Header (Ramesh / Admin)
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

// Tab Switching
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
    }
}

// Target Summary
function showTargetSummary() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4';
    modal.innerHTML = `
        <div class="bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div class="p-6 border-b flex justify-between">
                <h3 class="text-2xl font-bold">My Targets 2026</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-3xl">×</button>
            </div>
            <div class="flex-1 overflow-y-auto p-6" id="target-content"></div>
        </div>
    `;
    document.body.appendChild(modal);
    renderAllRetailers();
}

function renderAllRetailers() {
    const container = document.getElementById('target-content');
    if (!container) return;

    let html = '<div class="space-y-4">';
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
                        <div class="text-xs text-red-400">${r.paymentStatus}</div>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

// SKU Intelligence
function openSKUIntelligence() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4';
    modal.innerHTML = `
        <div class="bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div class="p-6 border-b flex justify-between">
                <h3 class="text-2xl font-bold">SKU Intelligence</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-3xl">×</button>
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

// Show Quick View
function showQuickView(id) {
    const retailer = retailers.find(r => r.id === id);
    if (!retailer) return;
    currentContextRetailer = retailer;
    alert(`Quick View:\n${retailer.name}\nOutstanding: ₹${retailer.outstanding}`);
}

// Initialize
async function initializeApp() {
    console.log("%c[Drona GPT] Initializing...", "color:#22c55e");
    await loadRetailers();

    allSKUs = [
        { name: "Prestige Pressure Cooker 5L", mrp: 2499, ecomPrice: 1899, talkingPoint: "High demand item." },
        { name: "Prestige Mixer Grinder", mrp: 4299, ecomPrice: 3199, talkingPoint: "Push combo offer." }
    ];

    addMessage("Hi Ramesh! How can I help you today?", 'bot');
    console.log("%c✅ Ready", "color:lime");
}

window.onload = initializeApp;

// Expose all functions
window.sendMessage = sendMessage;
window.showTargetSummary = showTargetSummary;
window.openSKUIntelligence = openSKUIntelligence;
window.switchTab = switchTab;
window.showQuickView = showQuickView;
