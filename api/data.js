// Base de datos simple en memoria (se reinicia en cada deploy)
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
    // Obtener todos los datos
    res.status(200).json({
      platforms: data.platforms,
      subscriptions: data.subscriptions
    });
    return;
  }

  if (req.method === 'POST') {
    // Guardar datos
    const { platforms, subscriptions } = req.body;
    
    if (platforms) {
      data.platforms = platforms;
    }
    if (subscriptions) {
      data.subscriptions = subscriptions;
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Datos guardados correctamente',
      platforms: data.platforms,
      subscriptions: data.subscriptions
    });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
