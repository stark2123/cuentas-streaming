import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Base de datos en memoria (temporal)
let data = {
  security: null,
  platforms: [],
  subscriptions: []
};

// Utilidades
function sha256Hex(text) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
}

async function hashPassword(password) {
  const buf = await sha256Hex(password);
  const bytes = new Uint8Array(buf);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Endpoints de seguridad
app.post('/api/security/setup', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'password_invalid' });
    }
    
    if (data.security) {
      return res.status(409).json({ error: 'already_configured' });
    }
    
    const hash = await hashPassword(password);
    data.security = { password_hash: hash };
    
    return res.json({ ok: true });
  } catch (e) {
    console.error('Error en setup:', e);
    return res.status(500).json({ error: 'server_error' });
  }
});

app.post('/api/security/login', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!data.security) {
      return res.status(404).json({ error: 'not_configured' });
    }
    
    const hash = await hashPassword(password || '');
    if (hash !== data.security.password_hash) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }
    
    return res.json({ ok: true });
  } catch (e) {
    console.error('Error en login:', e);
    return res.status(500).json({ error: 'server_error' });
  }
});

// Endpoints de plataformas
app.get('/api/platforms', (req, res) => {
  try {
    res.json(data.platforms);
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
});

app.post('/api/platforms', async (req, res) => {
  try {
    const { name, email, password, profiles } = req.body;
    if (!name || !email || !password || !profiles) {
      return res.status(400).json({ error: 'missing_fields' });
    }
    
    // Verificar si ya existe
    if (data.platforms.some(p => p.name === name)) {
      return res.status(409).json({ error: 'platform_exists' });
    }
    
    const id = Date.now().toString();
    const platform = { id, name, email, password, profiles };
    data.platforms.push(platform);
    
    res.json(platform);
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
});

app.put('/api/platforms/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, profiles } = req.body;
    
    if (!name || !email || !password || !profiles) {
      return res.status(400).json({ error: 'missing_fields' });
    }
    
    const index = data.platforms.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'platform_not_found' });
    }
    
    data.platforms[index] = { id, name, email, password, profiles };
    res.json(data.platforms[index]);
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
});

app.delete('/api/platforms/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Eliminar suscripciones relacionadas
    data.subscriptions = data.subscriptions.filter(sub => sub.platform_id !== id);
    
    const index = data.platforms.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'platform_not_found' });
    }
    
    data.platforms.splice(index, 1);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
});

// Endpoints de suscripciones
app.get('/api/subscriptions', (req, res) => {
  try {
    const subscriptions = data.subscriptions.map(sub => ({
      ...sub,
      platform_name: data.platforms.find(p => p.id === sub.platform_id)?.name || 'Unknown'
    }));
    res.json(subscriptions);
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
});

app.post('/api/subscriptions', (req, res) => {
  try {
    const { platform_id, service, account_email, account_password, profile_number, pin, client_name, start_date, end_date } = req.body;
    
    if (!platform_id || !service || !account_email || !account_password || !profile_number || !client_name || !start_date || !end_date) {
      return res.status(400).json({ error: 'missing_fields' });
    }
    
    // Verificar que la plataforma existe
    if (!data.platforms.find(p => p.id === platform_id)) {
      return res.status(404).json({ error: 'platform_not_found' });
    }
    
    // Verificar que el perfil no esté en uso
    if (data.subscriptions.some(sub => sub.platform_id === platform_id && sub.profile_number === profile_number)) {
      return res.status(409).json({ error: 'profile_in_use' });
    }
    
    const id = data.subscriptions.length > 0 ? Math.max(...data.subscriptions.map(s => s.id)) + 1 : 1;
    const subscription = {
      id,
      platform_id,
      service,
      account_email,
      account_password,
      profile_number,
      pin: pin || '',
      client_name,
      start_date,
      end_date
    };
    
    data.subscriptions.push(subscription);
    res.json(subscription);
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
});

app.put('/api/subscriptions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { platform_id, service, account_email, account_password, profile_number, pin, client_name, start_date, end_date } = req.body;
    
    if (!platform_id || !service || !account_email || !account_password || !profile_number || !client_name || !start_date || !end_date) {
      return res.status(400).json({ error: 'missing_fields' });
    }
    
    // Verificar que la plataforma existe
    if (!data.platforms.find(p => p.id === platform_id)) {
      return res.status(404).json({ error: 'platform_not_found' });
    }
    
    // Verificar que el perfil no esté en uso por otra suscripción
    if (data.subscriptions.some(sub => sub.platform_id === platform_id && sub.profile_number === profile_number && sub.id !== parseInt(id))) {
      return res.status(409).json({ error: 'profile_in_use' });
    }
    
    const index = data.subscriptions.findIndex(s => s.id === parseInt(id));
    if (index === -1) {
      return res.status(404).json({ error: 'subscription_not_found' });
    }
    
    data.subscriptions[index] = {
      id: parseInt(id),
      platform_id,
      service,
      account_email,
      account_password,
      profile_number,
      pin: pin || '',
      client_name,
      start_date,
      end_date
    };
    
    res.json(data.subscriptions[index]);
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
});

app.delete('/api/subscriptions/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const index = data.subscriptions.findIndex(s => s.id === parseInt(id));
    if (index === -1) {
      return res.status(404).json({ error: 'subscription_not_found' });
    }
    
    data.subscriptions.splice(index, 1);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
});

// Endpoint para obtener perfiles disponibles
app.get('/api/platforms/:id/available-profiles', (req, res) => {
  try {
    const { id } = req.params;
    const platform = data.platforms.find(p => p.id === id);
    
    if (!platform) {
      return res.status(404).json({ error: 'platform_not_found' });
    }
    
    const usedProfiles = data.subscriptions
      .filter(sub => sub.platform_id === id)
      .map(sub => sub.profile_number);
    
    const totalProfiles = parseInt(platform.profiles);
    const available = [];
    
    for (let i = 1; i <= totalProfiles; i++) {
      if (!usedProfiles.includes(i)) {
        available.push(i);
      }
    }
    
    res.json({ 
      available, 
      total: totalProfiles, 
      used: usedProfiles.length 
    });
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

export default app;
