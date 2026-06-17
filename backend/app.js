const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'focus-plans.json');

// Load plans from file
let focusPlans = [];
if (fs.existsSync(DATA_FILE)) {
    try {
        focusPlans = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        console.log(`✅ Loaded ${focusPlans.length} saved plans`);
    } catch (e) {
        console.log("No previous data found.");
    }
}

// Save plans to file
function saveToFile() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(focusPlans, null, 2));
}

// Create Focus Plan
app.post('/focus-plans', (req, res) => {
    const plan = {
        id: 'plan_' + Date.now(),
        created_at: new Date().toISOString(),
        ...req.body
    };
    
    focusPlans.unshift(plan);   // Add to top
    saveToFile();

    console.log("✅ New plan saved:", plan.area);
    res.status(201).json(plan);
});

// Get All Plans
app.get('/focus-plans', (req, res) => {
    res.json(focusPlans);
});

// Get Today's Plan
app.get('/focus-plans/today', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const todayPlans = focusPlans.filter(p => p.plan_date === today);
    res.json(todayPlans);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Drona GPT Backend running on port ${PORT}`);
    console.log(`📁 Data saved in focus-plans.json`);
});
