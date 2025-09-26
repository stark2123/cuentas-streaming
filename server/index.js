import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Init DB
const db = new Database('data.db');
db.pragma('journal_mode = WAL');

// Schema
db.exec(`
CREATE TABLE IF NOT EXISTS app_security (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS platforms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  profiles INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform_id TEXT NOT NULL,
  service TEXT NOT NULL,
  account_email TEXT NOT NULL,
  account_password TEXT NOT NULL,
  profile_number INTEGER NOT NULL,
  pin TEXT NOT NULL,
  client_name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  FOREIGN KEY(platform_id) REFERENCES platforms(id)
);
`);

// Utilities
function sha256Hex(text) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
}

// Node 18+ has global crypto; create helper to hash synchronously via WebCrypto
import { webcrypto as _crypto } from 'crypto';
const crypto = _crypto;

async function hashPassword(password) {
  const buf = await sha256Hex(password);
  const bytes = new Uint8Array(buf);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Security endpoints
app.post('/api/security/setup', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'password_invalid' });
    }
    const exists = db.prepare('SELECT 1 FROM app_security WHERE id=1').get();
    if (exists) return res.status(409).json({ error: 'already_configured' });
    const hash = await hashPassword(password);
    db.prepare('INSERT INTO app_security(id, password_hash) VALUES (1, ?)').run(hash);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
});

app.post('/api/security/login', async (req, res) => {
  try {
    const { password } = req.body;
    const row = db.prepare('SELECT password_hash FROM app_security WHERE id=1').get();
    if (!row) return res.status(404).json({ error: 'not_configured' });
    const hash = await hashPassword(password || '');
    if (hash !== row.password_hash) return res.status(401).json({ error: 'invalid_credentials' });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
});

// Middleware de autenticación
async function authenticateToken(req, res, next) {
  const { password } = req.body;
  if (!password) {
    return res.status(401).json({ error: 'password_required' });
  }
  
  try {
    const row = db.prepare('SELECT password_hash FROM app_security WHERE id=1').get();
    if (!row) return res.status(404).json({ error: 'not_configured' });
    
    const hash = await hashPassword(password);
    if (hash !== row.password_hash) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }
    next();
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
}

// Endpoints de plataformas
app.get('/api/platforms', (req, res) => {
  try {
    const platforms = db.prepare('SELECT * FROM platforms ORDER BY name').all();
    res.json(platforms);
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
});

app.post('/api/platforms', authenticateToken, (req, res) => {
  try {
    const { name, email, password, profiles } = req.body;
    if (!name || !email || !password || !profiles) {
      return res.status(400).json({ error: 'missing_fields' });
    }
    
    // Verificar si ya existe
    const existing = db.prepare('SELECT id FROM platforms WHERE name = ?').get(name);
    if (existing) {
      return res.status(409).json({ error: 'platform_exists' });
    }
    
    const id = Date.now().toString();
    db.prepare('INSERT INTO platforms(id, name, email, password, profiles) VALUES (?, ?, ?, ?, ?)')
      .run(id, name, email, password, profiles);
    
    res.json({ id, name, email, password, profiles });
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
});

app.put('/api/platforms/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, profiles } = req.body;
    
    if (!name || !email || !password || !profiles) {
      return res.status(400).json({ error: 'missing_fields' });
    }
    
    const result = db.prepare('UPDATE platforms SET name = ?, email = ?, password = ?, profiles = ? WHERE id = ?')
      .run(name, email, password, profiles, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'platform_not_found' });
    }
    
    res.json({ id, name, email, password, profiles });
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
});

app.delete('/api/platforms/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    // Eliminar suscripciones relacionadas primero
    db.prepare('DELETE FROM subscriptions WHERE platform_id = ?').run(id);
    
    const result = db.prepare('DELETE FROM platforms WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'platform_not_found' });
    }
    
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
});

// Endpoints de suscripciones
app.get('/api/subscriptions', (req, res) => {
  try {
    const subscriptions = db.prepare(`
      SELECT s.*, p.name as platform_name 
      FROM subscriptions s 
      LEFT JOIN platforms p ON s.platform_id = p.id 
      ORDER BY s.end_date
    `).all();
    res.json(subscriptions);
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
});

app.post('/api/subscriptions', authenticateToken, (req, res) => {
  try {
    const { platform_id, service, account_email, account_password, profile_number, pin, client_name, start_date, end_date } = req.body;
    
    if (!platform_id || !service || !account_email || !account_password || !profile_number || !client_name || !start_date || !end_date) {
      return res.status(400).json({ error: 'missing_fields' });
    }
    
    // Verificar que la plataforma existe
    const platform = db.prepare('SELECT id FROM platforms WHERE id = ?').get(platform_id);
    if (!platform) {
      return res.status(404).json({ error: 'platform_not_found' });
    }
    
    // Verificar que el perfil no esté en uso
    const existing = db.prepare('SELECT id FROM subscriptions WHERE platform_id = ? AND profile_number = ?').get(platform_id, profile_number);
    if (existing) {
      return res.status(409).json({ error: 'profile_in_use' });
    }
    
    const result = db.prepare(`
      INSERT INTO subscriptions(platform_id, service, account_email, account_password, profile_number, pin, client_name, start_date, end_date) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(platform_id, service, account_email, account_password, profile_number, pin || '', client_name, start_date, end_date);
    
    const newSubscription = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(result.lastInsertRowid);
    res.json(newSubscription);
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
});

app.put('/api/subscriptions/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { platform_id, service, account_email, account_password, profile_number, pin, client_name, start_date, end_date } = req.body;
    
    if (!platform_id || !service || !account_email || !account_password || !profile_number || !client_name || !start_date || !end_date) {
      return res.status(400).json({ error: 'missing_fields' });
    }
    
    // Verificar que la plataforma existe
    const platform = db.prepare('SELECT id FROM platforms WHERE id = ?').get(platform_id);
    if (!platform) {
      return res.status(404).json({ error: 'platform_not_found' });
    }
    
    // Verificar que el perfil no esté en uso por otra suscripción
    const existing = db.prepare('SELECT id FROM subscriptions WHERE platform_id = ? AND profile_number = ? AND id != ?').get(platform_id, profile_number, id);
    if (existing) {
      return res.status(409).json({ error: 'profile_in_use' });
    }
    
    const result = db.prepare(`
      UPDATE subscriptions 
      SET platform_id = ?, service = ?, account_email = ?, account_password = ?, profile_number = ?, pin = ?, client_name = ?, start_date = ?, end_date = ?
      WHERE id = ?
    `).run(platform_id, service, account_email, account_password, profile_number, pin || '', client_name, start_date, end_date, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'subscription_not_found' });
    }
    
    const updatedSubscription = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id);
    res.json(updatedSubscription);
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
});

app.delete('/api/subscriptions/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    const result = db.prepare('DELETE FROM subscriptions WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'subscription_not_found' });
    }
    
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
});

// Endpoint para obtener perfiles disponibles de una plataforma
app.get('/api/platforms/:id/available-profiles', (req, res) => {
  try {
    const { id } = req.params;
    const platform = db.prepare('SELECT * FROM platforms WHERE id = ?').get(id);
    
    if (!platform) {
      return res.status(404).json({ error: 'platform_not_found' });
    }
    
    const usedProfiles = db.prepare('SELECT profile_number FROM subscriptions WHERE platform_id = ?').all(id);
    const usedNumbers = usedProfiles.map(p => p.profile_number);
    const totalProfiles = parseInt(platform.profiles);
    const available = [];
    
    for (let i = 1; i <= totalProfiles; i++) {
      if (!usedNumbers.includes(i)) {
        available.push(i);
      }
    }
    
    res.json({ available, total: totalProfiles, used: usedNumbers.length });
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

// Solo iniciar servidor si no estamos en Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

export default app;


