let currentUser = null;

function login() {
  const name = document.getElementById("loginInput").value.trim();
  if (!name) return alert("Please enter your name");

  currentUser = name;
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("displayName").textContent = name;
  document.getElementById("userName").textContent = name;
}

function logout() {
  currentUser = null;
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("loginScreen").style.display = "block";
  document.getElementById("planSection").style.display = "none";
}

function generatePlan() {
  const area = document.getElementById("areaInput").value || "Your Area";
  const target = document.getElementById("targetInput").value || 10;
  const scheme = document.getElementById("schemeInput").value;

  const planHTML = `
    <div style="background:#334155; padding:20px; border-radius:12px; margin-top:15px;">
      <h4 style="margin-top:0;">📍 Area: ${area}</h4>
      <p><strong>Target:</strong> Visit ${target} shops today</p>
      
      <h4>Recommended Shops & Approach:</h4>
      <ul style="line-height: 1.8;">
        <li><strong>Shop 1 (High Potential)</strong> — Focus on ${scheme || "new schemes"}</li>
        <li><strong>Shop 2</strong> — Follow up on pending orders</li>
        <li><strong>Shop 3</strong> — Introduce new products</li>
        <li><strong>Remaining shops</strong> — Regular coverage + relationship building</li>
      </ul>

      <h4>Key Talking Points:</h4>
      <ul>
        <li>Highlight benefits of current schemes</li>
        <li>Ask about last month's sales feedback</li>
        <li>Collect pending payments if any</li>
      </ul>
    </div>
  `;

  document.getElementById("planContent").innerHTML = planHTML;
  document.getElementById("planSection").style.display = "block";
}

function savePlan() {
  alert("Plan saved successfully! (We'll connect backend later)");
  // Later we will save this to backend
}

function init() {
  // You can add auto-login logic later using localStorage
}

init();
