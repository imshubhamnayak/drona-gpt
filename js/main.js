// ==================== MAIN.JS - CLEAN & POLISHED (RAG + Dynamic Header) ====================

let retailers = [];
let currentContextRetailer = null;

const GROQ_API_KEY = "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";

// ==================== LOAD DATA ====================
async function loadAllData() {
    try {
        const [masterRes, osRes] = await Promise.all([
            fetch('data/retailers-master.json'),
            fetch('data/retailers-outstanding.json')
        ]);

        const masterData = await masterRes.json();
        const osData = await osRes.json();

        retailers = masterData.retailers.map(master => {
            const osInfo = osData.retailers.find(o => o.id === master.id) || {};
            return {
                ...master,
                outstanding: osInfo.outstanding || 0,
                lastPaymentDaysAgo: osInfo.lastPaymentDaysAgo || 12
            };
        });

        console.log(`✅ Loaded ${retailers.length} retailers`);
    } catch (e) {
        console.error("Data load failed", e);
    }
}

// ==================== DYNAMIC HEADER ====================
function updateUserHeader(name, role) {
    const userInfo = document.getElementById('user-info');
    if (!userInfo) return;

    const isAdmin = role === 'Admin' || role === 'Owner';
    userInfo.innerHTML = `
        <div class="flex items-center gap-x-3 bg-slate-800 px-4 py-1.5 rounded-2xl">
            <div class="text-right">
                <div class="font-medium">${name}</div>
                <div class="text-xs ${isAdmin ? 'text-orange-400' : 'text-emerald-400'}">${role}</div>
            </div>
            <div class="w-9 h-9 ${isAdmin ? 'bg-orange-600' : 'bg-emerald-600'} rounded-2xl flex items-center justify-center">
                <i class="fa-solid fa-user text-white"></i>
            </div>
        </div>
    `;
}

// ==================== RAG CHAT ====================
function buildRAGContext(query) {
    const lower = query.toLowerCase();
    const relevant = retailers.filter(r => 
        r.name.toLowerCase().includes(lower) || 
        r.area.toLowerCase().includes(lower) ||
        (r.outstanding && r.outstanding > 10000)
    ).slice(0, 8);

    if (relevant.length === 0) return "";

    let context = "\nRelevant Retailers:\n";
    relevant.forEach(r => {
        context += `• **${r.name}** (${r.area}) → Outstanding: **₹${r.outstanding}** | Last Payment: ${r.lastPaymentDaysAgo} days ago\n`;
    });
    return context;
}

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
                        content: `You are Drona - a practical sales manager. Use simple Hinglish. Be direct. Use **bold**. Always give clear action steps.` 
                    },
                    { role: "user", content: `${context}\n\nQuestion: ${message}` }
                ],
                temperature: 0.7,
                max_tokens: 700
            })
        });

        const data = await res.json();
        return data.choices?.[0]?.message?.content || "Bhai, batao kya scene hai?";
    } catch (e) {
        console.error(e);
        return "Network issue. Try again.";
    }
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    input.value = "";

    const reply = await generateSmartResponse(text);
    addMessage(reply, 'bot');
}

function addMessage(text, sender) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const formatted = text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');

    const div = document.createElement('div');
    div.className = `mb-4 flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
    div.innerHTML = sender === 'user' 
        ? `<div class="bg-orange-600 text-white rounded-3xl px-5 py-3 max-w-[80%]">${formatted}</div>`
        : `<div class="bg-slate-700 text-slate-100 rounded-3xl px-5 py-3 max-w-[80%]">${formatted}</div>`;

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// ==================== TAB SWITCHER ====================
window.switchTab = function(tab) {
    const dronaView = document.getElementById('drona-view');
    const strategyView = document.getElementById('strategy-view');
    const tabDrona = document.getElementById('tab-drona');
    const tabStrategy = document.getElementById('tab-strategy');

    if (tab === 'drona') {
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

        // Initialize Strategy X
        setTimeout(() => {
            if (typeof window.initializeStrategyX === 'function') {
                window.initializeStrategyX();
            }
        }, 150);
    }
};

// ==================== INITIALIZE ====================
async function initializeApp() {
    await loadAllData();
    updateUserHeader('Ramesh', 'Salesman');
    addMessage("Namaste Ramesh! Aaj kya help chahiye? Retailer, plan ya target ke baare mein poochho.", 'bot');
}

window.onload = initializeApp;

// Global Exports
window.sendMessage = sendMessage;
window.switchTab = switchTab;
