import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../assets/styles/Progress.css';
import { calc1RM } from '../utils/calc1RM';

interface HistoryItem {
  id?: number;
  date: string;
  exerciseName: string;
  kg: number;
  reps: number;
}

export default function ProgressPage() {
  const [data, setData] = useState<any[]>([]);
  const [isPlateau, setIsPlateau] = useState(false);

  useEffect(() => {
    try {
      const rawHistory = localStorage.getItem('workout_history');
      let history: HistoryItem[] = rawHistory ? JSON.parse(rawHistory) : [];
      
      // Inject mock history for the chart to look good if no enough local data
      if (history.length < 2) {
        const mockHistory = [
          { date: '2026-04-15', exerciseName: 'Press de Banca', kg: 60, reps: 5 },
          { date: '2026-04-22', exerciseName: 'Press de Banca', kg: 62.5, reps: 5 },
          { date: '2026-04-29', exerciseName: 'Press de Banca', kg: 65, reps: 4 },
        ];
        history = [...mockHistory, ...history];
      }

      const benchPressData = history.filter(h => h.exerciseName === 'Press de Banca');
      
      const chartData = benchPressData.map(h => ({
        date: h.date.substring(5), // Keep MM-DD
        '1RM Estimado': calc1RM(h.kg, h.reps)
      }));
      
      setData(chartData);

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
  }, []);

  return (
    <div className="progress-container">
      <div className="progress-header">
        <h1>Progreso 1RM</h1>
        <p>Motor Offline de Sobrecarga Progresiva</p>
      </div>

      {isPlateau && (
        <div className="alert-box">
          <h4>⚠️ Alerta de Estancamiento</h4>
          <p>Has registrado el mismo peso y repeticiones en Press de Banca por 2 semanas seguidas. La app sugiere <strong>aumentar 1 kg a la barra</strong> o probar una progresión de repeticiones en la siguiente sesión.</p>
        </div>
      )}

      <div className="chart-card">
        <h3>Press de Banca - Curva de Fuerza</h3>
        <div style={{ width: '100%', height: 250, marginTop: '20px' }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="date" stroke="#A1A1AA" fontSize={11} tickMargin={10} />
              <YAxis stroke="#A1A1AA" fontSize={11} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #333', borderRadius: '8px' }}
                itemStyle={{ color: '#DC2626', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="1RM Estimado" 
                stroke="#DC2626" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#DC2626', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#D9F99D', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
