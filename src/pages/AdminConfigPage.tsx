import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function AdminConfigPage() {
  const [primaryBg, setPrimaryBg] = useState('#0B0B0C');
  const [accentRed, setAccentRed] = useState('#E11D48');
  const [accentYellow, setAccentYellow] = useState('#CCFF00');
  const [accentStrava, setAccentStrava] = useState('#FF5700');
  const [textMotivation, setTextMotivation] = useState('Listo para romper tus límites hoy.');
  const [showBJJ, setShowBJJ] = useState(true);
  const [showNutrition, setShowNutrition] = useState(true);

  // Estados para la gestión de gimnasios (Multi-inquilinato de marcas)
  const [gyms, setGyms] = useState<any[]>([]);
  const [gymName, setGymName] = useState('');
  const [gymPrimaryColor, setGymPrimaryColor] = useState('#0B0B0C');
  const [gymAccentColor, setGymAccentColor] = useState('#CCFF00');
  const [gymTextColor, setGymTextColor] = useState('#FFFFFF');
  const [gymMotivation, setGymMotivation] = useState('');
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
  const [gymIsSaving, setGymIsSaving] = useState(false);
  const [gymMessage, setGymMessage] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Cargar config actual y lista de gyms del servidor SQLite
  const loadConfig = async () => {
    try {
      const config = await api.getAdminConfig();
      if (config) {
        setPrimaryBg(config.primaryBg || '#0B0B0C');
        setAccentRed(config.accentRed || '#E11D48');
        setAccentYellow(config.accentYellow || '#CCFF00');
        setAccentStrava(config.accentStrava || '#FF5700');
        setTextMotivation(config.textMotivation || 'Listo para romper tus límites hoy.');
        setShowBJJ(config.showBJJ !== false);
        setShowNutrition(config.showNutrition !== false);
      }
      await fetchGymsList();
    } catch (e) {
      console.error('Error al cargar config de admin:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGymsList = async () => {
    try {
      const list = await api.getGyms();
      if (list && Array.isArray(list)) {
        setGyms(list);
      }
    } catch (e) {
      console.error('Error al cargar la lista de gyms:', e);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    const newConfig = {
      primaryBg,
      accentRed,
      accentYellow,
      accentStrava,
      textMotivation,
      showBJJ,
      showNutrition
    };

    try {
      const res = await api.saveAdminConfig(newConfig);
      if (res.success) {
        setMessage('✓ ¡Diseño y configuración guardados en SQLite de manera exitosa!');
        // Disparar evento para que toda la app inyecte las nuevas variables CSS en el DOM
        window.dispatchEvent(new Event('adminConfigUpdated'));
      } else {
        setMessage('⚠️ Error al guardar configuración.');
      }
    } catch (e) {
      console.error(e);
      setMessage('⚠️ Error de red al conectar con el servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPrimaryBg('#0B0B0C');
    setAccentRed('#E11D48');
    setAccentYellow('#CCFF00');
    setAccentStrava('#FF5700');
    setTextMotivation('Listo para romper tus límites hoy.');
    setShowBJJ(true);
    setShowNutrition(true);
    setMessage('');
  };

  const handleSaveGym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymName.trim()) {
      setGymMessage('⚠️ El nombre del gimnasio no puede estar vacío.');
      return;
    }

    setGymIsSaving(true);
    setGymMessage('');

    try {
      const res = await api.saveGym({
        id: selectedGymId || undefined,
        name: gymName,
        primaryColor: gymPrimaryColor,
        accentColor: gymAccentColor,
        textColor: gymTextColor,
        motivation: gymMotivation
      });

      if (res.success) {
        setGymMessage('✓ ¡Gimnasio guardado y sincronizado exitosamente en la nube!');
        setGymName('');
        setGymPrimaryColor('#0B0B0C');
        setGymAccentColor('#CCFF00');
        setGymTextColor('#FFFFFF');
        setGymMotivation('');
        setSelectedGymId(null);
        await fetchGymsList();
        // Disparar evento para actualizar estilos del gym
        window.dispatchEvent(new Event('gymBrandingUpdated'));
      } else {
        setGymMessage('⚠️ Error al registrar el gimnasio.');
      }
    } catch (e) {
      console.error(e);
      setGymMessage('⚠️ Error de conexión con el servidor.');
    } finally {
      setGymIsSaving(false);
    }
  };

  const handleSelectEditGym = (gym: any) => {
    setSelectedGymId(gym.id);
    setGymName(gym.name);
    setGymPrimaryColor(gym.primaryColor || '#0B0B0C');
    setGymAccentColor(gym.accentColor || '#CCFF00');
    setGymTextColor(gym.textColor || '#FFFFFF');
    setGymMotivation(gym.motivation || '');
    setGymMessage(`Editando: ${gym.name}`);
  };

  const handleCancelGymEdit = () => {
    setSelectedGymId(null);
    setGymName('');
    setGymPrimaryColor('#0B0B0C');
    setGymAccentColor('#CCFF00');
    setGymTextColor('#FFFFFF');
    setGymMotivation('');
    setGymMessage('');
  };

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
        Cargando Consola de Administrador SQLite...
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      <header style={{ marginBottom: '20px', marginTop: '20px' }}>
        <h1>Consola del Administrador</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Rediseña libremente los colores de la marca, lemas y activa/desactiva módulos de la app en vivo.</p>
      </header>

      {message && (
        <div style={{
          padding: '12px 14px',
          backgroundColor: message.includes('✓') ? 'rgba(204, 255, 0, 0.1)' : 'rgba(225,29,72,0.1)',
          border: `1.5px solid ${message.includes('✓') ? 'var(--accent-yellow)' : 'var(--accent-red)'}`,
          borderRadius: '10px',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
          marginBottom: '20px',
          lineHeight: '1.4'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="glass-card" style={{ borderLeft: '4px solid var(--accent-yellow)' }}>
        
        {/* SECCIÓN COLORES */}
        <h2 style={{ fontSize: '15px', color: '#FFF', marginBottom: '14px' }}>🎨 Paleta de Colores de Marca</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Fondo Principal</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="color" 
                value={primaryBg} 
                onChange={e => setPrimaryBg(e.target.value)} 
                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent' }} 
              />
              <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{primaryBg.toUpperCase()}</span>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Carmesí Combate</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="color" 
                value={accentRed} 
                onChange={e => setAccentRed(e.target.value)} 
                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent' }} 
              />
              <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{accentRed.toUpperCase()}</span>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Amarillo UI Neón</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="color" 
                value={accentYellow} 
                onChange={e => setAccentYellow(e.target.value)} 
                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent' }} 
              />
              <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{accentYellow.toUpperCase()}</span>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Naranja Strava</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="color" 
                value={accentStrava} 
                onChange={e => setAccentStrava(e.target.value)} 
                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent' }} 
              />
              <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{accentStrava.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <hr style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '20px 0' }} />

        {/* SECCIÓN TEXTOS */}
        <h2 style={{ fontSize: '15px', color: '#FFF', marginBottom: '14px' }}>✍️ Contenido de Motivación</h2>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Lema del Dashboard</label>
          <input 
            type="text" 
            value={textMotivation} 
            onChange={e => setTextMotivation(e.target.value)} 
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'var(--bg-main)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              fontSize: '13px'
            }}
          />
        </div>

        <hr style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '20px 0' }} />

        {/* SECCIÓN INTERRUPTORES DE MÓDULO */}
        <h2 style={{ fontSize: '15px', color: '#FFF', marginBottom: '14px' }}>🛡️ Visibilidad de Módulos (Toggles)</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', color: '#DDD' }}>
            <input 
              type="checkbox" 
              checked={showBJJ} 
              onChange={e => setShowBJJ(e.target.checked)} 
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-strava)' }}
            />
            Habilitar sección y rutinas de **Jiu Jitsu (BJJ)**
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', color: '#DDD' }}>
            <input 
              type="checkbox" 
              checked={showNutrition} 
              onChange={e => setShowNutrition(e.target.checked)} 
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-strava)' }}
            />
            Habilitar módulo e IA de **Dieta / Nutrición**
          </label>
        </div>

        {/* BOTONES ACCIÓN */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#1E1E22',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🔄 Restablecer
          </button>
          
          <button
            type="submit"
            disabled={isSaving}
            style={{
              flex: 2,
              padding: '12px',
              backgroundColor: 'var(--accent-yellow)',
              color: 'black',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '12px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              boxShadow: 'var(--glow-yellow)'
            }}
          >
            {isSaving ? 'Guardando...' : '💾 Guardar Cambios Visuales'}
          </button>
        </div>
      </form>

      {/* SECCIÓN DE GESTIÓN Y CREACIÓN DE GIMNASIOS (ADMIN ONLY) */}
      <h2 style={{ fontSize: '18px', color: '#FFF', marginTop: '35px', marginBottom: '14px' }}>🏛️ Configuración y Registro de Gimnasios</h2>
      
      {gymMessage && (
        <div style={{
          padding: '10px 12px',
          backgroundColor: gymMessage.includes('✓') ? 'rgba(204, 255, 0, 0.1)' : 'rgba(225,29,72,0.1)',
          border: `1.5px solid ${gymMessage.includes('✓') ? 'var(--accent-yellow)' : 'var(--accent-red)'}`,
          borderRadius: '8px',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
          marginBottom: '16px'
        }}>
          {gymMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        
        {/* Formulario Crear/Editar */}
        <form onSubmit={handleSaveGym} className="glass-card" style={{ borderLeft: '4px solid var(--accent-strava)' }}>
          <h3 style={{ fontSize: '14px', color: '#FFF', marginBottom: '14px' }}>
            {selectedGymId ? '✏️ Editar Gimnasio' : '➕ Registrar Nuevo Gimnasio'}
          </h3>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Nombre del Gimnasio</label>
            <input 
              type="text" 
              placeholder="Ej: Dojo Dragón Dorado"
              value={gymName} 
              onChange={e => setGymName(e.target.value)} 
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'var(--bg-main)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Fondo Gym</label>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input 
                  type="color" 
                  value={gymPrimaryColor} 
                  onChange={e => setGymPrimaryColor(e.target.value)} 
                  style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'transparent' }} 
                />
                <span style={{ fontSize: '10px', fontFamily: 'monospace' }}>{gymPrimaryColor.toUpperCase()}</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Acento Neón</label>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input 
                  type="color" 
                  value={gymAccentColor} 
                  onChange={e => setGymAccentColor(e.target.value)} 
                  style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'transparent' }} 
                />
                <span style={{ fontSize: '10px', fontFamily: 'monospace' }}>{gymAccentColor.toUpperCase()}</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Texto principal</label>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input 
                  type="color" 
                  value={gymTextColor} 
                  onChange={e => setGymTextColor(e.target.value)} 
                  style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'transparent' }} 
                />
                <span style={{ fontSize: '10px', fontFamily: 'monospace' }}>{gymTextColor.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Lema o Frase Motivacional</label>
            <input 
              type="text" 
              placeholder="Ej: Disciplina y fuerza sin límites."
              value={gymMotivation} 
              onChange={e => setGymMotivation(e.target.value)} 
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'var(--bg-main)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {selectedGymId && (
              <button
                type="button"
                onClick={handleCancelGymEdit}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#1E1E22',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={gymIsSaving}
              style={{
                flex: 2,
                padding: '10px',
                backgroundColor: 'var(--accent-strava)',
                color: 'white',
                fontWeight: '900',
                textTransform: 'uppercase',
                fontSize: '12px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: 'var(--glow-orange)'
              }}
            >
              {gymIsSaving ? 'Guardando...' : selectedGymId ? '💾 Sincronizar Cambios' : '➕ Crear Gimnasio'}
            </button>
          </div>
        </form>

        {/* Lista de Gyms Existentes */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-yellow)' }}>
          <h3 style={{ fontSize: '14px', color: '#FFF', marginBottom: '14px' }}>🏛️ Gimnasios Registrados</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {gyms.map((g) => (
              <div 
                key={g.id} 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderRadius: '10px',
                  border: `1.5px solid ${g.accentColor}40`
                }}
              >
                <div>
                  <h4 style={{ fontSize: '13px', color: '#FFF', margin: 0 }}>{g.name}</h4>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>Lema: "{g.motivation}"</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: g.primaryColor, border: '1px solid #555', display: 'inline-block' }} title="Fondo"></span>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: g.accentColor, border: '1px solid #555', display: 'inline-block' }} title="Acento"></span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectEditGym(g)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: 'var(--accent-yellow)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  ✏️ Editar
                </button>
              </div>
            ))}
            {gyms.length === 0 && (
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', display: 'block', padding: '10px' }}>
                No hay gimnasios adicionales registrados aún.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
