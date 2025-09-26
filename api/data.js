// Base de datos simple en memoria (funciona en Vercel)
let data = {
  platforms: [],
  subscriptions: []
};

export default function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({
      success: true,
      platforms: data.platforms,
      subscriptions: data.subscriptions,
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (req.method === 'POST') {
    const { platforms, subscriptions } = req.body;
    
    if (platforms !== undefined) {
      data.platforms = platforms;
    }
    if (subscriptions !== undefined) {
      data.subscriptions = subscriptions;
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Datos guardados en la nube',
      platforms: data.platforms,
      subscriptions: data.subscriptions,
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
