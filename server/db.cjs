const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Use DATA_DIR env var for Railway volume, fallback to server/ dir for local dev
const dataDir = process.env.DATA_DIR || __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const DB_PATH = path.join(dataDir, 'data.db');
console.log('📂 Database path:', DB_PATH);

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      security_question TEXT DEFAULT '',
      security_answer TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS learning_stations (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      code TEXT NOT NULL DEFAULT '',
      data TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS station_collaborators (
      station_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      added_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (station_id, user_id),
      FOREIGN KEY (station_id) REFERENCES learning_stations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Migration: add columns to existing databases
  const migrations = [
    "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'",
    "ALTER TABLE users ADD COLUMN security_question TEXT DEFAULT ''",
    "ALTER TABLE users ADD COLUMN security_answer TEXT DEFAULT ''"
  ];
  for (const sql of migrations) {
    try { db.exec(sql); } catch (e) { /* column already exists */ }
  }

  // Auto-promote admin: if ADMIN_EMAIL is set, make that user admin
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    try {
      db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(adminEmail);
      console.log('👑 Admin role set for:', adminEmail);
    } catch (e) { /* ignore */ }
  }

  // If no admin exists at all, make the first user (id=1) admin
  const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (!adminExists) {
    try {
      db.prepare("UPDATE users SET role = 'admin' WHERE id = 1").run();
      console.log('👑 First user promoted to admin');
    } catch (e) { /* ignore */ }
  }
}

module.exports = { getDb };
