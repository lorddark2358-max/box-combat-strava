import { API_BASE_URL } from '../config';

// Utilidades para peticiones HTTP
export const api = {
  // 1. Autenticación
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  register: async (email: string, password: string, extraData?: {
    weight?: number;
    height?: number;
    age?: number;
    gymId?: string;
    targetGoal?: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, ...extraData })
    });
    return res.json();
  },

  // 2. Actividades y Social Feed
  getActivities: async () => {
    const res = await fetch(`${API_BASE_URL}/api/activities`);
    return res.json();
  },

  createActivity: async (formData: FormData) => {
    const res = await fetch(`${API_BASE_URL}/api/activities`, {
      method: 'POST',
      body: formData // Nota: Multipart para poder subir archivos de video
    });
    return res.json();
  },

  // 3. Comentarios y Kudos
  giveKudo: async (activityId: string, userEmail: string) => {
    const res = await fetch(`${API_BASE_URL}/api/activities/${activityId}/kudos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail })
    });
    return res.json();
  },

  addComment: async (activityId: string, authorName: string, content: string) => {
    const res = await fetch(`${API_BASE_URL}/api/activities/${activityId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorName, content, date: new Date().toISOString() })
    });
    return res.json();
  },

  // 4. Configuración del Administrador (Estilos y Modulos)
  getAdminConfig: async () => {
    const res = await fetch(`${API_BASE_URL}/api/admin/config`);
    return res.json();
  },

  saveAdminConfig: async (config: {
    primaryBg: string;
    accentRed: string;
    accentYellow: string;
    accentStrava: string;
    textMotivation: string;
    showBJJ: boolean;
    showNutrition: boolean;
  }) => {
    const res = await fetch(`${API_BASE_URL}/api/admin/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return res.json();
  },

  getAchievements: async (email: string) => {
    const res = await fetch(`${API_BASE_URL}/api/achievements/${email}`);
    return res.json();
  },

  // 5. NUEVOS: Gimnasios y Perfiles
  getGyms: async () => {
    const res = await fetch(`${API_BASE_URL}/api/gyms`);
    return res.json();
  },

  saveGym: async (gym: {
    id?: string;
    name: string;
    primaryColor: string;
    accentColor: string;
    textColor: string;
    motivation: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/api/gyms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gym)
    });
    return res.json();
  },

  getUserProfile: async (email: string) => {
    const res = await fetch(`${API_BASE_URL}/api/users/profile/${email}`);
    return res.json();
  },

  updateUserProfile: async (profileData: {
    email: string;
    weight: number;
    height: number;
    age: number;
    gymId: string;
    targetGoal: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    return res.json();
  }
};
