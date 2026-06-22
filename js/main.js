// ==================== MAIN.JS - POLISHED RAG CHAT + DYNAMIC HEADER ====================

let retailers = [];
let vectorCache = new Map();

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

        console.log(`✅ Loaded ${retailers.length} retailers for RAG & Targets`);
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
// Simple embedding function (keyword + importance scoring)
function createEmbedding(retailer) {
    const text = `${retailer.name} ${retailer.area} ${retailer.outstanding || 0}`.toLowerCase();
    const words = text.split(/\s+/);
    const embedding = {};

    words.forEach(word => {
        if (word.length > 2) {
            embedding[word] = (embedding[word] || 0) + 1;
        }
    });

    // Boost important fields
    if (retailer.outstanding > 20000) embedding['high_outstanding'] = 3;
    if (retailer.monthlyOrders) embedding['regular'] = 2;

    return embedding;
}

// Cosine similarity (simple vector search)
function cosineSimilarity(vec1, vec2) {
    let dot = 0, mag1 = 0, mag2 = 0;
    const allKeys = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);

    allKeys.forEach(key => {
        const v1 = vec1[key] || 0;
        const v2 = vec2[key] || 0;
        dot += v1 * v2;
        mag1 += v1 * v1;
        mag2 += v2 * v2;
    });

    if (mag1 === 0 || mag2 === 0) return 0;
    return dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

// Strong RAG with Vector Search
function buildRAGContext(query) {
    const lowerQuery = query.toLowerCase();
    const queryEmbedding = createEmbedding({ name: lowerQuery, area: lowerQuery });

    // Score all retailers
    const scored = retailers.map(r => {
        const emb = vectorCache.get(r.id) || createEmbedding(r);
        if (!vectorCache.has(r.id)) vectorCache.set(r.id, emb);

        const similarity = cosineSimilarity(queryEmbedding, emb);
        const outstandingBoost = (r.outstanding || 0) > 15000 ? 0.3 : 0;

        return {
            retailer: r,
            score: similarity + outstandingBoost
        };
    });

    // Top 6 most relevant
    const topRetailers = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map(item => item.retailer);

    if (topRetailers.length === 0) return "";

    let context = "\n📊 Relevant Retailer Context:\n";
    topRetailers.forEach(r => {
        context += `• **${r.name}** (${r.area}) → Outstanding: **₹${r.outstanding}** | Last Payment: ${r.lastPaymentDaysAgo} days ago\n`;
    });

    return context;
}

// Updated Chat Function
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
                        content: `You are Drona - a sharp sales manager. Use simple Hinglish. Be direct. Use **bold**. Give clear next actions.` 
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
        }, 100);
    }
};

// ==================== INITIALIZE ====================
async function initializeApp() {
    await loadAllData();
    updateUserHeader('Ramesh', 'Salesman');
    addMessage("Namaste Ramesh! Aaj kya help chahiye? Retailer, target ya plan ke baare mein poochho.", 'bot');
}

window.onload = initializeApp;

// Exports
window.sendMessage = sendMessage;
window.switchTab = switchTab;
