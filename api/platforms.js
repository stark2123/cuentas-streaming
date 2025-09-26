// Base de datos en memoria
let data = {
  platforms: [],
  subscriptions: []
};

export default function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json(data.platforms);
    return;
  }

  if (req.method === 'POST') {
    const { name, email, password, profiles } = req.body;
    if (!name || !email || !password || !profiles) {
      return res.status(400).json({ error: 'missing_fields' });
    }
    
    const id = Date.now().toString();
    const platform = { id, name, email, password, profiles };
    data.platforms.push(platform);
    
    res.status(200).json(platform);
    return;
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const { name, email, password, profiles } = req.body;
    
    if (!name || !email || !password || !profiles) {
      return res.status(400).json({ error: 'missing_fields' });
    }
    
    const index = data.platforms.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'platform_not_found' });
    }
    
    data.platforms[index] = { id, name, email, password, profiles };
    res.status(200).json(data.platforms[index]);
    return;
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    
    const index = data.platforms.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'platform_not_found' });
    }
    
    data.platforms.splice(index, 1);
    res.status(200).json({ success: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
