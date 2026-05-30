import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

interface LoginPageProps {
  onLoginSuccess: (user: { email: string; role: string; id: string }) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Nuevos campos de registro físico y gimnasio
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gymId, setGymId] = useState('gym-default');
  const [targetGoal, setTargetGoal] = useState('');
  const [gyms, setGyms] = useState<any[]>([]);

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Cargar gimnasios disponibles para seleccionar
  useEffect(() => {
    const fetchGyms = async () => {
      try {
        const list = await api.getGyms();
        if (list && Array.isArray(list)) {
          setGyms(list);
          if (list.length > 0) {
            setGymId(list[0].id);
          }
        }
      } catch (e) {
        console.error('Error al cargar gimnasios:', e);
      }
    };
    fetchGyms();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    if (isRegister && (!weight.trim() || !height.trim() || !age.trim())) {
      setErrorMsg('Por favor completa peso, altura y edad.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isRegister) {
        // Registrar atleta con telemetría física inicial
        const res = await api.register(email, password, {
          weight: parseFloat(weight) || 0,
          height: parseFloat(height) || 0,
          age: parseInt(age) || 0,
          gymId,
          targetGoal
        });
        
        if (res.success) {
          // Iniciar sesión tras registro exitoso
          const sessionUser = { email: res.email, role: res.role, id: res.id };
          localStorage.setItem('combat_strava_user', JSON.stringify(sessionUser));
          onLoginSuccess(sessionUser);
        } else {
          setErrorMsg(res.message || 'Error al registrar.');
        }
      } else {
        // Login
        const res = await api.login(email, password);
        if (res.success) {
          // Guardar sesión e iniciar
          const sessionUser = { email: res.email, role: res.role, id: res.id };
          localStorage.setItem('combat_strava_user', JSON.stringify(sessionUser));
          onLoginSuccess(sessionUser);
        } else {
          setErrorMsg(res.message || 'Credenciales incorrectas.');
        }
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg('Error de conexión con el servidor. ¿Está encendido?');
    } finally {
      setIsLoading(false);
    }
  };

  // Rellenar credenciales de prueba al instante
  const handleQuickDemo = (role: 'Admin' | 'User') => {
    if (role === 'Admin') {
      setEmail('admin@combat.com');
      setPassword('admin123');
    } else {
      setEmail('user@combat.com');
      setPassword('user123');
    }
    setErrorMsg('');
    // Pequeño timeout para permitir que React actualice los estados e inicie
    setTimeout(() => {
      const btn = document.getElementById('submit-btn');
      if (btn) btn.click();
    }, 100);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '24px 20px',
      background: 'radial-gradient(circle at center, #111115 0%, #030303 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Resplandor decorativo de fondo */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        left: '-150px',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'rgba(255, 87, 0, 0.12)',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '-150px',
        right: '-150px',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'rgba(225, 29, 72, 0.1)',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }}></div>

      {/* Título de la App */}
      <div style={{ textAlign: 'center', marginBottom: '35px', zIndex: 2 }}>
        <h1 style={{ 
          fontSize: '34px', 
          fontWeight: '900', 
          fontFamily: 'var(--font-metrics)', 
          letterSpacing: '-1px', 
          background: 'linear-gradient(135deg, #FFF 40%, var(--accent-strava) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px'
        }}>
          COMBAT STRAVA
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>
          Martial Performance Engine
        </p>
      </div>

      {/* Formulario Glassmorphic */}
      <div className="glass-card" style={{
        border: '1px solid rgba(255, 87, 0, 0.15)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        padding: '28px 24px',
        zIndex: 2,
        borderRadius: '20px'
      }}>
        <h2 style={{ fontSize: '20px', color: 'white', marginBottom: '8px', border: 'none', padding: '0' }}>
          {isRegister ? 'Crear Cuenta Atleta' : 'Ingreso al Dojang'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '24px' }}>
          {isRegister ? 'Registra tu perfil para sincronizar en la nube.' : 'Inicia sesión para entrenar, rolar y socializar.'}
        </p>

        {errorMsg && (
          <div style={{
            padding: '10px 12px',
            backgroundColor: 'rgba(225, 29, 72, 0.1)',
            border: '1.5px solid var(--accent-red)',
            borderRadius: '8px',
            color: '#FDA4AF',
            fontSize: '12px',
            fontWeight: 'bold',
            marginBottom: '16px',
            lineHeight: '1.4'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Correo Electrónico</label>
            <input
              type="email"
              placeholder="atleta@combate.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#121215',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: isRegister ? '16px' : '24px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#121215',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          {isRegister && (
            <>
              {/* Peso, Altura y Edad */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="70"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '12px 8px',
                      backgroundColor: '#121215',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Altura (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="175"
                    value={height}
                    onChange={e => setHeight(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '12px 8px',
                      backgroundColor: '#121215',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Edad</label>
                  <input
                    type="number"
                    placeholder="25"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '12px 8px',
                      backgroundColor: '#121215',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Gimnasio Selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Gimnasio al que pertenece</label>
                <select
                  value={gymId}
                  onChange={e => setGymId(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#121215',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    outline: 'none'
                  }}
                >
                  {gyms.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                  {gyms.length === 0 && (
                    <option value="gym-default">Combat Arena Central</option>
                  )}
                </select>
              </div>

              {/* Objetivo y Sugerencias */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Objetivo a Alcanzar</label>
                <input
                  type="text"
                  placeholder="Ej: Aumentar resistencia, poder"
                  value={targetGoal}
                  onChange={e => setTargetGoal(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#121215',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    fontSize: '13px',
                    outline: 'none',
                    marginBottom: '8px'
                  }}
                />
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    '🔥 Resistencia Cardio HIIT',
                    '🥊 Fuerza de Pegada (1RM)',
                    '⚡ Pérdida de Peso',
                    '🥋 Defensa Personal MMA',
                    '💪 Hipertrofia Combate'
                  ].map(suggest => (
                    <button
                      key={suggest}
                      type="button"
                      onClick={() => setTargetGoal(suggest)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        color: '#AAA',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.borderColor = 'var(--accent-strava)';
                        e.currentTarget.style.color = '#FFF';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.color = '#AAA';
                      }}
                    >
                      {suggest}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            id="submit-btn"
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: 'var(--accent-strava)',
              color: 'white',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontSize: '13px',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: 'var(--glow-orange)',
              transition: 'transform 0.1s'
            }}
          >
            {isLoading ? 'Conectando...' : isRegister ? 'Confirmar Registro' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Toggle Modo */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-yellow)',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {isRegister ? '¿Ya tienes cuenta? Ingresa aquí' : '¿Eres nuevo? Registra tu cuenta gratis'}
          </button>
        </div>
      </div>

      {/* ACCESOS RÁPIDOS MOCK DEMO (GRILL-ME ALIGNMENT) */}
      {!isRegister && (
        <div className="glass-card" style={{
          marginTop: '20px',
          border: '1px dashed rgba(255, 255, 255, 0.1)',
          padding: '16px',
          textAlign: 'center',
          zIndex: 2,
          borderRadius: '16px'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
            ⚡ Accesos de Prueba Demo Rápida
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => handleQuickDemo('User')}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              👤 Atleta Demo
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('Admin')}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: 'rgba(204, 255, 0, 0.05)',
                border: '1px solid rgba(204, 255, 0, 0.15)',
                borderRadius: '8px',
                color: 'var(--accent-yellow)',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              👑 Administrador
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
