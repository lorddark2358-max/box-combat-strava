import React, { useState, useEffect } from 'react';
import '../../assets/styles/RestTimer.css';

interface RestTimerProps {
  initialSeconds: number; // ej. 240 (4 min) para Fuerza, 90 para Hipertrofia
  onComplete?: () => void;
}

export default function RestTimer({ initialSeconds, onComplete }: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      if (onComplete) onComplete();
      
      // Haptic Feedback
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onComplete]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(initialSeconds);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progress = ((initialSeconds - timeLeft) / initialSeconds) * 100;
  const isStrength = initialSeconds >= 180;

  return (
    <div className="rest-timer-container">
      <div className="timer-header">
        <h4>Tiempo de Recuperación</h4>
        <span className={`timer-badge ${isStrength ? 'badge-strength' : 'badge-hyper'}`}>
          {isStrength ? 'Fuerza (SNC)' : 'Hipertrofia'}
        </span>
      </div>
      
      <div className="timer-display">
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="time-text">{formatTime(timeLeft)}</div>
      </div>

      <div className="timer-controls">
        <button className="btn-timer primary" onClick={toggleTimer}>
          {isActive ? 'PAUSAR' : timeLeft === 0 ? 'COMPLETADO' : 'INICIAR RESTO'}
        </button>
        <button className="btn-timer secondary" onClick={resetTimer}>REINICIAR</button>
      </div>
    </div>
  );
}
