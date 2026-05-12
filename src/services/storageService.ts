import { CharacterStats, Habit, TimeBlock, Skill, Book, DailyNote, Evaluation, Achievement, Task, Material, GoalsData, ChatSession } from '../types';

const STORAGE_KEYS = {
  STATS: 'doneify_stats',
  HABITS: 'doneify_habits',
  CALENDAR: 'doneify_calendar',
  SKILLS: 'doneify_skills',
  BOOKS: 'doneify_books',
  NOTES: 'doneify_notes',
  EVALUATIONS: 'doneify_evaluations',
  ACHIEVEMENTS: 'doneify_achievements',
  USERNAME: 'doneify_username',
  EVENTS: 'doneify_events',
  CHAT_HISTORY: 'doneify_chat_history',
  AVATAR: 'doneify_avatar',
  AVATAR_ID: 'doneify_avatar_id',
  ONBOARDING: 'onboarding_done',
  TASKS: 'doneify_tasks',
  MATERIALS: 'doneify_materials',
  GOALS: 'doneify_goals',
};

const DEFAULT_STATS: CharacterStats = {
  userName: 'User',
  points: 0,
  activeDays: 0,
  streak: {
    current: 0,
    history: []
  },
  stats: {
    creativity: 1,
    discipline: 1,
    focus: 1,
    vitality: 1,
  },
};

const DEFAULT_GOALS: GoalsData = {
  yearly: {
    text: '',
    year: new Date().getFullYear(),
    milestones: Array.from({ length: 12 }, (_, i) => ({
      bulan: i + 1,
      target: '',
      done: false,
    })),
  },
  weekly: [],
};

const safeGet = (key: string, fallback: any) => {
  try {
    const val = localStorage.getItem(key);
    if (!val) return fallback;
    try {
      return JSON.parse(val);
    } catch {
      return val; // fallback for raw strings from previous versions
    }
  } catch {
    return fallback;
  }
};

const safeSet = (key: string, value: any) => {
  try {
    const val = typeof value === 'string' && value === 'true' ? 'true' : 
                typeof value === 'string' && !value.startsWith('{') && !value.startsWith('[') && !value.startsWith('"') ? value : 
                JSON.stringify(value);
    // Note: preserving raw string storage for backwards compatibility where needed, 
    // but default to JSON stringify as requested.
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch (e) {
    console.error('Storage error:', key);
  }
};

export const storageService = {
  // Username
  getUserName: (): string => safeGet(STORAGE_KEYS.USERNAME, 'User'),
  saveUserName: (name: string) => safeSet(STORAGE_KEYS.USERNAME, name),

  // Stats
  getStats: (): CharacterStats => {
    const storedStats = safeGet(STORAGE_KEYS.STATS, {});
    const stats = {
      ...DEFAULT_STATS,
      ...storedStats,
      streak: {
        ...DEFAULT_STATS.streak,
        ...(storedStats.streak || {})
      },
      stats: {
        ...DEFAULT_STATS.stats,
        ...(storedStats.stats || {})
      }
    };
    stats.userName = storageService.getUserName();
    return stats;
  },
  saveStats: (stats: CharacterStats) => {
    safeSet(STORAGE_KEYS.STATS, stats);
    if (stats.userName) storageService.saveUserName(stats.userName);
    if (stats.avatar) storageService.saveAvatar(stats.avatar);
  },

  // Onboarding
  getOnboardingDone: (): boolean => safeGet(STORAGE_KEYS.ONBOARDING, '') === 'true',
  saveOnboardingDone: () => safeSet(STORAGE_KEYS.ONBOARDING, 'true'),

  // Habits
  getHabits: (): Habit[] => safeGet(STORAGE_KEYS.HABITS, []),
  saveHabits: (habits: Habit[]) => safeSet(STORAGE_KEYS.HABITS, habits),

  // Calendar
  getCalendar: (): TimeBlock[] => safeGet(STORAGE_KEYS.CALENDAR, []),
  saveCalendar: (blocks: TimeBlock[]) => safeSet(STORAGE_KEYS.CALENDAR, blocks),

  // Skills
  getSkills: (): Skill[] => safeGet(STORAGE_KEYS.SKILLS, []),
  saveSkills: (skills: Skill[]) => safeSet(STORAGE_KEYS.SKILLS, skills),

  // Books
  getBooks: (): Book[] => safeGet(STORAGE_KEYS.BOOKS, []),
  saveBooks: (books: Book[]) => safeSet(STORAGE_KEYS.BOOKS, books),

  // Notes
  getNotes: (): DailyNote[] => safeGet(STORAGE_KEYS.NOTES, []),
  saveNotes: (notes: DailyNote[]) => safeSet(STORAGE_KEYS.NOTES, notes),

  // Evaluations
  getEvaluations: (): Evaluation[] => safeGet(STORAGE_KEYS.EVALUATIONS, []),
  saveEvaluations: (evaluations: Evaluation[]) => safeSet(STORAGE_KEYS.EVALUATIONS, evaluations),

  // Achievements
  getAchievements: (): Achievement[] => safeGet(STORAGE_KEYS.ACHIEVEMENTS, []),

  // Avatar (base64 image)
  getAvatar: (): string | null => safeGet(STORAGE_KEYS.AVATAR, null),
  saveAvatar: (avatar: string) => safeSet(STORAGE_KEYS.AVATAR, avatar),

  // Avatar ID (SVG preset)
  getAvatarId: (): string => safeGet(STORAGE_KEYS.AVATAR_ID, 'boy1'),
  saveAvatarId: (id: string) => {
    safeSet(STORAGE_KEYS.AVATAR_ID, id);
    window.dispatchEvent(new Event('storage'));
  },

  // Events
  getEvents: (): any[] => safeGet(STORAGE_KEYS.EVENTS, []),
  saveEvents: (events: any[]) => safeSet(STORAGE_KEYS.EVENTS, events),

  // Chat History
  getChatHistory: (): ChatSession[] => safeGet(STORAGE_KEYS.CHAT_HISTORY, []),
  saveChatHistory: (history: ChatSession[]) => safeSet(STORAGE_KEYS.CHAT_HISTORY, history),

  // Tasks
  getTasks: (): Task[] => safeGet(STORAGE_KEYS.TASKS, []),
  saveTasks: (tasks: Task[]) => safeSet(STORAGE_KEYS.TASKS, tasks),

  // Materials
  getMaterials: (): Material[] => safeGet(STORAGE_KEYS.MATERIALS, []),
  saveMaterials: (materials: Material[]) => safeSet(STORAGE_KEYS.MATERIALS, materials),

  // Goals
  getGoals: (): GoalsData => {
    const parsed = safeGet(STORAGE_KEYS.GOALS, null);
    if (parsed) {
      if (parsed.yearly && (!parsed.yearly.milestones || parsed.yearly.milestones.length < 12)) {
        parsed.yearly.milestones = Array.from({ length: 12 }, (_, i) => {
          const existing = parsed.yearly.milestones?.find((m: any) => m.bulan === i + 1);
          return existing || { bulan: i + 1, target: '', done: false };
        });
      }
      return { ...DEFAULT_GOALS, ...parsed };
    }
    return DEFAULT_GOALS;
  },
  saveGoals: (goals: GoalsData) => safeSet(STORAGE_KEYS.GOALS, goals),

  // Storage size check
  getStorageSize: (): number => {
    let total = 0;
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += (localStorage.getItem(key) || '').length;
        }
      }
    } catch {
      return 0;
    }
    return total;
  },
  isStorageNearFull: (): boolean => storageService.getStorageSize() > 4 * 1024 * 1024,
};
