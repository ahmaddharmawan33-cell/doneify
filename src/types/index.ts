export interface CharacterStats {
  userName: string;
  points: number;
  activeDays: number;
  avatar?: string;
  weeklyGoal?: string;
  checkInFrequency?: string;
  streak: {
    current: number;
    history: string[]; // dates of activity 'YYYY-MM-DD'
  };
  stats: {
    creativity: number;
    discipline: number;
    focus: number;
    vitality: number;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  completedToday: boolean;
  targetPerDay: number;
  completedCount: number;
  lastCompletedDate?: string;
  category: 'work' | 'health' | 'learning' | 'personal';
  type: 'daily' | 'weekly';
}

export interface TimeBlock {
  id: string;
  time: string;
  activity: string;
  category: 'work' | 'health' | 'learning' | 'personal';
  date?: string;
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface SkillPhase {
  id: string;
  title: string;
  period: string;
  items: RoadmapItem[];
}

export interface Skill {
  id: string;
  name: string;
  progress?: number;
  points: number;
  phases?: SkillPhase[];
  isExpanded?: boolean;
  isGeneratingRoadmap?: boolean;
  error?: boolean;
}

export interface DailyNote {
  id: string;
  title?: string;
  date: string;
  content: string;
  category?: 'work' | 'health' | 'learning' | 'personal';
}

export interface Task {
  id: string;
  nama: string;
  matkul: string;
  deadline: string; // ISO datetime
  prioritas: 'rendah' | 'sedang' | 'tinggi';
  status: 'belum' | 'sedang' | 'selesai';
  createdAt: string;
}

export interface Material {
  id: string;
  judul: string;
  matkul: string;
  type: 'text' | 'image' | 'audio' | 'mixed';
  content: string; // text or base64
  images?: string[];
  audios?: {name: string, url: string}[];
  ringkasan: string; // AI result
  createdAt: string;
}

export interface GoalsData {
  yearly: {
    text: string;
    year: number;
    milestones: { bulan: number; target: string; done: boolean }[];
  };
  weekly: { id: string; text: string; done: boolean; deadline: string }[];
}

export interface Evaluation {
  id: string;
  type: 'daily' | 'weekly';
  date: string;
  summary: string;
  score: number;
}

export interface Book {
  id: string;
  title: string;
  status: 'Reading' | 'Done';
  linkedSkillId?: string;
}

export type Intent = 'INTENT_ACTION' | 'INTENT_CHAT';

export interface AIResponse {
  message: string;
  intent: Intent;
  proposedAction?: {
    type: string;
    data: any;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  date: string;
  messages: ChatMessage[];
}

export interface ChatMessage {
  role: string;
  parts: { text: string }[];
  action?: any;
  id?: string;
  actionHandled?: boolean;
}
