import React, { useState, useEffect, useRef } from 'react';
import '../assets/styles/WorkoutEngine.css';
import { routineTemplates, exerciseDatabase } from '../models/mockData';
import { WorkoutSession, Exercise } from '../models/types';
import ExerciseCard from '../components/workout/ExerciseCard';
import RestTimer from '../components/workout/RestTimer';

// Presets de entrenador de voz del usuario (6 opciones premium)
const VOICE_PROFILES = [
  { id: 'sergeant', name: '🥋 Sargento Furia', desc: 'Rápido, rudo, militar y agresivo.', rate: 1.3, pitch: 0.7, phrase: '¡Saca los codos, rompe tus límites y pelea sin miedo!' },
  { id: 'sensei', name: '🌸 Sensei Zen', desc: 'Calmo, profundo, metódico y controlado.', rate: 0.85, pitch: 0.9, phrase: 'Respira hondo. Ejecuta tu técnica con precisión perfecta.' },
  { id: 'cyborg', name: '🤖 Cyborg Operativo', desc: 'Robótico, monótono, cibernético y frío.', rate: 1.1, pitch: 0.4, phrase: 'Iniciando protocolo de combate cinético. Eficiencia al cien por ciento.' },
  { id: 'canelo', name: '🥊 Canelo Campeón', desc: 'Energético, motivacional y veloz.', rate: 1.15, pitch: 1.1, phrase: '¡Eso es! Choca los guantes, saca las manos y no te detengas.' },
  { id: 'corner', name: '⚡ Esquina Pro', desc: 'Profesional, agudo y táctico.', rate: 1.05, pitch: 1.0, phrase: 'Manos arriba, mantén la guardia alta y responde con rapidez.' },
  { id: 'mamba', name: '🐍 Mamba Mentality', desc: 'Susurrado, enfocado, tenacidad pura.', rate: 0.9, pitch: 0.8, phrase: 'Todo está en tu mente. Domina el tatami con ferocidad.' },
];

export default function WorkoutEnginePage() {
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  
  // Perfil de Voz Seleccionado
  const [selectedVoice, setSelectedVoice] = useState(() => {
    return localStorage.getItem('selected_fight_voice') || 'canelo';
  });

  // Ajustes en vivo calibrados por el usuario
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [voiceRate, setVoiceRate] = useState(1.0);

  // Estado del Ring de Voz Interactivo (Sparring Coach)
  const [activeVoiceCoachExercise, setActiveVoiceCoachExercise] = useState<Exercise | null>(null);
  const [isCoachRunning, setIsCoachRunning] = useState(false);
  const coachIntervalRef = useRef<number | null>(null);

  // Guardar configuración de voz en LocalStorage
  useEffect(() => {
    localStorage.setItem('selected_fight_voice', selectedVoice);
  }, [selectedVoice]);

  // Cargar pitch/rate específico del perfil seleccionado
  useEffect(() => {
    const profile = VOICE_PROFILES.find(p => p.id === selectedVoice) || VOICE_PROFILES[3];
    const savedPitch = parseFloat(localStorage.getItem(`fight_voice_pitch_${selectedVoice}`) || profile.pitch.toString());
    const savedRate = parseFloat(localStorage.getItem(`fight_voice_rate_${selectedVoice}`) || profile.rate.toString());
    setVoicePitch(savedPitch);
    setVoiceRate(savedRate);
  }, [selectedVoice]);

  const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVoicePitch(val);
    localStorage.setItem(`fight_voice_pitch_${selectedVoice}`, val.toString());
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVoiceRate(val);
    localStorage.setItem(`fight_voice_rate_${selectedVoice}`, val.toString());
  };

  // Limpiar temporizadores de voz
  useEffect(() => {
    return () => {
      if (coachIntervalRef.current) clearInterval(coachIntervalRef.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancelar cualquier audio anterior
      
      const utterance = new SpeechSynthesisUtterance(text);
      const profile = VOICE_PROFILES.find(p => p.id === selectedVoice) || VOICE_PROFILES[3];
      
      // Aplicar calibración manual
      const customPitch = parseFloat(localStorage.getItem(`fight_voice_pitch_${selectedVoice}`) || profile.pitch.toString());
      const customRate = parseFloat(localStorage.getItem(`fight_voice_rate_${selectedVoice}`) || profile.rate.toString());
      
      utterance.pitch = customPitch;
      utterance.rate = customRate;
      
      // Clasificación dinámica de voces para sonar humanas y realistas
      const voices = window.speechSynthesis.getVoices();
      const spanishVoices = voices.filter(v => v.lang.startsWith('es') || v.lang.includes('ES'));
      
      const femaleNames = ['sabina', 'helena', 'maria', 'paulina', 'monica', 'zira', 'daria', 'luz', 'female', 'elena', 'carmen', 'sofi'];
      const maleNames = ['daniel', 'jorge', 'pablo', 'raul', 'julio', 'carlos', 'male', 'miguel', 'enrique', 'javi'];

      let voiceToUse = null;
      const isFemalePreset = ['corner', 'mamba'].includes(selectedVoice);
      const isMalePreset = ['sergeant', 'sensei', 'canelo'].includes(selectedVoice);

      if (spanishVoices.length > 0) {
        if (isFemalePreset) {
          voiceToUse = spanishVoices.find(v => femaleNames.some(n => v.name.toLowerCase().includes(n)));
        } else if (isMalePreset) {
          voiceToUse = spanishVoices.find(v => maleNames.some(n => v.name.toLowerCase().includes(n)));
        }
        if (!voiceToUse) {
          voiceToUse = spanishVoices[0]; // Fallback al primer español
        }
      } else if (voices.length > 0) {
        if (isFemalePreset) {
          voiceToUse = voices.find(v => femaleNames.some(n => v.name.toLowerCase().includes(n)));
        } else if (isMalePreset) {
          voiceToUse = voices.find(v => maleNames.some(n => v.name.toLowerCase().includes(n)));
        }
        if (!voiceToUse) {
          voiceToUse = voices[0];
        }
      }

      if (voiceToUse) {
        utterance.voice = voiceToUse;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleTestVoice = (profileId: string) => {
    const profile = VOICE_PROFILES.find(p => p.id === profileId);
    if (profile) {
      setSelectedVoice(profileId);
      setTimeout(() => {
        const testPhrase = profile.phrase;
        speakText(testPhrase);
      }, 80);
    }
  };

  const [currentCoachPhrase, setCurrentCoachPhrase] = useState('¡Toma la guardia y prepárate!');

  const startCoachLoop = (exercise: Exercise) => {
    setActiveVoiceCoachExercise(exercise);
    setIsCoachRunning(true);
    speakText(`Iniciando entrenador virtual con ${exercise.name}. Prepara los guantes. Tres, dos, uno, ¡A pelear!`);
    
    // Frases del Entrenador por Disciplinas (Boxeo, Muay Thai, BJJ, MMA)
    let phrases: string[] = [];
    if (exercise.category === 'Boxing') {
      phrases = [
        '¡Jab, Recto! ¡Saca las manos con fuerza!',
        '¡Gancho, Cruzado! ¡Mueve la cintura!',
        '¡Esquiva a la izquierda y responde con recto de derecha!',
        '¡Uno, dos, uno, dos! ¡Más velocidad de sombra!',
        '¡Doble Jab y Hook potente al cuerpo!'
      ];
    } else if (exercise.category === 'Kickboxing') {
      phrases = [
        '¡Jab, Recto y Low Kick potente de tibia!',
        '¡Patada media, esquiva y gancho al hígado!',
        '¡Uno, dos, y Codo Slicing descendente de Muay Thai!',
        '¡Patada circular alta buscando la cabeza!',
        '¡Finta de jab, saca rodilla alta de Muay Thai!'
      ];
    } else if (exercise.category === 'BJJ') {
      phrases = [
        '¡Drill de pase toreando lateral, mantén la cadera baja!',
        '¡Captura los 100 kilos y presiona con el hombro al mentón!',
        '¡Avanza a montada completa, aísla el brazo!',
        '¡Estira la cadera y ejecuta palanca de brazo Armbar ya!',
        '¡Shrimp escape lateral rápido y recupera la guardia!'
      ];
    } else if (exercise.category === 'MMA') {
      phrases = [
        '¡Lanza uno dos, y Sprawl defensivo rápido al suelo!',
        '¡Montada en el suelo, Ground and Pound explosivo!',
        '¡Bajo axila con underhooks y empuja contra la jaula!',
        '¡Defiende derribo, sprawl, sube y patea circular!'
      ];
    } else {
      phrases = [
        `¡Dale ritmo con ${exercise.name}!`,
        '¡Mantén la tensión continua, excelente postura!',
        '¡Espalda recta y aprieta el core en cada repetición!',
        '¡Cardio al cien por ciento, no bajes el ritmo!'
      ];
    }
    
    setCurrentCoachPhrase('¡En guardia!');
    if (coachIntervalRef.current) clearInterval(coachIntervalRef.current);
    coachIntervalRef.current = window.setInterval(() => {
      const phrase = phrases[Math.floor(Math.random() * phrases.length)];
      speakText(phrase);
      setCurrentCoachPhrase(phrase);
    }, 6000);
  };

  const stopCoachLoop = () => {
    setIsCoachRunning(false);
    setActiveVoiceCoachExercise(null);
    if (coachIntervalRef.current) clearInterval(coachIntervalRef.current);
    speakText('Entrenamiento por voz pausado. Buen esfuerzo.');
  };

  const handleTriggerTimer = (seconds: number) => {
    setTimerSeconds(null); 
    setTimeout(() => {
      setTimerSeconds(seconds);
    }, 10);
  };
  
  // Custom templates from localStorage
  const [customTemplates, setCustomTemplates] = useState<WorkoutSession[]>(() => {
    const saved = localStorage.getItem('custom_templates');
    return saved ? JSON.parse(saved) : [];
  });

  const allTemplates = [...routineTemplates, ...customTemplates];

  const [selectedRoutineId, setSelectedRoutineId] = useState<string>(() => {
    return localStorage.getItem('active_routine_id') || allTemplates[0].id;
  });

  const activeRoutine = allTemplates.find(r => r.id === selectedRoutineId) || allTemplates[0];

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    localStorage.setItem('custom_templates', JSON.stringify(customTemplates));
  }, [customTemplates]);

  const changeRoutine = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedRoutineId(newId);
    localStorage.setItem('active_routine_id', newId);
  };

  const generateWithAI = () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    
    setTimeout(() => {
      const promptLow = aiPrompt.toLowerCase();
      // Simple offline AI rule engine: find exercises matching keywords
      const matched: Exercise[] = [];
      exerciseDatabase.forEach(ex => {
        if (
          promptLow.includes(ex.category.toLowerCase()) || 
          promptLow.includes(ex.name.toLowerCase().split(' ')[0]) ||
          (promptLow.includes('pecho') && ex.instructions.toLowerCase().includes('pech')) ||
          (promptLow.includes('espalda') && ex.instructions.toLowerCase().includes('dorsal')) ||
          (promptLow.includes('pierna') && ex.instructions.toLowerCase().includes('rompiendo')) ||
          (promptLow.includes('brazo') && ex.instructions.toLowerCase().includes('brazo')) ||
          (promptLow.includes('boxeo') && ex.category === 'Boxing')
        ) {
          matched.push(ex);
        }
      });

      // If no match, grab random 3
      const finalExercises = matched.length > 0 ? matched.slice(0, 5) : [exerciseDatabase[0], exerciseDatabase[4], exerciseDatabase[7]];
      
      const newTemplate: WorkoutSession = {
        id: 'ai-' + Date.now(),
        dayOfWeek: 'Día Custom IA',
        title: 'Rutina Generada: ' + aiPrompt.substring(0, 20) + '...',
        focus: 'Generación Automática IA',
        exercises: finalExercises
      };

      const updated = [...customTemplates, newTemplate];
      setCustomTemplates(updated);
      setSelectedRoutineId(newTemplate.id);
      localStorage.setItem('active_routine_id', newTemplate.id);
      setIsGenerating(false);
      setIsBuilderOpen(false);
      setAiPrompt('');
    }, 1500);
  };

  // State para Constructor Manual
  const [manualExercises, setManualExercises] = useState<Exercise[]>([]);
  const [manualTitle, setManualTitle] = useState('');

  const addManualExercise = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const exId = e.target.value;
    const ex = exerciseDatabase.find(x => x.id === exId);
    if (ex) setManualExercises([...manualExercises, ex]);
    e.target.value = '';
  };

  const saveManualRoutine = () => {
    if (manualExercises.length === 0 || !manualTitle) return;
    const newTemplate: WorkoutSession = {
      id: 'man-' + Date.now(),
      dayOfWeek: 'Día Manual',
      title: manualTitle,
      focus: 'Creada Manualmente',
      exercises: manualExercises
    };
    setCustomTemplates([...customTemplates, newTemplate]);
    setSelectedRoutineId(newTemplate.id);
    setIsBuilderOpen(false);
    setManualTitle('');
    setManualExercises([]);
  };

  return (
    <div className="workout-engine-container" style={{ paddingBottom: '40px' }}>
      <div className="workout-header" style={{ position: 'relative' }}>
        <button 
          onClick={() => setIsBuilderOpen(!isBuilderOpen)}
          style={{ 
            position: 'absolute', top: 0, right: 0, 
            background: 'var(--accent-red)', color: 'white', 
            padding: '8px 14px', borderRadius: '8px', border: 'none', 
            cursor: 'pointer', fontSize: '11px', fontWeight: '900',
            textTransform: 'uppercase', letterSpacing: '0.5px',
            boxShadow: 'var(--glow-red)'
          }}
        >
          {isBuilderOpen ? 'Cerrar Constructor' : '✨ Crear Rutina IA/Manual'}
        </button>

        <select 
          value={selectedRoutineId} 
          onChange={changeRoutine}
          style={{ 
            width: '100%', marginTop: '45px', padding: '12px', 
            backgroundColor: 'var(--bg-elevated)', color: 'white', 
            border: '1.5px solid var(--glass-border)', borderRadius: '10px', 
            marginBottom: '20px', fontFamily: 'var(--font-metrics)', 
            fontWeight: 'bold', fontSize: '13px' 
          }}
        >
          <optgroup label="Semanas Pre-Programadas">
            {routineTemplates.map(tpl => (
              <option key={tpl.id} value={tpl.id}>{tpl.title}</option>
            ))}
          </optgroup>
          {customTemplates.length > 0 && (
            <optgroup label="Tus Rutinas Personalizadas">
              {customTemplates.map(tpl => (
                 <option key={tpl.id} value={tpl.id}>{tpl.title}</option>
              ))}
            </optgroup>
          )}
        </select>

        <h1>{activeRoutine.title}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>🎯 Enfoque: {activeRoutine.focus}</p>
      </div>

      {/* --- PANEL DE CONFIGURACIÓN DE VOZ DE ENTRENADOR EN VIVO (6 OPCIONES) --- */}
      <section className="glass-card" style={{ borderLeft: '4px solid var(--accent-yellow)', background: 'rgba(223, 255, 0, 0.03)', marginTop: '10px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          🎙️ Configurar Entrenador Virtual
        </h3>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Selecciona una de las 6 voces disponibles para que cante combinaciones y dirija tus asaltos.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '12px' }}>
          {VOICE_PROFILES.map((profile) => {
            const isSelected = selectedVoice === profile.id;
            return (
              <div
                key={profile.id}
                onClick={() => setSelectedVoice(profile.id)}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? 'rgba(223, 255, 0, 0.08)' : 'rgba(255,255,255,0.01)',
                  border: isSelected ? '1.5px solid var(--accent-yellow)' : '1px solid rgba(255,255,255,0.05)',
                  boxShadow: isSelected ? 'var(--glow-yellow)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: isSelected ? '#FFF' : '#DDD' }}>{profile.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestVoice(profile.id);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: 'var(--accent-yellow)',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      fontSize: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Probar voz"
                  >
                    ▶
                  </button>
                </div>
                <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.2' }}>{profile.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Sliders de Ajuste Fino de Calibración Humana */}
        <div style={{
          marginTop: '15px',
          padding: '12px',
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', color: 'var(--accent-yellow)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ⚡ Calibrador de Voz Humana
            </span>
            <button
              onClick={() => {
                // Restablecer valores por defecto del perfil actual
                const profile = VOICE_PROFILES.find(p => p.id === selectedVoice) || VOICE_PROFILES[3];
                setVoicePitch(profile.pitch);
                setVoiceRate(profile.rate);
                localStorage.removeItem(`fight_voice_pitch_${selectedVoice}`);
                localStorage.removeItem(`fight_voice_rate_${selectedVoice}`);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}
            >
              🔄 reset
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#BBB', marginBottom: '4px' }}>
                <span>Tono (Pitch)</span>
                <span>{voicePitch.toFixed(2)}</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="1.7" 
                step="0.05"
                value={voicePitch}
                onChange={handlePitchChange}
                style={{ width: '100%', accentColor: 'var(--accent-yellow)', cursor: 'pointer' }}
              />
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#BBB', marginBottom: '4px' }}>
                <span>Velocidad (Rate)</span>
                <span>{voiceRate.toFixed(2)}</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="1.7" 
                step="0.05"
                value={voiceRate}
                onChange={handleRateChange}
                style={{ width: '100%', accentColor: 'var(--accent-yellow)', cursor: 'pointer' }}
              />
            </div>
          </div>
          <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', marginTop: '6px', lineHeight: '1.2' }}>
            Nota: Ajusta los controles para aproximar el sintetizador a una voz humana eufónica en tu dispositivo.
          </span>
        </div>
      </section>

      {/* --- HUD DE ENTRENAMIENTO POR VOZ ACTIVO --- */}
      {isCoachRunning && activeVoiceCoachExercise && (
        <section 
          className="glass-card flicker-animation" 
          style={{ 
            border: '2px solid var(--accent-yellow)', 
            background: 'rgba(223, 255, 0, 0.06)', 
            boxShadow: 'var(--glow-yellow)',
            textAlign: 'center',
            padding: '24px 18px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--accent-yellow)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              🎙️ Sparring Virtual Activo
            </span>
            <span style={{ fontSize: '9px', background: 'rgba(0,0,0,0.4)', color: '#FFF', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
              Coach: {VOICE_PROFILES.find(p => p.id === selectedVoice)?.name.split(' ')[1]}
            </span>
          </div>

          <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>Ejercicio Activo</h4>
          <h2 style={{ fontSize: '18px', color: 'white', margin: '4px 0 16px 0', textTransform: 'none', letterSpacing: 0 }}>
            {activeVoiceCoachExercise.name}
          </h2>

          <div 
            style={{ 
              padding: '20px 10px', 
              background: 'rgba(0,0,0,0.4)', 
              borderRadius: '12px', 
              margin: '10px 0 20px 0',
              border: '1px solid rgba(223, 255, 0, 0.15)'
            }}
          >
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>Indicación en vivo:</span>
            <p className="glow-text-yellow" style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-yellow)', margin: 0, lineHeight: '1.2' }}>
              {currentCoachPhrase}
            </p>
          </div>

          <button
            onClick={stopCoachLoop}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'var(--accent-red)',
              color: 'white',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontSize: '12px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              boxShadow: 'var(--glow-red)'
            }}
          >
            ⏹️ Detener Entrenador
          </button>
        </section>
      )}

      {isBuilderOpen && (
        <div style={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--accent-red)', marginBottom: '10px' }}>✨ Generador IA (Offline)</h3>
          <p style={{ fontSize: '12px', color: '#AAA', marginBottom: '10px' }}>Dile a la IA qué quieres entrenar hoy. (Ej: "Quiero hipertrofia de pecho y algo de boxeo")</p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
             <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Escribe tu objetivo..." style={{ flex: 1, padding: '8px', borderRadius: '4px', backgroundColor: '#222', color: '#FFF', border: '1px solid #444' }} />
             <button onClick={generateWithAI} style={{ padding: '8px 12px', backgroundColor: 'var(--accent-blue)', color: 'black', fontWeight: 'bold', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
               {isGenerating ? 'Calculando...' : 'Generar'}
             </button>
          </div>

          <hr style={{ borderColor: '#333', margin: '20px 0' }} />

          <h3 style={{ color: 'var(--accent-blue)', marginBottom: '10px' }}>🛠️ Constructor Manual</h3>
          <input type="text" value={manualTitle} onChange={e => setManualTitle(e.target.value)} placeholder="Nombre de tu rutina..." style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#222', color: '#FFF', border: '1px solid #444', marginBottom: '10px' }} />
          <select onChange={addManualExercise} defaultValue="" style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#222', color: '#FFF', border: '1px solid #444', marginBottom: '10px' }}>
            <option value="" disabled>+ Añadir ejercicio a la lista...</option>
            {exerciseDatabase.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name} ({ex.category})</option>
            ))}
          </select>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            {manualExercises.map((ex, i) => (
              <span key={i} style={{ fontSize: '10px', background: '#333', padding: '4px 8px', borderRadius: '4px' }}>{ex.name}</span>
            ))}
          </div>
          <button onClick={saveManualRoutine} style={{ width: '100%', padding: '8px', backgroundColor: '#444', color: 'white', fontWeight: 'bold', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Guardar Rutina Manual</button>
        </div>
      )}

      <div className="exercises-list">
        {activeRoutine.exercises.map(ex => (
          <ExerciseCard 
            key={ex.id} 
            exercise={ex} 
            onTriggerTimer={handleTriggerTimer} 
            onStartVoiceCoach={
              ['Boxing', 'Kickboxing', 'BJJ', 'MMA'].includes(ex.category) ? () => startCoachLoop(ex) : undefined
            }
            isVoiceCoachRunning={activeVoiceCoachExercise?.id === ex.id && isCoachRunning}
          />
        ))}
      </div>

      <div className={`timer-wrapper ${timerSeconds !== null ? 'visible' : ''}`}>
        {timerSeconds !== null && (
           <>
             <button 
               style={{
                 position: 'absolute', top: '-15px', right: '20px', 
                 background: '#333', border: 'none', color: '#fff', 
                 borderRadius: '50%', width: '30px', height: '30px', 
                 fontWeight: 'bold', cursor: 'pointer'
               }}
               onClick={() => setTimerSeconds(null)}
             >
               X
             </button>
             <RestTimer 
               initialSeconds={timerSeconds} 
               onComplete={() => setTimerSeconds(null)}
             />
           </>
        )}
      </div>
    </div>
  );
}
