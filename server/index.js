const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Crear carpeta uploads para guardar videos de Reels
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Servir la carpeta de videos estáticamente
app.use('/uploads', express.static(UPLOADS_DIR));

// Configuración de Multer para la subida de reels
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, 'reel-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

let db;

// --- INICIALIZAR Y SEMBRAR LA BASE DE DATOS SQLITE ---
async function initDb() {
  db = await open({
    filename: path.join(__dirname, 'database.db'),
    driver: sqlite3.Database
  });

  // 1. Tabla de Usuarios (con soporte antropométrico, de racha y gimnasio)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT,
      weight REAL DEFAULT 0,
      height REAL DEFAULT 0,
      age INTEGER DEFAULT 0,
      gymId TEXT,
      targetGoal TEXT,
      streak INTEGER DEFAULT 0,
      lastActiveDate TEXT
    )
  `);

  // Migraciones seguras para usuarios existentes
  try { await db.exec("ALTER TABLE users ADD COLUMN weight REAL DEFAULT 0"); } catch (e) {}
  try { await db.exec("ALTER TABLE users ADD COLUMN height REAL DEFAULT 0"); } catch (e) {}
  try { await db.exec("ALTER TABLE users ADD COLUMN age INTEGER DEFAULT 0"); } catch (e) {}
  try { await db.exec("ALTER TABLE users ADD COLUMN gymId TEXT"); } catch (e) {}
  try { await db.exec("ALTER TABLE users ADD COLUMN targetGoal TEXT"); } catch (e) {}
  try { await db.exec("ALTER TABLE users ADD COLUMN streak INTEGER DEFAULT 0"); } catch (e) {}
  try { await db.exec("ALTER TABLE users ADD COLUMN lastActiveDate TEXT"); } catch (e) {}

  // 2. Tabla de Gimnasios (para multi-inquilinato y marca personalizada de administradores)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS gyms (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE,
      primaryColor TEXT,
      accentColor TEXT,
      textColor TEXT,
      motivation TEXT
    )
  `);

  // 3. Tabla de Historial de Peso (para medir el progreso en el panel de control)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS weight_history (
      id TEXT PRIMARY KEY,
      userEmail TEXT,
      weight REAL,
      date TEXT
    )
  `);

  // 4. Tabla de Actividades de Combate y Cardio
  await db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      title TEXT,
      type TEXT,
      date TEXT,
      durationMinutes INTEGER,
      caloriesBurned INTEGER,
      intensity TEXT,
      notes TEXT,
      roundsCount INTEGER,
      roundDurationMinutes INTEGER,
      routeId TEXT,
      distanceKm REAL,
      elevationGainMeters INTEGER,
      videoUrl TEXT,
      athleteName TEXT,
      isPro INTEGER
    )
  `);

  // 5. Tabla de Comentarios de Actividad
  await db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      activityId TEXT,
      authorName TEXT,
      content TEXT,
      date TEXT,
      FOREIGN KEY (activityId) REFERENCES activities(id) ON DELETE CASCADE
    )
  `);

  // 6. Tabla de Kudos (Guantes de Boxeo)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS kudos (
      activityId TEXT,
      userEmail TEXT,
      PRIMARY KEY (activityId, userEmail),
      FOREIGN KEY (activityId) REFERENCES activities(id) ON DELETE CASCADE
    )
  `);

  // 7. Tabla de Configuración de Administrador
  await db.exec(`
    CREATE TABLE IF NOT EXISTS admin_config (
      id TEXT PRIMARY KEY,
      primaryBg TEXT,
      accentRed TEXT,
      accentYellow TEXT,
      accentStrava TEXT,
      textMotivation TEXT,
      showBJJ INTEGER,
      showNutrition INTEGER
    )
  `);

  // 8. Tabla de Logros de Atleta (Trophy Room)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_achievements (
      userEmail TEXT,
      achievementId TEXT,
      unlocked INTEGER DEFAULT 0,
      unlockedAt TEXT,
      progress REAL DEFAULT 0,
      target REAL DEFAULT 0,
      PRIMARY KEY (userEmail, achievementId)
    )
  `);

  // Migraciones seguras para columnas kinéticas de telemetría si no existen
  try {
    await db.exec("ALTER TABLE activities ADD COLUMN maxGForce REAL DEFAULT 0");
  } catch (e) {
    // La columna ya existe, ignorar
  }

  try {
    await db.exec("ALTER TABLE activities ADD COLUMN ropeJumpsCount INTEGER DEFAULT 0");
  } catch (e) {
    // La columna ya existe, ignorar
  }

  // --- SEED (Sembrar) Datos Iniciales si están vacías ---

  // Seed Gyms
  const gymCount = await db.get('SELECT COUNT(*) as count FROM gyms');
  if (gymCount.count === 0) {
    await db.run("INSERT INTO gyms VALUES ('gym-default', 'Combat Arena Central', '#060608', '#FF5700', '#FFFFFF', 'El templo de los campeones híbridos.')");
    await db.run("INSERT INTO gyms VALUES ('gym-gold', 'Dojo Dragón Dorado', '#0B0A02', '#DFFF00', '#FFFFFF', 'Refina tu espíritu, forja tu cuerpo en oro.')");
    await db.run("INSERT INTO gyms VALUES ('gym-olympo', 'Olimpo Boxing Club', '#0A0202', '#FF1A53', '#FFFFFF', 'Donde se entrenan los verdaderos dioses del cuadrilátero.')");
    await db.run("INSERT INTO gyms VALUES ('gym-cyber', 'Cyber Gladiators MMA', '#020A0A', '#00F0FF', '#FFFFFF', 'Conectados por la kinesis. Entrena en el futuro hoy.')");
    console.log('Sembrados gimnasios iniciales.');
  }

  // Seed Users
  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    await db.run("INSERT INTO users VALUES ('usr-1', 'admin@combat.com', 'admin123', 'Admin', 80, 180, 30, 'gym-default', 'Liderar el club', 0, NULL)");
    await db.run("INSERT INTO users VALUES ('usr-2', 'user@combat.com', 'user123', 'User', 53.6, 151.4, 25, 'gym-gold', 'Aumentar fuerza y velocidad', 12, '2026-05-28T21:46:00Z')");
    
    // Seed historial de peso inicial para user demo
    await db.run("INSERT INTO weight_history VALUES ('wh-seed-1', 'user@combat.com', 55.0, '2026-05-20T08:00:00Z')");
    await db.run("INSERT INTO weight_history VALUES ('wh-seed-2', 'user@combat.com', 54.2, '2026-05-24T08:00:00Z')");
    await db.run("INSERT INTO weight_history VALUES ('wh-seed-3', 'user@combat.com', 53.6, '2026-05-28T08:00:00Z')");
    
    console.log('Sembrados usuarios demo (Admin y User).');
  }

  // Seed Admin Config
  const configCount = await db.get('SELECT COUNT(*) as count FROM admin_config');
  if (configCount.count === 0) {
    await db.run(`
      INSERT INTO admin_config VALUES (
        'cfg-default', 
        '#0B0B0C', 
        '#E11D48', 
        '#CCFF00', 
        '#FF5700', 
        'Listo para romper tus límites hoy.', 
        1, 
        1
      )
    `);
    console.log('Sembrada configuración de administrador por defecto.');
  }

  // Seed Activities (Mock pros Canelo, Khabib, Jones)
  const actCount = await db.get('SELECT COUNT(*) as count FROM activities');
  if (actCount.count === 0) {
    // Canelo Boxing Activity
    await db.run(`
      INSERT INTO activities VALUES (
        'feed-1', 
        '12 Asaltos de Manoplas y Pera Loca', 
        'Boxing', 
        '2026-05-27T08:30:00Z', 
        60, 
        780, \n        'Alta', \n        'Puliendo la velocidad y el cabeceo. No hay descanso, nos preparamos para defender la corona.', 
        12, 
        3, 
        NULL, 
        NULL, 
        NULL, 
        NULL, 
        'Canelo Álvarez', 
        1
      )
    `);

    // Khabib BJJ Activity
    await db.run(`
      INSERT INTO activities VALUES (
        'feed-2', 
        '6 Rounds de Grappling Extremo / Sambo', 
        'BJJ', 
        '2026-05-26T17:15:00Z', 
        45, 
        850, 
        'Extrema', 
        '6 rounds de 5 minutos rolando sin parar. Presión constante, cansancio mental controlado. Alhamdullilah.', 
        6, 
        5, 
        NULL, 
        NULL, 
        NULL, 
        NULL, 
        'Khabib Nurmagomedov', 
        1
      )
    `);

    // Jon Jones Running Activity
    await db.run(`
      INSERT INTO activities VALUES (
        'feed-3', 
        'Cardio Explosivo - Subida al Cerro del Guerrero', 
        'Running', 
        '2026-05-26T06:00:00Z', 
        38, 
        640, 
        'Alta', 
        'Roadwork matutino completado. Trabajo de resistencia y fuerza de piernas con desnivel. Afilando la mente.', 
        NULL, 
        NULL, 
        'route-1', 
        5.2, 
        320, 
        NULL, 
        'Jon Jones', 
        1
      )
    `);

    // Seed Comments
    await db.run("INSERT INTO comments VALUES ('c-1', 'feed-1', 'Khabib Nurmagomedov', 'Good speed brother, but boxing needs more wrestling 🦅', '2026-05-27T09:10:00Z')");
    await db.run("INSERT INTO comments VALUES ('c-2', 'feed-1', 'Jon Jones', 'Crisp handwork, champion! 🔥', '2026-05-27T09:45:00Z')");
    await db.run("INSERT INTO comments VALUES ('c-3', 'feed-2', 'Tú (Atleta)', '¡Qué nivel de presión! Increíble acondicionamiento.', '2026-05-26T18:00:00Z')");
    await db.run("INSERT INTO comments VALUES ('c-4', 'feed-3', 'Canelo Álvarez', 'Gran ritmo para tu peso. La montaña forja campeones ⛰️', '2026-05-26T07:30:00Z')");

    // Seed Kudos
    await db.run("INSERT INTO kudos VALUES ('feed-2', 'user@combat.com')");
    await db.run("INSERT INTO kudos VALUES ('feed-1', 'user@combat.com')");

    console.log('Sembradas actividades e interacciones iniciales.');
  }
}

// --- SISTEMA DE EVALUACIÓN DE LOGROS (TROPHY ROOM) ---
async function evaluateAchievements(userEmail) {
  if (!userEmail) return;

  const achievements = ['canelo', 'shadow', 'tatami'];
  const targets = { canelo: 12, shadow: 8.0, tatami: 3 };

  // Asegurar registros por defecto en SQLite
  for (const achId of achievements) {
    const exists = await db.get('SELECT * FROM user_achievements WHERE userEmail = ? AND achievementId = ?', [userEmail, achId]);
    if (!exists) {
      await db.run('INSERT INTO user_achievements (userEmail, achievementId, unlocked, unlockedAt, progress, target) VALUES (?, ?, 0, NULL, 0, ?)', [
        userEmail, achId, targets[achId]
      ]);
    }
  }

  const athletePrefix = userEmail.split('@')[0];

  // 1. Canelo: Max asaltos seguidos (roundsCount) en Boxeo/Kickboxing
  const maxRoundsRow = await db.get(`
    SELECT MAX(roundsCount) as maxRounds 
    FROM activities 
    WHERE (type = 'Boxing' OR type = 'Kickboxing')
      AND (athleteName = ? OR athleteName = 'Tú (Atleta)' OR athleteName = 'user')
  `, [athletePrefix]);

  const currentMaxRounds = maxRoundsRow ? (maxRoundsRow.maxRounds || 0) : 0;
  await db.run(`
    UPDATE user_achievements 
    SET progress = ? 
    WHERE userEmail = ? AND achievementId = 'canelo'
  `, [Math.min(currentMaxRounds, 12), userEmail]);

  if (currentMaxRounds >= 12) {
    await db.run(`
      UPDATE user_achievements 
      SET unlocked = 1, unlockedAt = ? 
      WHERE userEmail = ? AND achievementId = 'canelo' AND unlocked = 0
    `, [new Date().toISOString(), userEmail]);
  }

  // 2. Velocidad de Sombra: Aceleración máxima (maxGForce)
  const maxGRow = await db.get(`
    SELECT MAX(maxGForce) as maxG 
    FROM activities 
    WHERE (athleteName = ? OR athleteName = 'Tú (Atleta)' OR athleteName = 'user')
  `, [athletePrefix]);

  const currentMaxG = maxGRow ? (maxGRow.maxG || 0) : 0;
  await db.run(`
    UPDATE user_achievements 
    SET progress = ? 
    WHERE userEmail = ? AND achievementId = 'shadow'
  `, [currentMaxG, userEmail]);

  if (currentMaxG >= 8.0) {
    await db.run(`
      UPDATE user_achievements 
      SET unlocked = 1, unlockedAt = ? 
      WHERE userEmail = ? AND achievementId = 'shadow' AND unlocked = 0
    `, [new Date().toISOString(), userEmail]);
  }

  // 3. Rey del Tatami: 3 videos de Jiu Jitsu (BJJ) en los últimos 7 días
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString();

  const bjjCountRow = await db.get(`
    SELECT COUNT(*) as cnt \n    FROM activities \n    WHERE type = 'BJJ' \n      AND videoUrl IS NOT NULL \n      AND date >= ?\n      AND (athleteName = ? OR athleteName = 'Tú (Atleta)' OR athleteName = 'user')\n  `, [sevenDaysAgoStr, athletePrefix]);

  const bjjCount = bjjCountRow ? (bjjCountRow.cnt || 0) : 0;
  await db.run(`
    UPDATE user_achievements 
    SET progress = ? 
    WHERE userEmail = ? AND achievementId = 'tatami'
  `, [Math.min(bjjCount, 3), userEmail]);

  if (bjjCount >= 3) {
    await db.run(`
      UPDATE user_achievements 
      SET unlocked = 1, unlockedAt = ? 
      WHERE userEmail = ? AND achievementId = 'tatami' AND unlocked = 0
    `, [new Date().toISOString(), userEmail]);
  }
}

// Lógica de Evaluación de Racha Activa (Reinicia a 0 tras 1 día de inactividad)
async function evaluateUserStreak(userEmail) {
  if (!userEmail) return;
  try {
    const user = await db.get('SELECT streak, lastActiveDate FROM users WHERE email = ?', [userEmail]);
    if (!user) return;

    if (user.lastActiveDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastActive = new Date(user.lastActiveDate);
      lastActive.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - lastActive.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Si ha pasado más de 1 día de inactividad (ayer fue el último día válido, por ende diffDays > 1), reset a 0.
      if (diffDays > 1) {
        await db.run('UPDATE users SET streak = 0 WHERE email = ?', [userEmail]);
      }
    } else {
      await db.run('UPDATE users SET streak = 0 WHERE email = ?', [userEmail]);
    }
  } catch (err) {
    console.error('Error al evaluar racha:', err);
  }
}

// --- RUTAS DE API ---

// Endpoint para leer logros de un usuario
app.get('/api/achievements/:email', async (req, res) => {
  const { email } = req.params;
  try {
    await evaluateAchievements(email);
    const rows = await db.all('SELECT * FROM user_achievements WHERE userEmail = ?', [email]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 1. Autenticación (Login & Registro)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (user) {
      await evaluateUserStreak(email);
      const updatedUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
      res.json({ 
        id: updatedUser.id, 
        email: updatedUser.email, 
        role: updatedUser.role, 
        weight: updatedUser.weight || 0,
        height: updatedUser.height || 0,
        age: updatedUser.age || 0,
        gymId: updatedUser.gymId || 'gym-default',
        targetGoal: updatedUser.targetGoal || '',
        streak: updatedUser.streak || 0,
        success: true 
      });
    } else {
      res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, weight, height, age, gymId, targetGoal } = req.body;
  try {
    // Comprobar si existe
    const exists = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (exists) {
      return res.status(400).json({ success: false, message: 'El usuario ya existe' });
    }
    const newId = 'usr-' + Date.now();
    const parsedWeight = parseFloat(weight) || 0;
    const parsedHeight = parseFloat(height) || 0;
    const parsedAge = parseInt(age) || 0;
    const finalGymId = gymId || 'gym-default';
    const finalGoal = targetGoal || '';

    await db.run(
      'INSERT INTO users (id, email, password, role, weight, height, age, gymId, targetGoal, streak, lastActiveDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)',
      [newId, email, password, 'User', parsedWeight, parsedHeight, parsedAge, finalGymId, finalGoal]
    );

    // Guardar peso inicial en el historial de peso corporal
    if (parsedWeight > 0) {
      const whId = 'wh-' + Date.now();
      await db.run('INSERT INTO weight_history VALUES (?, ?, ?, ?)', [whId, email, parsedWeight, new Date().toISOString()]);
    }

    res.json({ id: newId, email, role: 'User', success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// --- ENDPOINTS PARA GIMNASIOS Y PERFILES ---

// Obtener todos los gimnasios
app.get('/api/gyms', async (req, res) => {
  try {
    const gyms = await db.all('SELECT * FROM gyms ORDER BY name ASC');
    res.json(gyms);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Guardar o modificar un gimnasio (Admin)
app.post('/api/gyms', async (req, res) => {
  const { id, name, primaryColor, accentColor, textColor, motivation } = req.body;
  try {
    const finalId = id || 'gym-' + Date.now();
    await db.run(
      'INSERT OR REPLACE INTO gyms (id, name, primaryColor, accentColor, textColor, motivation) VALUES (?, ?, ?, ?, ?, ?)',
      [finalId, name, primaryColor, accentColor, textColor, motivation]
    );
    res.json({ success: true, gymId: finalId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Obtener perfil completo del atleta (incluye racha, gimnasio asociado y peso histórico)
app.get('/api/users/profile/:email', async (req, res) => {
  const { email } = req.params;
  try {
    await evaluateUserStreak(email);
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    
    // Obtener detalles de su gimnasio
    const gym = await db.get('SELECT * FROM gyms WHERE id = ?', [user.gymId]);
    
    // Obtener historial de peso corporal
    const weightHistory = await db.all('SELECT * FROM weight_history WHERE userEmail = ? ORDER BY date ASC', [email]);
    
    res.json({
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        role: user.role,
        weight: user.weight || 0,
        height: user.height || 0,
        age: user.age || 0,
        gymId: user.gymId || 'gym-default',
        targetGoal: user.targetGoal || '',
        streak: user.streak || 0,
        lastActiveDate: user.lastActiveDate
      },
      gym: gym || {
        id: 'gym-default',
        name: 'Combat Arena Central',
        primaryColor: '#060608',
        accentColor: '#FF5700',
        textColor: '#FFFFFF',
        motivation: 'El templo de los campeones híbridos.'
      },
      weightHistory
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Modificar datos del perfil del usuario (peso, altura, edad, gym, objetivo)
app.put('/api/users/profile', async (req, res) => {
  const { email, weight, height, age, gymId, targetGoal } = req.body;
  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const oldWeight = user.weight || 0;
    const parsedWeight = parseFloat(weight) || 0;
    const parsedHeight = parseFloat(height) || 0;
    const parsedAge = parseInt(age) || 0;

    await db.run(
      'UPDATE users SET weight = ?, height = ?, age = ?, gymId = ?, targetGoal = ? WHERE email = ?',
      [parsedWeight, parsedHeight, parsedAge, gymId, targetGoal, email]
    );

    // Si el peso cambió, agregar una entrada al historial de peso corporal
    if (parsedWeight !== oldWeight && parsedWeight > 0) {
      const whId = 'wh-' + Date.now();
      await db.run('INSERT INTO weight_history VALUES (?, ?, ?, ?)', [whId, email, parsedWeight, new Date().toISOString()]);
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 2. Actividades (Muro & Guardado)
app.get('/api/activities', async (req, res) => {
  try {
    const activities = await db.all('SELECT * FROM activities ORDER BY date DESC');
    
    // Para cada actividad, cargar sus comentarios y kudos
    const populated = await Promise.all(activities.map(async (act) => {
      const comments = await db.all('SELECT * FROM comments WHERE activityId = ? ORDER BY date ASC', [act.id]);
      const kudos = await db.all('SELECT * FROM kudos WHERE activityId = ?', [act.id]);
      
      return {
        id: act.id,
        athleteName: act.athleteName,
        athleteAvatarUrl: '', // Avatar genérico en front
        isPro: act.isPro === 1,
        activity: {
          id: act.id,
          title: act.title,
          type: act.type,
          date: act.date,
          durationMinutes: act.durationMinutes,
          caloriesBurned: act.caloriesBurned,
          intensity: act.intensity,
          notes: act.notes,
          roundsCount: act.roundsCount || undefined,
          roundDurationMinutes: act.roundDurationMinutes || undefined,
          routeId: act.routeId || undefined,
          distanceKm: act.distanceKm || undefined,
          elevationGainMeters: act.elevationGainMeters || undefined,
          videoUrl: act.videoUrl || undefined,
          maxGForce: act.maxGForce || undefined,
          ropeJumpsCount: act.ropeJumpsCount || undefined
        },
        kudosCount: kudos.length,
        comments
      };
    }));

    res.json(populated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Crear actividad con o sin video
app.post('/api/activities', upload.single('video'), async (req, res) => {
  const { 
    id, title, type, date, durationMinutes, caloriesBurned, intensity, 
    notes, roundsCount, roundDurationMinutes, routeId, distanceKm, 
    elevationGainMeters, athleteName, isPro, maxGForce, ropeJumpsCount, userEmail
  } = req.body;

  let videoUrl = null;
  if (req.file) {
    videoUrl = `/uploads/${req.file.filename}`;}

  try {
    await db.run(`
      INSERT INTO activities (
        id, title, type, date, durationMinutes, caloriesBurned, intensity, notes,
        roundsCount, roundDurationMinutes, routeId, distanceKm, elevationGainMeters,
        videoUrl, athleteName, isPro, maxGForce, ropeJumpsCount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, title, type, date, parseInt(durationMinutes) || 0, parseInt(caloriesBurned) || 0,
      intensity, notes, roundsCount ? parseInt(roundsCount) : null, 
      roundDurationMinutes ? parseInt(roundDurationMinutes) : null,
      routeId || null, distanceKm ? parseFloat(distanceKm) : null, 
      elevationGainMeters ? parseInt(elevationGainMeters) : null,
      videoUrl, athleteName, parseInt(isPro) || 0,
      parseFloat(maxGForce) || 0, parseInt(ropeJumpsCount) || 0
    ]);

    // Actualizar racha al registrar actividad
    if (userEmail) {
      try {
        const user = await db.get('SELECT streak, lastActiveDate FROM users WHERE email = ?', [userEmail]);
        if (user) {
          let currentStreak = user.streak || 0;
          const lastActiveDateStr = user.lastActiveDate;
          const todayStr = new Date().toISOString().split('T')[0];

          if (!lastActiveDateStr) {
            // Primera actividad
            currentStreak = 1;
          } else {
            const today = new Date();
            today.setHours(0,0,0,0);

            const lastActive = new Date(lastActiveDateStr);
            lastActive.setHours(0,0,0,0);

            const diffTime = today.getTime() - lastActive.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
              currentStreak += 1;
            } else if (diffDays > 1) {
              currentStreak = 1;
            }
          }
          await db.run('UPDATE users SET streak = ?, lastActiveDate = ? WHERE email = ?', [currentStreak, new Date().toISOString(), userEmail]);
        }
      } catch (err) {
        console.error('Error al actualizar racha:', err);
      }
    }

    // Evaluar logros de manera asíncrona tras guardar la actividad
    if (userEmail) {
      evaluateAchievements(userEmail).catch(err => {
        console.error('Error al evaluar logros para', userEmail, err);
      });
    }

    res.json({ success: true, videoUrl });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 3. Comentarios y Kudos
app.post('/api/activities/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { authorName, content, date } = req.body;
  try {
    const newId = 'c-' + Date.now();
    await db.run('INSERT INTO comments VALUES (?, ?, ?, ?, ?)', [
      newId, id, authorName, content, date
    ]);
    res.json({ success: true, commentId: newId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/activities/:id/kudos', async (req, res) => {
  const { id } = req.params;
  const { userEmail } = req.body;
  try {
    // Comprobar si ya le dio kudo
    const exists = await db.get('SELECT * FROM kudos WHERE activityId = ? AND userEmail = ?', [id, userEmail]);
    if (exists) {
      await db.run('DELETE FROM kudos WHERE activityId = ? AND userEmail = ?', [id, userEmail]);
      res.json({ success: true, action: 'removed' });
    } else {
      await db.run('INSERT INTO kudos VALUES (?, ?)', [id, userEmail]);
      res.json({ success: true, action: 'added' });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 4. Configuración del Administrador
app.get('/api/admin/config', async (req, res) => {
  try {
    const config = await db.get('SELECT * FROM admin_config LIMIT 1');
    res.json({
      primaryBg: config.primaryBg,
      accentRed: config.accentRed,
      accentYellow: config.accentYellow,
      accentStrava: config.accentStrava,
      textMotivation: config.textMotivation,
      showBJJ: config.showBJJ === 1,
      showNutrition: config.showNutrition === 1
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/admin/config', async (req, res) => {
  const { primaryBg, accentRed, accentYellow, accentStrava, textMotivation, showBJJ, showNutrition } = req.body;
  try {
    await db.run(`
      UPDATE admin_config SET
        primaryBg = ?,
        accentRed = ?,
        accentYellow = ?,
        accentStrava = ?,
        textMotivation = ?,
        showBJJ = ?,
        showNutrition = ?
      WHERE id = 'cfg-default'
    `, [
      primaryBg, accentRed, accentYellow, accentStrava, textMotivation,
      showBJJ ? 1 : 0, showNutrition ? 1 : 0
    ]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Iniciar servidor tras conectar SQLite
initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend de Combat Strava corriendo en http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error('Error al inicializar la base de datos', err);
});
