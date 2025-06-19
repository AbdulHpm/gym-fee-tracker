const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.resolve(__dirname, 'gym-fee-tracker.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      fee_start_date TEXT NOT NULL,
      fee_due_date TEXT NOT NULL
    )
  `);
  });

// API Endpoints

// Get all users (with optional search)
app.get('/users', (req, res) => {
  const { search } = req.query;
  let query = 'SELECT * FROM users';
  let params = [];
  if (search) {
    query += ' WHERE name LIKE ? OR phone LIKE ?';
    params = [`%${search}%`, `%${search}%`];
  }
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Add a new user
app.post('/users', (req, res) => {
  const { name, phone, fee_start_date, fee_due_date } = req.body;
  if (!name || !phone || !fee_start_date || !fee_due_date) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  db.run(
    'INSERT INTO users (name, phone, fee_start_date, fee_due_date) VALUES (?, ?, ?, ?)',
    [name, phone, fee_start_date, fee_due_date],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, name, phone, fee_start_date, fee_due_date });
    }
  );
});

// Delete a user
app.delete('/users/:id', (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Edit a user
app.put('/users/:id', (req, res) => {
  const { name, phone, fee_start_date, fee_due_date } = req.body;
  if (!name || !phone || !fee_start_date || !fee_due_date) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  db.run(
    'UPDATE users SET name = ?, phone = ?, fee_start_date = ?, fee_due_date = ? WHERE id = ?',
    [name, phone, fee_start_date, fee_due_date, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});