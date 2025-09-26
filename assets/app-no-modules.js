// ========== APLICACIÓN DE GESTIÓN DE CUENTAS STREAMING ==========
// Versión sin módulos ES6 para compatibilidad

// Variables globales de la aplicación
let subscriptions = [];
let editingId = null;
let PLATFORMS = [];
let activePlatformFilter = 'ALL';
let useAPI = true; // Flag para usar API o localStorage

// ========== CONFIGURACIÓN DE API ==========
const API_BASE_URL = window.location.origin + '/api';

// ========== UTILIDADES DE API ==========
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error en la API');
    }
    
    return data;
  } catch (error) {
    console.error('Error en API:', error);
    throw error;
  }
}

// ========== ENDPOINTS DE SEGURIDAD ==========
async function apiSetupPassword(password) {
  return apiRequest('/security/setup', {
    method: 'POST',
    body: JSON.stringify({ password })
  });
}

async function apiLoginPassword(password) {
  return apiRequest('/security/login', {
    method: 'POST',
    body: JSON.stringify({ password })
  });
}

// ========== ENDPOINTS DE PLATAFORMAS ==========
async function getPlatforms() {
  return apiRequest('/platforms');
}

async function createPlatform(platformData) {
  return apiRequest('/platforms', {
    method: 'POST',
    body: JSON.stringify(platformData)
  });
}

async function updatePlatform(id, platformData) {
  return apiRequest(`/platforms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(platformData)
  });
}

async function deletePlatform(id) {
  return apiRequest(`/platforms/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ password: getStoredPassword() })
  });
}

async function getAvailableProfiles(platformId) {
  return apiRequest(`/platforms/${platformId}/available-profiles`);
}

// ========== ENDPOINTS DE SUSCRIPCIONES ==========
async function getSubscriptions() {
  return apiRequest('/subscriptions');
}

async function createSubscription(subscriptionData) {
  return apiRequest('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(subscriptionData)
  });
}

async function updateSubscription(id, subscriptionData) {
  return apiRequest(`/subscriptions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(subscriptionData)
  });
}

async function deleteSubscription(id) {
  return apiRequest(`/subscriptions/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ password: getStoredPassword() })
  });
}

// ========== UTILIDADES ==========
function getStoredPassword() {
  return localStorage.getItem('app_password') ? atob(localStorage.getItem('app_password')) : '';
}

// ========== MIGRACIÓN DE DATOS ==========
async function migrateLocalData() {
  try {
    // Verificar si ya hay datos en el servidor
    const serverPlatforms = await getPlatforms();
    const serverSubscriptions = await getSubscriptions();
    
    if (serverPlatforms.length > 0 || serverSubscriptions.length > 0) {
      console.log('✅ Datos del servidor ya existen, no se migrarán datos locales');
      return;
    }
    
    // Obtener datos locales
    const localPlatforms = JSON.parse(localStorage.getItem('platforms') || '[]');
    const localSubscriptions = JSON.parse(localStorage.getItem('streaming_subscriptions') || '[]');
    
    if (localPlatforms.length === 0 && localSubscriptions.length === 0) {
      console.log('✅ No hay datos locales para migrar');
      return;
    }
    
    console.log('🔄 Migrando datos locales al servidor...');
    
    // Migrar plataformas
    for (const platform of localPlatforms) {
      try {
        await createPlatform({
          password: getStoredPassword(),
          ...platform
        });
        console.log(`✅ Plataforma migrada: ${platform.name}`);
      } catch (error) {
        console.error(`❌ Error migrando plataforma ${platform.name}:`, error);
      }
    }
    
    // Migrar suscripciones
    for (const subscription of localSubscriptions) {
      try {
        await createSubscription({
          password: getStoredPassword(),
          platform_id: subscription.platformId,
          service: subscription.service,
          account_email: subscription.accountEmail,
          account_password: subscription.accountPassword,
          profile_number: subscription.profileNumber,
          pin: subscription.pin,
          client_name: subscription.clientName,
          start_date: subscription.startDate,
          end_date: subscription.endDate
        });
        console.log(`✅ Suscripción migrada: ${subscription.clientName}`);
      } catch (error) {
        console.error(`❌ Error migrando suscripción ${subscription.clientName}:`, error);
      }
    }
    
    console.log('✅ Migración completada');
    
    // Limpiar datos locales después de migración exitosa
    localStorage.removeItem('platforms');
    localStorage.removeItem('streaming_subscriptions');
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  }
}

// ========== SEGURIDAD ==========
async function checkSecurity() {
    try {
        // Intentar verificar si el servidor está configurado
        const response = await fetch('/api/security/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'test' })
        });
        
        if (response.status === 404) {
            // Servidor no configurado, usar modo local
            useAPI = false;
            return checkLocalSecurity();
        }
        
        // Servidor configurado, usar API
        useAPI = true;
        const sessionVerified = sessionStorage.getItem('password_verified');
        if (!sessionVerified) {
            showPasswordLogin();
            return false;
        }
        return true;
    } catch (error) {
        console.log('🔄 Servidor no disponible, usando modo local');
        useAPI = false;
        return checkLocalSecurity();
    }
}

function checkLocalSecurity() {
    const hasPassword = localStorage.getItem('app_password');
    if (!hasPassword) {
        showPasswordSetup();
        return false;
    }
    const sessionVerified = sessionStorage.getItem('password_verified');
    if (!sessionVerified) {
        showPasswordLogin();
        return false;
    }
    return true;
}

function showPasswordLogin() {
    document.body.innerHTML = `
        <div class="security-container">
            <div class="security-card">
                <div class="security-header">
                    <h1>🔐 Acceso Seguro</h1>
                    <p>Ingresa tu contraseña para acceder a tus datos</p>
                </div>
                <form id="loginForm" class="security-form">
                    <div class="form-group">
                        <label for="loginPassword">Contraseña:</label>
                        <input type="password" id="loginPassword" required 
                               placeholder="Ingresa tu contraseña">
                    </div>
                    <button type="submit" class="security-btn">🔓 Acceder</button>
                </form>
                <div class="security-footer">
                    <p>💡 <strong>¿Olvidaste tu contraseña?</strong> Usa el botón "Limpiar Datos" para resetear</p>
                </div>
            </div>
        </div>
    `;
    addSecurityStyles();
    setupLoginEvents();
}

function setupLoginEvents() {
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handlePasswordLogin();
        });
    }
    const submitBtn = document.querySelector('.security-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handlePasswordLogin();
        });
    }
}

async function handlePasswordLogin() {
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.querySelector('.security-btn');
    if (!password) { showError('Por favor ingresa tu contraseña'); return; }
    
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Verificando...';
    
    try {
        if (useAPI) {
            // Usar API del servidor
            await apiLoginPassword(password);
            sessionStorage.setItem('password_verified', 'true');
            showSuccess('¡Acceso correcto! Cargando aplicación...');
            setTimeout(() => window.location.reload(), 1500);
        } else {
            // Usar modo local
            const storedPassword = localStorage.getItem('app_password');
            setTimeout(() => {
                if (btoa(password) !== storedPassword) {
                    showError('Contraseña incorrecta');
                    submitBtn.disabled = false;
                    submitBtn.textContent = '🔓 Acceder';
                    return;
                }
                sessionStorage.setItem('password_verified', 'true');
                showSuccess('¡Acceso correcto! Cargando aplicación...');
                setTimeout(() => window.location.reload(), 1500);
            }, 500);
        }
    } catch (error) {
        showError('Contraseña incorrecta');
        submitBtn.disabled = false;
        submitBtn.textContent = '🔓 Acceder';
    }
}

function showPasswordSetup() {
    document.body.innerHTML = `
        <div class="security-container">
            <div class="security-card">
                <div class="security-header">
                    <h1>🔐 Configuración de Seguridad</h1>
                    <p>Establece una contraseña para proteger tus datos</p>
                </div>
                <form id="passwordForm" class="security-form">
                    <div class="form-group">
                        <label for="newPassword">Contraseña:</label>
                        <input type="password" id="newPassword" required 
                               placeholder="Crea una contraseña segura">
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">Confirmar contraseña:</label>
                        <input type="password" id="confirmPassword" required 
                               placeholder="Repite tu contraseña">
                    </div>
                    <button type="submit" class="security-btn">🔐 Crear Contraseña</button>
                </form>
                <div class="security-footer">
                    <p>💡 Tu contraseña protegerá todos tus datos de streaming</p>
                </div>
            </div>
        </div>
    `;
    addSecurityStyles();
    setupPasswordEvents();
}

function addSecurityStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .security-container { display:flex; justify-content:center; align-items:center; min-height:100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding:20px; }
        .security-card { background:white; border-radius:15px; padding:40px; box-shadow:0 20px 40px rgba(0,0,0,0.1); width:100%; max-width:400px; }
        .security-header { text-align:center; margin-bottom:30px; }
        .security-header h1 { color:#333; margin-bottom:10px; font-size:1.8rem; }
        .security-header p { color:#666; font-size:14px; }
        .security-form { margin-bottom:20px; }
        .form-group { margin-bottom:20px; }
        .form-group label { display:block; margin-bottom:8px; font-weight:600; color:#333; }
        .form-group input[type="password"] { width:100%; padding:12px; border:2px solid #e0e0e0; border-radius:8px; font-size:16px; transition:border-color .3s; }
        .form-group input[type="password"]:focus { outline:none; border-color:#667eea; }
        .security-btn { width:100%; padding:15px; background:#667eea; color:white; border:none; border-radius:8px; font-size:16px; font-weight:600; cursor:pointer; transition:background .3s; }
        .security-btn:hover { background:#5a6fd8; }
        .security-btn:disabled { background:#ccc; cursor:not-allowed; }
        .security-footer { text-align:center; font-size:12px; color:#666; background:#f8f9fa; padding:15px; border-radius:8px; }
        .error-message { background:#f8d7da; color:#721c24; padding:10px; border-radius:5px; margin-bottom:15px; font-size:14px; }
        .success-message { background:#d4edda; color:#155724; padding:10px; border-radius:5px; margin-bottom:15px; font-size:14px; }
    `;
    document.head.appendChild(style);
}

function setupPasswordEvents() {
    document.getElementById('passwordForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handlePasswordSetup();
    });
}

async function handlePasswordSetup() {
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (!password) { showError('Por favor ingresa una contraseña'); return; }
    if (password !== confirmPassword) { showError('Las contraseñas no coinciden'); return; }
    if (password.length < 4) { showError('La contraseña debe tener al menos 4 caracteres'); return; }
    
    try {
        if (useAPI) {
            // Usar API del servidor
            await apiSetupPassword(password);
            localStorage.setItem('app_password', btoa(password)); // Para compatibilidad
            showSuccess('¡Contraseña creada! Cargando aplicación...');
            setTimeout(() => window.location.reload(), 1500);
        } else {
            // Usar modo local
            localStorage.setItem('app_password', btoa(password));
            showSuccess('¡Contraseña creada! Cargando aplicación...');
            setTimeout(() => window.location.reload(), 1500);
        }
    } catch (error) {
        if (error.message.includes('already_configured')) {
            showError('El servidor ya está configurado. Usa la contraseña existente.');
        } else {
            showError('Error al crear contraseña: ' + error.message);
        }
    }
}

function showError(message) {
    const existingError = document.querySelector('.error-message');
    if (existingError) existingError.remove();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    const form = document.getElementById('loginForm') || document.getElementById('passwordForm');
    if (form) form.insertBefore(errorDiv, form.firstChild);
}

function showSuccess(message) {
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) existingSuccess.remove();
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    const form = document.getElementById('loginForm') || document.getElementById('passwordForm');
    if (form) form.insertBefore(successDiv, form.firstChild);
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', async function() {
    const isSecure = await checkSecurity();
    if (isSecure) {
        await loadData();
        renderPlatformSubtabs();
        renderPlatforms();
        renderSubscriptions();
        setupEventListeners();
    }
});

// ========== GESTIÓN DE DATOS ==========
async function loadData() {
    try {
        if (useAPI) {
            // Cargar datos del servidor
            PLATFORMS = await getPlatforms();
            subscriptions = await getSubscriptions();
            console.log('✅ Datos cargados del servidor:', { platforms: PLATFORMS.length, subscriptions: subscriptions.length });
            
            // Intentar migrar datos locales si es la primera vez
            try {
                await migrateLocalData();
                // Recargar datos después de migración
                PLATFORMS = await getPlatforms();
                subscriptions = await getSubscriptions();
            } catch (migrationError) {
                console.log('ℹ️ No hay datos locales para migrar o ya están migrados');
            }
        } else {
            // Cargar datos locales
            subscriptions = JSON.parse(localStorage.getItem('streaming_subscriptions') || '[]');
            PLATFORMS = JSON.parse(localStorage.getItem('platforms') || '[]');
            console.log('✅ Datos cargados localmente:', { platforms: PLATFORMS.length, subscriptions: subscriptions.length });
        }
    } catch (error) {
        console.error('Error al cargar datos:', error);
        subscriptions = [];
        PLATFORMS = [];
    }
}

// ========== NAVEGACIÓN ==========
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    if (tabName === 'platforms') {
        document.getElementById('platformsTab').classList.add('active');
        document.querySelector('.tab-button[onclick="switchTab(\'platforms\')"]').classList.add('active');
    } else if (tabName === 'clients') {
        document.getElementById('clientsTab').classList.add('active');
        document.querySelector('.tab-button[onclick="switchTab(\'clients\')"]').classList.add('active');
    }
}

// ========== EVENTOS ==========
function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', function() {
        renderPlatforms();
        renderSubscriptions();
    });
    document.getElementById('subscriptionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveSubscription();
    });
    document.getElementById('platformForm').addEventListener('submit', function(e) {
        e.preventDefault();
        savePlatform();
    });
    document.getElementById('startDate').addEventListener('change', function() {
        const startDate = new Date(this.value);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30);
        document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    });
}

// ========== SUBTABS DE PLATAFORMAS ==========
function renderPlatformSubtabs() {
    const container = document.getElementById('platformsSubtabs');
    if (!container) return;
    const names = Array.from(new Set(PLATFORMS.map(p => p.name))).sort();
    const allTabs = ['Todos'].concat(names);
    const mapLabelToKey = (label) => label === 'Todos' ? 'ALL' : label;
    if (activePlatformFilter !== 'ALL' && !names.includes(activePlatformFilter)) {
        activePlatformFilter = 'ALL';
    }
    container.innerHTML = allTabs.map(label => {
        const key = mapLabelToKey(label);
        const isActive = (activePlatformFilter === key);
        return `<button class="subtab-button ${isActive ? 'active' : ''}" onclick="setPlatformFilter('${key}')">${label}</button>`;
    }).join('');
}

function setPlatformFilter(key) {
    activePlatformFilter = key;
    renderPlatformSubtabs();
    renderPlatforms();
}

// ========== RENDERIZADO ==========
function renderPlatforms() {
    const container = document.getElementById('platformsList');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (PLATFORMS.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>📺 No hay plataformas configuradas</h3><p>Agregá tu primera plataforma para comenzar</p></div>`;
        return;
    }
    const byTab = PLATFORMS.filter(p => activePlatformFilter === 'ALL' || p.name === activePlatformFilter);
    const filteredPlatforms = byTab.filter(platform =>
        platform.name.toLowerCase().includes(searchTerm) ||
        platform.email.toLowerCase().includes(searchTerm) ||
        subscriptions.some(sub => sub.platformId === platform.id && (sub.clientName.toLowerCase().includes(searchTerm) || sub.service.toLowerCase().includes(searchTerm)))
    );
    container.innerHTML = filteredPlatforms.map(platform => {
        const platformSubscriptions = subscriptions.filter(sub => sub.platformId === platform.id);
        const totalProfiles = parseInt(platform.profiles);
        const usedProfiles = platformSubscriptions.length;
        const availableProfiles = totalProfiles - usedProfiles;
        return `
            <div class="platform-card">
                <div class="subscription-header">
                    <div class="service-name">${platform.name}</div>
                    <div class="days-badge days-positive">${usedProfiles}/${totalProfiles} perfiles</div>
                </div>
                <div class="subscription-details">
                    <div class="detail-item"><div class="detail-label">Correo</div><div class="detail-value">${platform.email}</div></div>
                    <div class="detail-item"><div class="detail-label">Disponibles</div><div class="detail-value">${availableProfiles}</div></div>
                </div>
                <div class="subscription-actions">
                    <button class="btn btn-primary" onclick="openAddModal('${platform.id}')">➕ Agregar Cliente</button>
                    <button class="btn btn-secondary" onclick="editPlatform('${platform.id}')">✏️ Editar</button>
                    <button class="btn btn-danger" onclick="deletePlatform('${platform.id}')">🗑️ Eliminar</button>
                </div>
                ${platformSubscriptions.length > 0 ? `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
                        <h4 style="margin-bottom: 8px; color: #333; font-size: 14px;">Clientes:</h4>
                        ${platformSubscriptions.map(sub => {
                            const daysRemaining = calculateDaysRemaining(sub.endDate);
                            const daysClass = daysRemaining < 0 ? 'days-danger' : daysRemaining <= 3 ? 'days-warning' : 'days-positive';
                            return `
                                <div class="compact-card" style="margin-bottom: 4px;">
                                    <div class="compact-info">
                                        <div class="compact-title">Perfil ${sub.profileNumber}: ${sub.clientName}</div>
                                        <div class="compact-subtitle">${sub.pin ? `PIN: ${sub.pin} • ` : ''}Finaliza: ${formatDate(sub.endDate)}</div>
                                    </div>
                                    <div class="compact-actions">
                                        <span class="days-badge ${daysClass}" style="font-size: 11px; padding: 3px 6px; margin-right: 6px;">${daysRemaining} días</span>
                                        <button class="compact-btn compact-btn-primary" onclick="editSubscription(${sub.id})">✏️</button>
                                        <button class="compact-btn compact-btn-success" onclick="sendWhatsApp(${sub.id})">📱</button>
                                        <button class="compact-btn compact-btn-danger" onclick="deleteSubscription(${sub.id})">🗑️</button>
                                    </div>
                                </div>`;
                        }).join('')}
                    </div>` : ''}
            </div>`;
    }).join('');
}

function renderSubscriptions() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = subscriptions.filter(sub =>
        sub.service.toLowerCase().includes(searchTerm) ||
        sub.accountEmail.toLowerCase().includes(searchTerm) ||
        sub.clientName.toLowerCase().includes(searchTerm)
    );
    const container = document.getElementById('subscriptionsList');
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>📋 No hay clientes asignados</h3><p>Agregá clientes a tus plataformas</p></div>`;
        return;
    }
    container.innerHTML = filtered.map(sub => {
        const daysRemaining = calculateDaysRemaining(sub.endDate);
        const daysClass = daysRemaining < 0 ? 'days-danger' : daysRemaining <= 3 ? 'days-warning' : 'days-positive';
        return `
            <div class="compact-card">
                <div class="compact-info">
                    <div class="compact-title">${sub.service} • Perfil ${sub.profileNumber}</div>
                    <div class="compact-subtitle">${sub.clientName}${sub.pin ? ` • PIN: ${sub.pin}` : ''} • Inicia: ${formatDate(sub.startDate)} • Finaliza: ${formatDate(sub.endDate)}</div>
                </div>
                <div class="compact-actions">
                    <span class="days-badge ${daysClass}" style="font-size: 11px; padding: 3px 6px; margin-right: 6px;">${daysRemaining} días</span>
                    <button class="compact-btn compact-btn-primary" onclick="editSubscription(${sub.id})">✏️ Editar</button>
                    <button class="compact-btn compact-btn-success" onclick="sendWhatsApp(${sub.id})">📱 WhatsApp</button>
                    <button class="compact-btn compact-btn-danger" onclick="deleteSubscription(${sub.id})">🗑️ Eliminar</button>
                </div>
            </div>`;
    }).join('');
}

// ========== UTILIDADES ==========
function calculateDaysRemaining(endDate) {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
}

// ========== MODALES ==========
function openAddModal(platformId = null) {
    if (PLATFORMS.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Primero agrega una plataforma', text: 'Necesitas tener al menos una plataforma para crear una cuenta.' });
        return;
    }
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Nueva Cuenta';
    document.getElementById('subscriptionForm').reset();
    const platformSelect = document.getElementById('platformSelect');
    platformSelect.innerHTML = PLATFORMS.map(p => `<option value="${p.id}" ${p.id === platformId ? 'selected' : ''}>${p.name}</option>`).join('');
    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date(); endDate.setDate(endDate.getDate() + 30);
    document.getElementById('startDate').value = today;
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    updateAvailableProfiles();
    document.getElementById('subscriptionModal').style.display = 'block';
}

function updateAvailableProfiles() {
    const platformId = document.getElementById('platformSelect').value;
    const profileSelect = document.getElementById('profileNumber');
    if (!platformId) {
        profileSelect.innerHTML = '<option value="">Seleccionar perfil...</option>';
        document.getElementById('service').value = '';
        document.getElementById('accountEmail').value = '';
        document.getElementById('accountPassword').value = '';
        return;
    }
    const platform = PLATFORMS.find(p => p.id === platformId);
    if (!platform) return;
    document.getElementById('service').value = platform.name;
    document.getElementById('accountEmail').value = platform.email;
    document.getElementById('accountPassword').value = platform.password;
    const usedProfiles = subscriptions.filter(sub => sub.platformId === platformId).map(sub => sub.profileNumber);
    const totalProfiles = parseInt(platform.profiles);
    profileSelect.innerHTML = '<option value="">Seleccionar perfil...</option>';
    for (let i = 1; i <= totalProfiles; i++) {
        if (!usedProfiles.includes(i)) {
            profileSelect.innerHTML += `<option value="${i}">Perfil ${i}</option>`;
        }
    }
}

function openPlatformModal() {
    document.getElementById('platformModal').style.display = 'block';
}

function closePlatformModal() {
    document.getElementById('platformModal').style.display = 'none';
    renderPlatformSubtabs();
}

function closeModal() {
    document.getElementById('subscriptionModal').style.display = 'none';
    editingId = null;
}

// ========== GESTIÓN DE PLATAFORMAS ==========
async function savePlatform() {
    const platformData = {
        name: document.getElementById('platformName').value,
        email: document.getElementById('platformEmail').value,
        password: document.getElementById('platformPassword').value,
        profiles: document.getElementById('platformProfiles').value
    };
    
    try {
        if (useAPI) {
            // Usar API del servidor
            const newPlatform = await createPlatform({
                password: getStoredPassword(),
                ...platformData
            });
            PLATFORMS.push(newPlatform);
        } else {
            // Usar modo local
            if (PLATFORMS.some(p => p.name === platformData.name)) {
                Swal.fire({ icon: 'info', title: 'Plataforma duplicada', text: 'Ya existe una plataforma con ese nombre.' });
                return;
            }
            platformData.id = Date.now().toString();
            PLATFORMS.push(platformData);
            localStorage.setItem('platforms', JSON.stringify(PLATFORMS));
        }
        
        closePlatformModal();
        renderPlatforms();
        renderPlatformSubtabs();
        Swal.fire({ icon: 'success', title: 'Plataforma agregada', timer: 1400, showConfirmButton: false });
    } catch (error) {
        if (error.message.includes('platform_exists')) {
            Swal.fire({ icon: 'info', title: 'Plataforma duplicada', text: 'Ya existe una plataforma con ese nombre.' });
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Error al crear plataforma: ' + error.message });
        }
    }
}

function editPlatform(platformId) {
    const platform = PLATFORMS.find(p => p.id === platformId);
    if (!platform) return;
    document.getElementById('platformName').value = platform.name;
    document.getElementById('platformEmail').value = platform.email;
    document.getElementById('platformPassword').value = platform.password;
    document.getElementById('platformProfiles').value = platform.profiles;
    const submitBtn = document.querySelector('#platformForm button[type="submit"]');
    submitBtn.textContent = '💾 Actualizar Plataforma';
    submitBtn.onclick = function(e) { e.preventDefault(); updatePlatformLocal(platformId); };
    document.getElementById('platformModal').style.display = 'block';
}

async function updatePlatformLocal(platformId) {
    const platformData = {
        name: document.getElementById('platformName').value,
        email: document.getElementById('platformEmail').value,
        password: document.getElementById('platformPassword').value,
        profiles: document.getElementById('platformProfiles').value
    };
    
    try {
        if (useAPI) {
            // Usar API del servidor
            const updatedPlatform = await updatePlatform(platformId, {
                password: getStoredPassword(),
                ...platformData
            });
            const index = PLATFORMS.findIndex(p => p.id === platformId);
            PLATFORMS[index] = updatedPlatform;
        } else {
            // Usar modo local
            const platform = PLATFORMS.find(p => p.id === platformId);
            if (!platform) return;
            platform.name = platformData.name;
            platform.email = platformData.email;
            platform.password = platformData.password;
            platform.profiles = platformData.profiles;
            localStorage.setItem('platforms', JSON.stringify(PLATFORMS));
        }
        
        closePlatformModal();
        renderPlatforms();
        renderPlatformSubtabs();
        Swal.fire({ icon: 'success', title: 'Plataforma actualizada', timer: 1400, showConfirmButton: false });
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Error al actualizar plataforma: ' + error.message });
    }
}

async function deletePlatform(platformId) {
    Swal.fire({
        icon: 'warning', title: '¿Eliminar plataforma?', text: 'También se eliminarán los clientes asociados.', showCancelButton: true,
        confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                if (useAPI) {
                    // Usar API del servidor
                    await deletePlatform(platformId);
                } else {
                    // Usar modo local
                    PLATFORMS = PLATFORMS.filter(p => p.id !== platformId);
                    subscriptions = subscriptions.filter(sub => sub.platformId !== platformId);
                    localStorage.setItem('platforms', JSON.stringify(PLATFORMS));
                    localStorage.setItem('streaming_subscriptions', JSON.stringify(subscriptions));
                }
                
                renderPlatforms();
                renderSubscriptions();
                Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1200, showConfirmButton: false });
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Error al eliminar plataforma: ' + error.message });
            }
        }
    });
}

// ========== GESTIÓN DE SUSCRIPCIONES ==========
function editSubscription(id) {
    const sub = subscriptions.find(s => s.id === id);
    if (!sub) return;
    editingId = id;
    document.getElementById('modalTitle').textContent = 'Editar Cuenta';
    const platformSelect = document.getElementById('platformSelect');
    platformSelect.innerHTML = PLATFORMS.map(p => `<option value="${p.id}" ${p.id === sub.platformId ? 'selected' : ''}>${p.name}</option>`).join('');
    document.getElementById('service').value = sub.service;
    document.getElementById('accountEmail').value = sub.accountEmail;
    document.getElementById('accountPassword').value = sub.accountPassword;
    document.getElementById('profileNumber').value = sub.profileNumber;
    document.getElementById('pin').value = sub.pin;
    document.getElementById('clientName').value = sub.clientName;
    document.getElementById('startDate').value = sub.startDate;
    document.getElementById('endDate').value = sub.endDate;
    document.getElementById('subscriptionModal').style.display = 'block';
}

async function saveSubscription() {
    const platformId = document.getElementById('platformSelect').value;
    const platform = PLATFORMS.find(p => p.id === platformId);
    if (!platform) { Swal.fire({ icon: 'info', title: 'Selecciona una plataforma' }); return; }
    const formData = {
        platformId: platformId,
        service: platform.name,
        accountEmail: platform.email,
        accountPassword: platform.password,
        profileNumber: parseInt(document.getElementById('profileNumber').value),
        pin: (document.getElementById('pin').value || '').trim(),
        clientName: document.getElementById('clientName').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value
    };
    
    try {
        if (useAPI) {
            // Usar API del servidor
            if (editingId !== null) {
                const updatedSubscription = await updateSubscription(editingId, {
                    password: getStoredPassword(),
                    platform_id: formData.platformId,
                    service: formData.service,
                    account_email: formData.accountEmail,
                    account_password: formData.accountPassword,
                    profile_number: formData.profileNumber,
                    pin: formData.pin,
                    client_name: formData.clientName,
                    start_date: formData.startDate,
                    end_date: formData.endDate
                });
                const index = subscriptions.findIndex(s => s.id === editingId);
                subscriptions[index] = updatedSubscription;
            } else {
                const newSubscription = await createSubscription({
                    password: getStoredPassword(),
                    platform_id: formData.platformId,
                    service: formData.service,
                    account_email: formData.accountEmail,
                    account_password: formData.accountPassword,
                    profile_number: formData.profileNumber,
                    pin: formData.pin,
                    client_name: formData.clientName,
                    start_date: formData.startDate,
                    end_date: formData.endDate
                });
                subscriptions.push(newSubscription);
            }
        } else {
            // Usar modo local
            if (editingId !== null) {
                const index = subscriptions.findIndex(s => s.id === editingId);
                subscriptions[index] = { ...formData, id: editingId };
            } else {
                const newId = subscriptions.length > 0 ? Math.max(...subscriptions.map(s => s.id)) + 1 : 1;
                subscriptions.push({ ...formData, id: newId });
            }
            localStorage.setItem('streaming_subscriptions', JSON.stringify(subscriptions));
        }
        
        renderPlatforms();
        renderPlatformSubtabs();
        renderSubscriptions();
        closeModal();
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Error al guardar: ' + error.message });
    }
}

async function deleteSubscription(id) {
    Swal.fire({ icon: 'warning', title: '¿Eliminar cuenta?', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' })
    .then(async (result) => {
        if (result.isConfirmed) {
            try {
                if (useAPI) {
                    await deleteSubscription(id);
                } else {
                    subscriptions = subscriptions.filter(s => s.id !== id);
                    localStorage.setItem('streaming_subscriptions', JSON.stringify(subscriptions));
                }
                renderPlatforms();
                renderSubscriptions();
                Swal.fire({ icon: 'success', title: 'Cuenta eliminada', timer: 1200, showConfirmButton: false });
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Error al eliminar: ' + error.message });
            }
        }
    });
}

// ========== WHATSAPP ==========
function sendWhatsApp(id) {
    const sub = subscriptions.find(s => s.id === id);
    if (!sub) return;
    const message = `*¡Gracias por tu compra!* 🎉

Ya tienes acceso a tu pantalla de:

📺 *${sub.service.toUpperCase()}*.

🔑 *Datos de acceso:*
• 📧 *Correo:* ${sub.accountEmail}
• 🔐 *Contraseña:* ${sub.accountPassword}
• 👤 *Perfil:* ${sub.profileNumber}
${sub.pin ? `• 🔢 *PIN:* ${sub.pin}\n` : ''}

Cualquier duda, estoy para ayudarte 🙌 ¡Que disfrutes!`;
    const url = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// ========== IMPORTAR/EXPORTAR ==========
function exportData() {
    const dataStr = JSON.stringify(subscriptions, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `respaldo_cuentas_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function importData() {
    document.getElementById('fileInput').click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                Swal.fire({ icon: 'question', title: '¿Reemplazar cuentas?', text: 'Se reemplazarán todas las cuentas actuales por las del archivo.', showCancelButton: true, confirmButtonText: 'Sí, reemplazar', cancelButtonText: 'Cancelar' }).then(result => {
                    if (result.isConfirmed) {
                        subscriptions = importedData;
                        localStorage.setItem('streaming_subscriptions', JSON.stringify(subscriptions));
                        renderSubscriptions();
                        Swal.fire({ icon: 'success', title: 'Datos importados', timer: 1300, showConfirmButton: false });
                    }
                });
            } else {
                alert('El archivo no tiene el formato correcto');
            }
        } catch (error) {
            alert('Error al leer el archivo: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// ========== EVENTOS GLOBALES ==========
window.onclick = function(event) {
    const modal = document.getElementById('subscriptionModal');
    const platformModal = document.getElementById('platformModal');
    if (event.target === modal) { closeModal(); }
    if (event.target === platformModal) { closePlatformModal(); }
};
