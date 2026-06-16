const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let focusPlans = [];   // In-memory for now. Later we'll use PostgreSQL

// Create Focus Plan
app.post('/focus-plans', (req, res) => {
    const plan = {
        id: 'plan_' + Date.now(),
        ...req.body,
        created_at: new Date().toISOString()
    };
    focusPlans.unshift(plan);   // Add to top
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
    console.log(`✅ Backend running on port ${PORT}`);
});
