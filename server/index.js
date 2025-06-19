const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Use your Render PostgreSQL connection string here
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://gym_fee_tracker_db_user:0KXp51IWjGJ5vzL1E33lleNrgiPDP5i9@dpg-d19vfbqdbo4c73bup8l0-a.frankfurt-postgres.render.com/gym_fee_tracker_db',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

app.use(cors());
app.use(express.json());

// Health check endpoint (optional, but good for Render)
app.get('/', (req, res) => {
  res.send('Gym Fee Tracker backend is running!');
});

// Create table if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    fee_start_date DATE NOT NULL,
    fee_due_date DATE NOT NULL
  )
`).catch(err => console.error('Error creating table:', err));

// Get all users (with optional search)
app.get('/users', async (req, res) => {
  try {
    const { search } = req.query;
    let result;
    if (search) {
      result = await pool.query(
        "SELECT * FROM users WHERE name ILIKE $1 OR phone ILIKE $2",
        [`%${search}%`, `%${search}%`]
      );
    } else {
      result = await pool.query("SELECT * FROM users");
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new user
app.post('/users', async (req, res) => {
  const { name, phone, fee_start_date, fee_due_date } = req.body;
  if (!name || !phone || !fee_start_date || !fee_due_date) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const result = await pool.query(
      "INSERT INTO users (name, phone, fee_start_date, fee_due_date) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, phone, fee_start_date, fee_due_date]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a user
app.delete('/users/:id', async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit a user
app.put('/users/:id', async (req, res) => {
  const { name, phone, fee_start_date, fee_due_date } = req.body;
  if (!name || !phone || !fee_start_date || !fee_due_date) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    await pool.query(
      "UPDATE users SET name = $1, phone = $2, fee_start_date = $3, fee_due_date = $4 WHERE id = $5",
      [name, phone, fee_start_date, fee_due_date, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});