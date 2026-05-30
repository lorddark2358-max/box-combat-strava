import React, { useState } from 'react';
import SetInputRow from './SetInputRow';
import { Exercise } from '../../models/types';

interface ExerciseCardProps {
  exercise: Exercise;
  onTriggerTimer: (seconds: number) => void;
  onStartVoiceCoach?: () => void;
  isVoiceCoachRunning?: boolean;
}

export default function ExerciseCard({ 
  exercise, 
  onTriggerTimer,
  onStartVoiceCoach,
  isVoiceCoachRunning = false
}: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [completedSets, setCompletedSets] = useState(0);

  const handleCompleteSet = (kg: number, reps: number) => {
    setCompletedSets(prev => prev + 1);
    
    const historyItem = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      exerciseName: exercise.name,
      kg,
      reps
    };
    
    try {
      const currentHistory = JSON.parse(localStorage.getItem('workout_history') || '[]');
      currentHistory.push(historyItem);
      localStorage.setItem('workout_history', JSON.stringify(currentHistory));
    } catch (e) {
      console.error('Error saving offline data', e);
    }

    onTriggerTimer(exercise.restTimerSeconds);
  };

  const handleUncompleteSet = () => {
    setCompletedSets(prev => Math.max(0, prev - 1));
  };

  const isCompleted = completedSets >= exercise.targetSets;

  return (
    <div className={`exercise-card ${isVoiceCoachRunning ? 'glow-border-yellow' : ''}`}>
      <div className="exercise-header" onClick={() => setExpanded(!expanded)}>
        <div>
          <h3 className="exercise-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {exercise.name} 
            {isVoiceCoachRunning && (
              <span className="dot flicker-animation" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-yellow)', display: 'inline-block' }}></span>
            )}
          </h3>
          <span className="exercise-meta">
            {exercise.targetSets} Sets • {exercise.targetReps} Reps
          </span>
        </div>
        <div className="exercise-status" style={{ color: isCompleted ? 'var(--accent-yellow)' : 'var(--text-muted)' }}>
          {isCompleted ? 'COMPLETADO' : `${completedSets}/${exercise.targetSets}`}
        </div>
      </div>
      
      {expanded && (
        <div className="exercise-body">
          <p style={{ fontSize: '12px', color: '#BBB', fontStyle: 'italic', margin: '12px 0 8px 0', lineHeight: '1.4' }}>
            💡 {exercise.instructions}
          </p>

          {/* BOTÓN INTELIGENTE DEL ENTRENADOR POR VOZ DE COMBATE */}
          {onStartVoiceCoach && (
            <div style={{ margin: '12px 0 16px 0' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartVoiceCoach();
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: isVoiceCoachRunning ? 'rgba(223, 255, 0, 0.15)' : 'var(--bg-elevated)',
                  border: isVoiceCoachRunning ? '1.5px solid var(--accent-yellow)' : '1px solid rgba(255,255,255,0.08)',
                  color: isVoiceCoachRunning ? 'var(--accent-yellow)' : '#FFF',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: isVoiceCoachRunning ? 'var(--glow-yellow)' : 'none',
                  transition: 'all 0.25s ease'
                }}
              >
                <span>🎙️</span>
                {isVoiceCoachRunning ? 'Entrenador de Combate Activo...' : 'Iniciar Asistente de Sparring por Voz'}
              </button>
            </div>
          )}

          {exercise.alternatives && exercise.alternatives.length > 0 && (
            <div style={{ fontSize: '11px', color: 'var(--accent-blue)', marginBottom: '16px', padding: '8px', backgroundColor: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '6px' }}>
              <strong>🔄 Alternativas (Sin equipo):</strong> {exercise.alternatives.join(', ')}
            </div>
          )}
          
          {Array.from({ length: exercise.targetSets }).map((_, idx) => (
            <SetInputRow 
              key={idx} 
              setNumber={idx + 1} 
              onComplete={(kg, reps) => handleCompleteSet(kg, reps)}
              onUncomplete={handleUncompleteSet}
            />
          ))}
        </div>
      )}
    </div>
  );
}
