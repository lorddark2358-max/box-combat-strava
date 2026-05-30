import { UserProfile, WorkoutSession, Exercise, Meal } from './types';

export const currentUser: UserProfile = {
  id: 'USR-001',
  sex: 'M',
  age: 25,
  heightCm: 151.4,
  weightKg: 53.6,
  experienceLevel: 'Intermediate',
  activityLevel: 'Very High',
  goals: ['Aumentar 1RM', 'Hipertrofia', 'Fuerza de pegada', 'Rendimiento boxeo'],
  routineStartDay: 'Lunes',
  stats: {
    bmi: 23.4,
    currentStreakDays: 12,
    lastCompletedDate: new Date().toISOString().split('T')[0]
  },
  nutritionGoal: {
    calories: 2700,
    proteinGrams: 110,
    carbsGrams: 350,
    fatsGrams: 95
  }
};

export const exerciseDatabase: Exercise[] = [
  // --- PECHO Y EMPUJE (Push) ---
  { id: 'db-1', name: 'Press de Banca Libre', category: 'Weightlifting', type: 'Strength', targetSets: 4, targetReps: '3-5', restTimerSeconds: 240, instructions: 'Baja la barra al pecho controlado, empuja explosivamente.', alternatives: ['Flexiones Pliométricas', 'Fondos en anillas'], sets: [] },
  { id: 'db-2', name: 'Press Inclinado con Mancuernas', category: 'Weightlifting', type: 'Hypertrophy', targetSets: 3, targetReps: '8-10', restTimerSeconds: 120, instructions: 'Banco a 30-45 grados. Baja hasta sentir el estiramiento.', alternatives: ['Pike Push-ups', 'Flexiones Declinadas'], sets: [] },
  { id: 'db-3', name: 'Fondos en Paralelas Lastrados', category: 'Weightlifting', type: 'Hypertrophy', targetSets: 3, targetReps: '8-10', restTimerSeconds: 120, instructions: 'Inclina el torso hacia adelante. Rompe los 90 grados.', alternatives: ['Fondos estrictos', 'Flexiones Diamante'], sets: [] },
  { id: 'db-chest-4', name: 'Cruce de Poleas', category: 'Weightlifting', type: 'Hypertrophy', targetSets: 3, targetReps: '12-15', restTimerSeconds: 90, instructions: 'Junta los cables frente a ti apretando el pecho interno.', alternatives: ['Aperturas con Bandas', 'Isométricos amplios'], sets: [] },
  { id: 'db-chest-5', name: 'Press Guillotina', category: 'Weightlifting', type: 'Hypertrophy', targetSets: 3, targetReps: '10-12', restTimerSeconds: 90, instructions: 'Baja la barra al cuello. Aisla el pectoral superior (Avanzado).', alternatives: ['Aperturas Inclinadas'], sets: [] },

  // --- HOMBROS ---
  { id: 'db-4', name: 'Press Militar Libre', category: 'Weightlifting', type: 'Strength', targetSets: 4, targetReps: '4-6', restTimerSeconds: 180, instructions: 'Tensa glúteos y core. Empuja desde las clavículas.', alternatives: ['Handstand Push-ups', 'Pike Push-ups'], sets: [] },
  { id: 'db-5', name: 'Elevaciones Laterales Polea', category: 'Weightlifting', type: 'Hypertrophy', targetSets: 3, targetReps: '12-15', restTimerSeconds: 90, instructions: 'Mantiene tensión continua en el deltoide medio.', alternatives: ['Laterales con Mancuernas'], sets: [] },
  { id: 'db-sho-3', name: 'Elevaciones Frontales con Disco', category: 'Weightlifting', type: 'Hypertrophy', targetSets: 3, targetReps: '12', restTimerSeconds: 90, instructions: 'Levanta el disco con ambas manos hasta la altura de los ojos.', alternatives: ['Frontales con Banda'], sets: [] },
  { id: 'db-sho-4', name: 'Pájaros (Deltoide Posterior)', category: 'Weightlifting', type: 'Hypertrophy', targetSets: 3, targetReps: '15', restTimerSeconds: 90, instructions: 'Inclinado, abre los brazos para trabajar la parte posterior.', alternatives: ['Face Pulls con Banda'], sets: [] },

  // --- ESPALDA Y TRACCIÓN (Pull) ---
  { id: 'db-pull-1', name: 'Dominadas Lastradas', category: 'Weightlifting', type: 'Strength', targetSets: 4, targetReps: '4-6', restTimerSeconds: 180, instructions: 'Retrae escápulas. Barbilla sobre la barra.', alternatives: ['Muscle-ups', 'Front Lever Tucks'], sets: [] },
  { id: 'db-pull-2', name: 'Remo con Barra', category: 'Weightlifting', type: 'Hypertrophy', targetSets: 3, targetReps: '8-10', restTimerSeconds: 120, instructions: 'Espalda a 45 grados. Tira hacia el ombligo.', alternatives: ['Remo Invertido', 'Front Lever Raises'], sets: [] },
  { id: 'db-pull-3', name: 'Jalón al Pecho', category: 'Weightlifting', type: 'Hypertrophy', targetSets: 3, targetReps: '10-12', restTimerSeconds: 90, instructions: 'Aisla los dorsales en la máquina de polea alta.', alternatives: ['Dominadas asistidas'], sets: [] },
  { id: 'db-pull-4', name: 'Remo a una mano (Serrucho)', category: 'Weightlifting', type: 'Hypertrophy', targetSets: 3, targetReps: '10-12', restTimerSeconds: 90, instructions: 'Apoyado en banco, tira de la mancuerna al costado.', alternatives: ['Remo con banda a 1 brazo'], sets: [] },
  { id: 'db-pull-5', name: 'Encogimientos (Shrugs)', category: 'Weightlifting', type: 'Hypertrophy', targetSets: 4, targetReps: '12-15', restTimerSeconds: 90, instructions: 'Levanta los hombros hacia las orejas. Trabaja trapecios.', alternatives: ['Paseo del granjero pesado'], sets: [] },

  // --- BÍCEPS / TRÍCEPS / ANTEBRAZOS ---
  { id: 'db-6', name: 'Curl Predicador Barra EZ', category: 'Weightlifting', type: 'Hypertrophy', targetSets: 3, targetReps: '8-12', restTimerSeconds: 90, instructions: 'Ajusta el banco para aislar el brazo. Baja controlado.', alternatives: ['Dominadas Supinas', 'Curl Pelícano'], sets: [] },
  { id: 'db-7', name: 'Extensión Tríceps Polea', category: 'Weightlifting', type: 'Hypertrophy', targetSets: 3, targetReps: '10-12', restTimerSeconds: 90, instructions: 'Codos pegados. Extiende hacia abajo.', alternatives: ['Tricep Ext en barra baja', 'Bench dips'], sets: [] },
  { id: 'db-arm-3', name: 'Curl Martillo', category: 'Weightlifting', type: 'Hypertrophy', targetSets: 3, targetReps: '10-12', restTimerSeconds: 90, instructions: 'Agarre neutro. Trabaja el braquial y antebrazo.', alternatives: ['Dominadas neutras'], sets: [] },
  { id: 'db-arm-4', name: 'Rompecráneos (Skullcrushers)', category: 'Weightlifting', type: 'Hypertrophy', targetSets: 3, targetReps: '10-12', restTimerSeconds: 90, instructions: 'Acostado, baja la barra Z a la frente.', alternatives: ['Flexiones diamante explosivas'], sets: [] },
  { id: 'db-arm-5', name: 'Curl de Antebrazos Su/Pro', category: 'Weightlifting', type: 'Hypertrophy', targetSets: 3, targetReps: '15-20', restTimerSeconds: 60, instructions: 'Apoya el brazo, flexiona solo la muñeca. Previene lesiones.', alternatives: ['Colgarse de la barra (Grip holds)'], sets: [] },

  // --- PIERNAS, GLÚTEOS Y CORE ---
  { id: 'db-8', name: 'Sentadilla Libre', category: 'Weightlifting', type: 'Strength', targetSets: 4, targetReps: '3-5', restTimerSeconds: 240, instructions: 'Baja rompiendo el paralelo. Sube explosivo.', alternatives: ['Pistol Squats', 'Sentadillas Salto'], sets: [] },
  { id: 'db-9', name: 'Peso Muerto Rumano', category: 'Weightlifting', type: 'Hypertrophy', targetSets: 3, targetReps: '8-10', restTimerSeconds: 120, instructions: 'Flexión de cadera con rodillas semi-rígidas.', alternatives: ['Curl isquios deslizante'], sets: [] },
  { id: 'db-glute-1', name: 'Hip Thrust', category: 'Weightlifting', type: 'Strength', targetSets: 4, targetReps: '6-8', restTimerSeconds: 180, instructions: 'Espalda apoyada. Empuja con talones.', alternatives: ['Glute Bridge'], sets: [] },
  { id: 'db-leg-4', name: 'Prensa de Piernas', category: 'Weightlifting', type: 'Hypertrophy', targetSets: 3, targetReps: '10-15', restTimerSeconds: 120, instructions: 'No bloquees rodillas. Baja profundo.', alternatives: ['Zancadas Búlgaras'], sets: [] },
  { id: 'db-leg-5', name: 'Elevación de Talones', category: 'Weightlifting', type: 'Hypertrophy', targetSets: 4, targetReps: '15-20', restTimerSeconds: 60, instructions: 'Pantorrillas, vital para el footwork de boxeo.', alternatives: ['Saltos de cuerda continuos'], sets: [] },
  { id: 'db-core-1', name: 'Ab Wheel Rollouts', category: 'Core', type: 'Strength', targetSets: 3, targetReps: '8-12', restTimerSeconds: 90, instructions: 'Extiende rueda hacia adelante.', alternatives: ['L-Sit holds', 'Plancha extendida'], sets: [] },
  { id: 'db-core-2', name: 'Elevación Piernas Colgado', category: 'Core', type: 'Hypertrophy', targetSets: 3, targetReps: '12-15', restTimerSeconds: 90, instructions: 'Usa el abdomen bajo, sin balanceo.', alternatives: ['V-Ups'], sets: [] },
  { id: 'db-core-3', name: 'Russian Twists', category: 'Core', type: 'Conditioning', targetSets: 3, targetReps: '20', restTimerSeconds: 60, instructions: 'Gira el torso para oblicuos (ganchos rotacionales).', alternatives: ['Lanzamiento lateral de Med Ball'], sets: [] },

  // --- CUELLO ---
  { id: 'db-neck-1', name: 'Curl de Cuello con Disco', category: 'Weightlifting', type: 'Strength', targetSets: 3, targetReps: '15', restTimerSeconds: 60, instructions: 'Acostado, sube y baja el cuello. Previene KOs.', alternatives: ['Isométricos de cuello manuales'], sets: [] },

  // --- BOXEO ---
  { id: 'bx-1', name: 'Med Ball Throws', category: 'Boxing', type: 'Conditioning', targetSets: 4, targetReps: '8', restTimerSeconds: 90, instructions: 'Postura de guardia. Lanza balón rotando cadera.', alternatives: ['Band Resisted Punches'], sets: [] },
  { id: 'bx-2', name: 'Saco Pesado (Poder)', category: 'Boxing', type: 'Sparring', targetSets: 4, targetReps: '3 min', restTimerSeconds: 60, instructions: '100% de fuerza buscando hundir los nudillos.', alternatives: ['Mitts de poder'], sets: [] },
  { id: 'bx-3', name: 'Sombra Mancuernas Ligeras', category: 'Boxing', type: 'Technique', targetSets: 3, targetReps: '3 min', restTimerSeconds: 60, instructions: 'Mancuernas 1kg. Rapidez de retracción.', alternatives: ['Sombra con Ligas'], sets: [] },
  { id: 'bx-4', name: 'Pera Loca (Double End Bag)', category: 'Boxing', type: 'Technique', targetSets: 3, targetReps: '3 min', restTimerSeconds: 60, instructions: 'Ritmo y evasión tras golpear.', alternatives: ['Pelota de reflejos en gorra'], sets: [] },
  { id: 'bx-5', name: 'Burpees Pliométricos Sombra', category: 'Boxing', type: 'Conditioning', targetSets: 3, targetReps: '10', restTimerSeconds: 60, instructions: 'Burpee + Salto + 1-2 rápido.', alternatives: ['Sprawls de MMA'], sets: [] },

  // --- JIU JITSU (BJJ) ---
  { id: 'bjj-1', name: 'Drills de Entrada de Triángulo', category: 'BJJ', type: 'Technique', targetSets: 4, targetReps: '20 reps', restTimerSeconds: 45, instructions: 'Cadera arriba, lanza piernas al cuello cruzando pantorrillas.', alternatives: ['Sombra con fitball'], sets: [] },
  { id: 'bjj-2', name: 'Pase de Guardia (Toreando / X-Pass)', category: 'BJJ', type: 'Technique', targetSets: 3, targetReps: '10 L/R', restTimerSeconds: 60, instructions: 'Controla pantalones del oponente, desvía y pasa lateral.', alternatives: ['Pases en saco de box acostado'], sets: [] },
  { id: 'bjj-3', name: 'Escape de Montada a Media Guardia', category: 'BJJ', type: 'Technique', targetSets: 3, targetReps: '5 L/R', restTimerSeconds: 60, instructions: 'Esquiva cadera (shrimp), empuja rodilla y captura en media guardia.', alternatives: ['Movilidad cadera en suelo'], sets: [] },
  { id: 'bjj-4', name: 'Rolar / Sparring BJJ', category: 'BJJ', type: 'Sparring', targetSets: 5, targetReps: '5 min', restTimerSeconds: 120, instructions: 'Sparring libre de grappling buscando sumisiones y control.', alternatives: ['Drills de transiciones continuas'], sets: [] },

  // --- MMA ---
  { id: 'mma-1', name: 'Ground & Pound en Saco Acostado', category: 'MMA', type: 'Conditioning', targetSets: 4, targetReps: '2 min', restTimerSeconds: 60, instructions: 'Postura de montada en el saco, golpea con codos y puños controlando postura.', alternatives: ['Sombra de golpes en suelo'], sets: [] },
  { id: 'mma-2', name: 'Defensa de Derribo contra Jaula', category: 'MMA', type: 'Technique', targetSets: 3, targetReps: '8 reps', restTimerSeconds: 90, instructions: 'Apoya espalda, saca cadera bajo axilas y mete underhooks.', alternatives: ['Wall sits explosivos'], sets: [] },
  { id: 'mma-3', name: 'Transición Sprawl a Golpeo', category: 'MMA', type: 'Conditioning', targetSets: 3, targetReps: '12 reps', restTimerSeconds: 60, instructions: 'Realiza sprawl defensivo, sube explosivamente y lanza 1-2-patada.', alternatives: ['Burpees pliométricos'], sets: [] },
  { id: 'mma-4', name: 'Sparring Híbrido MMA', category: 'MMA', type: 'Sparring', targetSets: 3, targetReps: '5 min', restTimerSeconds: 60, instructions: 'Sparring completo combinando striking, derribos y sumisiones.', alternatives: ['Sombra de MMA integrando niveles'], sets: [] },

  // --- KICKBOXING & MUAY THAI ---
  { id: 'kb-1', name: 'Patada Circular Pesada al Saco', category: 'Kickboxing', type: 'Conditioning', targetSets: 5, targetReps: '15 L/R', restTimerSeconds: 90, instructions: 'Pivota pie de apoyo, rota cadera y golpea con la tibia.', alternatives: ['Patadas elásticas con liga'], sets: [] },
  { id: 'kb-2', name: 'Combinación 1-2-Low Kick', category: 'Kickboxing', type: 'Technique', targetSets: 4, targetReps: '3 min', restTimerSeconds: 60, instructions: 'Jab + Recto + Patada baja exterior buscando el cuadríceps.', alternatives: ['Sombra libre con kick drills'], sets: [] },
  { id: 'kb-3', name: 'Esquiva de Volado + Patada Media', category: 'Kickboxing', type: 'Technique', targetSets: 3, targetReps: '10 L/R', restTimerSeconds: 60, instructions: 'Esquiva rotando torso (roll) + Contraataca con patada media.', alternatives: ['Desplazamientos laterales rápidos'], sets: [] },
  { id: 'kb-4', name: 'Combo Muay Thai: 1-2-Codo Slicing', category: 'Kickboxing', type: 'Technique', targetSets: 4, targetReps: '3 min', restTimerSeconds: 60, instructions: 'Jab + Recto de Derecha + Codo descendente cortante (Slicing Elbow). Abre la guardia del oponente.', alternatives: ['Sombra de striking'], sets: [] },
  { id: 'bjj-5', name: 'Transición Toreando a Palanca Armbar', category: 'BJJ', type: 'Technique', targetSets: 3, targetReps: '10 reps', restTimerSeconds: 45, instructions: 'Simula pase toreando lateral, toma control de 100 kilos, avanza a montada completa y ejecuta palanca de brazo Armbar clásica.', alternatives: ['Drills de grappling solo'], sets: [] },


  // --- ACONDICIONAMIENTO FÍSICO / RUNNING ---
  { id: 'run-1', name: 'Roadwork / Carrera Continua', category: 'Running', type: 'Conditioning', targetSets: 1, targetReps: '30-45 min', restTimerSeconds: 0, instructions: 'Carrera a ritmo constante de cardio aeróbico para resistencia.', alternatives: ['Saltar la cuerda continuo'], sets: [] },

  // --- RECUPERACIÓN ---
  { id: 'rec-1', name: 'Movilidad Articular', category: 'Core', type: 'Technique', targetSets: 1, targetReps: '15 min', restTimerSeconds: 0, instructions: 'Rutina de movilidad cadera, hombros.', alternatives: ['Foam Rolling'], sets: [] },
  { id: 'rec-2', name: 'Planificación RM y Dieta', category: 'Core', type: 'Technique', targetSets: 1, targetReps: '15 min', restTimerSeconds: 0, instructions: 'Ajusta pesos y anota objetivos.', alternatives: ['Meditación Activa'], sets: [] }
];

export const nutritionDatabase: Meal[] = [
  { id: 'meal-1', name: 'Avena Explosiva Andina', type: 'Pre-Workout', calories: 450, protein: 15, carbs: 75, fats: 10, ingredients: ['Avena', 'Plátano', 'Miel', 'Canela', 'Leche'], description: 'Carbohidratos rápidos para energía explosiva.' },
  { id: 'meal-2', name: 'Pollo, Arroz y Brócoli', type: 'Post-Workout', calories: 550, protein: 45, carbs: 60, fats: 10, ingredients: ['Pollo', 'Arroz Blanco', 'Brócoli', 'Aceite de Oliva'], description: 'Reparación pura post-entrenamiento.' },
  { id: 'meal-3', name: 'Tortilla de Claras y Avena', type: 'Desayuno', calories: 400, protein: 35, carbs: 45, fats: 8, ingredients: ['Huevos', 'Claras de huevo', 'Avena'], description: 'Limpio y rápido de preparar.' },
  { id: 'meal-4', name: 'Atún con Lentejas', type: 'Almuerzo', calories: 500, protein: 40, carbs: 55, fats: 12, ingredients: ['Atún', 'Lentejas', 'Arroz', 'Cebolla'], description: 'Alto en hierro y proteína magra.' },
  { id: 'meal-5', name: 'Majado de Verde con Queso', type: 'Desayuno', calories: 450, protein: 18, carbs: 60, fats: 15, ingredients: ['Plátano Verde', 'Queso', 'Huevos'], description: 'Energía densa y potasio andino.' },
  { id: 'meal-6', name: 'Carne de Res con Camote', type: 'Almuerzo', calories: 600, protein: 40, carbs: 50, fats: 20, ingredients: ['Carne de Res', 'Camote', 'Aguacate'], description: 'Proteína pesada y grasas saludables (Aumentar fuerza).' },
  { id: 'meal-7', name: 'Batido Hipercalórico Casero', type: 'Snack', calories: 800, protein: 30, carbs: 100, fats: 30, ingredients: ['Leche entera', 'Mantequilla de maní', 'Plátano', 'Avena'], description: 'Para ganar peso y masa (Bulking).' },
  { id: 'meal-8', name: 'Tilapia al Horno con Quinoa', type: 'Cena', calories: 450, protein: 35, carbs: 50, fats: 8, ingredients: ['Tilapia', 'Pescado', 'Quinoa', 'Limón'], description: 'Digestión rápida para antes de dormir.' },
  { id: 'meal-9', name: 'Yogurt Griego con Almendras', type: 'Snack', calories: 300, protein: 20, carbs: 15, fats: 18, ingredients: ['Yogurt Griego', 'Almendras', 'Miel'], description: 'Bocadillo proteico de media tarde.' },
  { id: 'meal-10', name: 'Ensalada de Garbanzos y Atún', type: 'Almuerzo', calories: 400, protein: 30, carbs: 45, fats: 10, ingredients: ['Garbanzos', 'Atún', 'Tomate', 'Limón'], description: 'Fresco, sin cocinar, alto en fibra.' },
  { id: 'meal-11', name: 'Pechuga a la Plancha con Papas', type: 'Cena', calories: 500, protein: 40, carbs: 60, fats: 10, ingredients: ['Pollo', 'Papas', 'Zanahoria'], description: 'Restauración de glucógeno simple.' },
  { id: 'meal-12', name: 'Huevos Revueltos con Espinaca', type: 'Desayuno', calories: 350, protein: 25, carbs: 5, fats: 25, ingredients: ['Huevos', 'Espinaca', 'Mantequilla'], description: 'Bajo en carbohidratos, alto en grasas hormonales.' }
];

export const routineTemplates: WorkoutSession[] = [
  {
    id: 'tpl-1', dayOfWeek: 'Lunes', title: 'Lunes: Empuje Pesado', focus: 'Pecho, Hombros',
    exercises: [exerciseDatabase.find(e=>e.id==='db-1')!, exerciseDatabase.find(e=>e.id==='db-4')!, exerciseDatabase.find(e=>e.id==='db-7')!]
  },
  {
    id: 'tpl-2', dayOfWeek: 'Martes', title: 'Martes: Tracción y Espalda', focus: 'Espalda y Bíceps',
    exercises: [exerciseDatabase.find(e=>e.id==='db-pull-1')!, exerciseDatabase.find(e=>e.id==='db-pull-2')!, exerciseDatabase.find(e=>e.id==='db-6')!]
  },
  {
    id: 'tpl-3', dayOfWeek: 'Miércoles', title: 'Miércoles: Piernas y Glúteos', focus: 'Fuerza Inferior',
    exercises: [exerciseDatabase.find(e=>e.id==='db-8')!, exerciseDatabase.find(e=>e.id==='db-glute-1')!, exerciseDatabase.find(e=>e.id==='db-leg-4')!]
  },
  {
    id: 'tpl-4', dayOfWeek: 'Jueves', title: 'Jueves: Acondicionamiento Boxeo', focus: 'Resistencia y Técnica',
    exercises: [exerciseDatabase.find(e=>e.id==='bx-1')!, exerciseDatabase.find(e=>e.id==='bx-2')!, exerciseDatabase.find(e=>e.id==='bx-3')!]
  },
  {
    id: 'tpl-5', dayOfWeek: 'Viernes', title: 'Viernes: Full Body Explosivo', focus: 'Aislamiento',
    exercises: [exerciseDatabase.find(e=>e.id==='db-2')!, exerciseDatabase.find(e=>e.id==='db-pull-3')!, exerciseDatabase.find(e=>e.id==='db-core-1')!]
  },
  {
    id: 'tpl-6', dayOfWeek: 'Sábado', title: 'Sábado: Movilidad y Recuperación', focus: 'Descanso Activo',
    exercises: [exerciseDatabase.find(e=>e.id==='rec-1')!]
  },
  {
    id: 'tpl-7', dayOfWeek: 'Domingo', title: 'Domingo: Planificación Semanal', focus: 'Revisión',
    exercises: [exerciseDatabase.find(e=>e.id==='rec-2')!]
  }
];

// --- MOCK DATA PARA LA SECCIÓN DE MAPAS DE CONDICIONAMIENTO Y RUTAS ---

export const mockRoutes: any[] = [
  {
    id: 'route-1',
    name: 'Subida al Cerro del Guerrero (Roadwork)',
    distanceKm: 5.2,
    elevationGainMeters: 320,
    difficulty: 'Difícil',
    points: [
      { x: 10, y: 180 },
      { x: 50, y: 150 },
      { x: 100, y: 160 },
      { x: 150, y: 110 },
      { x: 200, y: 120 },
      { x: 250, y: 70 },
      { x: 300, y: 80 },
      { x: 350, y: 30 },
      { x: 400, y: 40 }
    ]
  },
  {
    id: 'route-2',
    name: 'Circuito de Intervalos del Club de Combate',
    distanceKm: 3.5,
    elevationGainMeters: 45,
    difficulty: 'Fácil',
    points: [
      { x: 20, y: 150 },
      { x: 80, y: 50 },
      { x: 200, y: 50 },
      { x: 260, y: 150 },
      { x: 200, y: 250 },
      { x: 80, y: 250 },
      { x: 20, y: 150 }
    ]
  },
  {
    id: 'route-3',
    name: 'Rocky Steps & Vuelta al Parque del Dolor',
    distanceKm: 8.0,
    elevationGainMeters: 180,
    difficulty: 'Moderado',
    points: [
      { x: 10, y: 190 },
      { x: 70, y: 190 },
      { x: 90, y: 120 },
      { x: 120, y: 120 },
      { x: 180, y: 150 },
      { x: 240, y: 90 },
      { x: 310, y: 90 },
      { x: 340, y: 50 },
      { x: 400, y: 50 }
    ]
  }
];

// --- MOCK RETOS (CHALLENGES) ---

export const mockChallenges: any[] = [
  {
    id: 'ch-1',
    title: 'Rey del Sparring',
    description: 'Completa 50 asaltos de sparring (Boxeo, MMA o Kickboxing) en la app.',
    target: 50,
    current: 32,
    unit: 'asaltos',
    badgeIcon: '👑',
    expiryDays: 5
  },
  {
    id: 'ch-2',
    title: 'Grip de Acero (BJJ Roll)',
    description: 'Logguea un total de 300 minutos rolando sobre el tatami para mejorar agarre.',
    target: 300,
    current: 120,
    unit: 'minutos',
    badgeIcon: '🥋',
    expiryDays: 12
  },
  {
    id: 'ch-3',
    title: 'Roadwork Leyenda (Rocky Steps)',
    description: 'Acumula un kilometraje de 30 km en tus rutas de cardio running.',
    target: 30,
    current: 15.5,
    unit: 'km',
    badgeIcon: '🏃‍♂️',
    expiryDays: 8
  }
];

// --- MOCK CLASIFICACIÓN (LEADERBOARD) ---

export const mockLeaderboard: any[] = [
  { rank: 1, athleteName: 'Khabib Nurmagomedov', isPro: true, score: 6200, discipline: 'MMA Sambo King' },
  { rank: 2, athleteName: 'Jon Jones', isPro: true, score: 5850, discipline: 'MMA Heavyweight Champ' },
  { rank: 3, athleteName: 'Canelo Álvarez', isPro: true, score: 5400, discipline: 'Boxing Absolute Champ' },
  { rank: 4, athleteName: 'Tú (Atleta)', isPro: false, score: 3950, discipline: 'Híbrido Combate' },
  { rank: 5, athleteName: 'Marcos \"El Pulpo\" Silva', isPro: false, score: 3200, discipline: 'BJJ Black Belt' }
];

// --- MOCK FEED SOCIAL DE ATLETAS PRO Y HISTORIAL ---

export const mockFeedItems: any[] = [
  {
    id: 'feed-1',
    athleteName: 'Canelo Álvarez',
    athleteAvatarUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=100&auto=format&fit=crop&q=60',
    isPro: true,
    activity: {
      id: 'act-canelo-1',
      title: '12 Asaltos de Manoplas y Pera Loca',
      type: 'Boxing',
      date: '2026-05-27T08:30:00Z',
      durationMinutes: 60,
      caloriesBurned: 780,
      intensity: 'Alta',
      roundsCount: 12,
      roundDurationMinutes: 3,
      notes: 'Puliendo la velocidad y el cabeceo. No hay descanso, nos preparamos para defender la corona.'
    },
    kudosCount: 1542,
    hasGivenKudo: false,
    comments: [
      { id: 'c-1', authorName: 'Khabib Nurmagomedov', content: 'Good speed brother, but boxing needs more wrestling 🦅', date: '2026-05-27T09:10:00Z' },
      { id: 'c-2', authorName: 'Jon Jones', content: 'Crisp handwork, champion! 🔥', date: '2026-05-27T09:45:00Z' }
    ]
  },
  {
    id: 'feed-2',
    athleteName: 'Khabib Nurmagomedov',
    athleteAvatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=60',
    isPro: true,
    activity: {
      id: 'act-khabib-1',
      title: '6 Rounds de Grappling Extremo / Sambo',
      type: 'BJJ',
      date: '2026-05-26T17:15:00Z',
      durationMinutes: 45,
      caloriesBurned: 850,
      intensity: 'Extrema',
      roundsCount: 6,
      roundDurationMinutes: 5,
      notes: '6 rounds de 5 minutos rolando sin parar. Presión constante, cansancio mental controlado. Alhamdullilah.'
    },
    kudosCount: 2890,
    hasGivenKudo: true,
    comments: [
      { id: 'c-3', authorName: 'Tú (Atleta)', content: '¡Qué nivel de presión! Increíble acondicionamiento.', date: '2026-05-26T18:00:00Z' }
    ]
  },
  {
    id: 'feed-3',
    athleteName: 'Jon Jones',
    athleteAvatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=60',
    isPro: true,
    activity: {
      id: 'act-jones-1',
      title: 'Cardio Explosivo - Subida al Cerro del Guerrero',
      type: 'Running',
      date: '2026-05-26T06:00:00Z',
      durationMinutes: 38,
      caloriesBurned: 640,
      intensity: 'Alta',
      routeId: 'route-1',
      distanceKm: 5.2,
      elevationGainMeters: 320,
      splits: [7.2, 7.5, 8.0, 7.8, 7.5],
      notes: 'Roadwork matutino completado. Trabajo de resistencia y fuerza de piernas con desnivel. Afilando la mente.'
    },
    kudosCount: 1980,
    hasGivenKudo: false,
    comments: [
      { id: 'c-4', authorName: 'Canelo Álvarez', content: 'Gran ritmo para tu peso. La montaña forja campeones ⛰️', date: '2026-05-26T07:30:00Z' }
    ]
  }
];
