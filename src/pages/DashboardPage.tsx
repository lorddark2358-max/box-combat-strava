import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../assets/styles/Dashboard.css';
import '../assets/styles/Progress.css';
import { currentUser, routineTemplates } from '../models/mockData';
import { calc1RM } from '../utils/calc1RM';
import { api } from '../utils/api';

interface HistoryItem {
  id?: number;
  date: string;
  exerciseName: string;
  kg: number;
  reps: number;
}

export default function DashboardPage() {
  const [calsConsumed, setCalsConsumed] = useState(0);
  const [proteinConsumed, setProteinConsumed] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  const [streak, setStreak] = useState(currentUser.stats.currentStreakDays);
  
  // Lógica del Gráfico de Progreso 1RM
  const [progressData, setProgressData] = useState<any[]>([]);
  const [isPlateau, setIsPlateau] = useState(false);

  // Lema dinámico del administrador SQLite
  const [motivationText, setMotivationText] = useState('Listo para romper tus límites hoy.');

  // --- LOGROS Y TROFEOS V3 ---
  const [userEmail, setUserEmail] = useState('user@combat.com');
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(true);

  // Perfil antropométrico, gimnasio y peso de SQLite
  const [profile, setProfile] = useState<any>(null);
  const [gym, setGym] = useState<any>(null);
  const [weightHistoryData, setWeightHistoryData] = useState<any[]>([]);

  // Leer sesión activa
  useEffect(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('combat_strava_user') || '{}');
      if (savedUser && savedUser.email) {
        setUserEmail(savedUser.email);
      }
    } catch (e) {}
  }, []);

  // Cargar perfil del atleta, su racha, gym y peso histórico
  useEffect(() => {
    const loadProfileData = async () => {
      if (userEmail) {
        try {
          const res = await api.getUserProfile(userEmail);
          if (res.success) {
            setProfile(res.profile);
            setGym(res.gym);
            setStreak(res.profile.streak);
            
            // Llenar el gráfico de peso corporal
            if (res.weightHistory && Array.isArray(res.weightHistory)) {
              const formatted = res.weightHistory.map((item: any) => ({
                date: new Date(item.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
                'Peso (kg)': item.weight
              }));
              setWeightHistoryData(formatted);
            }
          }
        } catch (e) {
          console.error('Error al cargar perfil en dashboard:', e);
        }
      }
    };
    loadProfileData();
    window.addEventListener('activityRecorded', loadProfileData);
    window.addEventListener('gymBrandingUpdated', loadProfileData);
    return () => {
      window.removeEventListener('activityRecorded', loadProfileData);
      window.removeEventListener('gymBrandingUpdated', loadProfileData);
    };
  }, [userEmail]);

  const fetchAchievements = async (email: string) => {
    try {
      const res = await api.getAchievements(email);
      if (res && Array.isArray(res)) {
        setAchievements(res);
      }
    } catch (e) {
      console.error('Error al cargar logros:', e);
    } finally {
      setIsLoadingAchievements(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchAchievements(userEmail);
    }
    // Recargar logros si se registra una actividad o si hay evento
    const handleActivity = () => fetchAchievements(userEmail);
    window.addEventListener('activityRecorded', handleActivity);
    return () => {
      window.removeEventListener('activityRecorded', handleActivity);
    };
  }, [userEmail]);

  useEffect(() => {
    const fetchDashboardConfig = async () => {
      try {
        const config = await api.getAdminConfig();
        if (config && config.textMotivation) {
          setMotivationText(config.textMotivation);
        }
      } catch (e) {}
    };
    fetchDashboardConfig();
    window.addEventListener('adminConfigUpdated', fetchDashboardConfig);
    window.addEventListener('gymBrandingUpdated', fetchDashboardConfig);
    return () => {
      window.removeEventListener('adminConfigUpdated', fetchDashboardConfig);
      window.removeEventListener('gymBrandingUpdated', fetchDashboardConfig);
    };
  }, []);

  const activeRoutineId = localStorage.getItem('active_routine_id') || routineTemplates[0].id;
  const activeRoutine = routineTemplates.find(r => r.id === activeRoutineId) || routineTemplates[0];

  useEffect(() => {
    // Sincronizar fecha y hora
    const interval = setInterval(() => {
      setCurrentDate(new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    }, 60000); // Check every minute
    
    // Cargar comidas planificadas para calcular calorías y proteínas consumidas hoy
    try {
      const savedMeals = JSON.parse(localStorage.getItem('planned_meals') || '[]');
      const totals = savedMeals.reduce((acc: any, meal: any) => {
        acc.cals += meal.calories;
        acc.protein += meal.protein;
        return acc;
      }, { cals: 0, protein: 0 });
      setCalsConsumed(totals.cals);
      setProteinConsumed(totals.protein);
    } catch (e) {
      console.error(e);
    }

    // Logica de Racha (Streak)
    try {
      const history = JSON.parse(localStorage.getItem('workout_history') || '[]');
      if (history.length > 0) {
        const lastEntry = history[history.length - 1];
        const lastDate = new Date(lastEntry.date).getTime();
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const diffTime = Math.abs(today.getTime() - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Si han pasado más de 1 día (ayer) y no se ha entrenado hoy, se rompe la racha.
        if (diffDays > 1) {
          setStreak(0);
        }
      }
    } catch(e) {
      console.error(e);
    }

    // Cargar historial para el gráfico 1RM de Fuerza (de Press de Banca)
    try {
      const rawHistory = localStorage.getItem('workout_history');
      let history: HistoryItem[] = rawHistory ? JSON.parse(rawHistory) : [];
      
      // Inject mock history for the chart to look good if not enough local data
      if (history.filter(h => h.exerciseName === 'Press de Banca Libre' || h.exerciseName === 'Press de Banca').length < 2) {
        const mockHistory = [
          { date: '2026-05-10', exerciseName: 'Press de Banca Libre', kg: 60, reps: 5 },
          { date: '2026-05-17', exerciseName: 'Press de Banca Libre', kg: 62.5, reps: 5 },
          { date: '2026-05-24', exerciseName: 'Press de Banca Libre', kg: 65, reps: 4 },
        ];
        history = [...mockHistory, ...history];
      }

      const benchPressData = history.filter(h => h.exerciseName === 'Press de Banca Libre' || h.exerciseName === 'Press de Banca');
      
      const chartData = benchPressData.map(h => ({
        date: h.date.substring(5), // Keep MM-DD
        '1RM Estimado': calc1RM(h.kg, h.reps)
      }));
      
      setProgressData(chartData);

      if (benchPressData.length >= 2) {
        const last = benchPressData[benchPressData.length - 1];
        const prev = benchPressData[benchPressData.length - 2];
        if (last.kg === prev.kg && last.reps === prev.reps) {
          setIsPlateau(true);
        } else {
          setIsPlateau(false);
        }
      }
    } catch(e) {
      console.error(e);
    }

    return () => clearInterval(interval);
  }, []);

  // Cargar calorías del ejercicio quemadas hoy desde LocalStorage
  const [calsBurnedToday, setCalsBurnedToday] = useState(() => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const savedActivities = JSON.parse(localStorage.getItem('recorded_activities') || '[]');
      const todayActivities = savedActivities.filter((act: any) => act.date.startsWith(todayStr));
      return todayActivities.reduce((sum: number, act: any) => sum + act.caloriesBurned, 0);
    } catch (e) {
      return 0;
    }
  });

  // Escuchar cambios en LocalStorage para actualizar en tiempo real
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const savedActivities = JSON.parse(localStorage.getItem('recorded_activities') || '[]');
        const todayActivities = savedActivities.filter((act: any) => act.date.startsWith(todayStr));
        setCalsBurnedToday(todayActivities.reduce((sum: number, act: any) => sum + act.caloriesBurned, 0));
        
        const savedMeals = JSON.parse(localStorage.getItem('planned_meals') || '[]');
        const totals = savedMeals.reduce((acc: any, meal: any) => {
          acc.cals += meal.calories;
          acc.protein += meal.protein;
          return acc;
        }, { cals: 0, protein: 0 });
        setCalsConsumed(totals.cals);
        setProteinConsumed(totals.protein);
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    // Disparador manual local para actualizar cuando grabamos en la misma pestaña
    window.addEventListener('activityRecorded', handleStorageChange);
    window.addEventListener('mealsUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('activityRecorded', handleStorageChange);
      window.removeEventListener('mealsUpdated', handleStorageChange);
    };
  }, []);

  // Presupuesto dinámico: Meta + Quemado por entrenamiento
  const totalCalorieGoal = currentUser.nutritionGoal.calories + calsBurnedToday;
  const ringPercentage = Math.min((calsConsumed / totalCalorieGoal) * 100, 100);
  const proteinPercentage = Math.min((proteinConsumed / currentUser.nutritionGoal.proteinGrams) * 100, 100);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Centro de Comando</h1>
        <p className="subtitle" style={{ textTransform: 'capitalize' }}>{currentDate}</p>
        <p className="subtitle text-orange">{motivationText}</p>
      </header>

      {/* Racha y Peso */}
      <section className="stats-grid">
        <div className="stat-card glass-card">
          <span className="stat-label">Peso Corporal</span>
          <span className="stat-value">{(profile && profile.weight > 0) ? profile.weight : currentUser.weightKg} <small>kg</small></span>
        </div>
        <div className="stat-card glass-card">
          <span className="stat-label">Racha Activa</span>
          <span className="stat-value highlight">{streak} <small>días</small></span>
          {streak === 0 && <span style={{fontSize: '10px', color: 'var(--accent-red)'}}>Racha perdida</span>}
        </div>
      </section>


      {/* --- VITRINA DE LOGROS (TROPHY ROOM) V3 --- */}
      <section className="achievements-section" style={{ marginTop: '22px', marginBottom: '22px' }}>
        <h2 style={{ fontSize: '15px', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          🏆 Vitrina de Trofeos
        </h2>
        
        {isLoadingAchievements ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '12px', textAlign: 'center' }}>
            Sincronizando logros de la nube...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            {achievements.map((ach) => {
              const isUnlocked = ach.unlocked === 1;
              const isCanelo = ach.achievementId === 'canelo';
              const isShadow = ach.achievementId === 'shadow';
              const isTatami = ach.achievementId === 'tatami';
              
              // Colores y medallas neón personalizadas según el logro
              let accentColor = 'var(--accent-strava)';
              let glowStyle = 'var(--glow-orange)';
              let badge = '🏆';
              let title = 'Logro';
              let desc = 'Descripción';
              let unit = '';
              
              if (isCanelo) {
                accentColor = 'var(--accent-red)';
                glowStyle = 'var(--glow-red)';
                badge = '🥊';
                title = 'Insignia de Canelo';
                desc = 'Completa 12 asaltos seguidos de Boxeo o Kickboxing';
                unit = 'rounds';
              } else if (isShadow) {
                accentColor = 'var(--accent-yellow)';
                glowStyle = 'var(--glow-yellow)';
                badge = '⚡';
                title = 'Velocidad de Sombra';
                desc = 'Registra un golpe de > 8.0 G con acelerómetro (simulado o real)';
                unit = 'G';
              } else if (isTatami) {
                accentColor = '#00C8FF'; // Turquesa
                glowStyle = '0 0 15px rgba(0,200,255,0.4)';
                badge = '🥋';
                title = 'Rey del Tatami';
                desc = 'Sube 3 videos de Jiu Jitsu (BJJ) en los últimos 7 días';
                unit = 'videos';
              }

              const progressPct = Math.min((ach.progress / ach.target) * 100, 100);

              return (
                <div 
                  key={ach.achievementId}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px',
                    borderRadius: '14px',
                    border: isUnlocked ? `1.5px solid ${accentColor}` : '1px solid rgba(255,255,255,0.04)',
                    boxShadow: isUnlocked ? glowStyle : 'none',
                    opacity: isUnlocked ? 1 : 0.65,
                    background: isUnlocked 
                      ? `linear-gradient(135deg, rgba(11,11,12,0.9) 70%, ${accentColor}15 100%)`
                      : 'var(--bg-elevated)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Glowing vertical bar */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    backgroundColor: isUnlocked ? accentColor : '#3F3F46',
                    boxShadow: isUnlocked ? glowStyle : 'none'
                  }}></div>

                  {/* Badge visual */}
                  <div style={{
                    fontSize: '28px',
                    width: '54px',
                    height: '54px',
                    borderRadius: '10px',
                    backgroundColor: isUnlocked ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isUnlocked ? `1.5px solid ${accentColor}` : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: isUnlocked ? glowStyle : 'none',
                    filter: isUnlocked ? 'none' : 'grayscale(100%)'
                  }}>
                    {badge}
                  </div>

                  {/* Contenido descriptivo */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '900', color: '#FFF', margin: 0 }}>
                        {title}
                      </h4>
                      {isUnlocked ? (
                        <span style={{ fontSize: '8px', textTransform: 'uppercase', padding: '1px 5px', borderRadius: '4px', backgroundColor: accentColor, color: isShadow ? '#000' : '#FFF', fontWeight: 'bold' }}>
                          ✓ OBTENIDO
                        </span>
                      ) : (
                        <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>🔒 Bloqueado</span>
                      )}
                    </div>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '3px 0 6px 0', lineHeight: '1.2' }}>
                      {desc}
                    </p>

                    {/* Progress Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '4px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${progressPct}%`,
                          backgroundColor: isUnlocked ? accentColor : '#52525B',
                          boxShadow: isUnlocked ? glowStyle : 'none',
                          transition: 'width 0.5s ease'
                        }}></div>
                      </div>
                      <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#AAA', minWidth: '45px', textAlign: 'right' }}>
                        {parseFloat(ach.progress.toFixed(1))} / {ach.target} {unit}
                      </span>
                    </div>
                    
                    {isUnlocked && ach.unlockedAt && (
                      <span style={{ fontSize: '8px', color: accentColor, display: 'block', marginTop: '4px', fontWeight: 'bold' }}>
                        🏆 Ganado el {new Date(ach.unlockedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Alertas de estancamiento (Plateau) */}
      {isPlateau && (
        <div className="alert-box glass-card" style={{ borderLeft: '4px solid var(--accent-yellow)', background: 'rgba(204, 255, 0, 0.05)' }}>
          <h4 style={{ color: 'var(--accent-yellow)', display: 'flex', alignItems: 'center', gap: '6px' }}>⚠️ Alerta de Fuerza</h4>
          <p style={{ fontSize: '12px', color: '#CCC', marginTop: '6px' }}>
            Tu fuerza se ha estabilizado en <strong>Press de Banca</strong>. Prueba agregar 1-2 kg a la barra en la siguiente sesión para activar la sobrecarga progresiva.
          </p>
        </div>
      )}

      {/* Gasto de Entrenamiento del Día */}
      {calsBurnedToday > 0 && (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-strava)', background: 'rgba(255, 87, 0, 0.08)' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent-strava)', fontWeight: 'bold' }}>⚡ Bonus Roadwork / Sparring</span>
          <h3 style={{ marginTop: '4px', fontSize: '20px' }}>+{calsBurnedToday} kcal quemadas hoy</h3>
          <p style={{ fontSize: '11px', color: '#AAA', marginTop: '4px' }}>Presupuesto calórico diario expandido para recuperación celular.</p>
        </div>
      )}

      {/* Rutina Activa */}
      <section className="workout-summary">
        <h2>Rutina de Hoy</h2>
        <div className="workout-card glass-card">
          <div className="workout-info">
            <span style={{ fontSize: '10px', background: 'var(--accent-red)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{activeRoutine.dayOfWeek}</span>
            <h3 style={{ marginTop: '8px' }}>{activeRoutine.title}</h3>
            <p style={{ fontSize: '13px', color: '#AAA', marginTop: '4px' }}>🎯 Enfoque: {activeRoutine.focus}</p>
          </div>
        </div>
      </section>

      {/* Combustible / Dieta Resumida */}
      <section className="nutrition-summary">
        <h2>Combustible Diario</h2>
        <div className="nutrition-card glass-card">
          <div className="progress-ring-container">
             <svg className="progress-ring" viewBox="0 0 100 100">
               <circle className="ring-bg" cx="50" cy="50" r="40" />
               <circle 
                 className="ring-progress" 
                 cx="50" cy="50" r="40" 
                 strokeDasharray={`${(ringPercentage / 100) * 251.2} 251.2`} 
                 style={{ stroke: 'var(--accent-strava)', filter: 'drop-shadow(var(--glow-orange))' }}
               />
             </svg>
             <div className="ring-content">
               <span className="ring-cals" style={{ fontSize: '20px', fontWeight: '800' }}>{calsConsumed}</span>
               <span className="ring-label" style={{ fontSize: '10px' }}>/ {totalCalorieGoal} kcal</span>
             </div>
          </div>
          <div className="macro-details">
            <div className="macro-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span>Proteínas</span>
                <span>{proteinConsumed}g / {currentUser.nutritionGoal.proteinGrams}g</span>
              </div>
              <div className="macro-bar-bg" style={{ backgroundColor: '#222', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                <div 
                  className="macro-bar-fill" 
                  style={{ width: `${proteinPercentage}%`, backgroundColor: 'var(--accent-yellow)', height: '100%', borderRadius: '3px', boxShadow: 'var(--glow-yellow)' }}>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fuerza y Rendimiento */}
      <section className="strength-progress">
        <h2>Fuerza / 1RM Estimado</h2>
        <div className="chart-card glass-card">
          <h3 style={{ fontSize: '14px', color: '#FFF', marginBottom: '10px' }}>Press de Banca Libre</h3>
          <div style={{ width: '100%', height: 180, marginTop: '10px' }}>
            <ResponsiveContainer>
              <LineChart data={progressData} margin={{ top: 5, right: 10, left: -30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="date" stroke="#71717A" fontSize={10} tickMargin={8} />
                <YAxis stroke="#71717A" fontSize={10} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141416', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--accent-strava)', fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="1RM Estimado" 
                  stroke="var(--accent-strava)" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'var(--accent-strava)', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: 'var(--accent-yellow)', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Control de Peso Corporal */}
      {weightHistoryData.length > 0 && (
        <section className="strength-progress" style={{ marginTop: '20px' }}>
          <h2>Progreso Físico / Peso Corporal</h2>
          <div className="chart-card glass-card">
            <h3 style={{ fontSize: '14px', color: '#FFF', marginBottom: '10px' }}>Evolución de Peso</h3>
            <div style={{ width: '100%', height: 180, marginTop: '10px' }}>
              <ResponsiveContainer>
                <LineChart data={weightHistoryData} margin={{ top: 5, right: 10, left: -30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="date" stroke="#71717A" fontSize={10} tickMargin={8} />
                  <YAxis stroke="#71717A" fontSize={10} domain={['dataMin - 3', 'dataMax + 3']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141416', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--accent-yellow)', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Peso (kg)" 
                    stroke="var(--accent-yellow)" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: 'var(--accent-yellow)', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: 'var(--accent-strava)', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
