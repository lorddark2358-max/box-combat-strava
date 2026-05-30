import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [gym, setGym] = useState<any>(null);
  const [gyms, setGyms] = useState<any[]>([]);
  const [weightHistory, setWeightHistory] = useState<any[]>([]);
  
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gymId, setGymId] = useState('gym-default');
  const [targetGoal, setTargetGoal] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const userEmail = (() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('combat_strava_user') || '{}');
      return savedUser.email || 'user@combat.com';
    } catch (e) {
      return 'user@combat.com';
    }
  })();

  const loadData = async () => {
    try {
      // 1. Cargar perfil del atleta y su gym
      const res = await api.getUserProfile(userEmail);
      if (res.success) {
        setProfile(res.profile);
        setGym(res.gym);
        setWeightHistory(res.weightHistory || []);
        
        // Rellenar estados del form
        setWeight(res.profile.weight.toString());
        setHeight(res.profile.height.toString());
        setAge(res.profile.age.toString());
        setGymId(res.profile.gymId);
        setTargetGoal(res.profile.targetGoal || '');
      }

      // 2. Cargar lista de gyms creados por el admin
      const gymRes = await api.getGyms();
      if (gymRes && Array.isArray(gymRes)) {
        setGyms(gymRes);
      }
    } catch (e) {
      console.error('Error al cargar datos del perfil:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const res = await api.updateUserProfile({
        email: userEmail,
        weight: parseFloat(weight) || 0,
        height: parseFloat(height) || 0,
        age: parseInt(age) || 0,
        gymId,
        targetGoal
      });

      if (res.success) {
        setMessage('✓ ¡Perfil actualizado exitosamente en la nube!');
        // Disparar evento para recargar estilos y datos en la App
        window.dispatchEvent(new Event('gymBrandingUpdated'));
        window.dispatchEvent(new Event('activityRecorded'));
        await loadData();
      } else {
        setMessage('⚠️ Error al actualizar el perfil.');
      }
    } catch (e) {
      console.error(e);
      setMessage('⚠️ Error de conexión con el servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
        Estableciendo enlace de telemetría de perfil...
      </div>
    );
  }

  // Tarjeta de Membresía del Gimnasio activa
  const cardColor = gym?.accentColor || 'var(--accent-yellow)';
  const cardBg = gym?.primaryColor || '#0F0F12';
  const cardText = gym?.textColor || '#FFFFFF';

  return (
    <div style={{ paddingBottom: '50px' }}>
      <header style={{ marginBottom: '20px', marginTop: '20px' }}>
        <h1>Tu Perfil Atleta</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Modifica tus métricas corporales para medir tu kinesis y cambiar de afiliación de gimnasio.</p>
      </header>

      {/* TARJETA DE MEMBRESÍA DIGITAL PREMIUM */}
      <section style={{ marginBottom: '25px' }}>
        <div 
          style={{
            background: `linear-gradient(135deg, ${cardBg} 60%, rgba(255,255,255,0.03) 100%)`,
            border: `2px solid ${cardColor}`,
            boxShadow: `0 0 25px ${cardColor}30`,
            borderRadius: '20px',
            padding: '24px',
            color: cardText,
            position: 'relative',
            overflow: 'hidden',
            fontFamily: 'var(--font-metrics)'
          }}
        >
          {/* Neon vertical line */}
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '6px', backgroundColor: cardColor }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2px', color: cardColor, fontWeight: '900' }}>
                PASE DE COMBATE OFICIAL
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: '900', border: 'none', margin: '4px 0 0 0', padding: 0, letterSpacing: '-0.5px' }}>
                {gym?.name || 'Combat Arena Central'}
              </h2>
            </div>
            <span style={{ fontSize: '32px' }}>🥋</span>
          </div>

          <div style={{ display: 'flex', gap: '25px', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', display: 'block' }}>Atleta</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{profile?.email.split('@')[0].toUpperCase()}</span>
            </div>
            <div>
              <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', display: 'block' }}>Rango / Rol</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: cardColor }}>{profile?.role === 'Admin' ? 'ENTRENADOR / ADMIN' : 'COMPETIDOR'}</span>
            </div>
            <div>
              <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', display: 'block' }}>Racha</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>🔥 {profile?.streak} días</span>
            </div>
          </div>

          <div style={{ padding: '10px 14px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '7px', color: cardColor, textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Lema Gimnasio:</span>
            <p style={{ fontSize: '11px', fontStyle: 'italic', margin: 0, color: '#DDD' }}>
              "{gym?.motivation || 'El templo de los campeones híbridos.'}"
            </p>
          </div>
        </div>
      </section>

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

      {/* FORMULARIO EDITAR PERFIL */}
      <section className="glass-card" style={{ borderLeft: '4px solid var(--accent-strava)' }}>
        <h2 style={{ fontSize: '15px', color: '#FFF', marginBottom: '14px' }}>⚙️ Modificar Parámetros Físicos</h2>
        
        <form onSubmit={handleUpdate}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={e => setWeight(e.target.value)}
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
            <div>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Altura (cm)</label>
              <input
                type="number"
                step="0.1"
                value={height}
                onChange={e => setHeight(e.target.value)}
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
            <div>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Edad</label>
              <input
                type="number"
                value={age}
                onChange={e => setAge(e.target.value)}
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
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Gimnasio al que pertenece</label>
            <select
              value={gymId}
              onChange={e => setGymId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'var(--bg-main)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold'
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

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Objetivo a Alcanzar</label>
            <input
              type="text"
              placeholder="Ej: Fuerza de Pegada (1RM)"
              value={targetGoal}
              onChange={e => setTargetGoal(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'var(--bg-main)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                fontSize: '13px',
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
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '6px',
                    color: '#AAA',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {suggest}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'var(--accent-strava)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              textTransform: 'uppercase',
              fontSize: '12px',
              boxShadow: 'var(--glow-orange)'
            }}
          >
            {isSaving ? 'Actualizando...' : '💾 Sincronizar Cambios de Perfil'}
          </button>
        </form>
      </section>

      {/* TABLA HISTORIAL DE PESOS */}
      <section className="glass-card" style={{ marginTop: '20px' }}>
        <h2 style={{ fontSize: '15px', color: '#FFF', marginBottom: '14px' }}>📊 Historial de Pesos</h2>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px' }}>Fecha</th>
                <th style={{ padding: '8px' }}>Peso Corporal</th>
              </tr>
            </thead>
            <tbody>
              {weightHistory.map((item, idx) => (
                <tr key={item.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '8px', color: '#CCC' }}>
                    {new Date(item.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '8px', fontWeight: 'bold', color: 'var(--accent-yellow)' }}>
                    {item.weight} kg
                  </td>
                </tr>
              ))}
              {weightHistory.length === 0 && (
                <tr>
                  <td colSpan={2} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay actualizaciones registradas de peso corporal aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
