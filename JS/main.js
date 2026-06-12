let currentUser = null;

function login() {
  const input = document.getElementById("loginInput");
  const name = input.value.trim();

  if (!name) {
    alert("Please enter your name");
    return;
  }

  currentUser = name;

  // Hide login screen
  document.getElementById("loginScreen").style.display = "none";
  
  // Show dashboard
  document.getElementById("dashboard").style.display = "block";

  // Update name in header and welcome message
  document.getElementById("userName").textContent = name;
  document.getElementById("displayName").textContent = name;
}

function logout() {
  currentUser = null;

  // Show login screen
  document.getElementById("loginScreen").style.display = "block";
  
  // Hide dashboard + plan
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("planSection").style.display = "none";

  // Clear input
  document.getElementById("loginInput").value = "";
}

function generatePlan() {
  const area = document.getElementById("areaInput").value || "Your Area";
  const target = document.getElementById("targetInput").value || 10;
  const scheme = document.getElementById("schemeInput").value || "current schemes";

  const planHTML = `
    <div style="background:#334155; padding:20px; border-radius:12px; margin-top:15px;">
      <h4 style="margin-top:0;">📍 Area: ${area}</h4>
      <p><strong>Target:</strong> Visit ${target} shops today</p>
      
      <h4>Recommended Approach:</h4>
      <ul style="line-height: 1.8;">
        <li><strong>High Potential Shops</strong> — Focus on ${scheme}</li>
        <li><strong>Regular Shops</strong> — Follow up on pending orders</li>
        <li><strong>New Shops</strong> — Introduce new products & schemes</li>
      </ul>

      <h4>Key Talking Points:</h4>
      <ul>
        <li>Highlight benefits of current schemes</li>
        <li>Ask about last month’s sales feedback</li>
        <li>Collect pending payments if any</li>
      </ul>
    </div>
  `;

  document.getElementById("planContent").innerHTML = planHTML;
  document.getElementById("planSection").style.display = "block";
}

function savePlan() {
  if (!currentUser) return alert("Please login first");
  alert("Plan saved for " + currentUser + " (We'll add backend saving soon)");
}

// Auto-focus on input when page loads
window.onload = function() {
  const input = document.getElementById("loginInput");
  if (input) input.focus();
};
