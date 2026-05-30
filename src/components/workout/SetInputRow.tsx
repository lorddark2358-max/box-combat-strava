import React, { useState } from 'react';

interface SetInputRowProps {
  setNumber: number;
  onComplete: (kg: number, reps: number) => void;
  onUncomplete: () => void;
}

export default function SetInputRow({ setNumber, onComplete, onUncomplete }: SetInputRowProps) {
  const [kg, setKg] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [completed, setCompleted] = useState(false);

  const toggleComplete = () => {
    if (completed) {
      setCompleted(false);
      onUncomplete();
    } else {
      const valKg = parseFloat(kg) || 0;
      const valReps = parseInt(reps, 10) || 0;
      setCompleted(true);
      onComplete(valKg, valReps);
    }
  };

  return (
    <div className="set-row">
      <span className="set-number">{setNumber}</span>
      <div className="set-inputs">
        <div className="input-group">
          <label>KG</label>
          <input 
            type="number" 
            className="input-style" 
            placeholder="-"
            value={kg}
            onChange={(e) => setKg(e.target.value)}
            disabled={completed}
          />
        </div>
        <div className="input-group">
          <label>REPS</label>
          <input 
            type="number" 
            className="input-style" 
            placeholder="-"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            disabled={completed}
          />
        </div>
      </div>
      <button 
        className={`btn-complete ${completed ? 'active' : ''}`}
        onClick={toggleComplete}
      >
        {completed ? '✓' : ''}
      </button>
    </div>
  );
}
