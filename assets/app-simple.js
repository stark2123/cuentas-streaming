// ========== APLICACIÓN SIMPLE PARA VERCEL ==========

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

// ========== FUNCIONES FALTANTES ==========
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
    // Implementar edición de plataforma
}

function deletePlatform(platformId) {
    console.log('Eliminando plataforma:', platformId);
    if (confirm('¿Estás seguro de eliminar esta plataforma?')) {
        PLATFORMS = PLATFORMS.filter(p => p.id !== platformId);
        subscriptions = subscriptions.filter(sub => sub.platformId !== platformId);
        renderPlatforms();
        renderSubscriptions();
    }
}

function editSubscription(id) {
    console.log('Editando suscripción:', id);
    // Implementar edición de suscripción
}

function deleteSubscription(id) {
    console.log('Eliminando suscripción:', id);
    if (confirm('¿Estás seguro de eliminar esta suscripción?')) {
        subscriptions = subscriptions.filter(s => s.id !== id);
        renderSubscriptions();
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
        console.log('Formulario enviado');
        // Implementar guardado
    });
    
    document.getElementById('platformForm').addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Formulario de plataforma enviado');
        // Implementar guardado de plataforma
    });
    
    document.getElementById('startDate').addEventListener('change', function() {
        const startDate = new Date(this.value);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30);
        document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    });
    
    // Eventos de búsqueda
    document.getElementById('searchInput').addEventListener('input', function() {
        console.log('Buscando:', this.value);
        // Implementar búsqueda
    });
});

// Eventos globales
window.onclick = function(event) {
    const modal = document.getElementById('subscriptionModal');
    const platformModal = document.getElementById('platformModal');
    if (event.target === modal) closeModal();
    if (event.target === platformModal) closePlatformModal();
};
