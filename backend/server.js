require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { pool, initDb } = require('./db');
const { startEngine } = require('./engine');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Database
initDb();

// --- API ROUTES ---

// Get all workflows
app.get('/api/workflows', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM workflows ORDER BY created_at DESC');
        const workflows = result.rows.map(wf => ({
            ...wf,
            trigger_config: wf.trigger_config ? JSON.parse(wf.trigger_config) : {},
            action_config: wf.action_config ? JSON.parse(wf.action_config) : {},
            active: Boolean(wf.active)
        }));
        res.json({ workflows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create workflow
app.post('/api/workflows', async (req, res) => {
    try {
        const { title, trigger_type, trigger_config, action_type, action_config, active } = req.body;

        const result = await pool.query(`
            INSERT INTO workflows (title, trigger_type, trigger_config, action_type, action_config, active)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [
            title,
            trigger_type,
            JSON.stringify(trigger_config || {}),
            action_type,
            JSON.stringify(action_config || {}),
            active
        ]);

        res.json({ id: result.rows[0].id, success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete workflow
app.delete('/api/workflows/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM workflows WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle workflow active status
app.put('/api/workflows/:id/toggle', async (req, res) => {
    try {
        const { active } = req.body;
        await pool.query('UPDATE workflows SET active = $1 WHERE id = $2', [active, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get execution stats for Dashboard
app.get('/api/stats', async (req, res) => {
    try {
        const activeResult = await pool.query('SELECT COUNT(*) as count FROM workflows WHERE active = true');
        const runResult = await pool.query("SELECT COUNT(*) as count FROM execution_logs WHERE created_at > NOW() - INTERVAL '30 days'");

        res.json({
            activeCount: parseInt(activeResult.rows[0].count),
            runCount: parseInt(runResult.rows[0].count)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);

    // Start the background Orchestration Engine
    startEngine();
});
