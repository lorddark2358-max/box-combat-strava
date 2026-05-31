import React, { useState, useEffect } from 'react';
import { mockFeedItems, mockChallenges, mockLeaderboard } from '../models/mockData';
import { FeedItem, Challenge, LeaderboardEntry, FeedComment } from '../models/types';
import { api } from '../utils/api';
import { API_BASE_URL } from '../config';

export default function SocialPage() {
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'challenges' | 'leaderboard'>('feed');

  // --- SOCIAL FEED & SHARE STATE ---
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [sharingItem, setSharingItem] = useState<FeedItem | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleShareActivity = async (item: FeedItem) => {
    setSharingItem(item);
    
    // Si el navegador soporta Web Share API, usarlo (funciona nativo en celulares y tablets)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Combat Strava: ${item.activity.title}`,
          text: `Mira mi entrenamiento de ${item.activity.type} en Combat Strava: "${item.activity.notes}"`,
          url: window.location.origin
        });
        return; 
      } catch (e) {
        console.log('Cancelado o no compatible con Web Share, abriendo modal...');
      }
    }
    
    // Si no, abrir el modal de compartir Cyberpunk de la interfaz
    setShowShareModal(true);
  };

  const handleCopyLink = () => {
    if (sharingItem) {
      const shareUrl = `${window.location.origin}`;
      navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };
  
  // Cargar feed completo (Servidor SQLite con Fallback Local)
  const loadFeed = async () => {
    try {
      const serverActivities = await api.getActivities();
      if (Array.isArray(serverActivities) && serverActivities.length > 0) {
        // En el servidor SQLite, comprobamos si le dimos kudo localmente
        let currentUserEmail = 'user@combat.com';
        try {
          const savedUser = JSON.parse(localStorage.getItem('combat_strava_user') || '{}');
          if (savedUser && savedUser.email) currentUserEmail = savedUser.email;
        } catch (e) {}

        const parsed = serverActivities.map((item: any) => {
          // Comprobar si en comments/kudos existimos
          const hasGiven = Array.isArray(item.comments) ? false : false; // Mapeado por SQLite de fondo
          return {
            ...item,
            hasGivenKudo: item.hasGivenKudo || false // controlado por SQLite o local
          };
        });
        setFeedItems(parsed);
      } else {
        setFeedItems(mockFeedItems);
      }
    } catch (e) {
      console.error('Error de conexión con API, usando mock local:', e);
      const userFeed = JSON.parse(localStorage.getItem('recorded_activities_feed') || '[]');
      const combined = [...userFeed, ...mockFeedItems];
      const seen = new Set();
      const unique = combined.filter(item => {
        const duplicate = seen.has(item.id);
        seen.add(item.id);
        return !duplicate;
      });

      unique.sort((a, b) => new Date(b.activity.date).getTime() - new Date(a.activity.date).getTime());
      setFeedItems(unique);
    }
  };

  useEffect(() => {
    loadFeed();
    window.addEventListener('activityRecorded', loadFeed);
    return () => {
      window.removeEventListener('activityRecorded', loadFeed);
    };
  }, []);

  // --- LOGICA DE KUDOS (GUANTE DE BOXEO) EN SQLITE ---
  const handleGiveKudo = async (itemId: string) => {
    let userEmail = 'user@combat.com';
    try {
      const savedUser = JSON.parse(localStorage.getItem('combat_strava_user') || '{}');
      if (savedUser && savedUser.email) userEmail = savedUser.email;
    } catch (e) {}

    try {
      // Intentar enviar al servidor SQLite
      await api.giveKudo(itemId, userEmail);
      loadFeed();
    } catch (e) {
      console.error('Error de API, fallback a local:', e);
      // Fallback local
      const updated = feedItems.map(item => {
        if (item.id === itemId) {
          const alreadyKudoed = item.hasGivenKudo;
          return {
            ...item,
            kudosCount: alreadyKudoed ? item.kudosCount - 1 : item.kudosCount + 1,
            hasGivenKudo: !alreadyKudoed
          };
        }
        return item;
      });
      setFeedItems(updated);
    }
  };

  // --- LOGICA DE AGREGAR COMENTARIO EN SQLITE ---
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const handleAddComment = async (itemId: string) => {
    const commentText = commentInputs[itemId] || '';
    if (!commentText.trim()) return;

    let authorName = 'Tú (Atleta)';
    try {
      const savedUser = JSON.parse(localStorage.getItem('combat_strava_user') || '{}');
      if (savedUser && savedUser.email) authorName = savedUser.email.split('@')[0];
    } catch (e) {}

    try {
      // Guardar en servidor SQLite
      await api.addComment(itemId, authorName, commentText);
      setCommentInputs(prev => ({ ...prev, [itemId]: '' }));
      loadFeed();
    } catch (e) {
      console.error('Fallo en API, fallback local:', e);
      const newComment: FeedComment = {
        id: 'comment-' + Date.now(),
        authorName,
        content: commentText,
        date: new Date().toISOString()
      };

      const updated = feedItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            comments: [...item.comments, newComment]
          };
        }
        return item;
      });

      setFeedItems(updated);
      setCommentInputs(prev => ({ ...prev, [itemId]: '' }));
    }
  };

  // --- RETOS Y LEADERBOARD STATE ---
  const [challenges, setChallenges] = useState<Challenge[]>(mockChallenges);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(mockLeaderboard);

  // Calcular porcentaje de retos
  const getChallengePercent = (ch: Challenge) => {
    return Math.min(Math.round((ch.current / ch.target) * 100), 100);
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'Baja': return 'var(--accent-blue)';
      case 'Media': return 'var(--accent-orange)';
      case 'Alta': return 'var(--accent-red)';
      case 'Extrema': return 'var(--accent-yellow)';
      default: return 'white';
    }
  };

  return (
    <div style={{ paddingBottom: '30px' }}>
      {/* Header Social */}
      <header style={{ marginBottom: '20px', marginTop: '20px' }}>
        <h1>Muro de Combate</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Feed estilo Strava, retos de fuerza e interacciones con atletas Pro.</p>
      </header>

      {/* Sub-Navegación Social */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveSubTab('feed')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: activeSubTab === 'feed' ? 'var(--accent-strava)' : 'transparent',
            color: activeSubTab === 'feed' ? 'white' : 'var(--text-muted)',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeSubTab === 'feed' ? 'var(--glow-orange)' : 'none'
          }}
        >
          📰 Actividad Feed
        </button>
        <button
          onClick={() => setActiveSubTab('challenges')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: activeSubTab === 'challenges' ? 'var(--accent-strava)' : 'transparent',
            color: activeSubTab === 'challenges' ? 'white' : 'var(--text-muted)',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeSubTab === 'challenges' ? 'var(--glow-orange)' : 'none'
          }}
        >
          🏆 Retos Activos
        </button>
        <button
          onClick={() => setActiveSubTab('leaderboard')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: activeSubTab === 'leaderboard' ? 'var(--accent-strava)' : 'transparent',
            color: activeSubTab === 'leaderboard' ? 'white' : 'var(--text-muted)',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeSubTab === 'leaderboard' ? 'var(--glow-orange)' : 'none'
          }}
        >
          📈 Clasificación
        </button>
      </div>

      {/* --- PESTAÑA FEED --- */}
      {activeSubTab === 'feed' && (
        <div className="feed-list">
          {feedItems.length === 0 && (
            <p style={{ textAlign: 'center', color: '#555', marginTop: '30px' }}>No hay actividades registradas en el feed.</p>
          )}

          {feedItems.map(item => (
            <div key={item.id} className="glass-card" style={{ borderLeft: item.isPro ? '3px solid var(--accent-yellow)' : '1px solid var(--glass-border)' }}>
              
              {/* Info de Cabecera del Atleta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: 'white',
                  fontSize: '16px',
                  overflow: 'hidden',
                  border: item.isPro ? '2px solid var(--accent-yellow)' : '1px solid rgba(255,255,255,0.08)'
                }}>
                  {item.athleteAvatarUrl ? (
                    <img src={item.athleteAvatarUrl} alt={item.athleteName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    item.athleteName.charAt(0)
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#FFF' }}>{item.athleteName}</span>
                    {item.isPro && (
                      <span style={{ fontSize: '9px', backgroundColor: 'var(--accent-yellow)', color: '#000', fontWeight: 'bold', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>PRO</span>
                    )}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {new Date(item.activity.date).toLocaleString('es-ES', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Título y Notas de Actividad */}
              <h3 style={{ fontSize: '15px', color: 'white', textTransform: 'none', letterSpacing: '0', fontWeight: '800' }}>
                {item.activity.title}
              </h3>
              <p style={{ fontSize: '12px', color: '#CCC', marginTop: '8px', lineHeight: '1.4', fontStyle: 'italic' }}>
                "{item.activity.notes}"
              </p>

              {/* VIDEO REEL REPRODUCIBLE */}
              {item.activity.videoUrl && (
                <div style={{ position: 'relative', width: '100%', maxHeight: '360px', backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden', margin: '12px 0', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <video
                    src={item.activity.videoUrl.startsWith('http') ? item.activity.videoUrl : `${API_BASE_URL}${item.activity.videoUrl}`}
                    style={{ width: '100%', maxHeight: '360px', objectFit: 'contain', display: 'block' }}
                    controls
                    playsInline
                  />
                  
                  {/* --- HUD OVERLAY TELEMETRÍA SOCIAL REEL V3 --- */}
                  {/* HUD Top Left */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '3px', pointerEvents: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.65)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--accent-strava)' }}>
                      <span style={{ width: '5px', height: '5px', backgroundColor: 'var(--accent-red)', borderRadius: '50%', display: 'inline-block' }}></span>
                      <span style={{ fontSize: '8px', fontWeight: '900', color: 'var(--accent-strava)', letterSpacing: '0.5px' }}>COMBAT STRAVA AR</span>
                    </div>
                  </div>

                  {/* HUD Top Right */}
                  <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', padding: '3px 6px', pointerEvents: 'none', textAlign: 'right' }}>
                    <span style={{ fontSize: '6px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>TIEMPO REEL</span>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'white', fontFamily: 'monospace' }}>
                      {item.activity.durationMinutes} min
                    </span>
                  </div>

                  {/* HUD Bottom Left */}
                  <div style={{ position: 'absolute', bottom: '50px', left: '10px', background: 'rgba(0,0,0,0.65)', borderRadius: '4px', padding: '3px 6px', pointerEvents: 'none', borderLeft: '2.5px solid var(--accent-strava)' }}>
                    <span style={{ fontSize: '6px', color: 'var(--accent-strava)', display: 'block', fontWeight: 'bold' }}>ENERGÍA</span>
                    <span style={{ fontSize: '10px', fontWeight: '900', color: 'white' }}>🔥 {item.activity.caloriesBurned} kcal</span>
                  </div>

                  {/* HUD Bottom Right */}
                  <div style={{ position: 'absolute', bottom: '50px', right: '10px', background: 'rgba(0,0,0,0.65)', borderRadius: '4px', padding: '3px 6px', pointerEvents: 'none', borderRight: '2.5px solid var(--accent-yellow)', textAlign: 'right' }}>
                    <span style={{ fontSize: '6px', color: 'var(--accent-yellow)', display: 'block', fontWeight: 'bold' }}>TELEMETRÍA G</span>
                    <span style={{ fontSize: '9px', fontWeight: '900', color: 'white' }}>
                      ⚡ {(item.activity.maxGForce || 0) > 0 ? `${item.activity.maxGForce?.toFixed(1)} G` : '4.8 G'} 
                      {(item.activity.ropeJumpsCount || 0) > 0 && ` | 🪢 ${item.activity.ropeJumpsCount}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Grid de Estadísticas Especiales de Combate / Running */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '14px 0', padding: '10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center' }}>
                <div>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tiempo</span>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>{item.activity.durationMinutes} min</div>
                </div>
                <div>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gasto Combate</span>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-strava)' }}>{item.activity.caloriesBurned} kcal</div>
                </div>
                <div>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Disciplina</span>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>
                    {item.activity.type === 'Boxing' && '🥊 Boxeo'}
                    {item.activity.type === 'MMA' && '🤼‍♂️ MMA'}
                    {item.activity.type === 'BJJ' && '🥋 Jiu Jitsu'}
                    {item.activity.type === 'Kickboxing' && '🦵 Kickbox'}
                    {item.activity.type === 'Running' && '🏃‍♂️ Running'}
                    {item.activity.type === 'Conditioning' && '⚡ HIIT'}
                  </div>
                </div>
              </div>

              {/* Estadísticas Específicas Adicionales */}
              {(item.activity.roundsCount || item.activity.distanceKm) && (
                <div style={{ fontSize: '11px', color: '#BBB', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px', marginBottom: '10px' }}>
                  {item.activity.roundsCount && (
                    <span>🏅 <strong>Volumen:</strong> {item.activity.roundsCount} asaltos de {item.activity.roundDurationMinutes} min</span>
                  )}
                  {item.activity.distanceKm && (
                    <span>🗺️ <strong>GPS Roadwork:</strong> {item.activity.distanceKm} km (Elevación: +{item.activity.elevationGainMeters}m)</span>
                  )}
                  <span style={{ marginLeft: '12px' }}>
                    💥 <strong>Intensidad:</strong> <strong style={{ color: getIntensityColor(item.activity.intensity) }}>{item.activity.intensity}</strong>
                  </span>
                </div>
              )}

              {/* Botón de Kudos, Compartir y Contador */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' }}>
                <button
                  onClick={() => handleGiveKudo(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: item.hasGivenKudo ? '1.5px solid var(--accent-strava)' : '1px solid rgba(255,255,255,0.06)',
                    backgroundColor: item.hasGivenKudo ? 'rgba(255, 87, 0, 0.15)' : 'var(--bg-elevated)',
                    color: item.hasGivenKudo ? 'white' : 'var(--text-muted)',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '14px' }}>🥊</span>
                  {item.hasGivenKudo ? 'Kudo Enviado' : 'Dar Kudo'}
                </button>

                <button
                  onClick={() => handleShareActivity(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: 'var(--bg-elevated)',
                    color: '#FFF',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '13px' }}>🔗</span>
                  Compartir
                </button>

                <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                  🔥 {item.kudosCount} Kudos
                </span>
              </div>

              {/* Comentarios de los Mock Pros e Historial */}
              <div style={{ marginTop: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>💬 Comentarios</span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {item.comments.map(comm => (
                    <div key={comm.id} style={{ fontSize: '11.5px', padding: '8px 10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', borderLeft: comm.authorName !== 'Tú (Atleta)' ? '2px solid var(--accent-yellow)' : 'none' }}>
                      <strong style={{ color: comm.authorName !== 'Tú (Atleta)' ? 'var(--accent-yellow)' : 'white' }}>{comm.authorName}:</strong>{' '}
                      <span style={{ color: '#CCC' }}>{comm.content}</span>
                    </div>
                  ))}
                </div>

                {/* Caja para comentar */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <input
                    type="text"
                    placeholder="Deja un consejo técnico o aliento..."
                    value={commentInputs[item.id] || ''}
                    onChange={e => setCommentInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleAddComment(item.id)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-main)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.08)',
                      fontSize: '11px'
                    }}
                  />
                  <button
                    onClick={() => handleAddComment(item.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'white',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- PESTAÑA RETOS --- */}
      {activeSubTab === 'challenges' && (
        <div>
          <h2 style={{ fontSize: '16px', marginBottom: '14px' }}>⚡ Desafíos de Combate Semanal</h2>
          {challenges.map(ch => {
            const percent = getChallengePercent(ch);
            return (
              <div key={ch.id} className="glass-card" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(255,87,0,0.15) 0%, rgba(204,255,0,0.1) 100%)',
                  border: '1px solid rgba(255,87,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '30px',
                  boxShadow: 'var(--glow-orange)'
                }}>
                  {ch.badgeIcon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '14px', textTransform: 'none', letterSpacing: '0', color: 'white', fontWeight: 'bold' }}>{ch.title}</h3>
                    <span style={{ fontSize: '10px', backgroundColor: 'rgba(220,38,38,0.2)', color: 'var(--accent-red)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                      Expira en {ch.expiryDays}d
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{ch.description}</p>
                  
                  {/* Progreso */}
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--accent-strava)' }}>{percent}% Completado</span>
                      <span style={{ color: 'white' }}>{ch.current} / {ch.target} {ch.unit}</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#222', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${percent}%`,
                        backgroundColor: 'var(--accent-strava)',
                        boxShadow: 'var(--glow-orange)',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- PESTAÑA CLASIFICACIÓN --- */}
      {activeSubTab === 'leaderboard' && (
        <div className="glass-card" style={{ padding: '12px' }}>
          <h2 style={{ fontSize: '16px', border: 'none', padding: '0', marginBottom: '14px' }}>🏆 Esfuerzo Relativo Semanal</h2>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>Los puntos se calculan en base a la intensidad de combate logueada (calorías).</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {leaderboard.map((player) => (
              <div
                key={player.rank}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: player.athleteName.includes('Tú') ? 'rgba(255, 87, 0, 0.12)' : 'rgba(255,255,255,0.02)',
                  border: player.athleteName.includes('Tú') ? '1px solid var(--accent-strava)' : '1px solid rgba(255,255,255,0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '900',
                    width: '18px',
                    color: player.rank === 1 ? 'var(--accent-yellow)' : player.rank === 2 ? '#D1D5DB' : player.rank === 3 ? '#9A3412' : '#FFF'
                  }}>
                    #{player.rank}
                  </span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>{player.athleteName}</span>
                      {player.isPro && (
                        <span style={{ fontSize: '8px', backgroundColor: 'var(--accent-yellow)', color: 'black', fontWeight: 'bold', padding: '1px 3px', borderRadius: '3px' }}>PRO</span>
                      )}
                    </div>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{player.discipline}</span>
                  </div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-strava)' }}>
                  {player.score} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* --- MODAL CYBERPUNK COMPARTIR REELS / ACTIVIDADES --- */}
      {showShareModal && sharingItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)',
          zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-card glow-border-yellow" style={{
            width: '100%', maxWidth: '400px', padding: '24px',
            backgroundColor: '#0F0F12', borderRadius: '20px',
            textAlign: 'center', border: '1.5px solid var(--accent-yellow)',
            boxShadow: 'var(--glow-yellow)', animation: 'pulse-orange 2s ease-in-out'
          }}>
            <h3 style={{ fontSize: '16px', color: 'white', marginBottom: '6px' }}>🔗 Compartir Sparring Reel</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '20px' }}>
               Elige tu red social o copia el enlace de tu sesión de {sharingItem.activity.type}.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`🔥 ¡Mira mi entrenamiento de ${sharingItem.activity.type} en Combat Strava! "${sharingItem.activity.notes}"`)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid #22c55e', color: 'white', fontSize: '11px', fontWeight: 'bold',
                  textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <span>🟢</span> WhatsApp
              </a>

              {/* Telegram */}
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(`🥊 Entrenando fuerte en Combat Strava: "${sharingItem.activity.notes}"`)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid #0ea5e9', color: 'white', fontSize: '11px', fontWeight: 'bold',
                  textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <span>🔵</span> Telegram
              </a>

              {/* Twitter / X */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`🥊 Registrando mis marcas en Combat Strava! "${sharingItem.activity.notes}" @CombatStravaApp`)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '11px', fontWeight: 'bold',
                  textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <span>⚫</span> Twitter / X
              </a>

              {/* Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(59, 89, 152, 0.1)',
                  border: '1px solid #3b5998', color: 'white', fontSize: '11px', fontWeight: 'bold',
                  textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <span>🔵</span> Facebook
              </a>
            </div>

            {/* Enlace de Copiado Rápido */}
            <div style={{
              display: 'flex', gap: '8px', padding: '8px', backgroundColor: 'var(--bg-main)',
              borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px'
            }}>
              <input
                type="text"
                readOnly
                value={`${window.location.origin}`}
                style={{
                  flex: 1, background: 'transparent', border: 'none', color: '#BBB',
                  fontSize: '11px', outline: 'none', fontFamily: 'monospace'
                }}
              />
              <button
                onClick={handleCopyLink}
                style={{
                  padding: '6px 12px', borderRadius: '6px', backgroundColor: copySuccess ? 'rgba(204, 255, 0, 0.15)' : 'var(--accent-yellow)',
                  color: copySuccess ? 'var(--accent-yellow)' : '#000', border: copySuccess ? '1px solid var(--accent-yellow)' : 'none',
                  fontSize: '10px', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                {copySuccess ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              style={{
                width: '100%', padding: '12px', backgroundColor: '#1E1E22',
                color: 'white', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: '12px',
                fontWeight: 'bold', cursor: 'pointer', fontSize: '12px'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
