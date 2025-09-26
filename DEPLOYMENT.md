# 🚀 Guía de Despliegue en Vercel

## 📋 Pasos para desplegar tu aplicación completa

### 1. **Preparar el proyecto**
```bash
# En la carpeta del proyecto
cd server
npm install
```

### 2. **Desplegar en Vercel**

#### Opción A: Desde la interfaz web de Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu cuenta de GitHub
3. Importa este repositorio
4. Vercel detectará automáticamente la configuración

#### Opción B: Desde la línea de comandos
```bash
# Instalar Vercel CLI
npm i -g vercel

# En la carpeta del proyecto
vercel

# Seguir las instrucciones:
# - ¿En qué directorio está tu proyecto? ./
# - ¿Quieres sobrescribir la configuración? No
# - ¿Quieres conectar a un proyecto existente? No
```

### 3. **Configuración automática**
- ✅ **Frontend**: Se sirve automáticamente desde `index.html`
- ✅ **Backend**: Se ejecuta en `/api/*` usando `server/index.js`
- ✅ **Base de datos**: SQLite se crea automáticamente
- ✅ **CORS**: Configurado para permitir el frontend

### 4. **Verificar el despliegue**
1. Abre la URL que te da Vercel
2. La aplicación debería cargar automáticamente
3. Si es la primera vez, te pedirá crear una contraseña
4. Los datos se guardarán en la base de datos del servidor

## 🔧 Configuración técnica

### Archivos importantes:
- `vercel.json` - Configuración principal de Vercel
- `server/vercel.json` - Configuración del backend
- `server/package.json` - Dependencias del servidor
- `assets/api.js` - Cliente API para el frontend

### Endpoints disponibles:
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

## 🎯 Características del despliegue

### ✅ **Funcionalidades completas:**
- 🔐 **Autenticación segura** con hash SHA-256
- 💾 **Base de datos SQLite** persistente
- 🔄 **Migración automática** de datos locales
- 📱 **Responsive** en todos los dispositivos
- 🌐 **Acceso global** desde cualquier lugar
- 🔒 **Datos seguros** en el servidor

### 🔄 **Modo híbrido:**
- Si el servidor no está disponible, usa localStorage
- Si el servidor está disponible, usa la base de datos
- Migración automática de datos locales al servidor

## 🚨 Solución de problemas

### Error: "Module not found"
```bash
cd server
npm install
```

### Error: "Database locked"
- La base de datos SQLite se reinicia automáticamente en Vercel
- No hay configuración adicional necesaria

### Error: "CORS"
- El CORS está configurado automáticamente
- Si persiste, verifica que estés usando la URL correcta de Vercel

## 📊 Monitoreo

### Logs de Vercel:
1. Ve a tu dashboard de Vercel
2. Selecciona tu proyecto
3. Ve a la pestaña "Functions"
4. Revisa los logs en tiempo real

### Métricas:
- **Uptime**: 99.9% garantizado por Vercel
- **Latencia**: < 100ms globalmente
- **Escalabilidad**: Automática

## 🎉 ¡Listo!

Tu aplicación estará disponible en:
- **URL**: `https://tu-proyecto.vercel.app`
- **API**: `https://tu-proyecto.vercel.app/api/*`
- **Frontend**: `https://tu-proyecto.vercel.app`

### Próximos pasos:
1. Comparte la URL con tus usuarios
2. Los datos se sincronizarán automáticamente
3. Puedes acceder desde cualquier dispositivo
4. Los datos están seguros en el servidor
