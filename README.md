# 📺 Cuentas Streaming - Página Web

Aplicación web para gestionar tus cuentas de streaming y clientes desde cualquier dispositivo. **¡No necesitás instalar nada!**

## ✨ Características

- 📱 **Responsive**: Funciona perfecto en celular, tablet y computadora
- 💾 **Datos locales**: Se guardan en tu navegador (no se pierden)
- 🔍 **Búsqueda en tiempo real**: Filtra por servicio, correo o cliente
- 📊 **Días restantes**: Con colores (verde/naranja/rojo) según vencimiento
- 📤 **Exportar/Importar**: Respaldo en JSON para compartir entre dispositivos
- 📱 **WhatsApp directo**: Envía mensaje prellenado con datos de la cuenta
- ➕ **CRUD completo**: Crear, editar, eliminar cuentas

## 🚀 Cómo usar

### Opción 1: Abrir directamente
1. Hacé doble clic en `index.html`
2. Se abre en tu navegador predeterminado
3. ¡Listo! Ya podés usar la app

### Opción 2: Desde cualquier dispositivo
1. Subí el archivo `index.html` a Google Drive, Dropbox, o cualquier servidor web
2. Abrí el enlace desde tu celular, tablet o computadora
3. Los datos se guardan localmente en cada dispositivo

### Opción 3: Servidor local (opcional)
Si querés probarlo como "app web":
```bash
# En la carpeta del proyecto
python -m http.server 8000
# Luego abrir: http://localhost:8000
```

## 📋 Cómo funciona

1. **Agregar cuenta**: Botón "➕ Nueva Cuenta"
2. **Buscar**: Escribí en la caja de búsqueda
3. **Editar**: Clic en "✏️ Editar" en cualquier tarjeta
4. **WhatsApp**: Clic en "📱 WhatsApp" (si tiene teléfono guardado)
5. **Respaldo**: "📤 Exportar" para guardar, "📥 Importar" para restaurar

## 💡 Ventajas vs APK

- ✅ **Sin instalación**: Solo abrir en navegador
- ✅ **Multiplataforma**: Windows, Mac, Android, iOS
- ✅ **Actualizaciones**: Solo cambiar el archivo HTML
- ✅ **Compartir fácil**: Enviar por WhatsApp, email, etc.
- ✅ **Sin permisos**: No necesita acceso a archivos del sistema

## 🔧 Personalización

Si querés cambiar algo:
- **Colores**: Busca `#667eea` en el CSS y cambiá por tu color
- **Mensaje WhatsApp**: Busca `sendWhatsApp()` en el JavaScript
- **Campos**: Agregá/quitá campos en el formulario HTML

## 📁 Archivos

- `index.html`: Todo en un solo archivo (HTML + CSS + JavaScript)
- `README.md`: Esta documentación

## 🚀 Despliegue Completo en Vercel

### ⚡ Despliegue Rápido (Recomendado)
```bash
# 1. Instalar dependencias
cd server
npm install

# 2. Desplegar en Vercel
vercel

# 3. ¡Listo! Tu app estará en https://tu-proyecto.vercel.app
```

### 🔧 Configuración Manual
1. **Sube tu código a GitHub**
2. **Ve a [vercel.com](https://vercel.com)**
3. **Conecta tu repositorio**
4. **Vercel detectará automáticamente la configuración**

### ✨ Características del Despliegue
- 🔐 **Autenticación segura** con hash SHA-256
- 💾 **Base de datos SQLite** persistente en el servidor
- 🔄 **Migración automática** de datos locales
- 📱 **Acceso global** desde cualquier dispositivo
- 🌐 **URL pública** para compartir con clientes

### 🗄️ Backend Completo (SQLite + Express)

**Endpoints implementados:**
- `GET /api/platforms` - Obtener plataformas
- `POST /api/platforms` - Crear plataforma  
- `PUT /api/platforms/:id` - Actualizar plataforma
- `DELETE /api/platforms/:id` - Eliminar plataforma
- `GET /api/subscriptions` - Obtener suscripciones
- `POST /api/subscriptions` - Crear suscripción
- `PUT /api/subscriptions/:id` - Actualizar suscripción
- `DELETE /api/subscriptions/:id` - Eliminar suscripción
- `POST /api/security/setup` - Configurar contraseña
- `POST /api/security/login` - Autenticación

### 🔄 Modo Híbrido
- **Con servidor**: Usa base de datos SQLite
- **Sin servidor**: Usa localStorage (modo offline)
- **Migración automática**: Datos locales → servidor


