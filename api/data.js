import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Obtener datos de la base de datos
      const platforms = await kv.get('platforms') || [];
      const subscriptions = await kv.get('subscriptions') || [];
      
      res.status(200).json({
        platforms,
        subscriptions
      });
      return;
    }

    if (req.method === 'POST') {
      // Guardar datos en la base de datos
      const { platforms, subscriptions } = req.body;
      
      if (platforms !== undefined) {
        await kv.set('platforms', platforms);
      }
      if (subscriptions !== undefined) {
        await kv.set('subscriptions', subscriptions);
      }
      
      // Obtener datos actualizados
      const updatedPlatforms = await kv.get('platforms') || [];
      const updatedSubscriptions = await kv.get('subscriptions') || [];
      
      res.status(200).json({ 
        success: true,
        platforms: updatedPlatforms,
        subscriptions: updatedSubscriptions
      });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database error: ' + error.message 
    });
  }
}
