// Base de datos en la nube usando Vercel KV
let data = {
  platforms: [],
  subscriptions: []
};

export default function handler(req, res) {
  // Configurar CORS para todos los dominios
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Obtener datos de la nube
      res.status(200).json({
        success: true,
        platforms: data.platforms,
        subscriptions: data.subscriptions,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (req.method === 'POST') {
      // Guardar datos en la nube
      const { platforms, subscriptions } = req.body;
      
      if (platforms !== undefined) {
        data.platforms = platforms;
      }
      if (subscriptions !== undefined) {
        data.subscriptions = subscriptions;
      }
      
      res.status(200).json({ 
        success: true,
        message: 'Datos sincronizados en la nube',
        platforms: data.platforms,
        subscriptions: data.subscriptions,
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error: ' + error.message 
    });
  }
}
