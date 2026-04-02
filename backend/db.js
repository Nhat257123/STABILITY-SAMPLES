const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'db.sqlite');
const db = new Database(dbPath, { verbose: console.log });

// Define the table structure for sample tracking.
db.exec(`
  CREATE TABLE IF NOT EXISTS samples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productName TEXT NOT NULL,
    startDate TEXT NOT NULL,
    storageCondition TEXT NOT NULL,
    initialNotes TEXT,
    checked1M INTEGER DEFAULT 0,
    checked3M INTEGER DEFAULT 0,
    checked6M INTEGER DEFAULT 0
  )
`);

// Define the detailed logging table
db.exec(`
  CREATE TABLE IF NOT EXISTS sample_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sampleId INTEGER NOT NULL,
    milestone TEXT NOT NULL,
    sensoryEval TEXT,
    ph REAL,
    imagePath TEXT,
    evaluationStatus TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sampleId) REFERENCES samples(id)
  )
`);

module.exports = db;
