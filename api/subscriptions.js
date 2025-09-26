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
    const subscriptions = data.subscriptions.map(sub => ({
      ...sub,
      platform_name: data.platforms.find(p => p.id === sub.platform_id)?.name || 'Unknown'
    }));
    res.status(200).json(subscriptions);
    return;
  }

  if (req.method === 'POST') {
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
    res.status(200).json(subscription);
    return;
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
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
    
    res.status(200).json(data.subscriptions[index]);
    return;
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    
    const index = data.subscriptions.findIndex(s => s.id === parseInt(id));
    if (index === -1) {
      return res.status(404).json({ error: 'subscription_not_found' });
    }
    
    data.subscriptions.splice(index, 1);
    res.status(200).json({ success: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
