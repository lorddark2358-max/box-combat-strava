import React, { useState, useEffect, useRef } from 'react';
import { mockRoutes } from '../models/mockData';
import { Activity, Route } from '../models/types';
import { api } from '../utils/api';

interface RecordActivityPageProps {
  onNavigateToFeed: () => void;
}

export default function RecordActivityPage({ onNavigateToFeed }: RecordActivityPageProps) {
  const [activityType, setActivityType] = useState<'Boxing' | 'MMA' | 'BJJ' | 'Kickboxing' | 'Running' | 'Conditioning'>('Boxing');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // --- NUEVOS ESTADOS Y REFERENCIAS PARA GRABAR VIDEO (REEL) ---
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [isCamActive, setIsCamActive] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoTimer, setVideoTimer] = useState(0);
  const [recordingMode, setRecordingMode] = useState<'video' | 'reel'>('video');

  // --- TELEMETRÍA KINÉTICA DE ACELERÓMETRO Y FALLBACK V3 ---
  const [maxGForce, setMaxGForce] = useState(0);
  const [ropeJumps, setRopeJumps] = useState(0);
  const maxGDetectRef = useRef<number>(0);
  const ropeJumpsRef = useRef<number>(0);
  const lastJumpTimeRef = useRef<number>(0);

  // Sintetizador de sonido explosivo para PC shadowbox
  const playImpactSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  };

  // Simulación PC de golpe de sombra
  const handleSimulateStrike = () => {
    const randomG = parseFloat((4.5 + Math.random() * 7).toFixed(1));
    if (randomG > maxGDetectRef.current) {
      maxGDetectRef.current = randomG;
      setMaxGForce(randomG);
    }
    playImpactSound();
  };

  // Simulación PC de salto de cuerda
  const handleSimulateJump = () => {
    ropeJumpsRef.current += 1;
    setRopeJumps(ropeJumpsRef.current);
    // Sonido sutil de salto de cuerda sintetizado
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch(e) {}
  };

  // Escuchar acelerómetro real en celulares
  useEffect(() => {
    let handleMotion: any;
    
    if (isRecording && !isPaused) {
      handleMotion = (e: DeviceMotionEvent) => {
        const accel = e.accelerationIncludingGravity || e.acceleration;
        if (!accel) return;
        const x = accel.x || 0;
        const y = accel.y || 0;
        const z = accel.z || 0;
        
        // Magnitud de la fuerza G
        const mag = Math.sqrt(x*x + y*y + z*z) / 9.80665;
        if (mag > maxGDetectRef.current) {
          maxGDetectRef.current = parseFloat(mag.toFixed(1));
          setMaxGForce(maxGDetectRef.current);
        }
        
        // Salto vertical (eje Y)
        const now = Date.now();
        if (y > 14 && now - lastJumpTimeRef.current > 350) {
          ropeJumpsRef.current += 1;
          setRopeJumps(ropeJumpsRef.current);
          lastJumpTimeRef.current = now;
        }
      };

      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      if (handleMotion) {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, [isRecording, isPaused]);
  
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const activeSessionVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoTimerRef = useRef<number | null>(null);
  
  // Formulario final
  const [notes, setNotes] = useState('');
  const [intensity, setIntensity] = useState<'Baja' | 'Media' | 'Alta' | 'Extrema'>('Media');
  const [activityTitle, setActivityTitle] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  // Ocultar Jiu Jitsu si el administrador lo decide
  const [showBJJ, setShowBJJ] = useState(true);

  useEffect(() => {
    const fetchBjjConfig = async () => {
      try {
        const config = await api.getAdminConfig();
        if (config) {
          setShowBJJ(config.showBJJ !== false);
        }
      } catch (e) {}
    };
    fetchBjjConfig();
    window.addEventListener('adminConfigUpdated', fetchBjjConfig);
    return () => {
      window.removeEventListener('adminConfigUpdated', fetchBjjConfig);
    };
  }, []);

  // Configuración de Combate
  const [targetRounds, setTargetRounds] = useState(3);
  const [roundDuration, setRoundDuration] = useState(3); // minutos
  const [restDuration, setRestDuration] = useState(60); // segundos
  
  // Estado de Combate Activo
  const [currentRound, setCurrentRound] = useState(1);
  const [combatPhase, setCombatPhase] = useState<'Fight' | 'Rest' | 'Completed'>('Fight');
  const [roundSecondsLeft, setRoundSecondsLeft] = useState(3 * 60);

  // Configuración de Running
  const [selectedRouteId, setSelectedRouteId] = useState(mockRoutes[0].id);
  const selectedRoute = mockRoutes.find(r => r.id === selectedRouteId) || mockRoutes[0];
  const [runDistance, setRunDistance] = useState(0);
  
  // Referencias para animar el Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  // --- AUDIO SYNTH PARA CAMPANA DE GOLPEO (BEEP DE BOXEO) ---
  const playBellSound = (highTone = true) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        
        gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);
        
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      if (highTone) {
        // Campana de inicio: Tono agudo doble
        playTone(880, 0, 0.4);
        playTone(880, 0.2, 0.4);
      } else {
        // Campana de descanso: Tono grave doble
        playTone(440, 0, 0.5);
        playTone(440, 0.3, 0.5);
      }
    } catch (e) {
      console.error('AudioContext fail', e);
    }
  };

  // --- CONTROL DE TIEMPO PRINCIPAL ---
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setSecondsElapsed(prev => prev + 1);

        if (activityType === 'Running') {
          // Aumentar distancia simulada
          setRunDistance(prev => {
            const speed = 0.003; // km por segundo aproximado (~5 min/km)
            const targetDist = selectedRoute.distanceKm;
            return Math.min(prev + speed, targetDist);
          });
        } else if (activityType !== 'Conditioning') {
          // Lógica de Asaltos de Combate
          setRoundSecondsLeft(prev => {
            if (prev <= 1) {
              if (combatPhase === 'Fight') {
                if (currentRound >= targetRounds) {
                  // Completado
                  playBellSound(true);
                  setCombatPhase('Completed');
                  setIsRecording(false);
                  setShowSaveForm(true);
                  return 0;
                } else {
                  // Ir a descanso
                  playBellSound(false);
                  setCombatPhase('Rest');
                  return restDuration;
                }
              } else {
                // Terminar descanso, volver a pelear
                playBellSound(true);
                setCurrentRound(r => r + 1);
                setCombatPhase('Fight');
                return roundDuration * 60;
              }
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused, activityType, combatPhase, currentRound, targetRounds, roundDuration, restDuration, selectedRouteId]);

  // Inicializar temporizadores de combate al cambiar configs
  useEffect(() => {
    if (!isRecording) {
      setRoundSecondsLeft(roundDuration * 60);
      setCurrentRound(1);
      setCombatPhase('Fight');
    }
  }, [roundDuration, restDuration, targetRounds, activityType, isRecording]);

  // --- ANIMACIÓN DEL LIENZO DE RUTA (CANVAS GPS SIMULADOR) ---
  useEffect(() => {
    if (activityType === 'Running' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animId: number;

      const drawMap = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const pts = selectedRoute.points;
        if (!pts || pts.length === 0) return;

        // 1. Dibujar el sendero de la ruta
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.strokeStyle = '#27272A';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // 2. Dibujar el camino ya recorrido (Naranja Strava)
        const totalPoints = pts.length;
        const progressFactor = runDistance / selectedRoute.distanceKm;
        const activePointIndex = Math.min(
          Math.floor(progressFactor * (totalPoints - 1)),
          totalPoints - 1
        );

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i <= activePointIndex; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        
        // Agregar la fracción del tramo actual
        if (activePointIndex < totalPoints - 1 && progressFactor > 0) {
          const nextPt = pts[activePointIndex + 1];
          const currPt = pts[activePointIndex];
          const segmentProgress = (progressFactor * (totalPoints - 1)) - activePointIndex;
          const interX = currPt.x + (nextPt.x - currPt.x) * segmentProgress;
          const interY = currPt.y + (nextPt.y - currPt.y) * segmentProgress;
          ctx.lineTo(interX, interY);
        }

        ctx.strokeStyle = 'var(--accent-strava)';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // 3. Dibujar Punto de Salida
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'var(--accent-yellow)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        ctx.stroke();

        // 4. Dibujar Meta
        const endPt = pts[pts.length - 1];
        ctx.beginPath();
        ctx.arc(endPt.x, endPt.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'var(--accent-red)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        ctx.stroke();

        // 5. Dibujar Avatar del Corredor (Brillante y Pulsante)
        let runnerX = pts[0].x;
        let runnerY = pts[0].y;
        if (progressFactor > 0) {
          if (activePointIndex >= totalPoints - 1) {
            runnerX = endPt.x;
            runnerY = endPt.y;
          } else {
            const nextPt = pts[activePointIndex + 1];
            const currPt = pts[activePointIndex];
            const segmentProgress = (progressFactor * (totalPoints - 1)) - activePointIndex;
            runnerX = currPt.x + (nextPt.x - currPt.x) * segmentProgress;
            runnerY = currPt.y + (nextPt.y - currPt.y) * segmentProgress;
          }
        }

        // Resplandor
        ctx.beginPath();
        ctx.arc(runnerX, runnerY, 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 87, 0, 0.25)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(runnerX, runnerY, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#FFF';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'var(--accent-strava)';
        ctx.stroke();

        animId = requestAnimationFrame(drawMap);
      };

      drawMap();

      return () => {
        cancelAnimationFrame(animId);
      };
    }
  }, [activityType, selectedRouteId, runDistance]);

  const handleStart = async (mode: 'video' | 'reel') => {
    setRecordingMode(mode);
    setIsRecording(true);
    setIsPaused(false);
    playBellSound(true);
    
    // Si no es Running, iniciar cámara en vivo automáticamente
    if (activityType !== 'Running') {
      await handleStartCamera(mode);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsRecording(false);
    setShowSaveForm(true);

    // Si la cámara en vivo estaba activa, traspasar el feed al preview del formulario de guardado
    if (isCamActive && streamRef.current) {
      setTimeout(() => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = streamRef.current;
          videoPreviewRef.current.muted = true;
          videoPreviewRef.current.play();
        }
      }, 150);
    }
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- CALCULAR CALORÍAS QUEMADAS BASADO EN MET E ESFUERZO ---
  const calculateCalories = () => {
    let met = 10;
    switch (activityType) {
      case 'Boxing': met = 10; break;
      case 'MMA': met = 14; break;
      case 'BJJ': met = 12; break;
      case 'Kickboxing': met = 11; break;
      case 'Running': met = 10; break;
      case 'Conditioning': met = 8; break;
    }

    let intensityMultiplier = 1.0;
    switch (intensity) {
      case 'Baja': intensityMultiplier = 0.8; break;
      case 'Media': intensityMultiplier = 1.0; break;
      case 'Alta': intensityMultiplier = 1.25; break;
      case 'Extrema': intensityMultiplier = 1.5; break;
    }

    const durationMins = secondsElapsed / 60 || 1;
    // Fórmula simplificada: MET * peso(54kg) * 0.0175 * minutos * factor
    const cals = Math.round(met * 53.6 * 0.0175 * durationMins * intensityMultiplier);
    return cals;
  };

  // --- GUARDAR ACTIVIDAD Y GENERAR INTERACCIONES SOCIALES ---
  // --- MÉTODOS DE CÁMARA Y GRABACIÓN ---
  const handleStartCamera = async (modeOverride?: 'video' | 'reel') => {
    const activeMode = modeOverride || recordingMode;
    const constraints = activeMode === 'reel' 
      ? { video: { width: 360, height: 640, facingMode: 'user' }, audio: true }
      : { video: { width: 640, height: 360, facingMode: 'user' }, audio: true };
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Intentar bindear a la cámara activa o al preview según el DOM
      setTimeout(() => {
        if (activeSessionVideoRef.current) {
          activeSessionVideoRef.current.srcObject = stream;
          activeSessionVideoRef.current.muted = true;
          activeSessionVideoRef.current.play();
        }
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.muted = true;
          videoPreviewRef.current.play();
        }
      }, 100);

      setIsCamActive(true);
      setRecordedVideoBlob(null);
      setVideoPreviewUrl(null);
    } catch (e) {
      console.error('Error al abrir la cámara:', e);
      alert('No se pudo acceder a la cámara. Por favor concede permisos.');
    }
  };

  const handleStartVideoRecording = () => {
    if (!streamRef.current) return;
    videoChunksRef.current = [];
    
    // Configurar MediaRecorder
    let options = { mimeType: 'video/webm;codecs=vp9,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm' };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/mp4' };
    }

    try {
      const recorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          videoChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/mp4' });
        setRecordedVideoBlob(videoBlob);
        const url = URL.createObjectURL(videoBlob);
        setVideoPreviewUrl(url);

        // Apagar el stream de la cámara tras grabar SOLO si ya terminó la sesión completa
        // Si seguimos en la sesión de entrenamiento en vivo, no apagar los tracks
        const sessionActive = activeSessionVideoRef.current !== null;
        if (!sessionActive && streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          setIsCamActive(false);
        }
      };

      // Iniciar
      recorder.start();
      setIsRecordingVideo(true);
      setVideoTimer(0);

      // Cronómetro de video (máximo 30s sólo si está en modo Reel)
      videoTimerRef.current = window.setInterval(() => {
        setVideoTimer(prev => {
          if (recordingMode === 'reel' && prev >= 29) {
            handleStopVideoRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (e) {
      console.error('Fallo en grabador de video:', e);
    }
  };

  const handleStopVideoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (videoTimerRef.current) {
      clearInterval(videoTimerRef.current);
    }
    setIsRecordingVideo(false);
  };

  const handleClearVideo = () => {
    setRecordedVideoBlob(null);
    setVideoPreviewUrl(null);
    setVideoTimer(0);
    handleStartCamera(recordingMode);
  };

  // --- GUARDAR ACTIVIDAD EN EL SERVIDOR backend ---
  const handleSave = async () => {
    const cals = calculateCalories();
    const durationMins = Math.max(Math.ceil(secondsElapsed / 60), 1);
    const today = new Date().toISOString();
    const activityId = 'act-' + Date.now();

    // Obtener usuario activo para firmar la actividad
    let athleteName = 'Tú (Atleta)';
    let userEmail = 'user@combat.com';
    let isPro = 0;
    try {
      const savedUser = JSON.parse(localStorage.getItem('combat_strava_user') || '{}');
      if (savedUser && savedUser.email) {
        athleteName = savedUser.email.split('@')[0];
        userEmail = savedUser.email;
        if (savedUser.role === 'Admin') isPro = 1; // Admins firman como pros
      }
    } catch(e) {
      console.error(e);
    }

    // Crear FormData multipart para el servidor SQLite
    const formData = new FormData();
    formData.append('id', activityId);
    formData.append('title', activityTitle || `Entrenamiento de ${activityType}`);
    formData.append('type', activityType);
    formData.append('date', today);
    formData.append('durationMinutes', durationMins.toString());
    formData.append('caloriesBurned', cals.toString());
    formData.append('intensity', intensity);
    formData.append('notes', notes || 'Entrenamiento enfocado en dar el 100%.');
    formData.append('athleteName', athleteName);
    formData.append('isPro', isPro.toString());
    formData.append('maxGForce', maxGForce.toString());
    formData.append('ropeJumpsCount', ropeJumps.toString());
    formData.append('userEmail', userEmail);

    if (activityType !== 'Running' && activityType !== 'Conditioning') {
      formData.append('roundsCount', currentRound.toString());
      formData.append('roundDurationMinutes', roundDuration.toString());
    }
    if (activityType === 'Running') {
      formData.append('routeId', selectedRoute.id);
      formData.append('distanceKm', runDistance.toFixed(2));
      formData.append('elevationGainMeters', selectedRoute.elevationGainMeters.toString());
    }

    // Adjuntar archivo de video si existe
    if (recordedVideoBlob) {
      formData.append('video', recordedVideoBlob, 'reel.mp4');
    }

    try {
      // 1. Subir al Servidor SQLite
      const res = await api.createActivity(formData);
      
      if (res.success) {
        // Apagar cámara por si quedó abierta
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }

        // 2. Opcional: Mantener histórico local del navegador para el 1RM
        const workoutHistory = JSON.parse(localStorage.getItem('workout_history') || '[]');
        workoutHistory.push({
          id: Date.now(),
          date: today.split('T')[0],
          exerciseName: activityType === 'Running' ? 'Cardio Roadwork' : `Combate ${activityType}`,
          kg: 0,
          reps: durationMins
        });
        localStorage.setItem('workout_history', JSON.stringify(workoutHistory));

        // 3. Notificar cambios locales
        window.dispatchEvent(new Event('activityRecorded'));
        
        // Resetear estados
        setIsRecording(false);
        setSecondsElapsed(0);
        setRunDistance(0);
        setShowSaveForm(false);
        setNotes('');
        setActivityTitle('');
        setRecordedVideoBlob(null);
        setVideoPreviewUrl(null);
        setIsCamActive(false);
        setMaxGForce(0);
        setRopeJumps(0);
        maxGDetectRef.current = 0;
        ropeJumpsRef.current = 0;

        // Redirigir a Social Feed!
        onNavigateToFeed();
      } else {
        alert('Error al guardar en el servidor: ' + res.message);
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al conectar con el servidor.');
    }
  };

  return (
    <div style={{ paddingBottom: '30px' }}>
      <header style={{ marginBottom: '20px', marginTop: '20px' }}>
        <h1>Registrar Actividad</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Graba tu sesión en vivo con métricas Strava y campana interactiva.</p>
      </header>

      {!isRecording && !showSaveForm && (
        <div className="glass-card" style={{ borderTop: '4px solid var(--accent-strava)' }}>
          <h3 style={{ color: '#FFF', fontSize: '16px', marginBottom: '14px' }}>🥋 Selecciona Disciplina</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
            {(['Boxing', 'MMA', 'BJJ', 'Kickboxing', 'Running', 'Conditioning'] as const)
              .filter(t => t !== 'BJJ' || showBJJ)
              .map(type => (
              <button 
                key={type}
                onClick={() => setActivityType(type)}
                style={{
                  padding: '12px 6px',
                  borderRadius: '10px',
                  border: activityType === type ? '2px solid var(--accent-strava)' : '1px solid rgba(255,255,255,0.06)',
                  backgroundColor: activityType === type ? 'rgba(255, 87, 0, 0.12)' : 'var(--bg-elevated)',
                  color: activityType === type ? '#FFF' : 'var(--text-muted)',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '20px' }}>
                  {type === 'Boxing' && '🥊'}
                  {type === 'MMA' && '🤼‍♂️'}
                  {type === 'BJJ' && '🥋'}
                  {type === 'Kickboxing' && '🦵'}
                  {type === 'Running' && '🏃‍♂️'}
                  {type === 'Conditioning' && '⚡'}
                </span>
                {type === 'Boxing' && 'Boxeo'}
                {type === 'MMA' && 'MMA'}
                {type === 'BJJ' && 'Jiu Jitsu'}
                {type === 'Kickboxing' && 'Kickboxing'}
                {type === 'Running' && 'Roadwork'}
                {type === 'Conditioning' && 'Cardio/HIIT'}
              </button>
            ))}
          </div>

          {/* Configuración según tipo */}
          {activityType === 'Running' ? (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>📍 Selecciona Ruta de Combate</label>
              <select 
                value={selectedRouteId} 
                onChange={e => setSelectedRouteId(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '10px',
                  backgroundColor: 'var(--bg-main)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}
              >
                {mockRoutes.map((r: Route) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.distanceKm} km | +{r.elevationGainMeters}m)
                  </option>
                ))}
              </select>
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '11px', color: '#AAA' }}>
                ⭐ <strong>Dificultad:</strong> {selectedRoute.difficulty} | Esta ruta simula splits en vivo por GPS en pantalla.
              </div>
            </div>
          ) : activityType === 'Conditioning' ? (
            <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '12px', color: '#BBB', lineHeight: '1.4' }}>
              💪 <strong>Acondicionamiento Físico General:</strong> Registra saltos de cuerda, calistenia, bolsa de agua o pesas rusas continuas. Usará cronómetro directo.
            </div>
          ) : (
            // CONFIG COMBATE
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rounds</label>
                <input 
                  type="number" 
                  value={targetRounds}
                  onChange={e => setTargetRounds(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ width: '100%', marginTop: '4px', padding: '8px', backgroundColor: 'var(--bg-main)', color: 'white', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', textAlign: 'center' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Min/Round</label>
                <input 
                  type="number" 
                  value={roundDuration}
                  onChange={e => setRoundDuration(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ width: '100%', marginTop: '4px', padding: '8px', backgroundColor: 'var(--bg-main)', color: 'white', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', textAlign: 'center' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Descanso (s)</label>
                <input 
                  type="number" 
                  value={restDuration}
                  onChange={e => setRestDuration(Math.max(5, parseInt(e.target.value) || 5))}
                  style={{ width: '100%', marginTop: '4px', padding: '8px', backgroundColor: 'var(--bg-main)', color: 'white', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', textAlign: 'center' }}
                />
              </div>
            </div>
          )}

          {/* BOTÓN DIVIDIDO SEGÚN MODO DE GRABACIÓN */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => handleStart('video')}
              style={{
                flex: 1,
                padding: '14px 10px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                color: '#FFF',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '11px',
                border: '1.5px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-strava)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            >
              🎥 Grabar Video
            </button>

            <button 
              onClick={() => handleStart('reel')}
              style={{
                flex: 1,
                padding: '14px 10px',
                backgroundColor: 'var(--accent-strava)',
                color: 'white',
                fontWeight: '900',
                textTransform: 'uppercase',
                fontSize: '11px',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: 'var(--glow-orange)',
                transition: 'transform 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              📱 Grabar Reel (30s)
            </button>
          </div>
        </div>
      )}

      {/* COMPONENTE GRABACIÓN ACTIVA */}
      {isRecording && (
        <div className="glass-card" style={{ border: '1px solid var(--accent-strava)', textAlign: 'center', padding: '24px 18px' }}>
          
          {/* Cabecera Actividad */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '4px', backgroundColor: 'rgba(255, 87, 0, 0.15)', color: 'var(--accent-strava)' }}>
              {activityType === 'Running' ? '🏃‍♂️ ROADWORK' : `🥊 ${activityType.toUpperCase()}`}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isPaused ? '#EAB308' : '#22C55E', display: 'inline-block', animation: isPaused ? 'none' : 'pulse-orange 1.5s infinite' }}></span>
              <span style={{ fontSize: '11px', color: '#BBB', fontWeight: 'bold' }}>{isPaused ? 'EN PAUSA' : 'GRABANDO EN VIVO'}</span>
            </div>
          </div>

          {/* TIMER PRINCIPAL */}
          <div style={{ margin: '20px 0' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1.5px', fontWeight: 'bold' }}>Tiempo Total</span>
            <h2 style={{ fontSize: '56px', fontWeight: '900', color: '#FFF', fontFamily: 'monospace', margin: '4px 0', textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>
              {formatTimer(secondsElapsed)}
            </h2>
          </div>

          {/* CÁMARA SPARRING Y REGISTRO EN TIEMPO REAL */}
          {activityType !== 'Running' && (
            <div style={{ 
              position: 'relative', 
              width: recordingMode === 'reel' ? '240px' : '100%', 
              height: recordingMode === 'reel' ? '426px' : '280px', 
              backgroundColor: '#070708', 
              borderRadius: '12px', 
              overflow: 'hidden', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '20px', 
              marginLeft: 'auto',
              marginRight: 'auto',
              border: isRecordingVideo ? '2px solid var(--accent-red)' : '1px solid rgba(255,255,255,0.06)', 
              boxShadow: isRecordingVideo ? 'var(--glow-red)' : 'none', 
              transition: 'all 0.3s' 
            }}>
              {isCamActive ? (
                <>
                  <video
                    ref={activeSessionVideoRef}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    playsInline
                    muted
                  />

                  {/* HUD OVERLAYS EN TIEMPO REAL */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '3px', pointerEvents: 'none', zIndex: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.7)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--accent-strava)' }}>
                      <span className="dot" style={{ width: '5px', height: '5px', backgroundColor: isRecordingVideo ? 'var(--accent-red)' : 'var(--accent-yellow)', borderRadius: '50%', display: 'inline-block', animation: 'pulse-orange 1.5s infinite' }}></span>
                      <span style={{ fontSize: '8px', fontWeight: '900', color: 'var(--accent-strava)', letterSpacing: '0.5px' }}>COMBAT STRAVA LIVE</span>
                    </div>
                  </div>

                  {/* HUD Asalto / Timer */}
                  <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', padding: '3px 6px', pointerEvents: 'none', zIndex: 5, textAlign: 'right' }}>
                    <span style={{ fontSize: '6px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                      {activityType === 'Conditioning' ? 'Cardio' : `Round ${currentRound}`}
                    </span>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'white', fontFamily: 'monospace' }}>
                      {activityType === 'Conditioning' ? formatTimer(secondsElapsed) : formatTimer(roundSecondsLeft)}
                    </span>
                  </div>

                  {/* HUD G Force */}
                  <div style={{ position: 'absolute', bottom: '15px', right: '10px', background: 'rgba(0,0,0,0.7)', borderRadius: '4px', padding: '3px 6px', pointerEvents: 'none', zIndex: 5, borderRight: '2px solid var(--accent-yellow)', textAlign: 'right' }}>
                    <span style={{ fontSize: '6px', color: 'var(--accent-yellow)', display: 'block', fontWeight: 'bold' }}>TELEMETRÍA G</span>
                    <span style={{ fontSize: '9px', fontWeight: '900', color: 'white' }}>
                      ⚡ {maxGForce.toFixed(1)} G {ropeJumps > 0 && `| 🪢 ${ropeJumps}`}
                    </span>
                  </div>

                  {/* Indicator de Grabación Activa */}
                  {isRecordingVideo && (
                    <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(225,29,72,0.85)', padding: '5px 12px', borderRadius: '20px', color: 'white', fontSize: '9px', fontWeight: 'bold', pointerEvents: 'none', zIndex: 5, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: 'var(--glow-red)' }}>
                      🔴 GRABANDO REEL ({videoTimer}s)
                    </div>
                  )}

                  {/* Controles de Grabación de Video en Tiempo Real */}
                  <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                    {!isRecordingVideo ? (
                      <button
                        type="button"
                        onClick={handleStartVideoRecording}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'var(--accent-red)',
                          color: 'white',
                          fontWeight: 'bold',
                          border: 'none',
                          borderRadius: '16px',
                          cursor: 'pointer',
                          fontSize: '10px',
                          boxShadow: 'var(--glow-red)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        📹 Iniciar Grabación Reel
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStopVideoRecording}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#FFF',
                          color: '#000',
                          fontWeight: 'bold',
                          border: 'none',
                          borderRadius: '16px',
                          cursor: 'pointer',
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        ⏹️ Detener y Guardar Reel
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <span style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}>📷</span>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    La cámara está desactivada. Actívala para grabar tu sparring en vivo.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleStartCamera()}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: 'var(--accent-strava)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      boxShadow: 'var(--glow-orange)'
                    }}
                  >
                    Activar Cámara en Vivo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SIMULADOR MAPA CANVASES (PARA RUNNING) */}
          {activityType === 'Running' && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Distancia</span>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{runDistance.toFixed(2)} km</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Desnivel</span>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-yellow)' }}>+{Math.round((runDistance / selectedRoute.distanceKm) * selectedRoute.elevationGainMeters)} m</div>
                </div>
              </div>
              
              <div style={{ position: 'relative', width: '100%', height: '220px', backgroundColor: '#070708', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                <canvas 
                  ref={canvasRef} 
                  width={420} 
                  height={220} 
                  style={{ width: '100%', height: '100%', display: 'block' }}
                />
                <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '9px', background: 'rgba(0,0,0,0.6)', padding: '3px 6px', borderRadius: '4px', color: '#FFF', pointerEvents: 'none' }}>
                  🗺️ SIMULACIÓN GPS RUTA ACTIVADA
                </span>
              </div>
            </div>
          )}

          {/* INTERFAZ ASALTOS GOLPEO (COMBATE) */}
          {activityType !== 'Running' && activityType !== 'Conditioning' && (
            <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '12px', backgroundColor: combatPhase === 'Fight' ? 'rgba(225,29,72,0.06)' : 'rgba(204,255,0,0.05)', border: `1px solid ${combatPhase === 'Fight' ? 'rgba(225,29,72,0.15)' : 'rgba(204,255,0,0.15)'}`, transition: 'all 0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-muted)' }}>ASALTO ACTUAL:</span>
                <span style={{ color: 'white', backgroundColor: '#333', padding: '2px 8px', borderRadius: '4px' }}>
                  {currentRound} / {targetRounds}
                </span>
              </div>

              {/* FASE ACTUAL */}
              <div style={{ margin: '15px 0' }}>
                <span style={{
                  fontSize: '28px',
                  fontWeight: '900',
                  color: combatPhase === 'Fight' ? 'var(--accent-red)' : 'var(--accent-yellow)',
                  textShadow: combatPhase === 'Fight' ? 'var(--glow-red)' : 'var(--glow-yellow)',
                  letterSpacing: '1px'
                }}>
                  {combatPhase === 'Fight' ? '🔥 COMBATE 🔥' : '🔔 DESCANSO 🔔'}
                </span>
                
                <h3 style={{ fontSize: '38px', fontFamily: 'monospace', marginTop: '8px', color: '#FFF' }}>
                  {formatTimer(roundSecondsLeft)}
                </h3>
              </div>
              
              <div className="progress-bar" style={{ height: '6px', backgroundColor: '#222', borderRadius: '3px', overflow: 'hidden', marginTop: '10px' }}>
                <div style={{
                  height: '100%',
                  width: `${(roundSecondsLeft / (combatPhase === 'Fight' ? roundDuration * 60 : restDuration)) * 100}%`,
                  backgroundColor: combatPhase === 'Fight' ? 'var(--accent-red)' : 'var(--accent-yellow)',
                  boxShadow: combatPhase === 'Fight' ? 'var(--glow-red)' : 'var(--glow-yellow)',
                  transition: 'width 1s linear'
                }}></div>
              </div>
            </div>
          )}

          {/* CONTROLES */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              onClick={handlePause}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#1F2937',
                color: isPaused ? 'var(--accent-yellow)' : '#FFF',
                border: isPaused ? '1px solid var(--accent-yellow)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {isPaused ? '▶️ Reanudar' : '⏸️ Pausar'}
            </button>
            <button 
              onClick={handleStop}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: 'rgba(220, 38, 38, 0.2)',
                color: 'var(--accent-red)',
                border: '1px solid var(--accent-red)',
                borderRadius: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '12px',
                boxShadow: 'var(--glow-red)'
              }}
            >
              ⏹️ Finalizar
            </button>
          </div>
        </div>
      )}

      {/* FORMULARIO DE GUARDADO / RESUMEN */}
      {showSaveForm && (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-strava)', animation: 'slideIn 0.3s' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--accent-strava)' }}>🏆 ¡Actividad Guardada!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '20px' }}>Revisa tus números y agrega detalles para publicarla en el feed.</p>

          {/* Métricas Generales */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px', textAlign: 'center' }}>
            <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '10px', borderRadius: '8px' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tiempo</span>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{Math.max(Math.ceil(secondsElapsed / 60), 1)} min</div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '10px', borderRadius: '8px' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Calorías</span>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-strava)' }}>~{calculateCalories()} kcal</div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '10px', borderRadius: '8px' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tipo</span>
              <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{activityType}</div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Título de tu Actividad</label>
            <input 
              type="text"
              placeholder={`Ej: ${activityType} explosivo`}
              value={activityTitle}
              onChange={e => setActivityTitle(e.target.value)}
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '10px',
                backgroundColor: 'var(--bg-main)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Intensidad Percibida (RPE)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '6px' }}>
              {(['Baja', 'Media', 'Alta', 'Extrema'] as const).map(lev => (
                <button
                  key={lev}
                  type="button"
                  onClick={() => setIntensity(lev)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '6px',
                    border: intensity === lev ? '1.5px solid var(--accent-strava)' : '1px solid rgba(255,255,255,0.06)',
                    backgroundColor: intensity === lev ? 'rgba(255, 87, 0, 0.15)' : 'var(--bg-elevated)',
                    color: intensity === lev ? 'white' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {lev}
                </button>
              ))}
            </div>
          </div>

          {/* NUEVO CONTENEDOR DE GRABACIÓN DE VIDEO / REEL */}
          <div style={{ marginBottom: '20px', padding: '14px', backgroundColor: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <label style={{ fontSize: '11px', color: 'var(--accent-strava)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              🎥 Grabar Video / Reel de la Sesión
            </label>

            {!isCamActive && !videoPreviewUrl && (
              <button
                type="button"
                onClick={() => handleStartCamera()}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px dashed rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                📷 Activar Cámara en Vivo
              </button>
            )}

            {/* Previsualización en Vivo de la Cámara */}
            {isCamActive && (
              <div style={{
                position: 'relative',
                width: recordingMode === 'reel' ? '240px' : '100%',
                height: recordingMode === 'reel' ? '426px' : '260px',
                backgroundColor: '#000',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: recordingMode === 'reel' ? '0 auto 10px' : '0 0 10px',
                transition: 'all 0.3s'
              }}>
                <video
                  ref={videoPreviewRef}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  playsInline
                  muted
                />
                
                {/* Grabador Activo indicación de tiempo */}
                {isRecordingVideo && (
                  <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(225,29,72,0.85)', padding: '4px 10px', borderRadius: '4px', color: 'white', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 3 }}>
                    <span className="dot" style={{ width: '6px', height: '6px', backgroundColor: 'white', borderRadius: '50%', animation: 'pulse-orange 1s infinite' }}></span>
                    GRABANDO REEL: {videoTimer}s / 30s
                  </div>
                )}

                {/* --- HUD OVERLAYS EN VIVO AR V3 --- */}
                {isRecordingVideo && (
                  <>
                    {/* HUD Top Left Brand */}
                    <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '4px', pointerEvents: 'none', zIndex: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.65)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--accent-strava)' }}>
                        <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent-red)', borderRadius: '50%', animation: 'pulse-orange 1s infinite' }}></span>
                        <span style={{ fontSize: '9px', fontWeight: '900', color: 'var(--accent-strava)', letterSpacing: '0.5px' }}>COMBAT STRAVA AR</span>
                      </div>
                      <span style={{ fontSize: '8px', color: '#FFF', textShadow: '0 1px 3px #000', paddingLeft: '4px' }}>TELEMETRÍA KINÉTICA</span>
                    </div>

                    {/* HUD Top Right Asalto */}
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.65)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '4px 8px', textAlign: 'right', pointerEvents: 'none', zIndex: 2 }}>
                      <span style={{ fontSize: '7px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 'bold' }}>
                        {activityType === 'Running' ? 'Roadwork' : `Asalto ${currentRound}`}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '900', color: '#FFF', fontFamily: 'monospace' }}>
                        {activityType === 'Running' ? formatTimer(secondsElapsed) : formatTimer(roundSecondsLeft)}
                      </span>
                    </div>

                    {/* HUD Bottom Left Calorias */}
                    <div style={{ position: 'absolute', bottom: '50px', left: '10px', background: 'rgba(0,0,0,0.65)', borderRadius: '6px', padding: '4px 8px', pointerEvents: 'none', zIndex: 2, borderLeft: '3px solid var(--accent-strava)' }}>
                      <span style={{ fontSize: '7px', color: 'var(--accent-strava)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block' }}>Energía</span>
                      <span style={{ fontSize: '11px', fontWeight: '900', color: 'white' }}>🔥 {Math.round(calculateCalories() * (videoTimer / 30) || 5)} kcal</span>
                    </div>

                    {/* HUD Bottom Right G Force */}
                    <div style={{ position: 'absolute', bottom: '50px', right: '10px', background: 'rgba(0,0,0,0.65)', borderRadius: '6px', padding: '4px 8px', pointerEvents: 'none', zIndex: 2, borderRight: '3px solid var(--accent-yellow)', textAlign: 'right' }}>
                      <span style={{ fontSize: '7px', color: 'var(--accent-yellow)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block' }}>Fuerza G</span>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: '#FFF' }}>
                        ⚡ {maxGForce.toFixed(1)} G {ropeJumps > 0 && `| 🪢 ${ropeJumps}`}
                      </span>
                    </div>
                  </>
                )}

                {/* Botones de Control de Grabación */}
                <div style={{ position: 'absolute', bottom: '10px', display: 'flex', gap: '10px', zIndex: 10 }}>
                  {!isRecordingVideo ? (
                    <button
                      type="button"
                      onClick={handleStartVideoRecording}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: 'var(--accent-red)',
                        color: 'white',
                        fontWeight: 'bold',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        boxShadow: 'var(--glow-red)'
                      }}
                    >
                      ● Iniciar Grabación
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopVideoRecording}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: '#FFF',
                        color: '#000',
                        fontWeight: 'bold',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      ■ Detener Grabación
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Previsualización del Video Grabado */}
            {videoPreviewUrl && (
              <div style={{
                position: 'relative',
                width: recordingMode === 'reel' ? '240px' : '100%',
                height: recordingMode === 'reel' ? '426px' : '260px',
                backgroundColor: '#000',
                borderRadius: '8px',
                overflow: 'hidden',
                margin: recordingMode === 'reel' ? '0 auto 10px' : '0 0 10px',
                transition: 'all 0.3s'
              }}>
                <video
                  src={videoPreviewUrl}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  controls
                  playsInline
                />
                
                {/* --- HUD OVERLEY MOCK EN LA PREVIA DE VIDEO --- */}
                <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.65)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--accent-strava)', pointerEvents: 'none' }}>
                  <span style={{ fontSize: '9px', fontWeight: '900', color: 'var(--accent-strava)', letterSpacing: '0.5px' }}>COMBAT STRAVA AR</span>
                </div>
                <div style={{ position: 'absolute', top: '10px', right: '50px', background: 'rgba(0,0,0,0.65)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '4px 8px', textAlign: 'right', pointerEvents: 'none' }}>
                  <span style={{ fontSize: '7px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 'bold' }}>FINAL</span>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: '#FFF', fontFamily: 'monospace' }}>
                    {formatTimer(secondsElapsed)}
                  </span>
                </div>
                <div style={{ position: 'absolute', bottom: '50px', left: '10px', background: 'rgba(0,0,0,0.65)', borderRadius: '6px', padding: '4px 8px', pointerEvents: 'none', borderLeft: '3px solid var(--accent-strava)' }}>
                  <span style={{ fontSize: '7px', color: 'var(--accent-strava)', display: 'block' }}>ENERGÍA</span>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: 'white' }}>🔥 ~{calculateCalories()} kcal</span>
                </div>
                <div style={{ position: 'absolute', bottom: '50px', right: '10px', background: 'rgba(0,0,0,0.65)', borderRadius: '6px', padding: '4px 8px', pointerEvents: 'none', borderRight: '3px solid var(--accent-yellow)', textAlign: 'right' }}>
                  <span style={{ fontSize: '7px', color: 'var(--accent-yellow)', display: 'block' }}>KINESIS</span>
                  <span style={{ fontSize: '9px', fontWeight: '900', color: '#FFF' }}>
                    ⚡ {maxGForce.toFixed(1)} G {ropeJumps > 0 && `| 🪢 ${ropeJumps}`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleClearVideo}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: 'var(--accent-red)',
                    border: '1px solid var(--accent-red)',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    zIndex: 10
                  }}
                  title="Borrar Video"
                >
                  ✕
                </button>
              </div>
            )}

            {/* PC FALLBACK SIMULADOR KINÉTICO (GRILL-ME ALIGNMENT) */}
            {(isCamActive || videoPreviewUrl) && (
              <div style={{
                marginTop: '14px',
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '10px',
                border: '1px dashed rgba(255,255,255,0.08)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--accent-yellow)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ⚡ SIMULADOR PC SENSORES KINÉTICOS
                  </span>
                  {maxGForce >= 8.0 && (
                    <span style={{ fontSize: '8px', color: '#FFF', fontWeight: 'bold', background: 'rgba(225,29,72,0.2)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--accent-red)', animation: 'pulse-orange 1s infinite' }}>
                      💥 GOLPE EXPLOSIVO DETECTADO!
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ backgroundColor: 'var(--bg-main)', padding: '6px 8px', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block' }}>G-FORCE GOLPE</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: maxGForce >= 8.0 ? 'var(--accent-red)' : 'var(--accent-yellow)' }}>
                      {maxGForce.toFixed(1)} G / 8.0 G
                    </span>
                  </div>
                  
                  <div style={{ backgroundColor: 'var(--bg-main)', padding: '6px 8px', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block' }}>SALTOS DE CUERDA</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-strava)' }}>
                      🪢 {ropeJumps}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleSimulateStrike}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: 'rgba(225, 29, 72, 0.1)',
                      border: '1px solid rgba(225, 29, 72, 0.25)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    🥊 Simular Shadowbox Golpe
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateJump}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: 'rgba(255, 87, 0, 0.1)',
                      border: '1px solid rgba(255, 87, 0, 0.25)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    🪢 Simular Salto Cuerda
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>¿Cómo te sentiste? (Notas)</label>
            <textarea 
              rows={3}
              placeholder="Notas técnicas, cansancio, golpes conectados, sensaciones..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '10px',
                backgroundColor: 'var(--bg-main)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                fontSize: '13px',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <button 
            onClick={handleSave}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: 'var(--accent-strava)',
              color: 'white',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontSize: '14px',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: 'var(--glow-orange)'
            }}
          >
            💾 Guardar y Publicar en Muro
          </button>
        </div>
      )}
    </div>
  );
}
