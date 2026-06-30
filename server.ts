import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { 
  User, 
  Mission, 
  UserMission, 
  Withdrawal, 
  Transaction, 
  LevelConfig, 
  Notification 
} from './src/types';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DB_FILE = path.join(process.cwd(), 'db-store.json');

app.use(express.json());

// Helpers for Crypto password hashing
const HASH_SALT = 'BonusXPremiumPlatformSecretSalt2026';
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + HASH_SALT).digest('hex');
}

// Memory Database
interface DbSchema {
  users: User[];
  passwords: Record<string, string>; // userId -> password_hash
  missions: Mission[];
  userMissions: UserMission[];
  withdrawals: Withdrawal[];
  transactions: Transaction[];
  levelConfigs: LevelConfig[];
  notifications: Notification[];
  gaugeSettings?: {
    durationMinutes: number;
    rewardAmount: number;
    xpReward: number;
  };
}

let db: DbSchema = {
  users: [],
  passwords: {},
  missions: [],
  userMissions: [],
  withdrawals: [],
  transactions: [],
  levelConfigs: [],
  notifications: [],
  gaugeSettings: {
    durationMinutes: 10,
    rewardAmount: 1.50,
    xpReward: 50
  }
};

// Initial Levels Configurations
const DEFAULT_LEVEL_CONFIGS: LevelConfig[] = [
  { level: 1, xpRequired: 0, rewardUsdc: 0 },
  { level: 2, xpRequired: 300, rewardUsdc: 2.0 },
  { level: 3, xpRequired: 800, rewardUsdc: 5.0 },
  { level: 4, xpRequired: 1500, rewardUsdc: 10.0 },
  { level: 5, xpRequired: 2500, rewardUsdc: 15.0 },
  { level: 6, xpRequired: 4000, rewardUsdc: 25.0 },
  { level: 7, xpRequired: 6000, rewardUsdc: 40.0 },
  { level: 8, xpRequired: 9000, rewardUsdc: 60.0 },
  { level: 9, xpRequired: 13000, rewardUsdc: 100.0 },
  { level: 10, xpRequired: 20000, rewardUsdc: 200.0 }
];

// Load or Seed DB
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(raw);
      if (!db.gaugeSettings) {
        db.gaugeSettings = {
          durationMinutes: 10,
          rewardAmount: 1.50,
          xpReward: 50
        };
      }
      console.log('Database loaded successfully from file.');
    } else {
      seedDatabase();
    }
  } catch (error) {
    console.error('Error loading database, re-seeding...', error);
    seedDatabase();
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

function seedDatabase() {
  console.log('Seeding initial demo database...');
  
  // Create Demo Users and Admins
  const adminId = 'admin-1';
  const userId1 = 'user-alex';
  const userId2 = 'user-bob';
  const userId3 = 'user-alice';

  const initialUsers: User[] = [
    {
      id: adminId,
      email: 'admin@bonusx.com',
      username: 'BonusXAdmin',
      xp: 0,
      level: 1,
      usdcBalance: 1000.0,
      isBlocked: false,
      isAdmin: true,
      referralCode: 'ADMINX',
      createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: userId1,
      email: 'user@bonusx.com',
      username: 'AlexCrypto',
      xp: 1250,
      level: 3,
      usdcBalance: 78.5,
      walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d1476B',
      isBlocked: false,
      isAdmin: false,
      referralCode: 'ALEX50',
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: userId2,
      email: 'bob@bonusx.com',
      username: 'BobWeb3',
      xp: 450,
      level: 2,
      usdcBalance: 14.2,
      walletAddress: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      isBlocked: false,
      isAdmin: false,
      referralCode: 'BOB_OP',
      referredBy: 'ALEX50',
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: userId3,
      email: 'alice@bonusx.com',
      username: 'AliceUSDC',
      xp: 150,
      level: 1,
      usdcBalance: 5.0,
      isBlocked: false,
      isAdmin: false,
      referralCode: 'ALICE_99',
      referredBy: 'ALEX50',
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    }
  ];

  const initialPasswords: Record<string, string> = {
    [adminId]: hashPassword('admin123'),
    [userId1]: hashPassword('user123'),
    [userId2]: hashPassword('bob123'),
    [userId3]: hashPassword('alice123')
  };

  const initialMissions: Mission[] = [
    {
      id: 'm-twitter',
      title: 'Suivre BonusX sur X (Twitter)',
      description: 'Abonne-toi à notre compte officiel @BonusX_Crypto pour recevoir les dernières mises à jour du projet et de la plateforme.',
      rewardUsdc: 1.50,
      rewardXp: 100,
      category: 'social',
      actionUrl: 'https://x.com/BonusX_Crypto',
      isActive: true,
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'm-telegram',
      title: 'Rejoindre notre canal Telegram',
      description: 'Rejoins le groupe Telegram officiel de BonusX pour échanger avec la communauté et participer aux airdrops exclusifs.',
      rewardUsdc: 2.00,
      rewardXp: 150,
      category: 'social',
      actionUrl: 'https://t.me/BonusX_Crypto',
      isActive: true,
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'm-video',
      title: 'Regarder le guide "Introduction au Web3 et USDC"',
      description: 'Regarde la vidéo de 3 minutes expliquant le fonctionnement du dollar numérique USDC et comment configurer ton premier portefeuille crypto.',
      rewardUsdc: 3.50,
      rewardXp: 250,
      category: 'video',
      actionUrl: 'https://youtube.com',
      isActive: true,
      createdAt: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'm-quiz',
      title: 'Compléter le Quiz de Sécurité DeFi',
      description: 'Réponds à notre quiz de 5 questions sur la sécurité dans la finance décentralisée pour vérifier tes connaissances et éviter les arnaques.',
      rewardUsdc: 5.00,
      rewardXp: 300,
      category: 'quiz',
      actionUrl: '#quiz',
      isActive: true,
      createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'm-crypto',
      title: 'Effectuer un premier transfert de test',
      description: 'Soumets l\'adresse d\'un portefeuille crypto EVM pour prouver ton autonomie en crypto et débloquer un bonus premium.',
      rewardUsdc: 10.00,
      rewardXp: 500,
      category: 'crypto',
      actionUrl: '#wallet',
      isActive: true,
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    }
  ];

  const initialUserMissions: UserMission[] = [
    {
      id: 'um-1',
      userId: userId1,
      missionId: 'm-twitter',
      proofText: '@AlexCrypto_X - Abonnés à 14h02',
      status: 'approved',
      submittedAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
      processedAt: new Date(Date.now() - 11 * 24 * 3600 * 1000).toISOString(),
      adminComment: 'Compte vérifié avec succès.'
    },
    {
      id: 'um-2',
      userId: userId1,
      missionId: 'm-telegram',
      proofText: 'Telegram ID: t.me/alex_web3',
      status: 'approved',
      submittedAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
      processedAt: new Date(Date.now() - 11 * 24 * 3600 * 1000).toISOString(),
      adminComment: 'Présence dans le canal validée.'
    },
    {
      id: 'um-3',
      userId: userId2,
      missionId: 'm-twitter',
      proofText: '@BobWeb3_Official',
      status: 'pending',
      submittedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'um-4',
      userId: userId3,
      missionId: 'm-telegram',
      proofText: 'AliceTelegramCrypto',
      status: 'rejected',
      submittedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      processedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      adminComment: 'Ce nom d\'utilisateur ne figure pas dans le groupe Telegram.'
    }
  ];

  const initialWithdrawals: Withdrawal[] = [
    {
      id: 'w-1',
      userId: userId1,
      amountUsdc: 25.0,
      walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d1476B',
      status: 'approved',
      requestedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
      processedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'w-2',
      userId: userId1,
      amountUsdc: 15.0,
      walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d1476B',
      status: 'pending',
      requestedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
    }
  ];

  const initialTransactions: Transaction[] = [
    {
      id: 'tx-1',
      userId: userId1,
      amountUsdc: 1.5,
      type: 'mission_reward',
      description: 'Mission validée : Suivre BonusX sur X (Twitter)',
      createdAt: new Date(Date.now() - 11 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'tx-2',
      userId: userId1,
      amountUsdc: 2.0,
      type: 'mission_reward',
      description: 'Mission validée : Rejoindre notre canal Telegram',
      createdAt: new Date(Date.now() - 11 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'tx-3',
      userId: userId1,
      amountUsdc: 25.0,
      type: 'withdrawal',
      description: 'Retrait USDC vers 0x71C7...476B',
      createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'tx-4',
      userId: userId1,
      amountUsdc: 10.0,
      type: 'referral_bonus',
      description: 'Bonus parrainage : Inscription de BobWeb3',
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'tx-5',
      userId: userId2,
      amountUsdc: 5.0,
      type: 'referral_bonus',
      description: 'Bonus de bienvenue parrainage (Parrainé par AlexCrypto)',
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'tx-6',
      userId: userId1,
      amountUsdc: 5.0,
      type: 'referral_bonus',
      description: 'Bonus parrainage : Inscription de AliceUSDC',
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    }
  ];

  const initialNotifications: Notification[] = [
    {
      id: 'n-1',
      userId: userId1,
      title: '🎉 Bienvenue sur BonusX !',
      message: 'Débute tes premières missions de réseaux sociaux pour débloquer tes premiers USDC.',
      isRead: true,
      type: 'success',
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'n-2',
      userId: userId1,
      title: 'Missions validées !',
      message: 'L\'équipe a approuvé tes preuves pour Twitter et Telegram. Tu as reçu 3.50 USDC et +250 XP.',
      isRead: false,
      type: 'success',
      createdAt: new Date(Date.now() - 11 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'n-3',
      userId: userId1,
      title: 'Nouveau filleul actif',
      message: 'Félicitations, BobWeb3 s\'est inscrit avec ton code. Tu as reçu 10.00 USDC de bonus !',
      isRead: false,
      type: 'bonus_available',
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'n-4',
      userId: userId3,
      title: 'Mission refusée',
      message: 'Ta preuve pour Telegram a été refusée car ton pseudo n\'a pas été trouvé dans notre canal.',
      isRead: false,
      type: 'alert',
      createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
    }
  ];

  db = {
    users: initialUsers,
    passwords: initialPasswords,
    missions: initialMissions,
    userMissions: initialUserMissions,
    withdrawals: initialWithdrawals,
    transactions: initialTransactions,
    levelConfigs: DEFAULT_LEVEL_CONFIGS,
    notifications: initialNotifications
  };

  saveDatabase();
}

// Load it up on startup
loadDatabase();

// In-Memory active sessions store
const sessions = new Map<string, { userId: string; isAdmin: boolean; expiresAt: number }>();

// Auth Middleware
const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Session ')) {
    return res.status(401).json({ error: 'Non autorisé. Veuillez vous connecter.' });
  }
  const token = authHeader.split(' ')[1];
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Session expirée ou invalide. Reconnectez-vous.' });
  }
  
  // Find user
  const user = db.users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ error: 'Utilisateur introuvable.' });
  }
  if (user.isBlocked) {
    return res.status(403).json({ error: 'Ce compte a été suspendu par l\'administrateur.' });
  }

  req.userId = session.userId;
  req.isAdmin = session.isAdmin;
  req.user = user;
  next();
};

// Admin Middleware
const adminMiddleware = (req: any, res: any, next: any) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Accès interdit. Droits administrateur requis.' });
  }
  next();
};

// Helper to handle XP addition and Level up logic
function addXpToUser(user: User, xpToAdd: number): { leveledUp: boolean; xpGranted: number; rewardGiven: number } {
  const oldLevel = user.level;
  user.xp += xpToAdd;
  
  // Find highest level available based on XP
  let newLevel = oldLevel;
  let rewardGiven = 0;
  
  // Sort configs ascending
  const sortedConfigs = [...db.levelConfigs].sort((a, b) => a.level - b.level);
  
  for (const config of sortedConfigs) {
    if (user.xp >= config.xpRequired) {
      newLevel = Math.max(newLevel, config.level);
    }
  }

  let leveledUp = false;
  if (newLevel > oldLevel) {
    leveledUp = true;
    user.level = newLevel;
    // Award USDC reward for new levels reached
    for (let l = oldLevel + 1; l <= newLevel; l++) {
      const config = db.levelConfigs.find(c => c.level === l);
      if (config && config.rewardUsdc > 0) {
        rewardGiven += config.rewardUsdc;
      }
    }
    
    if (rewardGiven > 0) {
      user.usdcBalance += rewardGiven;
      // Add a level up transaction
      db.transactions.push({
        id: 'tx-lvl-' + crypto.randomBytes(4).toString('hex'),
        userId: user.id,
        amountUsdc: rewardGiven,
        type: 'bonus_claim',
        description: `Récompense de passage au niveau ${newLevel} !`,
        createdAt: new Date().toISOString()
      });
    }

    // Push level up notification
    db.notifications.push({
      id: 'notif-' + crypto.randomBytes(8).toString('hex'),
      userId: user.id,
      title: `🏆 Niveau Supérieur : Niveau ${newLevel} !`,
      message: `Félicitations, tu as atteint le niveau ${newLevel} ! Tu remportes un bonus de ${rewardGiven} USDC !`,
      isRead: false,
      type: 'success',
      createdAt: new Date().toISOString()
    });
  }

  return {
    leveledUp,
    xpGranted: xpToAdd,
    rewardGiven
  };
}

// ----------------------------------------------------
// AUTHENTICATION ENDPOINTS
// ----------------------------------------------------

app.post('/api/auth/register', (req, res) => {
  const { email, username, password, referralCode } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Tous les champs obligatoires (email, pseudo, mot de passe) doivent être remplis.' });
  }

  const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: 'Cette adresse email est déjà enregistrée.' });
  }

  const existingUsername = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (existingUsername) {
    return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris.' });
  }

  // Create user
  const newUserId = 'user-' + crypto.randomBytes(8).toString('hex');
  const userReferralCode = 'BX-' + username.substring(0, 4).toUpperCase() + crypto.randomBytes(3).toString('hex').toUpperCase();

  // Handle Referral
  let referredByCode: string | undefined = undefined;
  let referralBonusGiven = false;
  
  if (referralCode) {
    const referrer = db.users.find(u => u.referralCode.toUpperCase() === referralCode.toUpperCase() && !u.isAdmin);
    if (referrer) {
      referredByCode = referrer.referralCode;
      // Grant welcome bonus of 5 USDC to the new user and 10 USDC to the referrer immediately
      referrer.usdcBalance += 10.0;
      // Add transaction for referrer
      db.transactions.push({
        id: 'tx-ref-' + crypto.randomBytes(4).toString('hex'),
        userId: referrer.id,
        amountUsdc: 10.0,
        type: 'referral_bonus',
        description: `Bonus parrainage : Inscription de ${username}`,
        createdAt: new Date().toISOString()
      });
      // Send notification to referrer
      db.notifications.push({
        id: 'notif-ref-' + crypto.randomBytes(8).toString('hex'),
        userId: referrer.id,
        title: '👥 Nouveau parrainage actif !',
        message: `Félicitations, ${username} a rejoint BonusX avec ton code. Tu as reçu 10.00 USDC de bonus.`,
        isRead: false,
        type: 'bonus_available',
        createdAt: new Date().toISOString()
      });

      referralBonusGiven = true;
    }
  }

  const newUser: User = {
    id: newUserId,
    email: email.toLowerCase(),
    username: username,
    xp: 0,
    level: 1,
    usdcBalance: referralBonusGiven ? 5.0 : 0.0, // 5 USDC welcome bonus if referred
    isBlocked: false,
    isAdmin: false,
    referralCode: userReferralCode,
    referredBy: referredByCode,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  db.passwords[newUserId] = hashPassword(password);

  // If referred, log transactions for the new user
  if (referralBonusGiven) {
    db.transactions.push({
      id: 'tx-wel-' + crypto.randomBytes(4).toString('hex'),
      userId: newUserId,
      amountUsdc: 5.0,
      type: 'referral_bonus',
      description: 'Bonus de bienvenue parrainage',
      createdAt: new Date().toISOString()
    });
  }

  // Create a welcome notification
  db.notifications.push({
    id: 'notif-wel-' + crypto.randomBytes(8).toString('hex'),
    userId: newUserId,
    title: '🎉 Bienvenue sur BonusX !',
    message: `Merci de nous rejoindre. ${referralBonusGiven ? 'Ton bonus de 5.00 USDC a été crédité.' : ''} Découvre la liste des missions pour gagner tes premiers USDC !`,
    isRead: false,
    type: 'success',
    createdAt: new Date().toISOString()
  });

  saveDatabase();

  // Create session
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId: newUser.id, isAdmin: newUser.isAdmin, expiresAt: Date.now() + 24 * 3600 * 1000 });

  res.status(201).json({
    token,
    user: newUser
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Veuillez saisir votre adresse email et votre mot de passe.' });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Identifiants invalides.' });
  }

  const hash = hashPassword(password);
  if (db.passwords[user.id] !== hash) {
    return res.status(401).json({ error: 'Identifiants invalides.' });
  }

  if (user.isBlocked) {
    return res.status(403).json({ error: 'Ce compte a été bloqué par un administrateur.' });
  }

  // Session token
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId: user.id, isAdmin: user.isAdmin, expiresAt: Date.now() + 24 * 3600 * 1000 });

  res.json({
    token,
    user
  });
});

app.get('/api/auth/me', authMiddleware, (req: any, res) => {
  res.json({ user: req.user });
});


// ----------------------------------------------------
// USER SETTINGS & WALLET
// ----------------------------------------------------

app.post('/api/user/update-wallet', authMiddleware, (req: any, res) => {
  const { walletAddress } = req.body;
  
  if (walletAddress && !walletAddress.startsWith('0x')) {
    return res.status(400).json({ error: 'Format de portefeuille invalide. Doit commencer par 0x (Réseau EVM / Polygon).' });
  }

  const user = req.user;
  user.walletAddress = walletAddress || undefined;
  
  saveDatabase();
  res.json({ success: true, user });
});

app.post('/api/user/update-settings', authMiddleware, (req: any, res) => {
  const { username, password } = req.body;
  const user = req.user;

  if (username && username.trim().length >= 3) {
    const existing = db.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.id !== user.id);
    if (existing) {
      return res.status(400).json({ error: 'Ce pseudo est déjà utilisé.' });
    }
    user.username = username.trim();
  }

  if (password && password.trim().length >= 6) {
    db.passwords[user.id] = hashPassword(password);
  }

  saveDatabase();
  res.json({ success: true, user });
});


// ----------------------------------------------------
// AUTO-FILLING CLAIM GAUGE ENDPOINTS
// ----------------------------------------------------

app.get('/api/gauge/state', authMiddleware, (req: any, res) => {
  const user = req.user;
  const settings = db.gaugeSettings || { durationMinutes: 10, rewardAmount: 1.50, xpReward: 50 };
  
  if (!user.lastGaugeClaims) {
    user.lastGaugeClaims = {
      USDT: user.lastGaugeClaimAt || new Date(Date.now() - settings.durationMinutes * 60 * 1000).toISOString(),
      BTC: new Date(Date.now() - Math.floor(settings.durationMinutes * 0.75) * 60 * 1000).toISOString(),
      ETH: new Date(Date.now() - Math.floor(settings.durationMinutes * 0.5) * 60 * 1000).toISOString(),
      SOL: new Date(Date.now() - Math.floor(settings.durationMinutes * 0.25) * 60 * 1000).toISOString()
    };
    saveDatabase();
  }

  const gauges: Record<string, any> = {};
  const currencies = ['USDT', 'BTC', 'ETH', 'SOL'];
  
  currencies.forEach(cur => {
    const lastClaimAt = user.lastGaugeClaims[cur] || new Date(Date.now() - settings.durationMinutes * 60 * 1000).toISOString();
    const lastClaimTime = new Date(lastClaimAt).getTime();
    const elapsedSeconds = (Date.now() - lastClaimTime) / 1000;
    const totalSeconds = settings.durationMinutes * 60;
    
    const progress = Math.min(100, Math.floor((elapsedSeconds / totalSeconds) * 100));
    const timeLeftSeconds = Math.max(0, Math.floor(totalSeconds - elapsedSeconds));
    
    gauges[cur] = {
      progress,
      timeLeftSeconds,
      lastClaimAt
    };
  });

  res.json({
    progress: gauges['USDT'].progress,
    timeLeftSeconds: gauges['USDT'].timeLeftSeconds,
    lastGaugeClaimAt: user.lastGaugeClaims['USDT'],
    gauges,
    settings
  });
});

app.post('/api/user/claim-gauge', authMiddleware, (req: any, res) => {
  const user = req.user;
  const { claimCurrency } = req.body; // 'BTC', 'USDT', 'ETH', 'SOL'
  const currency = ['USDT', 'BTC', 'ETH', 'SOL'].includes(claimCurrency) ? claimCurrency : 'USDT';
  
  const settings = db.gaugeSettings || { durationMinutes: 10, rewardAmount: 1.50, xpReward: 50 };
  
  if (!user.lastGaugeClaims) {
    user.lastGaugeClaims = {
      USDT: user.lastGaugeClaimAt || new Date(Date.now() - settings.durationMinutes * 60 * 1000).toISOString(),
      BTC: new Date(Date.now() - Math.floor(settings.durationMinutes * 0.75) * 60 * 1000).toISOString(),
      ETH: new Date(Date.now() - Math.floor(settings.durationMinutes * 0.5) * 60 * 1000).toISOString(),
      SOL: new Date(Date.now() - Math.floor(settings.durationMinutes * 0.25) * 60 * 1000).toISOString()
    };
  }

  const lastClaimAt = user.lastGaugeClaims[currency] || new Date(Date.now() - settings.durationMinutes * 60 * 1000).toISOString();
  const lastClaimTime = new Date(lastClaimAt).getTime();
  const elapsedSeconds = (Date.now() - lastClaimTime) / 1000;
  const totalSeconds = settings.durationMinutes * 60;
  
  if (elapsedSeconds < totalSeconds - 3) { // 3 seconds leeway for network latency
    const timeLeft = Math.ceil(totalSeconds - elapsedSeconds);
    return res.status(400).json({ error: `La jauge ${currency} n'est pas encore remplie. Attendez encore ${timeLeft} secondes.` });
  }

  // Credit user balance
  user.usdcBalance += settings.rewardAmount;
  
  // Add XP and handle level up
  const { leveledUp, rewardGiven } = addXpToUser(user, settings.xpReward);
  
  // Reset claim time for this specific gauge
  const nowStr = new Date().toISOString();
  user.lastGaugeClaims[currency] = nowStr;
  user.lastGaugeClaimAt = nowStr; // legacy compatibility

  // Create Transaction
  const currencySign = currency === 'BTC' ? '₿' : currency === 'ETH' ? 'Ξ' : currency === 'SOL' ? '◎' : '₮';
  db.transactions.push({
    id: 'tx-gauge-' + crypto.randomBytes(4).toString('hex'),
    userId: user.id,
    amountUsdc: settings.rewardAmount,
    type: 'bonus_claim',
    description: `Récompense de jauge réclamée en ${currency} (${currencySign})`,
    createdAt: new Date().toISOString()
  });

  // Notify User
  db.notifications.push({
    id: 'notif-gauge-' + crypto.randomBytes(8).toString('hex'),
    userId: user.id,
    title: `⚡ Jauge ${currency} Réclamée !`,
    message: `Félicitations, tu as réclamé ${settings.rewardAmount.toFixed(2)} USDT équivalent en ${currency} et gagné +${settings.xpReward} XP.`,
    isRead: false,
    type: 'success',
    createdAt: new Date().toISOString()
  });

  saveDatabase();

  res.json({
    success: true,
    claimedAmount: settings.rewardAmount,
    xpGranted: settings.xpReward,
    leveledUp,
    levelUpReward: rewardGiven,
    currency,
    user
  });
});

// ----------------------------------------------------
// NEW DAILY RETENTION ENGAGEMENT ENDPOINTS
// ----------------------------------------------------

app.post('/api/user/daily-spin', authMiddleware, (req: any, res) => {
  const user = req.user;
  const now = Date.now();
  const SPIN_COOLDOWN = 12 * 3600 * 1000; // 12 hours cooldown
  
  const lastSpinTime = user.lastSpinAt ? new Date(user.lastSpinAt).getTime() : 0;
  if (now - lastSpinTime < SPIN_COOLDOWN) {
    const remainingMs = SPIN_COOLDOWN - (now - lastSpinTime);
    const hours = Math.floor(remainingMs / (3600 * 1000));
    const minutes = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
    return res.status(400).json({ 
      error: `La Roue de la fortune est en recharge. Réessayez dans ${hours}h ${minutes}m.` 
    });
  }

  // Spin Wheel possibilities:
  const rewards = [
    { type: 'USDT', val: 0.10, label: '+0.10 USDT' },
    { type: 'XP', val: 15, label: '+15 XP' },
    { type: 'USDT', val: 0.25, label: '+0.25 USDT' },
    { type: 'XP', val: 30, label: '+30 XP' },
    { type: 'USDT', val: 0.50, label: '+0.50 USDT' },
    { type: 'XP', val: 50, label: '+50 XP' },
    { type: 'USDT', val: 1.00, label: '+1.00 USDT' },
    { type: 'XP', val: 100, label: '+100 XP' }
  ];

  const rewardIndex = Math.floor(Math.random() * rewards.length);
  const prize = rewards[rewardIndex];

  let leveledUp = false;
  let rewardGiven = 0;

  if (prize.type === 'USDT') {
    user.usdcBalance += prize.val;
  } else {
    const resXp = addXpToUser(user, prize.val);
    leveledUp = resXp.leveledUp;
    rewardGiven = resXp.rewardGiven;
  }

  user.lastSpinAt = new Date().toISOString();

  // Create Transaction
  db.transactions.push({
    id: 'tx-spin-' + crypto.randomBytes(4).toString('hex'),
    userId: user.id,
    amountUsdc: prize.type === 'USDT' ? prize.val : 0,
    type: 'bonus_claim',
    description: `Gain Roue de la fortune : ${prize.label}`,
    createdAt: new Date().toISOString()
  });

  // Notify User
  db.notifications.push({
    id: 'notif-spin-' + crypto.randomBytes(8).toString('hex'),
    userId: user.id,
    title: '🎡 Roue de la Fortune lancée !',
    message: `Tu as gagné ${prize.label} sur la Roue de la Fortune !`,
    isRead: false,
    type: 'success',
    createdAt: new Date().toISOString()
  });

  saveDatabase();

  res.json({
    success: true,
    rewardIndex,
    rewardType: prize.type,
    rewardVal: prize.val,
    label: prize.label,
    leveledUp,
    levelUpReward: rewardGiven,
    user
  });
});

app.post('/api/user/daily-quiz', authMiddleware, (req: any, res) => {
  const user = req.user;
  const { score } = req.body; // e.g. 0 to 3 correct answers
  
  const now = Date.now();
  const QUIZ_COOLDOWN = 24 * 3600 * 1000; // 24 hours cooldown
  
  const lastQuizTime = user.lastQuizAt ? new Date(user.lastQuizAt).getTime() : 0;
  if (now - lastQuizTime < QUIZ_COOLDOWN) {
    return res.status(400).json({ error: "Vous avez déjà fait le quiz quotidien. Revenez demain !" });
  }

  let rewardUsdt = 0;
  let rewardXp = 2;

  if (score === 3) {
    rewardUsdt = 0.25;
    rewardXp = 20;
  } else if (score === 2) {
    rewardUsdt = 0.10;
    rewardXp = 15;
  } else if (score === 1) {
    rewardXp = 5;
  }

  user.usdcBalance += rewardUsdt;
  const { leveledUp, rewardGiven } = addXpToUser(user, rewardXp);
  
  user.lastQuizAt = new Date().toISOString();

  // Create Transaction
  db.transactions.push({
    id: 'tx-quiz-' + crypto.randomBytes(4).toString('hex'),
    userId: user.id,
    amountUsdc: rewardUsdt,
    type: 'bonus_claim',
    description: `Quiz Quotidien Web3 - Score: ${score}/3`,
    createdAt: new Date().toISOString()
  });

  // Notify User
  db.notifications.push({
    id: 'notif-quiz-' + crypto.randomBytes(8).toString('hex'),
    userId: user.id,
    title: `🧠 Quiz Quotidien complété !`,
    message: `Score : ${score}/3. Tu remportes +${rewardUsdt.toFixed(2)} USDT et +${rewardXp} XP.`,
    isRead: false,
    type: 'success',
    createdAt: new Date().toISOString()
  });

  saveDatabase();

  res.json({
    success: true,
    score,
    rewardUsdt,
    rewardXp,
    leveledUp,
    levelUpReward: rewardGiven,
    user
  });
});

app.post('/api/user/daily-predict', authMiddleware, (req: any, res) => {
  const user = req.user;
  const { prediction, currentPrice } = req.body; // 'UP' or 'DOWN', number
  
  if (!prediction || !currentPrice) {
    return res.status(400).json({ error: "Données de prédiction manquantes." });
  }

  const now = Date.now();
  const PREDICT_COOLDOWN = 12 * 3600 * 1000; // 12 hours between predictions
  
  const lastPredictTime = user.lastPredictionAt ? new Date(user.lastPredictionAt).getTime() : 0;
  if (lastPredictTime > 0 && user.predictionResult === 'pending') {
    return res.status(400).json({ error: "Vous avez déjà une prédiction en attente de vérification." });
  }

  if (now - lastPredictTime < PREDICT_COOLDOWN && user.predictionResult !== 'pending') {
    const remainingMs = PREDICT_COOLDOWN - (now - lastPredictTime);
    const hours = Math.floor(remainingMs / (3600 * 1000));
    const minutes = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
    return res.status(400).json({ error: `La prédiction est en recharge. Réessayez dans ${hours}h ${minutes}m.` });
  }

  user.lastPredictionAt = new Date().toISOString();
  user.predictionChoice = prediction;
  user.predictionBtcPrice = Number(currentPrice);
  user.predictionResult = 'pending';

  saveDatabase();

  res.json({
    success: true,
    user
  });
});

app.post('/api/user/verify-predict', authMiddleware, (req: any, res) => {
  const user = req.user;
  
  if (user.predictionResult !== 'pending' || !user.predictionChoice || !user.predictionBtcPrice) {
    return res.status(400).json({ error: "Aucune prédiction en attente à vérifier." });
  }

  const elapsed = Date.now() - new Date(user.lastPredictionAt!).getTime();
  if (elapsed < 15 * 1000) {
    const remaining = Math.ceil(15 - elapsed / 1000);
    return res.status(400).json({ error: `Vérification disponible dans ${remaining} secondes. Laissez le marché fluctuer !` });
  }

  const won = Math.random() < 0.55;
  const initialPrice = user.predictionBtcPrice;
  const percentChange = (0.05 + Math.random() * 0.45) / 100; // 0.05% to 0.50% change
  let finalPrice = initialPrice;

  if (user.predictionChoice === 'UP') {
    finalPrice = won ? initialPrice * (1 + percentChange) : initialPrice * (1 - percentChange);
  } else {
    finalPrice = won ? initialPrice * (1 - percentChange) : initialPrice * (1 + percentChange);
  }

  let rewardUsdt = 0;
  let rewardXp = 5; // Consolation XP

  if (won) {
    rewardUsdt = 0.50;
    rewardXp = 30;
    user.usdcBalance += rewardUsdt;
  }

  const { leveledUp, rewardGiven } = addXpToUser(user, rewardXp);
  user.predictionResult = won ? 'won' : 'lost';

  // Create Transaction
  db.transactions.push({
    id: 'tx-predict-' + crypto.randomBytes(4).toString('hex'),
    userId: user.id,
    amountUsdc: rewardUsdt,
    type: 'bonus_claim',
    description: `Défi Prédiction BTC ${user.predictionChoice} - ${won ? 'GAGNÉ' : 'PERDU'}`,
    createdAt: new Date().toISOString()
  });

  // Notify User
  db.notifications.push({
    id: 'notif-predict-' + crypto.randomBytes(8).toString('hex'),
    userId: user.id,
    title: won ? '📈 Prédiction Correcte !' : '📉 Prédiction Incorrecte',
    message: won 
      ? `Félicitations ! BTC a évolué en ta faveur (de $${initialPrice.toFixed(2)} à $${finalPrice.toFixed(2)}). Tu gagnes +0.50 USDT et +30 XP !`
      : `Le marché a fluctué dans l'autre sens (de $${initialPrice.toFixed(2)} à $${finalPrice.toFixed(2)}). Tu reçois +5 XP de consolation.`,
    isRead: false,
    type: won ? 'success' : 'info',
    createdAt: new Date().toISOString()
  });

  saveDatabase();

  res.json({
    success: true,
    result: user.predictionResult,
    initialPrice,
    finalPrice,
    rewardUsdt,
    rewardXp,
    leveledUp,
    levelUpReward: rewardGiven,
    user
  });
});

// Admin config endpoints
app.get('/api/admin/gauge', authMiddleware, adminMiddleware, (req, res) => {
  const settings = db.gaugeSettings || { durationMinutes: 10, rewardAmount: 1.50, xpReward: 50 };
  res.json({ settings });
});

app.post('/api/admin/gauge', authMiddleware, adminMiddleware, (req, res) => {
  const { durationMinutes, rewardAmount, xpReward } = req.body;
  
  if (durationMinutes === undefined || rewardAmount === undefined || xpReward === undefined) {
    return res.status(400).json({ error: 'Tous les champs (durationMinutes, rewardAmount, xpReward) doivent être fournis.' });
  }

  db.gaugeSettings = {
    durationMinutes: Number(durationMinutes),
    rewardAmount: Number(rewardAmount),
    xpReward: Number(xpReward)
  };

  saveDatabase();
  res.json({ success: true, settings: db.gaugeSettings });
});


// ----------------------------------------------------
// DAILY BONUS / CLAIM BONUS
// ----------------------------------------------------

// Last claim registry: userId -> timestamp
const lastClaims = new Map<string, number>();

app.post('/api/user/claim-daily', authMiddleware, (req: any, res) => {
  const user = req.user;
  const now = Date.now();
  const COOLDOWN = 12 * 3600 * 1000; // 12 hours cooldown
  
  const lastClaim = lastClaims.get(user.id) || 0;
  if (now - lastClaim < COOLDOWN) {
    const remainingMs = COOLDOWN - (now - lastClaim);
    const hours = Math.floor(remainingMs / (3600 * 1000));
    const minutes = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
    return res.status(429).json({ 
      error: `Tu as déjà réclamé ton bonus récemment. Reviens dans ${hours}h ${minutes}m.` 
    });
  }

  // Random USDC bonus between 0.25 and 1.50 USDC
  const bonusUsdc = Math.round((0.25 + Math.random() * 1.25) * 100) / 100;
  const xpReward = 20;

  user.usdcBalance += bonusUsdc;
  const { leveledUp, rewardGiven } = addXpToUser(user, xpReward);

  lastClaims.set(user.id, now);

  // Add Transaction
  db.transactions.push({
    id: 'tx-daily-' + crypto.randomBytes(4).toString('hex'),
    userId: user.id,
    amountUsdc: bonusUsdc,
    type: 'bonus_claim',
    description: 'Bonus quotidien réclamé avec succès !',
    createdAt: new Date().toISOString()
  });

  // Notify User
  db.notifications.push({
    id: 'notif-daily-' + crypto.randomBytes(8).toString('hex'),
    userId: user.id,
    title: '🎁 Bonus Quotidien Réclamé !',
    message: `Félicitations, tu as gagné ${bonusUsdc} USDC et +${xpReward} XP.`,
    isRead: false,
    type: 'success',
    createdAt: new Date().toISOString()
  });

  saveDatabase();

  res.json({
    success: true,
    bonusUsdc,
    xpReward,
    leveledUp,
    levelUpReward: rewardGiven,
    user
  });
});


// ----------------------------------------------------
// MISSIONS ENDPOINTS
// ----------------------------------------------------

app.get('/api/missions', authMiddleware, (req, res) => {
  // Only send active missions
  const activeMissions = db.missions.filter(m => m.isActive);
  res.json({ missions: activeMissions });
});

app.post('/api/missions/submit', authMiddleware, (req: any, res) => {
  const { missionId, proofText } = req.body;
  if (!missionId || !proofText) {
    return res.status(400).json({ error: 'La preuve ou l\'ID de mission est manquant.' });
  }

  const mission = db.missions.find(m => m.id === missionId && m.isActive);
  if (!mission) {
    return res.status(404).json({ error: 'Mission introuvable ou inactive.' });
  }

  // Check if already submitted & pending or approved
  const existing = db.userMissions.find(um => um.userId === req.userId && um.missionId === missionId);
  if (existing) {
    if (existing.status === 'pending') {
      return res.status(400).json({ error: 'Tu as déjà soumis une preuve pour cette mission. Elle est en cours de validation.' });
    }
    if (existing.status === 'approved') {
      return res.status(400).json({ error: 'Tu as déjà accompli cette mission avec succès.' });
    }
    // If rejected, allow re-submission
  }

  const userMissionId = 'um-' + crypto.randomBytes(8).toString('hex');
  const submission: UserMission = {
    id: userMissionId,
    userId: req.userId,
    missionId,
    proofText: proofText.trim(),
    status: 'pending',
    submittedAt: new Date().toISOString()
  };

  if (existing && existing.status === 'rejected') {
    // Overwrite rejected one
    const index = db.userMissions.findIndex(um => um.id === existing.id);
    db.userMissions[index] = submission;
  } else {
    db.userMissions.push(submission);
  }

  saveDatabase();
  res.status(201).json({ success: true, submission });
});

app.get('/api/user/my-missions', authMiddleware, (req: any, res) => {
  const submissions = db.userMissions.filter(um => um.userId === req.userId);
  res.json({ submissions });
});


// ----------------------------------------------------
// MY BONUSES / TRANSACTION HISTORY
// ----------------------------------------------------

app.get('/api/user/my-bonus', authMiddleware, (req: any, res) => {
  const bonuses = db.transactions.filter(tx => tx.userId === req.userId && tx.type !== 'withdrawal');
  res.json({ bonuses });
});


// ----------------------------------------------------
// WITHDRAWALS ENDPOINTS
// ----------------------------------------------------

app.get('/api/user/my-withdrawals', authMiddleware, (req: any, res) => {
  const userWithdrawals = db.withdrawals.filter(w => w.userId === req.userId);
  res.json({ withdrawals: userWithdrawals });
});

app.post('/api/user/request-withdrawal', authMiddleware, (req: any, res) => {
  const { amountUsdc, walletAddress } = req.body;
  const user = req.user;

  if (!amountUsdc || amountUsdc <= 0) {
    return res.status(400).json({ error: 'Le montant de retrait doit être supérieur à zéro.' });
  }

  if (amountUsdc > user.usdcBalance) {
    return res.status(400).json({ error: 'Solde insuffisant pour ce retrait.' });
  }

  if (!walletAddress || !walletAddress.startsWith('0x')) {
    return res.status(400).json({ error: 'Adresse de portefeuille EVM (Polygon) invalide.' });
  }

  const withdrawalId = 'w-' + crypto.randomBytes(8).toString('hex');
  const withdrawal: Withdrawal = {
    id: withdrawalId,
    userId: user.id,
    amountUsdc: Number(amountUsdc),
    walletAddress,
    status: 'pending',
    requestedAt: new Date().toISOString()
  };

  // Deduct from balance immediately to lock it
  user.usdcBalance -= Number(amountUsdc);

  db.withdrawals.push(withdrawal);

  // Add transaction
  db.transactions.push({
    id: 'tx-w-' + crypto.randomBytes(4).toString('hex'),
    userId: user.id,
    amountUsdc: -Number(amountUsdc),
    type: 'withdrawal',
    description: `Demande de retrait USDC initiée vers ${walletAddress.substring(0, 6)}...${walletAddress.slice(-4)}`,
    createdAt: new Date().toISOString()
  });

  // Create notification
  db.notifications.push({
    id: 'notif-w-' + crypto.randomBytes(8).toString('hex'),
    userId: user.id,
    title: '📤 Demande de Retrait Reçue',
    message: `Ta demande de retrait de ${amountUsdc} USDC est en cours d'examen par notre équipe.`,
    isRead: false,
    type: 'info',
    createdAt: new Date().toISOString()
  });

  saveDatabase();

  res.json({ success: true, withdrawal, user });
});


// ----------------------------------------------------
// LEADERBOARD ENDPOINT
// ----------------------------------------------------

app.get('/api/leaderboard', (req, res) => {
  // Sort non-admins by XP descending
  const leaderboard = db.users
    .filter(u => !u.isAdmin)
    .map(u => ({
      id: u.id,
      username: u.username,
      level: u.level,
      xp: u.xp,
      usdcBalance: u.usdcBalance
    }))
    .sort((a, b) => b.xp - a.xp);
  
  res.json({ leaderboard });
});


// ----------------------------------------------------
// REFERRAL ENDPOINTS
// ----------------------------------------------------

app.get('/api/user/referrals', authMiddleware, (req: any, res) => {
  const user = req.user;

  // Find users referred by this user's referral code
  const referredUsersList = db.users.filter(u => u.referredBy === user.referralCode);
  
  // Calculate total referral commissions (each yields 10 USDC to referrer)
  const totalEarnedUsdc = referredUsersList.length * 10.0;

  const referredUsersInfo = referredUsersList.map(u => ({
    username: u.username,
    level: u.level,
    joinedAt: u.createdAt,
    earnedForReferrer: 10.0
  }));

  res.json({
    referralCode: user.referralCode,
    referralsCount: referredUsersList.length,
    totalEarnedUsdc,
    referredUsers: referredUsersInfo
  });
});


// ----------------------------------------------------
// NOTIFICATIONS
// ----------------------------------------------------

app.get('/api/user/notifications', authMiddleware, (req: any, res) => {
  const userNotifs = db.notifications.filter(n => n.userId === req.userId);
  res.json({ notifications: userNotifs });
});

app.post('/api/user/notifications/read', authMiddleware, (req: any, res) => {
  const userNotifs = db.notifications.filter(n => n.userId === req.userId);
  userNotifs.forEach(n => n.isRead = true);
  saveDatabase();
  res.json({ success: true });
});


// ====================================================
// ADMINISTRATOR EXCLUSIVE ENDPOINTS (auth + admin middleware)
// ====================================================

app.get('/api/admin/stats', authMiddleware, adminMiddleware, (req, res) => {
  const totalUsers = db.users.filter(u => !u.isAdmin).length;
  const blockedUsers = db.users.filter(u => u.isBlocked).length;
  
  // Withdrawals status
  const pendingWithdrawalsCount = db.withdrawals.filter(w => w.status === 'pending').length;
  const approvedWithdrawalsAmount = db.withdrawals
    .filter(w => w.status === 'approved')
    .reduce((sum, w) => sum + w.amountUsdc, 0);

  // Submissions status
  const pendingSubmissionsCount = db.userMissions.filter(um => um.status === 'pending').length;

  // Missions counts
  const totalMissions = db.missions.length;
  const activeMissions = db.missions.filter(m => m.isActive).length;

  // Global Rewards (all non-withdrawal positive transactions)
  const totalRewardsDistributed = db.transactions
    .filter(tx => tx.amountUsdc > 0 && tx.type !== 'withdrawal')
    .reduce((sum, tx) => sum + tx.amountUsdc, 0);

  res.json({
    totalUsers,
    blockedUsers,
    pendingWithdrawalsCount,
    approvedWithdrawalsAmount,
    pendingSubmissionsCount,
    totalMissions,
    activeMissions,
    totalRewardsDistributed
  });
});

app.get('/api/admin/users', authMiddleware, adminMiddleware, (req, res) => {
  // Return all users with their full stats
  const allUsers = db.users.filter(u => !u.isAdmin);
  res.json({ users: allUsers });
});

app.post('/api/admin/users/:id/adjust', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { xpAmount, usdcAmount, comment } = req.body;

  const targetUser = db.users.find(u => u.id === id);
  if (!targetUser) {
    return res.status(404).json({ error: 'Utilisateur introuvable.' });
  }

  const xpNum = Number(xpAmount || 0);
  const usdcNum = Number(usdcAmount || 0);

  if (xpNum !== 0) {
    addXpToUser(targetUser, xpNum);
  }

  if (usdcNum !== 0) {
    targetUser.usdcBalance += usdcNum;
    // Log adjustment transaction
    db.transactions.push({
      id: 'tx-adj-' + crypto.randomBytes(4).toString('hex'),
      userId: targetUser.id,
      amountUsdc: usdcNum,
      type: 'admin_adjustment',
      description: `Ajustement administratif : ${usdcNum > 0 ? '+' : ''}${usdcNum} USDC. ${comment || ''}`,
      createdAt: new Date().toISOString()
    });
  }

  // Send admin action notification
  db.notifications.push({
    id: 'notif-adj-' + crypto.randomBytes(8).toString('hex'),
    userId: targetUser.id,
    title: '⚙️ Ajustement de compte',
    message: `L'équipe administrative a ajusté ton compte : ${xpNum !== 0 ? `${xpNum > 0 ? '+' : ''}${xpNum} XP ` : ''}${usdcNum !== 0 ? `${usdcNum > 0 ? '+' : ''}${usdcNum} USDC ` : ''}.${comment ? ` Motif : ${comment}` : ''}`,
    isRead: false,
    type: 'info',
    createdAt: new Date().toISOString()
  });

  saveDatabase();
  res.json({ success: true, user: targetUser });
});

app.post('/api/admin/users/:id/toggle-block', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;
  const targetUser = db.users.find(u => u.id === id);
  
  if (!targetUser) {
    return res.status(404).json({ error: 'Utilisateur introuvable.' });
  }

  if (targetUser.isAdmin) {
    return res.status(400).json({ error: 'Action impossible sur un compte administrateur.' });
  }

  targetUser.isBlocked = !targetUser.isBlocked;
  saveDatabase();
  
  res.json({ success: true, isBlocked: targetUser.isBlocked });
});

// Admin Mission Actions (CRUD)
app.get('/api/admin/missions', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ missions: db.missions });
});

app.post('/api/admin/missions', authMiddleware, adminMiddleware, (req, res) => {
  const { title, description, rewardUsdc, rewardXp, category, actionUrl, isActive } = req.body;
  
  if (!title || !description || rewardUsdc === undefined || rewardXp === undefined || !category) {
    return res.status(400).json({ error: 'Veuillez renseigner tous les champs obligatoires de la mission.' });
  }

  const newMission: Mission = {
    id: 'm-' + crypto.randomBytes(6).toString('hex'),
    title,
    description,
    rewardUsdc: Number(rewardUsdc),
    rewardXp: Number(rewardXp),
    category,
    actionUrl: actionUrl || '#',
    isActive: isActive !== undefined ? isActive : true,
    createdAt: new Date().toISOString()
  };

  db.missions.push(newMission);
  saveDatabase();

  res.status(201).json({ success: true, mission: newMission });
});

app.put('/api/admin/missions/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, description, rewardUsdc, rewardXp, category, actionUrl, isActive } = req.body;

  const missionIndex = db.missions.findIndex(m => m.id === id);
  if (missionIndex === -1) {
    return res.status(404).json({ error: 'Mission introuvable.' });
  }

  const updatedMission: Mission = {
    ...db.missions[missionIndex],
    title: title || db.missions[missionIndex].title,
    description: description || db.missions[missionIndex].description,
    rewardUsdc: rewardUsdc !== undefined ? Number(rewardUsdc) : db.missions[missionIndex].rewardUsdc,
    rewardXp: rewardXp !== undefined ? Number(rewardXp) : db.missions[missionIndex].rewardXp,
    category: category || db.missions[missionIndex].category,
    actionUrl: actionUrl !== undefined ? actionUrl : db.missions[missionIndex].actionUrl,
    isActive: isActive !== undefined ? isActive : db.missions[missionIndex].isActive
  };

  db.missions[missionIndex] = updatedMission;
  saveDatabase();

  res.json({ success: true, mission: updatedMission });
});

app.delete('/api/admin/missions/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;
  const initialLength = db.missions.length;
  db.missions = db.missions.filter(m => m.id !== id);
  
  if (db.missions.length === initialLength) {
    return res.status(404).json({ error: 'Mission introuvable.' });
  }

  saveDatabase();
  res.json({ success: true });
});

// Admin Task Submissions Verification
app.get('/api/admin/submissions', authMiddleware, adminMiddleware, (req, res) => {
  // Join with user and mission details for rich display
  const richSubmissions = db.userMissions.map(um => {
    const user = db.users.find(u => u.id === um.userId);
    const mission = db.missions.find(m => m.id === um.missionId);
    return {
      ...um,
      user: user ? { username: user.username, email: user.email } : null,
      mission: mission ? { title: mission.title, rewardUsdc: mission.rewardUsdc, rewardXp: mission.rewardXp } : null
    };
  });

  res.json({ submissions: richSubmissions });
});

app.post('/api/admin/submissions/:id/process', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { action, adminComment } = req.body; // action: 'approve' | 'reject'

  if (action !== 'approve' && action !== 'reject') {
    return res.status(400).json({ error: 'Action invalide. Doit être approve ou reject.' });
  }

  const submission = db.userMissions.find(um => um.id === id);
  if (!submission) {
    return res.status(404).json({ error: 'Preuve de tâche introuvable.' });
  }

  if (submission.status !== 'pending') {
    return res.status(400).json({ error: 'Cette preuve a déjà été traitée.' });
  }

  const user = db.users.find(u => u.id === submission.userId);
  const mission = db.missions.find(m => m.id === submission.missionId);

  if (!user || !mission) {
    return res.status(404).json({ error: 'L\'utilisateur ou la mission associée est introuvable.' });
  }

  if (action === 'approve') {
    submission.status = 'approved';
    submission.processedAt = new Date().toISOString();
    submission.adminComment = adminComment || 'Preuve approuvée avec succès !';

    // Credit user reward
    user.usdcBalance += mission.rewardUsdc;
    const { leveledUp, rewardGiven } = addXpToUser(user, mission.rewardXp);

    // Save transaction
    db.transactions.push({
      id: 'tx-approve-' + crypto.randomBytes(4).toString('hex'),
      userId: user.id,
      amountUsdc: mission.rewardUsdc,
      type: 'mission_reward',
      description: `Validation mission : ${mission.title}`,
      createdAt: new Date().toISOString()
    });

    // Notify User
    db.notifications.push({
      id: 'notif-appr-' + crypto.randomBytes(8).toString('hex'),
      userId: user.id,
      title: '✅ Mission validée !',
      message: `Félicitations, ta preuve pour "${mission.title}" a été acceptée. Tu as reçu ${mission.rewardUsdc} USDC et +${mission.rewardXp} XP !`,
      isRead: false,
      type: 'success',
      createdAt: new Date().toISOString()
    });

  } else {
    submission.status = 'rejected';
    submission.processedAt = new Date().toISOString();
    submission.adminComment = adminComment || 'Preuve refusée. Veuillez vérifier les détails demandés.';

    // Notify User of rejection
    db.notifications.push({
      id: 'notif-rejc-' + crypto.randomBytes(8).toString('hex'),
      userId: user.id,
      title: '❌ Mission refusée',
      message: `Ta preuve pour la mission "${mission.title}" a été refusée par l'administrateur. Raison : ${submission.adminComment}`,
      isRead: false,
      type: 'alert',
      createdAt: new Date().toISOString()
    });
  }

  saveDatabase();
  res.json({ success: true, submission });
});

// Admin Withdrawals Verification
app.get('/api/admin/withdrawals', authMiddleware, adminMiddleware, (req, res) => {
  const richWithdrawals = db.withdrawals.map(w => {
    const user = db.users.find(u => u.id === w.userId);
    return {
      ...w,
      user: user ? { username: user.username, email: user.email } : null
    };
  });
  res.json({ withdrawals: richWithdrawals });
});

app.post('/api/admin/withdrawals/:id/process', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // action: 'approve' | 'reject'

  const withdrawal = db.withdrawals.find(w => w.id === id);
  if (!withdrawal) {
    return res.status(404).json({ error: 'Demande de retrait introuvable.' });
  }

  if (withdrawal.status !== 'pending') {
    return res.status(400).json({ error: 'Cette demande de retrait a déjà été traitée.' });
  }

  const user = db.users.find(u => u.id === withdrawal.userId);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur associé introuvable.' });
  }

  if (action === 'approve') {
    withdrawal.status = 'approved';
    withdrawal.processedAt = new Date().toISOString();

    // Create notification
    db.notifications.push({
      id: 'notif-wappr-' + crypto.randomBytes(8).toString('hex'),
      userId: user.id,
      title: '💸 Retrait traité avec succès !',
      message: `Ton retrait de ${withdrawal.amountUsdc} USDC a été validé et envoyé vers ton portefeuille ${withdrawal.walletAddress.substring(0, 6)}...${withdrawal.walletAddress.slice(-4)}.`,
      isRead: false,
      type: 'success',
      createdAt: new Date().toISOString()
    });

  } else {
    withdrawal.status = 'rejected';
    withdrawal.processedAt = new Date().toISOString();

    // Return locked funds back to user balance
    user.usdcBalance += withdrawal.amountUsdc;

    // Refund transaction
    db.transactions.push({
      id: 'tx-wref-' + crypto.randomBytes(4).toString('hex'),
      userId: user.id,
      amountUsdc: withdrawal.amountUsdc,
      type: 'admin_adjustment',
      description: `Remboursement de retrait refusé (ID: ${withdrawal.id})`,
      createdAt: new Date().toISOString()
    });

    // Notify User of rejection
    db.notifications.push({
      id: 'notif-wrejc-' + crypto.randomBytes(8).toString('hex'),
      userId: user.id,
      title: '❌ Retrait refusé',
      message: `Ta demande de retrait de ${withdrawal.amountUsdc} USDC a été refusée. Le montant a été recrédité sur ton solde disponible.`,
      isRead: false,
      type: 'alert',
      createdAt: new Date().toISOString()
    });
  }

  saveDatabase();
  res.json({ success: true, withdrawal });
});

// Admin Global Transactions List
app.get('/api/admin/transactions', authMiddleware, adminMiddleware, (req, res) => {
  const richTransactions = db.transactions.map(tx => {
    const user = db.users.find(u => u.id === tx.userId);
    return {
      ...tx,
      user: user ? { username: user.username, email: user.email } : null
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  res.json({ transactions: richTransactions });
});

// Admin level configurations list
app.get('/api/admin/levels', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ levels: db.levelConfigs });
});

app.post('/api/admin/levels', authMiddleware, adminMiddleware, (req, res) => {
  const { level, xpRequired, rewardUsdc } = req.body;
  if (level === undefined || xpRequired === undefined || rewardUsdc === undefined) {
    return res.status(400).json({ error: 'Veuillez saisir le niveau, l\'XP requise, et la récompense USDC.' });
  }

  const existingIndex = db.levelConfigs.findIndex(l => l.level === Number(level));
  const config: LevelConfig = {
    level: Number(level),
    xpRequired: Number(xpRequired),
    rewardUsdc: Number(rewardUsdc)
  };

  if (existingIndex !== -1) {
    db.levelConfigs[existingIndex] = config;
  } else {
    db.levelConfigs.push(config);
  }

  // Sort configs
  db.levelConfigs.sort((a, b) => a.level - b.level);
  saveDatabase();

  res.json({ success: true, levels: db.levelConfigs });
});


// ----------------------------------------------------
// VITE AND STATIC ASSETS HANDLER
// ----------------------------------------------------

async function startServer() {
  // Vite dev server middleware configuration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production serving static dist assets
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BonusX] Server successfully running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
