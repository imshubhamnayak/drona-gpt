let retailers = [];
let currentContextRetailer = null;

async function loadRetailers() {
    const res = await fetch('data/retailers.json');
    retailers = await res.json();
}

function initializeApp() {
    loadRetailers().then(() => {
        // Welcome message
        const container = document.getElementById('chat-messages');
        container.innerHTML = `
            <div class="flex justify-start">
                <div class="max-w-[80%] px-4 py-3 rounded-3xl bg-slate-800">
                    Hi Ramesh! I'm Drona GPT for TTK Prestige.<br>
                    I can help with retailer details, payment status, SKU patterns, targets & sampling.<br><br>
                    Try searching for a retailer or ask: <span class="text-orange-400">"Which retailers are behind on payment?"</span>
                </div>
            </div>
        `;
    });
}

// Chat functions
function addMessage(text, isUser = false) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;
    
    const bubble = document.createElement('div');
    bubble.className = `max-w-[80%] px-4 py-3 rounded-3xl text-sm ${isUser ? 'message-user text-white' : 'bg-slate-800'}`;
    bubble.innerHTML = text;
    
    div.appendChild(bubble);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, true);
    input.value = '';

    setTimeout(() => {
        const response = generateSmartResponse(text);
        addMessage(response);
    }, 500);
}

function generateSmartResponse(query) {
    const q = query.toLowerCase();
    
    if (currentContextRetailer) {
        const r = currentContextRetailer;
        if (q.includes("payment") || q.includes("outstanding")) {
            return `For <strong>${r.name}</strong>: Outstanding ₹${r.outstanding.toLocaleString()}. Aging: 0-7: ₹${r.paymentAging["0-7"]}, 8-15: ₹${r.paymentAging["8-15"]}`;
        }
        if (q.includes("pattern") || q.includes("sku")) {
            let html = `SKU Patterns for <strong>${r.name}</strong>:<br>`;
            r.skuPatterns.forEach(p => {
                html += `• <strong>${p.sku}</strong> — <span class="status-${p.status.toLowerCase()} px-2 py-0.5 rounded text-xs">${p.status}</span> (${p.insight})<br>`;
            });
            return html;
        }
    }
    
    if (q.includes("behind on payment")) {
        const behind = retailers.filter(r => r.outstanding > 15000).map(r => r.name);
        return `Retailers with high outstanding: ${behind.join(", ")}`;
    }
    
    return "I can help with retailer details, payment status, SKU patterns, targets, and sampling. Try asking about a specific retailer.";
}

// Retailer Search + Quick View
function openRetailerSearch() {
    // Modal logic here (you can expand this)
    alert("Search modal will open here. (Full implementation in next iteration)");
}

function showQuickView(retailer) {
    // Full Quick View modal with Payment, SKU Patterns, Recent Orders, etc.
    console.log("Showing Quick View for:", retailer.name);
    // You can implement the modal HTML dynamically here
}

// Initialize
window.onload = initializeApp;
