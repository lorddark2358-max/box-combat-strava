export interface UserProfile {
  id: string;
  sex: 'M' | 'F';
  age: number;
  heightCm: number;
  weightKg: number;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  activityLevel: 'Very High'; // 2.5h diarias
  goals: string[];
  routineStartDay: string; // e.g., 'Lunes'
  stats: {
    bmi: number;
    currentStreakDays: number;
    lastCompletedDate?: string;
  };
  nutritionGoal: {
    calories: number; // 2600 - 2800 kcal (Superávit)
    proteinGrams: number; // 110g
    carbsGrams: number;
    fatsGrams: number;
  };
}

export interface ExerciseSet {
  setId: number;
  reps: number;
  weightKg: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  category: 'Weightlifting' | 'Boxing' | 'Core' | 'BJJ' | 'MMA' | 'Kickboxing' | 'Running' | string;
  type: 'Strength' | 'Hypertrophy' | 'Technique' | 'Sparring' | 'Conditioning';
  targetSets: number;
  targetReps: string;
  restTimerSeconds: number;
  instructions: string;
  alternatives?: string[]; // Ej: Si no hay barra, usar mancuernas
  sets: ExerciseSet[];
}

export interface WorkoutSession {
  id: string;
  dayOfWeek: string; // e.g., 'Lunes', 'Martes'
  title: string;
  focus: string; // Ej: 'Pecho / Tríceps'
  exercises: Exercise[];
}

export interface Meal {
  id: string;
  name: string;
  type: 'Pre-Workout' | 'Post-Workout' | 'Desayuno' | 'Almuerzo' | 'Cena' | 'Snack';
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  description: string;
}

// --- NUEVOS TIPOS PARA LAS FUNCIONALIDADES DE STRAVA ---

export interface Activity {
  id: string;
  title: string;
  type: 'Boxing' | 'MMA' | 'BJJ' | 'Kickboxing' | 'Running' | 'Conditioning';
  date: string;
  durationMinutes: number;
  caloriesBurned: number;
  intensity: 'Baja' | 'Media' | 'Alta' | 'Extrema';
  notes?: string;
  // Campos específicos de Running
  routeId?: string;
  distanceKm?: number;
  elevationGainMeters?: number;
  splits?: number[]; // Ritmos por kilómetro
  // Campos específicos de Combate
  roundsCount?: number;
  roundDurationMinutes?: number;
  videoUrl?: string;
  maxGForce?: number;
  ropeJumpsCount?: number;
}

export interface FeedComment {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  date: string;
}

export interface FeedItem {
  id: string;
  athleteName: string;
  athleteAvatarUrl?: string;
  isPro?: boolean;
  activity: Activity;
  kudosCount: number;
  hasGivenKudo?: boolean;
  comments: FeedComment[];
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number; // Ej: 100 asaltos, 50 km
  current: number;
  unit: string; // "asaltos", "km", "minutos"
  badgeIcon: string; // Icono o emoji de medalla
  expiryDays: number;
}

export interface LeaderboardEntry {
  rank: number;
  athleteName: string;
  isPro?: boolean;
  score: number; // Ej: Calorías totales quemadas o puntos de esfuerzo
  discipline: string; // Ej: "MMA Pro", "BJJ Brown Belt", "El Atleta"
}

export interface Route {
  id: string;
  name: string;
  distanceKm: number;
  elevationGainMeters: number;
  difficulty: 'Fácil' | 'Moderado' | 'Difícil' | 'Extremo';
  points: { x: number; y: number }[]; // Coordenadas para dibujar en un Canvas/SVG
}
