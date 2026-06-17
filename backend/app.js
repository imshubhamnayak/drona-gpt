const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PLANS_FILE = path.join(__dirname, 'focus-plans.json');
const TARGETS_FILE = path.join(__dirname, 'targets.json');

// Load Focus Plans
let focusPlans = [];
if (fs.existsSync(PLANS_FILE)) {
    try {
        focusPlans = JSON.parse(fs.readFileSync(PLANS_FILE, 'utf8'));
    } catch (e) {}
}

// Load Targets
let targets = [];
if (fs.existsSync(TARGETS_FILE)) {
    try {
        targets = JSON.parse(fs.readFileSync(TARGETS_FILE, 'utf8'));
    } catch (e) {}
}

// Save Functions
function savePlans() {
    fs.writeFileSync(PLANS_FILE, JSON.stringify(focusPlans, null, 2));
}

function saveTargets() {
    fs.writeFileSync(TARGETS_FILE, JSON.stringify(targets, null, 2));
}

// ==================== FOCUS PLANS ====================

// Create / Update Focus Plan (One per day)
app.post('/focus-plans', (req, res) => {
    const newPlan = {
        id: 'plan_' + Date.now(),
        created_at: new Date().toISOString(),
        ...req.body
    };

    const existingIndex = focusPlans.findIndex(p => p.plan_date === newPlan.plan_date);

    if (existingIndex !== -1) {
        focusPlans[existingIndex] = newPlan;
    } else {
        focusPlans.unshift(newPlan);
    }

    savePlans();
    res.status(201).json(newPlan);
});

// Get All Focus Plans
app.get('/focus-plans', (req, res) => {
    res.json(focusPlans);
});

// Get Today's Focus Plan
app.get('/focus-plans/today', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const todayPlans = focusPlans.filter(p => p.plan_date === today);
    res.json(todayPlans);
});

// Delete Focus Plan
app.delete('/focus-plans/:id', (req, res) => {
    const planId = req.params.id;
    const initialLength = focusPlans.length;
    focusPlans = focusPlans.filter(p => p.id !== planId);

    if (focusPlans.length < initialLength) {
        savePlans();
        res.json({ message: "Plan deleted" });
    } else {
        res.status(404).json({ message: "Plan not found" });
    }
});

// ==================== TARGETS ====================

// Create Target
app.post('/targets', (req, res) => {
    const newTarget = {
        id: 'target_' + Date.now(),
        createdAt: new Date().toISOString(),
        currentValue: 0,
        status: "On Track",
        ...req.body
    };

    targets.unshift(newTarget);
    saveTargets();
    res.status(201).json(newTarget);
});

// Get All Targets
app.get('/targets', (req, res) => {
    res.json(targets);
});

// Delete Target
app.delete('/targets/:id', (req, res) => {
    const targetId = req.params.id;
    const initialLength = targets.length;
    targets = targets.filter(t => t.id !== targetId);

    if (targets.length < initialLength) {
        saveTargets();
        res.json({ message: "Target deleted" });
    } else {
        res.status(404).json({ message: "Target not found" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Drona GPT Backend running on port ${PORT}`);
    console.log(`📁 Data saved in focus-plans.json and targets.json`);
});
