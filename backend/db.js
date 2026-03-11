const { Pool } = require('pg');

const pool = new Pool({
  // Railway automatically provisions DATABASE_URL when a PG plugin is added
  connectionString: process.env.DATABASE_URL,
  // If testing locally without a Postgres DB, we can fallback to a local string or handle errors gracefully
});

async function initDb() {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS workflows (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                trigger_type TEXT NOT NULL,
                trigger_config TEXT,
                action_type TEXT NOT NULL,
                action_config TEXT,
                active BOOLEAN DEFAULT false,
                last_run TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

    await pool.query(`
            CREATE TABLE IF NOT EXISTS execution_logs (
                id SERIAL PRIMARY KEY,
                workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
                status TEXT NOT NULL,
                output TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    console.log('📦 PostgreSQL Database initialized');
  } catch (err) {
    console.log('⚠️ Database initialization skipped or failed (Ensure DATABASE_URL is set in Railway):', err.message);
  }
}

module.exports = {
  pool,
  initDb
};
