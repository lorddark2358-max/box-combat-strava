// Coloca aquí la URL de tu servidor Express desplegado en la nube (ej: Render, Railway, Fly.io, etc.)
export const PRODUCTION_API_URL = 'https://combat-strava-backend.onrender.com';

const getBackendUrl = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;

  // 1. Si cargamos la aplicación desde la nube (ej: Vercel, Netlify, Render)
  if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.')) {
    console.log('☁️ Entorno de Producción en la Nube detectado.');
    return PRODUCTION_API_URL;
  }

  // 2. Si está en un celular físico compilado nativamente (Capacitor sirve en http://localhost sin puerto)
  if (hostname === 'localhost' && port === '') {
    // CAMBIA ESTO A 'false' si quieres que la app instalada en tu celular apunte a la nube en vez del PC
    const USE_LOCAL_DEV_SERVER = true; 
    
    if (USE_LOCAL_DEV_SERVER) {
      console.log('📱 App Nativa: Apuntando a Servidor Local del PC de desarrollo...');
      return 'http://192.168.1.21:3001';
    } else {
      console.log('☁️ App Nativa: Apuntando al Servidor Backend en la Nube...');
      return PRODUCTION_API_URL;
    }
  }

  // 3. Si está en el navegador web local de la PC (Vite en localhost:5173)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }

  // 4. Si accede al navegador móvil por red Wi-Fi (ej: http://192.168.1.21:5173)
  return `http://${hostname}:3001`;
};

export const API_BASE_URL = getBackendUrl();
console.log('🔗 API Base URL configurada automáticamente en:', API_BASE_URL);
