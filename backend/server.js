const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Get all samples with their results
app.get('/api/samples', (req, res) => {
  try {
    const samples = db.prepare('SELECT * FROM samples ORDER BY id DESC').all();
    const results = db.prepare('SELECT * FROM sample_results').all();
    
    // Attach results to samples
    samples.forEach(s => {
      s.results = results.filter(r => r.sampleId === s.id);
    });
    
    res.json(samples);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new sample
app.post('/api/samples', (req, res) => {
  const { productName, startDate, storageCondition, initialNotes } = req.body;
  if (!productName || !startDate || !storageCondition) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const stmt = db.prepare(`
      INSERT INTO samples (productName, startDate, storageCondition, initialNotes)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(productName, startDate, storageCondition, initialNotes || '');
    
    const newSample = db.prepare('SELECT * FROM samples WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newSample);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update basic sample details (Edit)
app.put('/api/samples/:id', (req, res) => {
  const { id } = req.params;
  const { productName, startDate, storageCondition, initialNotes } = req.body;
  if (!productName || !startDate || !storageCondition) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    db.prepare(`
      UPDATE samples SET productName = ?, startDate = ?, storageCondition = ?, initialNotes = ?
      WHERE id = ?
    `).run(productName, startDate, storageCondition, initialNotes || '', id);
    
    const updatedSample = db.prepare('SELECT * FROM samples WHERE id = ?').get(id);
    res.json(updatedSample);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update basic milestone status (Toggle directly)
app.put('/api/samples/:id/:milestone', (req, res) => {
  const { id } = req.params;
  const milestone = req.params.milestone.toLowerCase();
  const { checked } = req.body;
  
  const columnMap = { '1m': 'checked1M', '3m': 'checked3M', '6m': 'checked6M' };
  const column = columnMap[milestone];
  if (!column) return res.status(400).json({ error: 'Invalid milestone.' });

  try {
    db.prepare(`UPDATE samples SET ${column} = ? WHERE id = ?`).run(checked ? 1 : 0, id);
    res.json(db.prepare('SELECT * FROM samples WHERE id = ?').get(id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- NEW CAPABILITIES: Detailed Results Logging ---

// Get specific details of a milestone result
app.get('/api/samples/:id/result/:milestone', (req, res) => {
  const { id, milestone } = req.params;
  try {
    const result = db.prepare('SELECT * FROM sample_results WHERE sampleId = ? AND milestone = ? ORDER BY id DESC LIMIT 1').get(id, milestone.toLowerCase());
    res.json(result || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all results for a sample
app.get('/api/samples/:id/results', (req, res) => {
  const { id } = req.params;
  try {
    const results = db.prepare('SELECT * FROM sample_results WHERE sampleId = ? ORDER BY id ASC').all(id);
    res.json(results || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save or Update specific details of a milestone
app.post('/api/samples/:id/result/:milestone', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const milestone = req.params.milestone.toLowerCase();
  const { sensoryEval, ph, evaluationStatus } = req.body;
  
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    // Check if result already exists
    const existing = db.prepare('SELECT * FROM sample_results WHERE sampleId = ? AND milestone = ?').get(id, milestone);
    
    if (existing) {
      // Update
      const updatePath = imagePath || existing.imagePath; // keep old image if no new one
      db.prepare(`
        UPDATE sample_results SET sensoryEval = ?, ph = ?, imagePath = ?, evaluationStatus = ?
        WHERE id = ?
      `).run(sensoryEval, ph, updatePath, evaluationStatus, existing.id);
    } else {
      // Insert
      db.prepare(`
        INSERT INTO sample_results (sampleId, milestone, sensoryEval, ph, imagePath, evaluationStatus)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, milestone, sensoryEval, ph, imagePath, evaluationStatus);
    }

    // Always mark the sample milestone as checked=1 since we have result
    const columnMap = { '1m': 'checked1M', '3m': 'checked3M', '6m': 'checked6M' };
    const column = columnMap[milestone];
    if (column) {
      db.prepare(`UPDATE samples SET ${column} = 1 WHERE id = ?`).run(id);
    }

    // Return the updated sample for UI refresh
    const updatedSample = db.prepare('SELECT * FROM samples WHERE id = ?').get(id);
    res.json(updatedSample);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a sample and its results
app.delete('/api/samples/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM sample_results WHERE sampleId = ?').run(id);
    db.prepare('DELETE FROM samples WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
