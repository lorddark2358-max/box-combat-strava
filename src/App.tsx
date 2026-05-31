import React, { useState, useEffect } from 'react';
import DashboardPage from './pages/DashboardPage';
import NutritionPage from './pages/NutritionPage';
import WorkoutEnginePage from './pages/WorkoutEnginePage';
import RecordActivityPage from './pages/RecordActivityPage';
import SocialPage from './pages/SocialPage';
import LoginPage from './pages/LoginPage';
import AdminConfigPage from './pages/AdminConfigPage';
import ProfilePage from './pages/ProfilePage';
import { api } from './utils/api';
import './assets/styles/global.css';

interface UserSession {
  email: string;
  role: string;
  id: string;
}

function App() {
  // 1. Estado de Sesión del Usuario
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('combat_strava_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  // 2. Estado de Configuración del Administrador
  const [adminConfig, setAdminConfig] = useState({
    showBJJ: true,
    showNutrition: true,
    textMotivation: 'Listo para romper tus límites hoy.'
  });

  // Función para cargar los estilos e interruptores desde el servidor SQLite
  const applyAdminConfig = async () => {
    try {
      // 1. Cargar la configuración general del administrador
      const config = await api.getAdminConfig();
      let finalBg = '#060608';
      let finalRed = '#FF1A53';
      let finalYellow = '#DFFF00';
      let finalStrava = '#FF5700';

      if (config) {
        setAdminConfig({
          showBJJ: config.showBJJ !== false,
          showNutrition: config.showNutrition !== false,
          textMotivation: config.textMotivation || 'Listo para romper tus límites hoy.'
        });
        if (config.primaryBg) finalBg = config.primaryBg;
        if (config.accentRed) finalRed = config.accentRed;
        if (config.accentYellow) finalYellow = config.accentYellow;
        if (config.accentStrava) finalStrava = config.accentStrava;
      }

      // 2. Si el usuario está logueado, verificar si pertenece a un gimnasio con colores corporativos personalizados
      if (user && user.email) {
        const profileRes = await api.getUserProfile(user.email);
        if (profileRes.success && profileRes.gym) {
          const gymBrand = profileRes.gym;
          // Si el gimnasio tiene colores definidos, sobrescribir variables CSS
          if (gymBrand.primaryColor) finalBg = gymBrand.primaryColor;
          if (gymBrand.accentColor) {
            finalYellow = gymBrand.accentColor;
            finalStrava = gymBrand.accentColor; // Usar color del gym en acentos
          }
          if (gymBrand.motivation) {
            setAdminConfig(prev => ({
              ...prev,
              textMotivation: gymBrand.motivation
            }));
          }
        }
      }

      // Inyectar variables de color CSS dinámicamente en el DOM raíz del documento
      const root = document.documentElement;
      root.style.setProperty('--bg-main', finalBg);
      root.style.setProperty('--accent-red', finalRed);
      root.style.setProperty('--accent-yellow', finalYellow);
      root.style.setProperty('--accent-strava', finalStrava);

    } catch (e) {
      console.error('Fallo al conectar con el servidor SQLite para estilos:', e);
    }
  };

  useEffect(() => {
    applyAdminConfig();
    
    // Escuchar el evento local para repintar en vivo sin recargar la página
    window.addEventListener('adminConfigUpdated', applyAdminConfig);
    window.addEventListener('gymBrandingUpdated', applyAdminConfig);
    return () => {
      window.removeEventListener('adminConfigUpdated', applyAdminConfig);
      window.removeEventListener('gymBrandingUpdated', applyAdminConfig);
    };
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('combat_strava_user');
    setUser(null);
    setActiveTab('dashboard');
  };

  // Si no está autenticado, forzar pantalla de Login Cyberpunk
  if (!user) {
    return <LoginPage onLoginSuccess={(session) => setUser(session)} />;
  }

  return (
    <div className="app-layout">
      {/* Botón rápido de cerrar sesión en la cabecera */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 20px 4px 20px',
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        zIndex: 10
      }}>
        <span style={{ fontSize: '11px', color: 'var(--accent-yellow)', fontWeight: 'bold' }}>
          🥋 {user.role === 'Admin' ? 'ADMIN CONSOLE' : `ATLETA: ${user.email.split('@')[0].toUpperCase()}`}
        </span>
        <button 
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '11px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🚪 Salir
        </button>
      </div>

      <div className="main-content">
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'workout' && <WorkoutEnginePage />}
        {activeTab === 'record' && <RecordActivityPage onNavigateToFeed={() => setActiveTab('social')} />}
        {activeTab === 'nutrition' && adminConfig.showNutrition && <NutritionPage />}
        {activeTab === 'social' && <SocialPage />}
        {activeTab === 'profile' && <ProfilePage />}
        {activeTab === 'admin' && user.role === 'Admin' && <AdminConfigPage />}
      </div>

      {/* Navegación PWA Estilo Strava con Botón Flotante y Config Admin */}
      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <span className="nav-icon">📊</span>
          <span>Panel</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'workout' ? 'active' : ''}`}
          onClick={() => setActiveTab('workout')}
        >
          <span className="nav-icon">🥊</span>
          <span>Rutinas</span>
        </button>

        {/* Botón Central Flotante de Grabación */}
        <div className="record-nav-container">
          <div className="record-btn-pulsing-glow"></div>
          <button 
            className={`nav-item nav-item-record ${activeTab === 'record' ? 'active' : ''}`}
            onClick={() => setActiveTab('record')}
          >
            <span className="nav-icon">➕</span>
          </button>
        </div>

        {/* Muestra pestaña de Dieta solo si el Administrador la tiene activa en el servidor */}
        {adminConfig.showNutrition && (
          <button 
            className={`nav-item ${activeTab === 'nutrition' ? 'active' : ''}`}
            onClick={() => setActiveTab('nutrition')}
          >
            <span className="nav-icon">🥩</span>
            <span>Dieta</span>
          </button>
        )}
        
        <button 
          className={`nav-item ${activeTab === 'social' ? 'active' : ''}`}
          onClick={() => setActiveTab('social')}
        >
          <span className="nav-icon">🧡</span>
          <span>Social</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <span className="nav-icon">👤</span>
          <span>Perfil</span>
        </button>
        
        {/* Pestaña de Administrador - Visible solo si el rol del login es Admin */}
        {user.role === 'Admin' && (
          <button 
            className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <span className="nav-icon">🛠️</span>
            <span>Admin</span>
          </button>
        )}
      </nav>
    </div>
  );
}

export default App;
