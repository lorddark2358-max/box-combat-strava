import React, { useState, useEffect } from 'react';
import '../assets/styles/Nutrition.css';
import { currentUser, nutritionDatabase } from '../models/mockData';
import { Meal } from '../models/types';

export default function NutritionPage() {
  const { nutritionGoal } = currentUser;

  // Cargar comidas seleccionadas del día desde localStorage o iniciar vacío
  const [plannedMeals, setPlannedMeals] = useState<Meal[]>(() => {
    const saved = localStorage.getItem('planned_meals');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [aiInput, setAiInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<Meal | null>(null);

  // --- INTEGRACIÓN CALORÍAS QUEMADAS STRAVA ---
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

  const [lastActivityType, setLastActivityType] = useState<string | null>(() => {
    try {
      const savedActivities = JSON.parse(localStorage.getItem('recorded_activities') || '[]');
      if (savedActivities.length > 0) {
        return savedActivities[savedActivities.length - 1].type;
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem('planned_meals', JSON.stringify(plannedMeals));
    window.dispatchEvent(new Event('mealsUpdated'));
  }, [plannedMeals]);

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const savedActivities = JSON.parse(localStorage.getItem('recorded_activities') || '[]');
        const todayActivities = savedActivities.filter((act: any) => act.date.startsWith(todayStr));
        setCalsBurnedToday(todayActivities.reduce((sum: number, act: any) => sum + act.caloriesBurned, 0));
        if (savedActivities.length > 0) {
          setLastActivityType(savedActivities[savedActivities.length - 1].type);
        }
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('activityRecorded', handleUpdate);
    return () => {
      window.removeEventListener('activityRecorded', handleUpdate);
    };
  }, []);

  const removeMeal = (index: number) => {
    const newMeals = [...plannedMeals];
    newMeals.splice(index, 1);
    setPlannedMeals(newMeals);
  };

  const consumed = plannedMeals.reduce((acc, meal) => {
    acc.cals += meal.calories;
    acc.protein += meal.protein;
    acc.carbs += meal.carbs;
    acc.fats += meal.fats;
    return acc;
  }, { cals: 0, protein: 0, carbs: 0, fats: 0 });

  const totalCalGoal = nutritionGoal.calories + calsBurnedToday;

  const askAI = () => {
    if (!aiInput.trim()) return;
    setIsTyping(true);
    setAiSuggestion(null);
    
    setTimeout(() => {
      // Simulación de IA offline: busca la comida en la base de datos que más coincida con los ingredientes
      const inputLower = aiInput.toLowerCase();
      let bestMatch: Meal | null = null;
      let highestScore = 0;
      
      nutritionDatabase.forEach(meal => {
        let score = 0;
        meal.ingredients.forEach(ing => {
          if (inputLower.includes(ing.toLowerCase().split(' ')[0])) {
            score++;
          }
        });
        if (score > highestScore) {
          highestScore = score;
          bestMatch = meal;
        }
      });
      
      // Si no encuentra match perfecto, sugiere una genérica
      setAiSuggestion(bestMatch || nutritionDatabase[0]);
      setIsTyping(false);
    }, 1500);
  };

  const acceptAiMeal = () => {
    if (aiSuggestion) {
      setPlannedMeals([...plannedMeals, aiSuggestion]);
      setAiSuggestion(null);
      setAiInput('');
    }
  };

  const acceptRecoveryMeal = (meal: Meal) => {
    setPlannedMeals([...plannedMeals, meal]);
  };

  // Determinar la sugerencia de recuperación celular
  const getRecoveryRecommendation = () => {
    if (!lastActivityType) return null;
    
    if (lastActivityType === 'BJJ' || lastActivityType === 'MMA' || lastActivityType === 'Running') {
      // Desgaste cardiovascular alto: Carbohidratos complejos + Electrolitos/Minerales
      const recommendedMeals = nutritionDatabase.filter(m => m.id === 'meal-5' || m.id === 'meal-8');
      return {
        title: `🔋 Recarga de Glucógeno Post-${lastActivityType}`,
        desc: 'Tu última sesión tuvo un desgaste cardiovascular extremo. La app recomienda carbohidratos andinos complejos y pescados magros de rápida asimilación para recuperar electrolitos.',
        meals: recommendedMeals
      };
    } else {
      // Fuerza/Boxeo: Proteína pura para reparación miofibrilar
      const recommendedMeals = nutritionDatabase.filter(m => m.id === 'meal-2' || m.id === 'meal-6');
      return {
        title: `🥩 Reparación Miofibrilar Post-${lastActivityType}`,
        desc: 'Tu última sesión de fuerza/striking requiere una síntesis de proteína óptima. Agrega uno de estos platillos ricos en aminoácidos esenciales.',
        meals: recommendedMeals
      };
    }
  };

  const recoveryInfo = getRecoveryRecommendation();

  return (
    <div className="nutrition-container" style={{ paddingBottom: '30px' }}>
      <h1>Motor de Nutrición</h1>
      <p className="nutrition-desc">Planificación Manual e Inteligencia Artificial Offline</p>

      {/* Dashboard de Macros Diario */}
      <section className="macro-board">
        <div className="macro-box glass-card" style={{ borderLeft: calsBurnedToday > 0 ? '3px solid var(--accent-strava)' : '1px solid var(--glass-border)' }}>
          <span className="label">Presupuesto Calorías</span>
          <span className="val" style={{ color: consumed.cals >= totalCalGoal ? 'var(--accent-red)' : 'white', fontSize: '20px' }}>
            {consumed.cals} <small style={{fontSize: '11px', color: '#888'}}>/ {totalCalGoal} kcal</small>
          </span>
          {calsBurnedToday > 0 && (
            <span style={{ fontSize: '9px', color: 'var(--accent-strava)', fontWeight: 'bold', display: 'block', marginTop: '4px' }}>
              ⚡ +{calsBurnedToday} kcal por Ejercicio
            </span>
          )}
        </div>
        <div className="macro-box glass-card" style={{ borderLeft: '3px solid var(--accent-yellow)' }}>
          <span className="label">Proteína (Meta Fija)</span>
          <span className="val protein" style={{ fontSize: '20px' }}>
            {consumed.protein}g <small style={{fontSize: '11px', color: '#888'}}>/ {nutritionGoal.proteinGrams}g</small>
          </span>
        </div>
      </section>

      {/* TIP DE RECUPERACIÓN INTELIGENTE (SINCRONIZACIÓN STRAVA) */}
      {recoveryInfo && (
        <section className="glass-card" style={{ borderLeft: '4px solid var(--accent-yellow)', background: 'rgba(204, 255, 0, 0.05)', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--accent-yellow)', fontSize: '14px', marginBottom: '6px' }}>{recoveryInfo.title}</h3>
          <p style={{ fontSize: '11.5px', color: '#BBB', lineHeight: '1.4', marginBottom: '12px' }}>{recoveryInfo.desc}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recoveryInfo.meals.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'white' }}>{m.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>🔥 {m.calories} kcal | 🥩 {m.protein}g P</span>
                </div>
                <button
                  onClick={() => acceptRecoveryMeal(m)}
                  style={{
                    padding: '6px 10px',
                    fontSize: '10px',
                    backgroundColor: 'var(--accent-yellow)',
                    color: 'black',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  + Agregar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* IA Asistente de Nutrición */}
      <section className="ai-nutrition-assistant glass-card" style={{ borderLeft: '3px solid var(--accent-blue)' }}>
        <h3>🧠 Asistente de Dieta IA</h3>
        <p style={{ fontSize: '12px', color: '#AAA', marginBottom: '12px' }}>¿Qué ingredientes tienes a la mano hoy? (Ej: Tengo huevos, avena y plátano)</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder="Menciona tus alimentos..."
            style={{ flex: 1, padding: '10px', borderRadius: '6px', backgroundColor: '#121212', color: 'white', border: '1px solid #333', fontSize: '12px' }}
          />
          <button onClick={askAI} style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'var(--accent-strava)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
            Consultar
          </button>
        </div>
        
        {isTyping && <p style={{ marginTop: '12px', color: '#888', fontStyle: 'italic', fontSize: '11px' }}>IA Analizando ingredientes y calculando macros...</p>}
        
        {aiSuggestion && (
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--accent-blue)', borderRadius: '8px' }}>
            <h4 style={{ color: 'var(--accent-blue)', marginBottom: '8px', fontSize: '13px' }}>✨ Sugerencia Generada: {aiSuggestion.name}</h4>
            <p style={{ fontSize: '11.5px', color: '#CCC', marginBottom: '8px' }}>{aiSuggestion.description}</p>
            <div style={{ fontSize: '11px', display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <span>🔥 {aiSuggestion.calories} kcal</span>
              <span>🥩 {aiSuggestion.protein}g P</span>
            </div>
            <button onClick={acceptAiMeal} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--accent-blue)', color: 'black', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
              + Agregar a mi Plan
            </button>
          </div>
        )}
      </section>

      {/* Creador de Dieta Diaria */}
      <section className="meal-section">
        <h2 style={{ fontSize: '18px', border: 'none', padding: '0', marginBottom: '14px' }}>🍽️ Mi Plan de Hoy</h2>
        {plannedMeals.length === 0 && (
          <p style={{ textAlign: 'center', color: '#555', marginTop: '20px', fontSize: '12px' }}>No has agregado comidas hoy.</p>
        )}

        {plannedMeals.map((meal, index) => (
          <div key={`${meal.id}-${index}`} className="meal-card glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ fontSize: '13px', color: '#FFF' }}>{meal.name}</h4>
                <span style={{ fontSize: '9px', backgroundColor: '#222', padding: '2px 6px', borderRadius: '4px', color: '#CCFF00', fontWeight: 'bold', display: 'inline-block', marginTop: '4px' }}>{meal.type}</span>
              </div>
              <button 
                onClick={() => removeMeal(index)}
                style={{ background: 'transparent', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }}
              >
                ✕
              </button>
            </div>
            <p style={{ marginTop: '8px', fontSize: '12px', color: '#CCC', lineHeight: '1.4' }}>{meal.description}</p>
            <div style={{ marginTop: '12px', fontSize: '11px', display: 'flex', gap: '12px', color: '#AAA' }}>
              <span>🔥 {meal.calories} kcal</span>
              <span>🥩 {meal.protein}g Prot</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
