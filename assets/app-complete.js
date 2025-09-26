// ========== APLICACIÓN COMPLETA PARA VERCEL ==========

// Variables globales
let subscriptions = [];
let editingId = null;
let PLATFORMS = [];
let activePlatformFilter = 'ALL';
let useAPI = true;

// Detectar Vercel
const isVercel = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel.com');

// ========== FUNCIONES BÁSICAS ==========
function openPlatformModal() {
    console.log('Abriendo modal de plataformas');
    document.getElementById('platformModal').style.display = 'block';
}

function closePlatformModal() {
    document.getElementById('platformModal').style.display = 'none';
}

function exportData() {
    console.log('Exportando datos');
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
    console.log('Importando datos');
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
                subscriptions = importedData;
                renderSubscriptions();
                alert('Datos importados correctamente');
            } else {
                alert('El archivo no tiene el formato correcto');
            }
        } catch (error) {
            alert('Error al leer el archivo: ' + error.message);
        }
    };
    reader.readAsText(file);
}

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

function closeModal() {
    document.getElementById('subscriptionModal').style.display = 'none';
    editingId = null;
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

// ========== RENDERIZADO ==========
function renderPlatforms() {
    const container = document.getElementById('platformsList');
    if (PLATFORMS.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>📺 No hay plataformas configuradas</h3><p>Agregá tu primera plataforma para comenzar</p></div>`;
        return;
    }
    container.innerHTML = PLATFORMS.map(platform => {
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
            </div>`;
    }).join('');
}

function renderSubscriptions() {
    const container = document.getElementById('subscriptionsList');
    if (subscriptions.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>📋 No hay clientes asignados</h3><p>Agregá clientes a tus plataformas</p></div>`;
        return;
    }
    container.innerHTML = subscriptions.map(sub => {
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

// ========== FUNCIONES COMPLETAS ==========
function openAddModal(platformId = null) {
    console.log('Abriendo modal para agregar');
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

function editPlatform(platformId) {
    console.log('Editando plataforma:', platformId);
    const platform = PLATFORMS.find(p => p.id === platformId);
    if (!platform) return;
    document.getElementById('platformName').value = platform.name;
    document.getElementById('platformEmail').value = platform.email;
    document.getElementById('platformPassword').value = platform.password;
    document.getElementById('platformProfiles').value = platform.profiles;
    const submitBtn = document.querySelector('#platformForm button[type="submit"]');
    submitBtn.textContent = '💾 Actualizar Plataforma';
    submitBtn.onclick = function(e) { e.preventDefault(); updatePlatform(platformId); };
    document.getElementById('platformModal').style.display = 'block';
}

function updatePlatform(platformId) {
    const platformData = {
        name: document.getElementById('platformName').value,
        email: document.getElementById('platformEmail').value,
        password: document.getElementById('platformPassword').value,
        profiles: document.getElementById('platformProfiles').value
    };
    
    const index = PLATFORMS.findIndex(p => p.id === platformId);
    if (index !== -1) {
        PLATFORMS[index] = { ...PLATFORMS[index], ...platformData };
        closePlatformModal();
        renderPlatforms();
        alert('Plataforma actualizada correctamente');
    }
}

function deletePlatform(platformId) {
    console.log('Eliminando plataforma:', platformId);
    if (confirm('¿Estás seguro de eliminar esta plataforma?')) {
        PLATFORMS = PLATFORMS.filter(p => p.id !== platformId);
        subscriptions = subscriptions.filter(sub => sub.platformId !== platformId);
        renderPlatforms();
        renderSubscriptions();
        alert('Plataforma eliminada correctamente');
    }
}

function editSubscription(id) {
    console.log('Editando suscripción:', id);
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

function deleteSubscription(id) {
    console.log('Eliminando suscripción:', id);
    if (confirm('¿Estás seguro de eliminar esta suscripción?')) {
        subscriptions = subscriptions.filter(s => s.id !== id);
        renderSubscriptions();
        alert('Suscripción eliminada correctamente');
    }
}

function sendWhatsApp(id) {
    console.log('Enviando WhatsApp:', id);
    const sub = subscriptions.find(s => s.id === id);
    if (!sub) return;
    const message = `*¡Gracias por tu compra!* 🎉\n\nYa tienes acceso a tu pantalla de:\n\n📺 *${sub.service.toUpperCase()}*.\n\n🔑 *Datos de acceso:*\n• 📧 *Correo:* ${sub.accountEmail}\n• 🔐 *Contraseña:* ${sub.accountPassword}\n• 👤 *Perfil:* ${sub.profileNumber}\n${sub.pin ? `• 🔢 *PIN:* ${sub.pin}\n` : ''}\n\nCualquier duda, estoy para ayudarte 🙌 ¡Que disfrutes!`;
    const url = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// ========== GUARDADO DE DATOS ==========
function saveSubscription() {
    const platformId = document.getElementById('platformSelect').value;
    const platform = PLATFORMS.find(p => p.id === platformId);
    if (!platform) { alert('Selecciona una plataforma'); return; }
    
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
    
    if (editingId !== null) {
        const index = subscriptions.findIndex(s => s.id === editingId);
        subscriptions[index] = { ...formData, id: editingId };
        alert('Suscripción actualizada correctamente');
    } else {
        const newId = subscriptions.length > 0 ? Math.max(...subscriptions.map(s => s.id)) + 1 : 1;
        subscriptions.push({ ...formData, id: newId });
        alert('Suscripción creada correctamente');
    }
    
    renderPlatforms();
    renderSubscriptions();
    closeModal();
}

function savePlatform() {
    const platformData = {
        name: document.getElementById('platformName').value,
        email: document.getElementById('platformEmail').value,
        password: document.getElementById('platformPassword').value,
        profiles: document.getElementById('platformProfiles').value
    };
    
    if (PLATFORMS.some(p => p.name === platformData.name)) {
        alert('Ya existe una plataforma con ese nombre');
        return;
    }
    
    platformData.id = Date.now().toString();
    PLATFORMS.push(platformData);
    closePlatformModal();
    renderPlatforms();
    alert('Plataforma agregada correctamente');
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Aplicación iniciada');
    console.log('🌐 Vercel detectado:', isVercel);
    
    // Cargar datos de ejemplo
    PLATFORMS = [
        { id: '1', name: 'NETFLIX', email: 'ejemplo@netflix.com', password: 'password123', profiles: '5' }
    ];
    subscriptions = [];
    
    // Renderizar contenido
    renderPlatforms();
    renderSubscriptions();
    
    // Configurar eventos
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
    
    // Eventos de búsqueda
    document.getElementById('searchInput').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const filteredPlatforms = PLATFORMS.filter(platform =>
            platform.name.toLowerCase().includes(searchTerm) ||
            platform.email.toLowerCase().includes(searchTerm)
        );
        const filteredSubscriptions = subscriptions.filter(sub =>
            sub.service.toLowerCase().includes(searchTerm) ||
            sub.accountEmail.toLowerCase().includes(searchTerm) ||
            sub.clientName.toLowerCase().includes(searchTerm)
        );
        
        // Renderizar resultados filtrados
        if (searchTerm) {
            document.getElementById('platformsList').innerHTML = filteredPlatforms.map(platform => {
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
                    </div>`;
            }).join('');
            
            document.getElementById('subscriptionsList').innerHTML = filteredSubscriptions.map(sub => {
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
        } else {
            renderPlatforms();
            renderSubscriptions();
        }
    });
});

// Eventos globales
window.onclick = function(event) {
    const modal = document.getElementById('subscriptionModal');
    const platformModal = document.getElementById('platformModal');
    if (event.target === modal) closeModal();
    if (event.target === platformModal) closePlatformModal();
};
