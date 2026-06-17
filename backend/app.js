const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'focus-plans.json');

// Load plans
let focusPlans = [];
if (fs.existsSync(DATA_FILE)) {
    try {
        focusPlans = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {}
}

// Save to file
function saveToFile() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(focusPlans, null, 2));
}

// Create / Update Plan (One per day)
app.post('/focus-plans', (req, res) => {
    const newPlan = {
        id: 'plan_' + Date.now(),
        created_at: new Date().toISOString(),
        ...req.body
    };

    // Check if plan for same date exists
    const existingIndex = focusPlans.findIndex(p => p.plan_date === newPlan.plan_date);

    if (existingIndex !== -1) {
        focusPlans[existingIndex] = newPlan;
    } else {
        focusPlans.unshift(newPlan);
    }

    saveToFile();
    res.status(201).json(newPlan);
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

// **DELETE Plan**
app.delete('/focus-plans/:id', (req, res) => {
    const planId = req.params.id;
    const initialLength = focusPlans.length;

    focusPlans = focusPlans.filter(p => p.id !== planId);

    if (focusPlans.length < initialLength) {
        saveToFile();
        res.json({ message: "Plan deleted" });
    } else {
        res.status(404).json({ message: "Plan not found" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Backend running on port ${PORT}`);
});
