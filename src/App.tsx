import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Zap, 
  MessageSquare, 
  User, 
  Trophy,
  Flame,
  Plus,
  Check,
  StickyNote,
  ChevronRight,
  Menu,
  X,
  Clock,
  History,
  Info,
  Edit3,
  Trash2,
  Crown,
  ListTodo,
  BookOpen,
  Target,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Loader2,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CharacterStats, Habit, TimeBlock, Skill, Book, DailyNote, Evaluation, Achievement, Task, Material, GoalsData, ChatSession } from './types';
import { storageService } from './services/storageService';
import { geminiService } from './services/geminiService';
import { cn } from './lib/utils';
import Markdown from 'react-markdown';
import { Onboarding } from './components/Onboarding';
import { AVATARS } from './components/avatar';


// Page Components

// UI Components
import { DarkCard } from './components/ui/DarkCard';
import { StatBar } from './components/ui/StatBar';
import { ConfirmModal, InputModal, DoubleInputModal } from './components/ui/Modal';
import { MaterialsPage } from './components/MaterialsPage';
import { TasksPage } from './components/TasksPage';

// Error Boundary
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-brand-text-secondary">
          <p className="font-bold">Gagal memuat halaman ini.</p>
          <p className="text-xs mt-2 opacity-60">
            {this.state.error?.message}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-amber-500 text-brand-background rounded-xl text-xs font-bold"
          >
            Muat Ulang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Mock/Initial Data if empty
const GREETING = "Hey, Aham";

export default function App() {
  const [onboardingDone, setOnboardingDone] = useState(storageService.getOnboardingDone());
  const [userName, setUserName] = useState(storageService.getUserName());
  const [avatarId, setAvatarId] = useState(storageService.getAvatarId());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'habits' | 'calendar' | 'skills' | 'coach' | 'notes' | 'profile' | 'achievements'>('dashboard');
  const [stats, setStats] = useState<CharacterStats>(storageService.getStats());
  const [habits, setHabits] = useState<Habit[]>(storageService.getHabits() || []);
  const [skills, setSkills] = useState<Skill[]>(storageService.getSkills() || []);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [notes, setNotes] = useState<DailyNote[]>(storageService.getNotes() || []);
  const [achievements, setAchievements] = useState<Achievement[]>(storageService.getAchievements() || []);
  const [events, setEvents] = useState<any[]>(storageService.getEvents() || []);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(storageService.getChatHistory() || []);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(storageService.getAvatar());
  const [showHistory, setShowHistory] = useState(false);
  const [noteToView, setNoteToView] = useState<DailyNote | null>(null);
  const [tasks, setTasks] = useState<Task[]>(storageService.getTasks() || []);
  const [materials, setMaterials] = useState<Material[]>(storageService.getMaterials() || []);
  const [goals, setGoals] = useState<GoalsData>(storageService.getGoals() || { yearly: { text: '', year: new Date().getFullYear(), milestones: [] }, weekly: [] });
  const [dismissedReminders, setDismissedReminders] = useState<string[]>([]);
  // Modal states for replacing window.prompt/confirm
  const [confirmState, setConfirmState] = useState<{open:boolean,msg:string,onOk:()=>void}>({open:false,msg:'',onOk:()=>{}});
  const [inputState, setInputState] = useState<{open:boolean,title:string,label:string,defaultVal:string,onOk:(v:string)=>void}>({open:false,title:'',label:'',defaultVal:'',onOk:()=>{}});
  const [doubleInputState, setDoubleInputState] = useState<{open:boolean,title:string,l1:string,l2:string,d1:string,d2:string,onOk:(a:string,b:string)=>void}>({open:false,title:'',l1:'',l2:'',d1:'',d2:'',onOk:()=>{}});
  const [noteTitle, setNoteTitle] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [expandedSkillIds, setExpandedSkillIds] = useState<string[]>([]);
  
  // Mobile UI States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFloatingVoxOpen, setIsFloatingVoxOpen] = useState(false);
  const [calendarTab, setCalendarTab] = useState<'grid' | 'tasks'>('grid');
  const [notesTab, setNotesTab] = useState<'notes' | 'materials'>('notes');

  // Modal States
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [selectedHabitName, setSelectedHabitName] = useState('');
  const [selectedHabitTarget, setSelectedHabitTarget] = useState(1);
  const handleAddSkillAuto = async (name: string, generateRoadmap: boolean) => {
    const skillId = Math.random().toString(36).substr(2, 9);
    const newSkill: Skill = {
      id: skillId,
      name,
      points: 0,
      phases: [],
      isGeneratingRoadmap: generateRoadmap
    };
    setSkills(prev => [...prev, newSkill]);
    setShowSkillModal(false);
    
    if (generateRoadmap) {
      const roadmap = await geminiService.generateRoadmap(name);
      if (roadmap && roadmap.phases) {
        setSkills(prev => prev.map(s => s.id === skillId ? { ...s, phases: roadmap.phases, isGeneratingRoadmap: false } : s));
      } else {
        setSkills(prev => prev.map(s => s.id === skillId ? { ...s, isGeneratingRoadmap: false, error: true } : s));
      }
    }
  };
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [selectedSkillName, setSelectedSkillName] = useState('');
  const [autoRoadmap, setAutoRoadmap] = useState(true);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventData, setNewEventData] = useState({ activity: '', time: '09:00', category: 'personal' });
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const showToast = (msg: string) => setToast(msg);

  const handleResetProfile = () => {
    setConfirmState({
      open: true,
      msg: "Hapus semua data dan mulai dari awal? Tindakan ini tidak bisa dibatalkan.",
      onOk: () => {
        localStorage.clear();
        window.location.reload();
      }
    });
  };

  // Current session messages
  const activeSession = chatSessions.find(s => s.id === activeChatSessionId);
  const currentMessages = activeSession?.messages || [];

  // AI Coach State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState("");

  const cleanMessage = (text: string) => {
    return text
      .replace(/\[ACTION\][\s\S]*?\[\/ACTION\]/g, '')
      .replace(/^(CASUAL|ACTION|AMBIGUOUS)\s*/i, '')
      .trim();
  };

  const Typewriter = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
    const [displayedText, setDisplayedText] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
      if (currentIndex < text.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(prev => prev + text[currentIndex]);
          setCurrentIndex(prev => prev + 1);
        }, 15); // Adjust typing speed here
        return () => clearTimeout(timeout);
      } else if (onComplete) {
        onComplete();
      }
    }, [currentIndex, text]);

    return (
      <div className="markdown-body">
        <Markdown>{displayedText}</Markdown>
        {currentIndex < text.length && <span className="inline-block w-1 h-4 bg-amber-500 ml-1 animate-pulse" />}
      </div>
    );
  };
  const [showChatHistory, setShowChatHistory] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const floatingChatEndRef = React.useRef<HTMLDivElement>(null);
  
  // Auto-scroll
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    if (floatingChatEndRef.current) {
      floatingChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages, isAiLoading, isFloatingVoxOpen]);

  // Persistence
  useEffect(() => {
    storageService.saveStats(stats);
  }, [stats]);
  useEffect(() => {
    if (avatar) storageService.saveAvatar(avatar);
  }, [avatar]);
  useEffect(() => {
    storageService.saveHabits(habits);
  }, [habits]);
  useEffect(() => {
    storageService.saveSkills(skills);
  }, [skills]);
  useEffect(() => {
    storageService.saveNotes(notes);
  }, [notes]);
  useEffect(() => {
    storageService.saveEvents(events);
  }, [events]);
  useEffect(() => {
    storageService.saveTasks(tasks);
  }, [tasks]);
  useEffect(() => {
    storageService.saveMaterials(materials);
  }, [materials]);
  useEffect(() => {
    storageService.saveGoals(goals);
  }, [goals]);
  useEffect(() => {
    storageService.saveChatHistory(chatSessions);
  }, [chatSessions]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sync with storage for real-time updates
  useEffect(() => {
    const handleStorageChange = () => {
      setOnboardingDone(storageService.getOnboardingDone());
      setUserName(storageService.getUserName());
      setAvatarId(storageService.getAvatarId());
      setStats(storageService.getStats());
      setGoals(storageService.getGoals());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Streak logic
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const history = stats.streak?.history || [];
    if (!history.includes(today)) {
      // Check for activity today
      const hasHabitActivity = habits.some(h => h.completedToday);
      const hasNoteActivity = notes.some(n => n.date.startsWith(today));
      const hasEventActivity = events.some(e => e.date === today);
      const hasChatActivity = chatSessions.some(c => c.date.startsWith(today));

      if (hasHabitActivity || hasNoteActivity || hasEventActivity || hasChatActivity) {
        setStats(prev => {
          const newHistory = [...prev.streak.history, today];
          return {
            ...prev,
            activeDays: prev.activeDays + 1,
            streak: {
              ...prev.streak,
              current: prev.streak.current + 1,
              history: newHistory
            }
          };
        });
      }
    }
  }, [habits, notes, events, chatSessions]);

  // RPG Logic helpers (Now Poin based)
  const addPoints = (amount: number) => {
    setStats(prev => ({
      ...prev,
      points: prev.points + amount
    }));
  };

  const handleToggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const completed = !h.completedToday;
        if (completed) {
          addPoints(10);
          // Focus boost for completing all habits
          if (prev.filter(x => !x.completedToday).length === 1) {
            addPoints(20);
          }
        }
        return { ...h, completedToday: completed };
      }
      return h;
    }));
  };

  const handleAddSkillManual = () => {
    if (!selectedSkillName) return;
    setActiveTab('coach');
    setShowSkillModal(false);
    handleCoachMessage(`Bantu aku buat roadmap detail untuk skill: ${selectedSkillName}. Susun dalam minimal 3 fase belajar.`);
    setSelectedSkillName('');
  };

  const handleCoachMessage = async (msg: string) => {
    if (!msg.trim()) return;
    
    let currentSessionId = activeChatSessionId;
    if (!currentSessionId) {
      const newSession: ChatSession = {
        id: Math.random().toString(36).substr(2, 9),
        title: msg.length > 40 ? msg.substring(0, 40) + '...' : msg,
        date: new Date().toISOString(),
        messages: []
      };
      setChatSessions(prev => [newSession, ...prev]);
      currentSessionId = newSession.id;
      setActiveChatSessionId(newSession.id);
    }

    const newUserMsg = { role: 'user', parts: [{ text: msg }] };

    setChatSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, newUserMsg] } : s));
    setIsAiLoading(true);
    setIsTyping(true);

    const context = {
      userName: stats.userName,
      habits: habits,
      skills: skills,
      notes: notes,
      events: events,
      stats: stats,
      tasks: tasks,
      goals: goals,
    };
    
    const responseText = await geminiService.getChatResponse(msg, context, currentMessages);
    
    // Parse actions if any
    const actionMatch = responseText.match(/\[ACTION\](.*?)\[\/ACTION\]/is);
    let cleanResponse = responseText.replace(/\[ACTION\](.*?)\[\/ACTION\]/gis, '').trim();

    if (actionMatch) {
      try {
        const cleanJson = actionMatch[1].replace(/```json/g, '').replace(/```/g, '').trim();
        const actionData = JSON.parse(cleanJson);
        executeActionDirectly(actionData);
      } catch (e) {
        console.error("Action parse error", e);
      }
    }

    const hasActionTag = !!actionMatch;
    const hasConfirmQuestion = 
      cleanResponse.includes('Mau aku') || 
      cleanResponse.includes('mau aku') ||
      cleanResponse.includes('Boleh aku') ||
      cleanResponse.includes('Aku tambahkan') ||
      cleanResponse.includes('Aku masukkan') ||
      cleanResponse.includes('Aku jadwalkan') ||
      cleanResponse.includes('Aku catat') ||
      cleanResponse.includes('Aku simpan');
    
    const needsConfirm = hasConfirmQuestion && !hasActionTag;

    const aiMessage = { 
      role: 'model', 
      parts: [{ text: cleanResponse }],
      needsConfirmation: needsConfirm,
      id: Math.random().toString(36).substr(2, 9),
      actionHandled: false
    };

    setChatSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMessage] } : s));
    setIsAiLoading(false);
  };

  const executeActionDirectly = (action: any) => {
    const { type, data } = action;
    if (type === 'add_habit') {
      const newHabit: Habit = {
        id: Math.random().toString(36).substr(2, 9),
        name: data.nama || data.name,
        streak: 0,
        completedToday: false,
        category: data.category || 'personal',
        targetPerDay: data.target || 1,
        completedCount: 0,
        type: 'daily'
      };
      setHabits(prev => [...prev, newHabit]);
      showToast(`Habit "${newHabit.name}" ditambahkan!`);
    } else if (type === 'delete_habit') {
      setHabits(prev => prev.filter(h => h.id !== data.id));
      showToast(`Habit dihapus.`);
    } else if (type === 'add_skill') {
      const newSkill: Skill = {
        id: Math.random().toString(36).substr(2, 9),
        name: data.nama || data.name,
        points: 0,
        phases: (data.phases || []).map((phase: any) => ({
          ...phase,
          items: (phase.items || []).map((item: any) => ({ ...item, completed: false }))
        }))
      };
      setSkills(prev => [...prev, newSkill]);
      showToast(`Skill "${newSkill.name}" ditambahkan!`);
    } else if (type === 'add_note') {
      const newNote: DailyNote = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        content: data.content || data.isi,
        category: 'personal'
      };
      setNotes(prev => [newNote, ...prev]);
      showToast(`Catatan disimpan!`);
    } else if (type === 'add_event') {
      const newEvent = {
        id: Math.random().toString(36).substr(2, 9),
        activity: data.activity || data.judul,
        time: data.time || '09:00',
        category: data.category || 'personal',
        date: data.date || new Date().toISOString().split('T')[0]
      };
      setEvents(prev => [...prev, newEvent]);
      showToast(`Event ditambahkan!`);
    } else if (type === 'update_stats') {
      setStats(prev => ({
        ...prev,
        points: prev.points + (data.xp || data.points || 0),
        stats: {
          creativity: prev.stats.creativity + (data.creativity || 0),
          discipline: prev.stats.discipline + (data.discipline || 0),
          focus: prev.stats.focus + (data.focus || 0),
          vitality: prev.stats.vitality + (data.vitality || 0),
        }
      }));
    } else if (type === 'add_task') {
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        nama: data.nama || data.name || '',
        matkul: data.matkul || '',
        deadline: data.deadline || new Date(Date.now() + 7*24*60*60*1000).toISOString(),
        prioritas: data.prioritas || 'sedang',
        status: 'belum',
        createdAt: new Date().toISOString(),
      };
      setTasks(prev => [...prev, newTask]);
      showToast(`Tugas "${newTask.nama}" ditambahkan!`);
    } else if (type === 'update_task_status') {
      setTasks(prev => prev.map(t => t.id === data.id ? { ...t, status: data.status } : t));
      showToast('Status tugas diperbarui!');
    } else if (type === 'add_weekly_goal') {
      const newGoal = { id: Math.random().toString(36).substr(2, 9), text: data.text, done: false, deadline: '' };
      setGoals(prev => ({ ...prev, weekly: [...prev.weekly, newGoal] }));
      showToast('Target mingguan ditambahkan!');
    } else if (type === 'update_monthly_milestone') {
      setGoals(prev => ({
        ...prev,
        yearly: {
          ...prev.yearly,
          milestones: prev.yearly.milestones.map(m =>
            m.bulan === data.bulan ? { ...m, target: data.target || m.target } : m
          )
        }
      }));
      showToast('Milestone diperbarui!');
    } else if (type === 'add_material') {
      const newMat: Material = {
        id: Math.random().toString(36).substr(2, 9),
        judul: data.judul || 'Materi Baru',
        matkul: data.matkul || '',
        type: 'text',
        content: data.content || '',
        ringkasan: '',
        createdAt: new Date().toISOString(),
      };
      setMaterials(prev => [newMat, ...prev]);
      showToast('Materi ditambahkan!');
    }
  };

  const handleConfirmAction = (msgIndex: number) => {
    // Disable right away
    setChatSessions(prev => prev.map(s => s.id === activeChatSessionId ? {
      ...s,
      messages: s.messages.map((m, i) => i === msgIndex ? { ...m, actionHandled: true } : m)
    } : s));
    
    handleCoachMessage("Iya, mau!");
  };

  const handleCancelAction = (msgIndex: number) => {
    setChatSessions(prev => prev.map(s => s.id === activeChatSessionId ? {
      ...s,
      messages: s.messages.map((m, i) => i === msgIndex ? { ...m, actionHandled: true } : m)
    } : s));
    handleCoachMessage("Nggak dulu");
  };

  if (!onboardingDone) {
    return <Onboarding onComplete={() => setOnboardingDone(true)} />;
  }



  return (
    <div className="flex h-screen overflow-hidden bg-brand-background text-brand-text-primary">
      {/* MOBILE HEADER */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-brand-border bg-brand-background/80 backdrop-blur-md z-40 flex items-center justify-between px-4 lg:hidden">
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 hover:bg-brand-surface rounded-lg">
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-brand-accent flex items-center justify-center font-bold text-brand-background italic text-xs">D</div>
          <h1 className="text-lg font-bold tracking-tight">Doneify</h1>
        </div>
        <button onClick={() => setActiveTab('profile')} className="p-2 hover:bg-brand-surface rounded-lg">
          <User size={24} />
        </button>
      </header>

      {/* LEFT SIDEBAR (Desktop) */}
      <aside className="hidden lg:flex w-[260px] border-r border-brand-border flex-col p-6 space-y-8 bg-brand-background z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center font-bold text-brand-background italic">D</div>
          <h1 className="text-xl font-bold tracking-tight">Doneify</h1>
        </div>
        
        <nav className="flex-1 space-y-1">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Home" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={<CheckSquare size={20} />} label="Habits" active={activeTab === 'habits'} onClick={() => setActiveTab('habits')} />
          <SidebarItem icon={<CalendarIcon size={20} />} label="Kalender" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
          <SidebarItem icon={<Zap size={20} />} label="Skills" active={activeTab === 'skills'} onClick={() => setActiveTab('skills')} />
          <SidebarItem icon={<StickyNote size={20} />} label="Catatan" active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} />
          <SidebarItem icon={<MessageSquare size={20} />} label="Vox" active={activeTab === 'coach'} onClick={() => setActiveTab('coach')} />
        </nav>

        <div className="h-px bg-brand-border mx-2" />

        <div className="space-y-1">
          <SidebarItem icon={<User size={20} />} label="Profil" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          <SidebarItem icon={<Trophy size={20} />} label="Achievements" active={activeTab === 'achievements'} onClick={() => setActiveTab('achievements')} />
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-brand-background border-r border-brand-border z-50 p-6 flex flex-col space-y-8 lg:hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center font-bold text-brand-background italic">D</div>
                  <h1 className="text-xl font-bold tracking-tight">Doneify</h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-brand-surface rounded-full">
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 space-y-2">
                <SidebarItem icon={<LayoutDashboard size={20} />} label="Home" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} />
                <SidebarItem icon={<CheckSquare size={20} />} label="Habits" active={activeTab === 'habits'} onClick={() => { setActiveTab('habits'); setIsMobileMenuOpen(false); }} />
                <SidebarItem icon={<CalendarIcon size={20} />} label="Kalender" active={activeTab === 'calendar'} onClick={() => { setActiveTab('calendar'); setIsMobileMenuOpen(false); }} />
                <SidebarItem icon={<Zap size={20} />} label="Skills" active={activeTab === 'skills'} onClick={() => { setActiveTab('skills'); setIsMobileMenuOpen(false); }} />
                <SidebarItem icon={<StickyNote size={20} />} label="Catatan" active={activeTab === 'notes'} onClick={() => { setActiveTab('notes'); setIsMobileMenuOpen(false); }} />
                <SidebarItem icon={<MessageSquare size={20} />} label="Vox" active={activeTab === 'coach'} onClick={() => { setActiveTab('coach'); setIsMobileMenuOpen(false); }} />
                <div className="pt-4 mt-4 border-t border-brand-border space-y-2">
                  <SidebarItem icon={<User size={20} />} label="Profil" active={activeTab === 'profile'} onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }} />
                  <SidebarItem icon={<Trophy size={20} />} label="Achievements" active={activeTab === 'achievements'} onClick={() => { setActiveTab('achievements'); setIsMobileMenuOpen(false); }} />
                </div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative pt-16 lg:pt-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 custom-scrollbar scroll-smooth">
          {/* Deadline Reminder Banner */}
          {(() => {
            const urgentTasks = tasks.filter(t => t.status !== 'selesai' && (new Date(t.deadline).getTime() - Date.now()) < 48*60*60*1000 && !dismissedReminders.includes(t.id));
            if (urgentTasks.length === 0) return null;
            return (
              <div className="mb-6 space-y-2">
                {urgentTasks.map(t => {
                  const diff = new Date(t.deadline).getTime() - Date.now();
                  const label = diff < 0 ? 'Terlambat!' : diff < 24*60*60*1000 ? 'Kurang dari 24 jam!' : 'Kurang dari 48 jam';
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-3 p-3 bg-[#EF4444]/10 border border-[#EF4444]/40 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertTriangle size={16} className="text-[#EF4444] shrink-0" />
                        <span className="text-sm font-bold truncate">{t.nama}</span>
                        <span className="text-xs text-[#EF4444] font-bold shrink-0">— {label}</span>
                      </div>
                      <button onClick={() => setDismissedReminders(p => [...p, t.id])} className="p-1 text-[#A0A0A0] hover:text-white shrink-0"><X size={14} /></button>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto space-y-10"
          >
            {activeTab === 'dashboard' && (
              <>
                <header className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-brand-border bg-brand-surface shrink-0">
                      {(() => {
                        const avatarObj = AVATARS.find(a => a.id === avatarId);
                        return avatarObj ? <avatarObj.Component /> : <User size={16} />;
                      })()}
                    </div>
                  <h2 className="text-2xl md:text-4xl font-bold">Halo, {userName}</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] px-[14px] py-[6px] rounded-[20px] text-[13px] font-medium text-brand-text-primary shadow-sm flex items-center gap-1.5">
                      <span className="text-amber-500">🔥</span> {stats.streak.current} hari streak
                    </div>
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] px-[14px] py-[6px] rounded-[20px] text-[13px] font-medium text-brand-text-primary shadow-sm flex items-center gap-1.5">
                      <span className="text-brand-success">✓</span> {habits.filter(h => h.completedToday).length}/{habits.length} habit
                    </div>
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] px-[14px] py-[6px] rounded-[20px] text-[13px] font-medium text-brand-text-primary shadow-sm flex items-center gap-1.5">
                      <span className="text-amber-400">⭐</span> {stats.points} poin
                    </div>
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <DarkCard className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-lg">Kebiasaan Hari Ini</h3>
                      <button onClick={() => setActiveTab('habits')} className="text-[11px] text-brand-accent uppercase font-bold tracking-widest hover:underline">Lihat Semua</button>
                    </div>
                    <div className="space-y-4">
                      {habits.length > 0 ? habits.slice(0, 4).map(h => (
                        <div key={h.id} className="flex items-center justify-between group">
                          <span className="text-sm font-medium">{h.name}</span>
                          <button 
                            onClick={() => handleToggleHabit(h.id)}
                            className={cn(
                              "w-6 h-6 rounded border transition-all flex items-center justify-center",
                              h.completedToday ? "bg-brand-success border-brand-success text-brand-background" : "border-brand-border hover:border-brand-accent"
                            )}
                          >
                            {h.completedToday && <Check size={14} />}
                          </button>
                        </div>
                      )) : (
                        <p className="text-sm text-brand-text-secondary italic">Belum ada kebiasaan. Tanya Vox untuk mulai!</p>
                      )}
                    </div>
                  </DarkCard>

                  <DarkCard className="space-y-6">
                    <h3 className="font-semibold text-lg">Kegiatan Hari Ini</h3>
                    <p className="text-xs text-brand-text-secondary font-medium uppercase tracking-widest">
                      {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <div className="space-y-4">
                      {events.filter(e => e.date === new Date().toISOString().split('T')[0]).length > 0 ? 
                        events.filter(e => e.date === new Date().toISOString().split('T')[0]).map(item => (
                        <div key={item.id} className="flex gap-4 items-start">
                          <span className="text-xs font-mono text-brand-text-secondary pt-0.5">{item.time}</span>
                          <div className={cn(
                            "flex-1 p-3 rounded-xl border border-l-4",
                            item.category === 'work' ? "border-blue-500 bg-blue-500/5 text-blue-200" :
                            item.category === 'health' ? "border-green-500 bg-green-500/5 text-green-200" :
                            item.category === 'learning' ? "border-amber-500 bg-amber-500/5 text-amber-200" :
                            "border-purple-500 bg-purple-500/5 text-purple-200"
                          )}>
                            <p className="text-sm font-medium">{item.activity}</p>
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-brand-text-secondary italic">Belum ada kegiatan hari ini.</p>
                      )}
                    </div>
                  </DarkCard>
                </div>

                {/* Timeline Apa yang kamu lakukan hari ini */}
                <DarkCard className="space-y-6">
                  <h3 className="font-semibold text-lg">Apa yang kamu lakukan hari ini?</h3>
                  <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-border">
                    {[
                      ...habits.filter(h => h.completedToday).map(h => ({ type: 'habit', title: h.name, status: '✓ Selesai', time: '' })),
                      ...events.filter(e => e.date === new Date().toISOString().split('T')[0]).map(e => ({ type: 'event', title: e.activity, status: e.category, time: e.time })),
                      ...notes.filter(n => n.date.startsWith(new Date().toISOString().split('T')[0])).map(n => ({ type: 'note', title: n.content.substring(0, 40) + '...', status: '📝 Dicatat hari ini', time: '' }))
                    ].length > 0 ? [
                      ...habits.filter(h => h.completedToday).map(h => ({ type: 'habit', title: h.name, status: '✓ Selesai', time: '' })),
                      ...events.filter(e => e.date === new Date().toISOString().split('T')[0]).map(e => ({ type: 'event', title: e.activity, status: e.category, time: e.time })),
                      ...notes.filter(n => n.date.startsWith(new Date().toISOString().split('T')[0])).map(n => ({ type: 'note', title: n.content.substring(0, 40) + '...', status: '📝 Dicatat hari ini', time: '' }))
                    ].map((item, idx) => (
                      <div key={idx} className="relative pl-8 group">
                        <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-brand-surface border-4 border-amber-500 z-10" />
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                          <p className="text-sm font-bold">{item.title}</p>
                          <div className="flex items-center gap-2">
                             {item.time && <span className="text-[10px] font-mono text-brand-text-secondary">{item.time}</span>}
                             <span className="px-2 py-0.5 bg-brand-surface rounded border border-brand-border text-[10px] font-bold text-brand-text-secondary uppercase">{item.status}</span>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <p className="pl-8 text-sm text-brand-text-secondary italic">Hari ini masih kosong. Mulai dengan chat ke Vox!</p>
                    )}
                  </div>
                </DarkCard>
              </>
            )}

            {activeTab === 'habits' && (
               <div className="space-y-8 pb-20 lg:pb-0">
                 <div className="flex justify-between items-end">
                  <h2 className="text-2xl md:text-3xl font-bold">Habits</h2>
                  <button 
                    onClick={() => setShowHabitModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-brand-background rounded-xl text-sm font-bold hover:opacity-90 transition-all shrink-0 overflow-hidden"
                  >
                    <Plus size={16} />
                    <span>Habit Baru</span>
                  </button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {habits.map(h => (
                     <DarkCard key={h.id} className="flex justify-between items-center group">
                       <div className="space-y-1">
                         <h4 className="font-semibold">{h.name}</h4>
                         <div className="flex gap-2">
                           <p className="text-[10px] text-brand-text-secondary uppercase font-bold tracking-widest">{h.streak} Streak</p>
                           <p className="text-[10px] text-amber-500 uppercase font-bold tracking-widest">{h.completedCount}/{h.targetPerDay} Hari ini</p>
                         </div>
                       </div>
                       <button 
                        onClick={() => {
                          const newCount = h.completedToday ? h.completedCount - 1 : h.completedCount + 1;
                          const completed = newCount >= h.targetPerDay;
                          setHabits(prev => prev.map(item => item.id === h.id ? { ...item, completedCount: newCount, completedToday: completed } : item));
                          if (!h.completedToday && completed) addPoints(10);
                        }}
                        className={cn(
                          "w-10 h-10 rounded-xl border transition-all flex items-center justify-center",
                          h.completedToday ? "bg-brand-success border-brand-success text-brand-background shadow-lg shadow-green-500/20" : "border-brand-border hover:border-amber-500 h-bg-amber-500/5 text-brand-text-secondary"
                        )}
                      >
                        {h.completedToday ? <Check size={20} /> : <div className="text-xs font-bold">{h.completedCount}</div>}
                      </button>
                     </DarkCard>
                   ))}
                 </div>

                 <DarkCard className="space-y-4">
                   <h3 className="font-bold text-lg text-amber-500 uppercase tracking-widest">Target Minggu Ini</h3>
                   <div className="space-y-3">
                     {goals.weekly.map(w => (
                       <div key={w.id} className="flex items-center gap-3 group">
                         <button
                           onClick={() => {
                             const updated = { ...goals, weekly: goals.weekly.map(item => item.id === w.id ? { ...item, done: !item.done } : item) };
                             setGoals(updated);
                           }}
                           className={cn("w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0",
                             w.done ? "bg-brand-success border-brand-success text-brand-background" : "border-brand-border hover:border-amber-500"
                           )}
                         >
                           {w.done && <Check size={12} />}
                         </button>
                         <input
                           type="text"
                           value={w.text}
                           onChange={(e) => {
                             const updated = { ...goals, weekly: goals.weekly.map(item => item.id === w.id ? { ...item, text: e.target.value } : item) };
                             setGoals(updated);
                           }}
                           className={cn("flex-1 bg-transparent text-sm focus:outline-none border-b border-transparent focus:border-amber-500 transition-colors", w.done && "line-through opacity-50")}
                           placeholder="Tulis target..."
                         />
                         <button
                           onClick={() => {
                             const updated = { ...goals, weekly: goals.weekly.filter(item => item.id !== w.id) };
                             setGoals(updated);
                           }}
                           className="opacity-0 group-hover:opacity-100 p-1 text-brand-text-secondary hover:text-brand-danger transition-opacity"
                         >
                           <X size={14} />
                         </button>
                       </div>
                     ))}
                     {goals.weekly.length === 0 && (
                       <p className="text-sm text-brand-text-secondary italic">Belum ada target minggu ini. Klik + untuk tambah!</p>
                     )}
                     <button 
                       onClick={() => {
                         const newGoal = { id: Math.random().toString(36).substr(2, 9), text: '', done: false, deadline: '' };
                         setGoals({ ...goals, weekly: [...goals.weekly, newGoal] });
                       }}
                       className="flex items-center gap-2 text-xs font-bold text-amber-500 hover:opacity-80 mt-2"
                     >
                       <Plus size={14} /> Tambah Target
                     </button>
                   </div>
                 </DarkCard>
               </div>
            )}

            {activeTab === 'calendar' && (
              <ErrorBoundary>
                <div className="space-y-6">
                  <div className="flex gap-4 p-1 bg-brand-surface border border-brand-border rounded-2xl w-fit">
                    <button 
                      onClick={() => setCalendarTab('grid')} 
                      className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", calendarTab === 'grid' ? "bg-amber-500 text-brand-background shadow-lg" : "text-brand-text-secondary hover:text-white")}
                    >
                      Kalender
                    </button>
                    <button 
                      onClick={() => setCalendarTab('tasks')} 
                      className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", calendarTab === 'tasks' ? "bg-amber-500 text-brand-background shadow-lg" : "text-brand-text-secondary hover:text-white")}
                    >
                      Tugas
                    </button>
                  </div>
                  {calendarTab === 'grid' ? (
                    <CalendarView events={events} setEvents={setEvents} />
                  ) : (
                    <TasksPage tasks={tasks} onUpdate={setTasks} showToast={showToast} />
                  )}
                </div>
              </ErrorBoundary>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-8 pb-20 lg:pb-0">
                <div className="flex justify-between items-end">
                  <h2 className="text-2xl md:text-3xl font-bold">Skills</h2>
                  <button 
                    onClick={() => setShowSkillModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-brand-background rounded-xl text-sm font-bold hover:opacity-90 transition-all shrink-0 overflow-hidden"
                  >
                    <Plus size={16} />
                    <span>Skill Baru</span>
                  </button>
                </div>
                <div className="flex flex-col space-y-6">
                  {skills.length > 0 ? skills.map(skill => (
                    <DarkCard 
                      key={skill.id} 
                      className="transition-all w-full relative group overflow-visible"
                    >
                      <div className="absolute top-4 right-4 flex gap-2">
                         <button 
                            onClick={() => {
                              setInputState({
                                open: true,
                                title: 'Edit Skill',
                                label: 'Nama Skill',
                                defaultVal: skill.name,
                                onOk: (newName) => {
                                  if (newName) {
                                    setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, name: newName } : s));
                                  }
                                  setInputState(p => ({ ...p, open: false }));
                                }
                              });
                            }}
                            className="p-2 text-brand-text-secondary hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                         >
                            <Edit3 size={18} />
                         </button>
                         <button 
                            onClick={() => {
                              setConfirmState({
                                open: true,
                                msg: `Hapus skill "${skill.name}"? Semua progres akan hilang.`,
                                onOk: () => {
                                  setSkills(prev => prev.filter(s => s.id !== skill.id));
                                  showToast('Skill dihapus.');
                                  setConfirmState(p => ({ ...p, open: false }));
                                }
                              });
                            }}
                            className="p-2 text-brand-text-secondary hover:text-brand-danger hover:bg-brand-danger/10 rounded-lg transition-colors"
                         >
                            <Trash2 size={18} />
                         </button>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center gap-6 pr-24 pt-2">
                        <div className="flex items-center gap-4 min-w-[200px]">
                          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                            <Zap size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-xl">{skill.name}</h4>
                          </div>
                        </div>
                        
                        <div className="flex-1 w-full flex items-center gap-4">
                          {(() => {
                            let totalItems = 0;
                            let completedItems = 0;
                            skill.phases?.forEach(p => {
                              p.items.forEach(i => {
                                totalItems++;
                                if (i.completed) completedItems++;
                              });
                            });
                            const progress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
                            return (
                              <>
                                <div className="flex-1">
                                  <StatBar label="Progress" value={progress} max={100} color="bg-amber-500" showText={false} />
                                </div>
                                <span className="text-sm font-bold w-12 text-right">{progress}%</span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      
                      {skill.isGeneratingRoadmap && (
                        <div className="mt-4 flex items-center gap-2 text-xs text-amber-500 font-bold animate-pulse">
                          <Loader2 size={12} className="animate-spin" />
                          Vox sedang menyusun roadmap...
                        </div>
                      )}
                      {skill.error && (
                        <div className="mt-4 flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                          <span className="text-xs text-red-400 font-bold">⚠ Gagal generate roadmap.</span>
                          <button 
                            onClick={() => handleAddSkillAuto(skill.name, true)}
                            className="text-xs font-bold text-amber-500 hover:underline"
                          >
                            Coba Lagi
                          </button>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-brand-border">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, points: s.points + 25 } : s));
                            addPoints(25);
                          }}
                          className="px-5 py-2.5 bg-amber-500 text-brand-background rounded-xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2"
                        >
                          <Zap size={16} /> Log Sesi (+25 Poin)
                        </button>
                        {(!skill.phases || skill.phases.length === 0) && !skill.isGeneratingRoadmap && (
                          <button 
                            onClick={() => handleAddSkillAuto(skill.name, true)}
                            className="px-5 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-sm font-bold hover:bg-amber-500/20 transition-all flex items-center gap-2"
                          >
                            Generate Roadmap
                          </button>
                        )}
                        <button 
                          onClick={() => {
                             setExpandedSkillIds(prev => 
                               prev.includes(skill.id) ? prev.filter(id => id !== skill.id) : [...prev, skill.id]
                             );
                          }}
                          className="px-5 py-2.5 bg-brand-surface border border-brand-border text-brand-text-secondary rounded-xl text-sm font-bold hover:bg-brand-surface/80 hover:text-white transition-all flex items-center gap-2 ml-auto md:ml-0"
                        >
                          {expandedSkillIds.includes(skill.id) ? (
                             <><ChevronUp size={16} /> Tutup Roadmap</>
                          ) : (
                             <><ChevronDown size={16} /> Buka Roadmap</>
                          )}
                        </button>
                      </div>

                      {expandedSkillIds.includes(skill.id) && (
                        <div className="mt-6 pt-6 border-t border-brand-border animate-in fade-in slide-in-from-top-4 duration-300">
                           <div className="flex justify-between items-center mb-6">
                              <h5 className="font-bold text-lg">Roadmap Belajar</h5>
                              <button 
                                onClick={() => {
                                  setDoubleInputState({
                                    open: true,
                                    title: 'Tambah Fase Belajar',
                                    l1: 'Judul Fase',
                                    l2: 'Periode',
                                    d1: '',
                                    d2: 'Minggu 1-2',
                                    onOk: (title, period) => {
                                      if (title && period) {
                                        const newPhase = {
                                          id: Math.random().toString(36).substr(2, 9),
                                          title,
                                          period,
                                          items: []
                                        };
                                        setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, phases: [...(s.phases || []), newPhase] } : s));
                                      }
                                      setDoubleInputState(p => ({ ...p, open: false }));
                                    }
                                  });
                                }}
                                className="px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-lg text-xs font-bold hover:bg-amber-500 hover:text-black transition-all flex items-center gap-1"
                              >
                                <Plus size={14} /> Fase Baru
                              </button>
                           </div>
                           
                           <div className="space-y-6">
                             {skill.phases?.map((phase, pIdx) => (
                               <div key={phase.id} className="relative pl-8 before:absolute before:left-[15px] before:top-4 before:bottom-0 before:w-0.5 before:bg-brand-border">
                                 <div className="absolute left-0 top-3 w-8 h-8 rounded-full bg-brand-background border-4 border-amber-500 flex items-center justify-center text-xs font-bold z-10">{pIdx + 1}</div>
                                 <div className="bg-brand-surface rounded-2xl p-5 border border-brand-border">
                                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                     <div>
                                       <div className="flex items-center gap-3 mb-1">
                                         <h4 className="font-bold text-base text-brand-text-primary">{phase.title}</h4>
                                         <span className="px-2 py-0.5 bg-brand-background rounded text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">{phase.period}</span>
                                       </div>
                                     </div>
                                     <div className="flex items-center gap-2 shrink-0">
                                       <button 
                                          onClick={() => {
                                            setDoubleInputState({
                                              open: true,
                                              title: 'Edit Fase',
                                              l1: 'Judul Fase',
                                              l2: 'Periode',
                                              d1: phase.title,
                                              d2: phase.period,
                                              onOk: (newTitle, newPeriod) => {
                                                if (newTitle || newPeriod) {
                                                  setSkills(prev => prev.map(s => s.id === skill.id ? {
                                                    ...s,
                                                    phases: s.phases?.map(p => p.id === phase.id ? { ...p, title: newTitle || p.title, period: newPeriod || p.period } : p)
                                                  } : s));
                                                }
                                                setDoubleInputState(p => ({ ...p, open: false }));
                                              }
                                            });
                                          }}
                                          className="p-2 bg-brand-background border border-brand-border rounded-lg text-brand-text-secondary hover:text-amber-500 transition-colors"
                                       >
                                         <Edit3 size={14} />
                                       </button>
                                       <button 
                                         onClick={() => {
                                            setConfirmState({
                                              open: true,
                                              msg: 'Hapus fase belajar ini?',
                                              onOk: () => {
                                                setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, phases: s.phases?.filter(p => p.id !== phase.id) } : s));
                                                setConfirmState(p => ({ ...p, open: false }));
                                              }
                                            });
                                         }}
                                         className="p-2 bg-brand-background border border-brand-border rounded-lg text-brand-text-secondary hover:text-brand-danger transition-colors"
                                       >
                                         <Trash2 size={14} />
                                       </button>
                                     </div>
                                   </div>
                                   
                                   <div className="space-y-3">
                                     {phase.items.map((item) => (
                                       <div key={item.id} className="flex gap-4 group/item items-start p-3 bg-brand-background/50 rounded-xl border border-transparent hover:border-brand-border transition-colors relative">
                                         <button 
                                           onClick={() => {
                                              setSkills(prev => prev.map(s => s.id === skill.id ? {
                                                ...s,
                                                phases: s.phases?.map(p => p.id === phase.id ? {
                                                  ...p,
                                                  items: p.items.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i)
                                                } : p)
                                              } : s));
                                              if (!item.completed) addPoints(10);
                                           }}
                                           className={cn("w-6 h-6 rounded-md flex items-center justify-center border transition-all mt-0.5 shrink-0", item.completed ? "bg-brand-success border-brand-success text-brand-background" : "border-brand-border hover:border-amber-500 bg-brand-background")}
                                         >
                                           {item.completed && <Check size={14} />}
                                         </button>
                                         <div className="flex-1 min-w-0 pr-16">
                                           <p className={cn("text-sm font-semibold", item.completed && "line-through opacity-50")}>{item.title}</p>
                                           <p className="text-xs text-brand-text-secondary mt-1 line-clamp-2">{item.description}</p>
                                         </div>
                                         <div className="absolute right-3 top-3 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <button 
                                              onClick={() => {
                                                setDoubleInputState({
                                                  open: true,
                                                  title: 'Edit Topik',
                                                  l1: 'Judul Topik',
                                                  l2: 'Deskripsi',
                                                  d1: item.title,
                                                  d2: item.description,
                                                  onOk: (t, d) => {
                                                    if (t !== null) {
                                                      setSkills(prev => prev.map(s => s.id === skill.id ? {
                                                        ...s,
                                                        phases: s.phases?.map(p => p.id === phase.id ? {
                                                          ...p,
                                                          items: p.items.map(i => i.id === item.id ? { ...i, title: t || i.title, description: d !== null ? d : i.description } : i)
                                                        } : p)
                                                      } : s));
                                                    }
                                                    setDoubleInputState(p => ({ ...p, open: false }));
                                                  }
                                                });
                                              }}
                                              className="p-1.5 text-brand-text-secondary hover:text-amber-500 bg-brand-surface rounded-md border border-brand-border"
                                            >
                                              <Edit3 size={12} />
                                            </button>
                                            <button 
                                              onClick={() => {
                                                setConfirmState({
                                                  open: true,
                                                  msg: 'Hapus topik ini?',
                                                  onOk: () => {
                                                    setSkills(prev => prev.map(s => s.id === skill.id ? {
                                                      ...s,
                                                      phases: s.phases?.map(p => p.id === phase.id ? {
                                                        ...p,
                                                        items: p.items.filter(i => i.id !== item.id)
                                                      } : p)
                                                    } : s));
                                                    setConfirmState(p => ({ ...p, open: false }));
                                                  }
                                                });
                                              }}
                                              className="p-1.5 text-brand-text-secondary hover:text-brand-danger bg-brand-surface rounded-md border border-brand-border"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                         </div>
                                       </div>
                                     ))}
                                     <button 
                                       onClick={() => {
                                         setDoubleInputState({
                                           open: true,
                                           title: 'Tambah Materi Baru',
                                           l1: 'Judul Topik',
                                           l2: 'Deskripsi Singkat',
                                           d1: '',
                                           d2: '',
                                           onOk: (t, d) => {
                                             if (t) {
                                               setSkills(prev => prev.map(s => s.id === skill.id ? {
                                                 ...s,
                                                 phases: s.phases?.map(p => p.id === phase.id ? {
                                                   ...p,
                                                   items: [...p.items, { id: Math.random().toString(36).substr(2, 9), title: t, description: d, completed: false }]
                                                 } : p)
                                               } : s));
                                             }
                                             setDoubleInputState(p => ({ ...p, open: false }));
                                           }
                                         });
                                       }}
                                       className="w-full py-3 mt-2 border-2 border-dashed border-brand-border rounded-xl text-xs font-bold text-brand-text-secondary hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2"
                                     >
                                       <Plus size={14} /> Tambah Topik
                                     </button>
                                   </div>
                                 </div>
                               </div>
                             ))}
                             {(!skill.phases || skill.phases.length === 0) && (
                                <div className="py-10 border-2 border-dashed border-brand-border rounded-2xl flex flex-col items-center justify-center text-brand-text-secondary">
                                  <Zap size={24} className="opacity-50 mb-2" />
                                  <p className="text-sm italic">Belum ada roadmap. Tambahkan fase pertama!</p>
                                </div>
                             )}
                           </div>
                        </div>
                      )}
                    </DarkCard>
                  )) : (
                    <div onClick={() => setShowSkillModal(true)} className="py-24 border-2 border-dashed border-brand-border rounded-3xl flex flex-col items-center justify-center space-y-4 cursor-pointer hover:border-amber-500/50 transition-all group bg-brand-surface/30">
                       <div className="w-16 h-16 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center opacity-50 group-hover:text-amber-500 group-hover:border-amber-500/30 transition-all">
                         <Zap size={32} />
                       </div>
                       <p className="text-brand-text-secondary group-hover:text-brand-text-primary font-bold">Mulai pelajari keahlian baru!</p>
                    </div>
                  )}
                </div>
              </div>
            )}


            {activeTab === 'coach' && (
              <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-120px)] lg:h-[75vh] relative">
                {/* History Sidebar overlay */}
                <AnimatePresence>
                  {showHistory && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowHistory(false)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                      />
                      <motion.div 
                        initial={{ x: -260 }}
                        animate={{ x: 0 }}
                        exit={{ x: -260 }}
                        className="fixed top-0 left-0 bottom-0 w-[260px] bg-brand-background border-r border-brand-border z-50 p-6 flex flex-col space-y-6"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold uppercase tracking-widest text-xs">Riwayat Chat</h3>
                          <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-brand-surface rounded-full"><X size={18} /></button>
                        </div>
                        <button 
                          onClick={() => {
                            setActiveChatSessionId(null);
                            setShowHistory(false);
                          }}
                          className="w-full py-3 bg-amber-500 text-brand-background rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
                        >
                          <Plus size={18} /> New Chat
                        </button>
                        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                          {chatSessions.map(session => (
                            <button 
                              key={session.id}
                              onClick={() => {
                                setActiveChatSessionId(session.id);
                                setShowHistory(false);
                              }}
                              className={cn(
                                "w-full p-4 rounded-xl text-left border transition-all space-y-1",
                                activeChatSessionId === session.id 
                                  ? "bg-amber-500/10 border-amber-500/30" 
                                  : "bg-brand-surface border-brand-border hover:border-amber-500/20"
                              )}
                            >
                              <p className="text-sm font-bold line-clamp-1">{session.messages[0]?.parts[0].text.substring(0, 35) || 'No messages'}</p>
                              <p className="text-[10px] text-brand-text-secondary">{new Date(session.date).toLocaleDateString('id-ID')}</p>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                <div className="flex-1 flex flex-col space-y-6">
                  <header className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setShowHistory(true)}
                        className="p-3 bg-brand-surface border border-brand-border rounded-xl text-amber-500 hover:border-amber-500 transition-all"
                      >
                        <History size={20} />
                      </button>
                      <div className="w-12 h-12 rounded-full border-2 border-amber-500 p-0.5">
                        <div className="w-full h-full rounded-full bg-amber-500/20 flex items-center justify-center">
                          <MessageSquare className="text-amber-500" size={24} />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Vox</h2>
                        <p className="text-xs text-amber-500 font-bold tracking-widest uppercase">AI Strategic Coach</p>
                      </div>
                    </div>
                  </header>

                  <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-2xl bg-brand-surface border border-brand-border custom-scrollbar">
                    {currentMessages.length === 0 && (
                      <div className="h-full flex flex-center flex-col items-center justify-center text-center space-y-4">
                        <p className="text-brand-text-secondary max-w-xs text-sm">Hai! Aku Vox. Siapa namamu tadi? Eh, maksudku, apa progresmu hari ini?</p>
                      </div>
                    )}
                    {currentMessages.map((chat: any, i: number) => (
                      <div key={i} className="space-y-4">
                        <div className={cn(
                          "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                          chat.role === 'user' ? "ml-auto bg-amber-500 text-brand-background font-medium shadow-lg shadow-amber-500/20" : "mr-auto bg-brand-card border border-brand-border"
                        )}>
                          <div className="markdown-body max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {chat.role === 'model' && i === currentMessages.length - 1 && isTyping ? (
                              <Typewriter text={cleanMessage(chat.parts[0].text)} onComplete={() => setIsTyping(false)} />
                            ) : (
                              <Markdown>{chat.role === 'model' ? cleanMessage(chat.parts[0].text) : chat.parts[0].text}</Markdown>
                            )}
                          </div>
                        </div>
                        {chat.needsConfirmation && !chat.actionHandled && (
                          <div className="flex gap-2 mr-auto ml-0 transition-all">
                            <button 
                              onClick={() => handleConfirmAction(i)}
                              className="px-4 py-1.5 bg-amber-500 text-brand-background rounded-full text-[13px] font-bold hover:opacity-90 transition-all flex items-center gap-1.5"
                            >
                              <Check size={14} />
                              Iya, mau!
                            </button>
                            <button 
                              onClick={() => handleCancelAction(i)}
                              className="px-4 py-1.5 bg-brand-surface border border-brand-border text-brand-text-secondary rounded-full text-[13px] font-bold hover:bg-brand-background transition-all"
                            >
                              Nggak dulu
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {isAiLoading && (
                      <div className="mr-auto bg-brand-card border border-brand-border p-4 rounded-2xl">
                        <div className="flex gap-1">
                          <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                    <div className="flex gap-3 pb-20 lg:pb-0">
                      <input 
                        type="text" 
                        placeholder="Tanya Vox..." 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCoachMessage(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                        className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      />
                      <button onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value) {
                           handleCoachMessage(input.value);
                           input.value = '';
                        }
                      }} className="bg-amber-500 text-brand-background p-3 rounded-xl hover:opacity-90 transition-opacity">
                        <Send size={20} />
                      </button>
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-6">
                <div className="flex gap-4 p-1 bg-brand-surface border border-brand-border rounded-2xl w-fit">
                  <button 
                    onClick={() => setNotesTab('notes')} 
                    className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", notesTab === 'notes' ? "bg-amber-500 text-brand-background shadow-lg" : "text-brand-text-secondary hover:text-white")}
                  >
                    Notes
                  </button>
                  <button 
                    onClick={() => setNotesTab('materials')} 
                    className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", notesTab === 'materials' ? "bg-amber-500 text-brand-background shadow-lg" : "text-brand-text-secondary hover:text-white")}
                  >
                    Materi
                  </button>
                </div>
                {notesTab === 'notes' ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <header className="flex justify-between items-center bg-brand-surface p-8 rounded-3xl border border-brand-border">
                      <div className="space-y-2">
                        <h2 className="text-3xl font-bold">Catatan Strategis</h2>
                        <p className="text-xs text-brand-text-secondary uppercase tracking-[0.2em] font-bold">Dokumentasikan progres & ide</p>
                      </div>
                      <button 
                        onClick={() => {
                            const newNote: DailyNote = {
                                id: Math.random().toString(36).substring(2, 11),
                                title: '',
                                content: '',
                                date: new Date().toISOString(),
                                category: 'personal'
                            };
                            setNotes([newNote, ...notes]);
                            setNoteToView(newNote);
                            setIsEditingNote(true);
                            addPoints(10);
                        }}
                        className="p-4 bg-amber-500 text-brand-background rounded-2xl hover:opacity-90 transition-all flex items-center gap-2 font-bold shadow-lg shadow-amber-500/20"
                      >
                        <Plus size={20} />
                        <span className="hidden md:inline">Baru</span>
                      </button>
                    </header>

                    {noteToView ? (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <DarkCard className="w-full max-w-2xl h-[70vh] flex flex-col p-6 space-y-4">
                           <div className="flex justify-between items-center">
                              <div className="space-y-1 flex-1 min-w-0">
                                 <p className="text-[10px] uppercase font-bold text-brand-text-secondary tracking-widest">{new Date(noteToView.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                 {isEditingNote ? (
                                   <input 
                                     type="text"
                                     value={noteToView.title || ''}
                                     onChange={(e) => {
                                       const newTitle = e.target.value;
                                       setNoteToView({ ...noteToView, title: newTitle });
                                       setNotes(prev => prev.map(n => n.id === noteToView.id ? { ...n, title: newTitle } : n));
                                     }}
                                     placeholder="Judul catatan..."
                                     className="font-bold text-xl bg-transparent border-b border-brand-border focus:border-amber-500 outline-none w-full pb-1 transition-colors"
                                   />
                                 ) : (
                                   <h4 className="font-bold text-xl truncate">{noteToView.title || noteToView.content?.split(' ').slice(0,5).join(' ') || 'Catatan Baru'}</h4>
                                 )}
                              </div>
                              <div className="flex gap-2 shrink-0 ml-3">
                                 <button onClick={() => {
                                   if (isEditingNote) {
                                     if (!noteToView.title?.trim() && !noteToView.content?.trim()) {
                                       showToast('Catatan tidak boleh kosong!');
                                       return;
                                     }
                                     let finalTitle = noteToView.title;
                                     if (!finalTitle?.trim() && noteToView.content?.trim()) {
                                       finalTitle = noteToView.content.split(' ').slice(0, 5).join(' ');
                                     }
                                     const updatedNote = { ...noteToView, title: finalTitle };
                                     setNoteToView(updatedNote);
                                     setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
                                     setIsEditingNote(false);
                                     showToast('Catatan disimpan!');
                                   } else {
                                     setIsEditingNote(true);
                                   }
                                 }} className="p-2 hover:bg-brand-surface rounded-xl border border-brand-border transition-all">
                                    {isEditingNote ? <Check size={18} className="text-brand-success" /> : <Edit3 size={18} />}
                                 </button>
                                 <button onClick={() => {
                                    setConfirmState({
                                      open: true,
                                      msg: 'Hapus catatan ini?',
                                      onOk: () => {
                                        setNotes(prev => prev.filter(n => n.id !== noteToView.id));
                                        setNoteToView(null);
                                        setIsEditingNote(false);
                                        setConfirmState(p => ({...p, open: false}));
                                        showToast('Catatan dihapus.');
                                      }
                                    });
                                 }} className="p-2 hover:bg-brand-danger/10 rounded-xl border border-brand-border hover:border-brand-danger transition-all text-brand-danger">
                                    <Trash2 size={18} />
                                 </button>
                                 <button onClick={() => { 
                                   // Auto cleanup if empty when closed
                                   if (!noteToView.title?.trim() && !noteToView.content?.trim()) {
                                     setNotes(prev => prev.filter(n => n.id !== noteToView.id));
                                   }
                                   setNoteToView(null); 
                                   setIsEditingNote(false); 
                                 }} className="p-2 hover:bg-brand-surface rounded-xl border border-brand-border transition-all">
                                    <X size={18} />
                                 </button>
                              </div>
                           </div>
                           <div className="flex-1 overflow-y-auto">
                              {isEditingNote ? (
                                 <textarea 
                                    autoFocus
                                    className="w-full h-full bg-transparent resize-none border-none outline-none text-lg leading-relaxed text-brand-text-primary"
                                    placeholder="Tulis sesuatu..."
                                    value={noteToView.content}
                                    onChange={(e) => {
                                       const newContent = e.target.value;
                                       setNoteToView({ ...noteToView, content: newContent });
                                       setNotes(prev => prev.map(n => n.id === noteToView.id ? { ...n, content: newContent } : n));
                                    }}
                                 />
                              ) : (
                                 <div className="markdown-body text-inherit">
                                    <Markdown>{noteToView.content || '*Kosong*'}</Markdown>
                                 </div>
                              )}
                           </div>
                        </DarkCard>
                      </motion.div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 lg:pb-0">
                        {notes.map(note => {
                          const displayTitle = note.title || note.content?.split(' ').slice(0,5).join(' ') || 'Catatan kosong';
                          return (
                            <DarkCard 
                              key={note.id} 
                              onClick={() => setNoteToView(note)}
                              className="cursor-pointer hover:border-amber-500/40 transition-all h-48 flex flex-col justify-between group"
                            >
                              <div className="space-y-2">
                                 <p className="text-[10px] uppercase font-bold text-brand-text-secondary tracking-widest">{new Date(note.date).toLocaleDateString()}</p>
                                 <h4 className="font-semibold text-sm truncate">{displayTitle}</h4>
                                 <p className="text-xs text-brand-text-secondary line-clamp-3 leading-relaxed">{note.content || 'Catatan kosong...'}</p>
                              </div>
                              <div className="flex justify-between items-center pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">Detail</span>
                                 <ChevronRight size={14} className="text-brand-accent" />
                              </div>
                            </DarkCard>
                          );
                        })}
                        {notes.length === 0 && (
                          <div className="col-span-full py-20 bg-brand-surface border border-brand-border rounded-3xl border-dashed flex flex-col items-center justify-center space-y-4">
                             <StickyNote size={40} className="text-brand-text-secondary" />
                             <p className="text-brand-text-secondary">Mulai catat insight harianmu di sini.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <ErrorBoundary>
                    <MaterialsPage materials={materials || []} onUpdate={setMaterials} showToast={showToast} storageWarning={storageService.isStorageNearFull()} />
                  </ErrorBoundary>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <header className="space-y-2">
                  <h2 className="text-3xl font-bold">Profil & Pengaturan</h2>
                  <p className="text-xs text-brand-text-secondary uppercase tracking-[0.2em] font-bold">Kelola identitas produktivitasmu</p>
                </header>

                <DarkCard className="p-8 space-y-8">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-brand-accent bg-brand-surface shrink-0 shadow-2xl shadow-amber-500/10">
                      {(() => {
                        const avatarObj = AVATARS.find(a => a.id === avatarId);
                        return avatarObj ? <avatarObj.Component /> : <User size={64} className="text-brand-text-secondary" />;
                      })()}
                    </div>
                    
                    <div className="w-full max-sm:px-4 space-y-6">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-brand-text-secondary tracking-widest">Display Name</label>
                        <input 
                          type="text" 
                          value={userName}
                          onChange={(e) => {
                            setUserName(e.target.value);
                            storageService.saveUserName(e.target.value);
                          }}
                          className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-3 outline-none focus:border-amber-500 text-sm font-bold transition-all"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] uppercase font-bold text-brand-text-secondary tracking-widest">Pilih Avatar</label>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                          {AVATARS.map((av) => (
                            <button 
                              key={av.id}
                              onClick={() => {
                                setAvatarId(av.id);
                              }}
                              className={cn(
                                "aspect-square rounded-2xl border-2 transition-all p-1 hover:scale-105",
                                avatarId === av.id ? "border-amber-500 bg-amber-500/10" : "border-brand-border bg-brand-surface hover:border-amber-500/50"
                              )}
                            >
                              <av.Component />
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          storageService.saveUserName(userName);
                          storageService.saveAvatarId(avatarId);
                          showToast('Profil berhasil disimpan!');
                        }}
                        className="w-full py-3 bg-amber-500 text-brand-background rounded-xl font-bold hover:opacity-90 transition-all text-sm mt-4"
                      >
                        Simpan Profil
                      </button>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-brand-border">
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-xs text-brand-text-secondary text-center italic">Ingin memulai perjalanan baru dari nol?</p>
                      <button 
                        onClick={handleResetProfile}
                        className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm font-bold hover:bg-red-500/20 transition-all flex items-center gap-2"
                      >
                        <X size={18} /> Reset Semua Data
                      </button>
                    </div>
                  </div>
                </DarkCard>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <header className="bg-brand-surface p-8 rounded-3xl border border-brand-border flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                      <Flame size={40} className="mb-1" />
                      <span className="text-2xl font-black">{stats.streak.current}</span>
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-3xl font-bold">Lanjutkan Perjalananmu</h2>
                      <p className="text-sm text-brand-text-secondary font-bold uppercase tracking-widest">{stats.streak.current} hari berturut-turut aktif</p>
                    </div>
                  </div>
                  
                  {/* Heatmap preview */}
                  <div className="grid grid-cols-10 gap-1.5 p-4 bg-brand-background rounded-2xl border border-brand-border">
                    {Array.from({ length: 30 }).map((_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - (29 - i));
                      const dateStr = date.toISOString().split('T')[0];
                      const active = (stats.streak?.history || []).includes(dateStr);
                      return (
                        <div 
                          key={i} 
                          title={dateStr}
                          className={cn(
                            "w-3 h-3 rounded-sm transition-all",
                            active ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-brand-surface border border-brand-border"
                          )} 
                        />
                      );
                    })}
                  </div>
                </header>

                <div className="space-y-6">
                  <h3 className="font-bold text-xl px-2">Milestone Badges</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-20 lg:pb-0">
                    {[
                      { id: '1', name: 'Starting Out', description: 'Streak 3 Hari', icon: <Zap size={24} />, threshold: 3 },
                      { id: '2', name: 'Building Momentum', description: 'Streak 7 Hari', icon: <Flame size={24} />, threshold: 7 },
                      { id: '3', name: 'The Dedicated', description: 'Streak 30 Hari', icon: <Trophy size={24} />, threshold: 30 },
                      { id: '4', name: 'Master Architect', description: 'Streak 100 Hari', icon: <Crown size={24} />, threshold: 100 }
                    ].map(badge => {
                      const unlocked = stats.streak.current >= badge.threshold;
                      return (
                        <DarkCard 
                          key={badge.id}
                          className={cn(
                            "flex flex-col items-center text-center p-8 space-y-4 transition-all duration-500",
                            unlocked ? "border-amber-500/50 bg-amber-500/5 shadow-[0_0_30px_rgba(245,158,11,0.1)]" : "opacity-40 grayscale"
                          )}
                        >
                          <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center mb-2 transition-all duration-700",
                            unlocked ? "bg-amber-500 text-brand-background shadow-lg shadow-amber-500/30 scale-110" : "bg-brand-surface text-brand-text-secondary"
                          )}>
                            {badge.icon}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm tracking-tight">{badge.name}</h4>
                            <p className="text-[10px] text-brand-text-secondary uppercase font-bold tracking-widest mt-1">{badge.description}</p>
                          </div>
                          {unlocked && (
                            <p className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">Unlocked</p>
                          )}
                        </DarkCard>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </div>

        {/* RIGHT PANEL - CHARACTER STATS (Desktop) */}
        <aside className="hidden lg:flex w-[320px] border-l border-brand-border p-8 space-y-8 flex-col overflow-y-auto bg-brand-background/20 z-10">
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-brand-text-secondary uppercase tracking-[0.2em]">Profil</h3>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-brand-border transition-all flex items-center justify-center bg-brand-surface">
                  {(() => {
                    const avatarObj = AVATARS.find(a => a.id === avatarId);
                    return avatarObj ? <avatarObj.Component /> : <div className="text-4xl font-black text-amber-500 uppercase">{stats.userName.charAt(0)}</div>;
                  })()}
                </div>
              </div>
              <div className="text-center">
                <h4 className="text-xl font-bold">{stats.userName}</h4>
                <p className="text-xs text-amber-500 font-bold uppercase tracking-widest">Hari Aktif: {stats.streak.current} Hari</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 flex-1">
             <h3 className="text-xs font-bold text-brand-text-secondary uppercase tracking-[0.2em]">Minggu Ini</h3>
             <div className="grid grid-cols-2 gap-4">
               {/* STREAK (Achievement style) */}
               <div className="col-span-2 flex flex-col items-center justify-center py-8 bg-brand-background border border-amber-500/30 rounded-[40px] shadow-[0_0_15px_rgba(245,158,11,0.1)] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-amber-500/5 transition-colors group-hover:bg-amber-500/10"></div>
                  <Flame size={48} className="text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] mb-2 z-10" strokeWidth={1.5} />
                  <span className="text-4xl font-black text-amber-500 z-10">{stats.streak.current}</span>
               </div>
               
               {/* Stats */}
               <div className="col-span-2 space-y-3">
                 <div className="flex justify-between items-center p-4 bg-brand-surface rounded-xl border border-brand-border">
                    <span className="text-xs font-bold text-brand-text-secondary">Habit selesai</span>
                    <span className="text-lg font-black text-amber-500">{habits.filter(h => h.completedToday).length}</span>
                 </div>
                 <div className="flex justify-between items-center p-4 bg-brand-surface rounded-xl border border-brand-border">
                    <span className="text-xs font-bold text-brand-text-secondary">Tugas baru</span>
                    <span className="text-lg font-black text-white">{tasks.length}</span>
                 </div>
                 <div className="flex justify-between items-center p-4 bg-brand-surface rounded-xl border border-brand-border">
                    <span className="text-xs font-bold text-brand-text-secondary">Catatan</span>
                    <span className="text-lg font-black text-white">{notes.length}</span>
                 </div>
               </div>
             </div>
          </div>

          <div className="pt-6 border-t border-brand-border space-y-2">
            <p className="text-[10px] uppercase font-bold text-brand-text-secondary text-center tracking-widest">Total Poin</p>
            <p className="text-3xl font-black text-center text-brand-text-primary">{stats.points}</p>
          </div>
        </aside>
      </main>

      {/* FLOATING VOX BUBBLE */}
      {activeTab !== 'coach' && (
        <div className="fixed bottom-6 right-6 lg:bottom-12 lg:right-12 z-50 flex flex-col items-end gap-4 pointer-events-none">
        <AnimatePresence>
          {isFloatingVoxOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="w-[320px] md:w-[380px] h-[500px] bg-brand-background border border-brand-border rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto mb-4"
            >
              <div className="p-4 border-b border-brand-border flex items-center justify-between bg-amber-500 text-brand-background font-bold">
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} />
                  <span>Vox AI</span>
                </div>
                <button onClick={() => setIsFloatingVoxOpen(false)} className="p-1 hover:bg-black/10 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-brand-background">
                {currentMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <MessageSquare size={32} />
                    </div>
                    <p className="text-sm text-brand-text-secondary">Hey! Ada yang bisa Vox bantu hari ini? Kamu bisa curhat, minta evaluasi, atau tanya roadmap skill.</p>
                  </div>
                ) : (
                  currentMessages.map((chat: any, i: number) => (
                    <div key={i} className="space-y-4">
                      <div className={cn(
                        "max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed",
                        chat.role === 'user' ? "ml-auto bg-amber-500 text-brand-background font-medium" : "mr-auto bg-brand-surface border border-brand-border"
                      )}>
                        <div className="markdown-body max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                          {chat.role === 'model' && i === currentMessages.length - 1 && isTyping ? (
                            <Typewriter text={cleanMessage(chat.parts[0].text)} onComplete={() => setIsTyping(false)} />
                          ) : (
                            <Markdown>{chat.role === 'model' ? cleanMessage(chat.parts[0].text) : chat.parts[0].text}</Markdown>
                          )}
                        </div>
                      </div>
                      {chat.needsConfirmation && !chat.actionHandled && (
                        <div className="flex gap-2 mr-auto ml-0">
                          <button 
                            onClick={() => handleConfirmAction(i)}
                            className="px-3 py-1 bg-amber-500 text-brand-background rounded-full text-[11px] font-bold hover:opacity-90 transition-all flex items-center gap-1"
                          >
                            <Check size={12} />
                            Iya, mau!
                          </button>
                          <button 
                            onClick={() => handleCancelAction(i)}
                            className="px-3 py-1 bg-brand-surface border border-brand-border text-brand-text-secondary rounded-full text-[11px] font-bold hover:bg-brand-background transition-all"
                          >
                            Nggak dulu
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
                {isAiLoading && (
                  <div className="mr-auto bg-brand-surface border border-brand-border p-3 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                      <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse delay-75" />
                      <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse delay-150" />
                    </div>
                  </div>
                )}
                <div ref={floatingChatEndRef} />
              </div>

              <div className="p-4 border-t border-brand-border bg-brand-surface flex gap-2">
                <input 
                  id="vox-input-field"
                  type="text" 
                  placeholder="Ketik pesan..." 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCoachMessage(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="flex-1 bg-brand-background border border-brand-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById('vox-input-field') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      handleCoachMessage(input.value);
                      input.value = '';
                    }
                  }}
                  className="p-2 bg-amber-500 text-brand-background rounded-xl hover:opacity-90 transition-opacity"
                >
                  <Send size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button 
          onClick={() => setIsFloatingVoxOpen(!isFloatingVoxOpen)}
          animate={{ boxShadow: ["0 0 0px 0px rgba(245,158,11,0)", "0 0 20px 4px rgba(245,158,11,0.3)", "0 0 0px 0px rgba(245,158,11,0)"] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className={cn(
            "w-[52px] h-[52px] rounded-full bg-amber-500 text-brand-background flex items-center justify-center shadow-lg pointer-events-auto transition-transform active:scale-90 z-50",
            activeTab === 'dashboard' ? 'mb-20 lg:mb-0' : 'mb-20 lg:mb-0' // Account for bottom nav space in mobile
          )}
        >
          {isFloatingVoxOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </motion.button>
      </div>
    )}

      {/* Mobile Nav — 5 items: Home, Habits, Tugas, Vox, Materi */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#111111] border-t border-[#2A2A2A] z-40 flex lg:hidden items-center justify-around px-2">
        <MobileNavItem icon={<LayoutDashboard size={20} />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <MobileNavItem icon={<CheckSquare size={20} />} active={activeTab === 'habits'} onClick={() => setActiveTab('habits')} />
        <MobileNavItem icon={<CalendarIcon size={20} />} active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
        <MobileNavItem icon={<StickyNote size={20} />} active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} />
        <MobileNavItem icon={<MessageSquare size={20} />} active={activeTab === 'coach'} onClick={() => setActiveTab('coach')} />
      </nav>

      {/* Habit Modal */}
      <AnimatePresence>
        {showHabitModal && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowHabitModal(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-8 space-y-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold">Buat Habit Baru</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-brand-text-secondary">Nama Habit</label>
                  <input 
                    type="text" 
                    placeholder="Misal: Membaca Buku..." 
                    className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-3 outline-none focus:border-amber-500 text-sm"
                    value={selectedHabitName}
                    onChange={(e) => setSelectedHabitName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-brand-text-secondary tracking-widest">Target Per Hari</label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(n => (
                      <button 
                        key={n}
                        onClick={() => setSelectedHabitTarget(n)}
                        className={cn(
                          "flex-1 py-3 rounded-xl border font-bold transition-all text-sm",
                          selectedHabitTarget === n ? "bg-amber-500 border-amber-500 text-brand-background" : "bg-brand-background border-brand-border text-brand-text-secondary"
                        )}
                      >
                        {n}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowHabitModal(false)}
                  className="flex-1 py-3 rounded-xl border border-brand-border font-bold hover:bg-brand-surface transition-all text-sm"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    if (!selectedHabitName) return;
                    const newHabit: Habit = {
                      id: Math.random().toString(36).substr(2, 9),
                      name: selectedHabitName,
                      targetPerDay: selectedHabitTarget,
                      completedToday: false,
                      completedCount: 0,
                      streak: 0,
                      type: 'daily',
                      category: 'personal'
                    };
                    setHabits(prev => [...prev, newHabit]);
                    setShowHabitModal(false);
                    setSelectedHabitName('');
                  }}
                  className="flex-1 py-3 bg-amber-500 text-brand-background rounded-xl font-bold hover:opacity-90 transition-all text-sm"
                >
                  Simpan
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showSkillModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-brand-surface border border-brand-border rounded-3xl p-8 space-y-6"
            >
              <h3 className="text-xl font-bold">Pelajari Skill Baru</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-brand-text-secondary tracking-widest">Nama Skill</label>
                  <input 
                    type="text" 
                    placeholder="misal: Main Gitar..." 
                    className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-3 outline-none focus:border-amber-500"
                    value={selectedSkillName}
                    onChange={(e) => setSelectedSkillName(e.target.value)}
                  />
                </div>
                
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative w-10 h-6">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={autoRoadmap}
                      onChange={() => setAutoRoadmap(!autoRoadmap)}
                    />
                    <div className="w-full h-full bg-brand-background border border-brand-border rounded-full peer-checked:bg-amber-500 transition-all" />
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:left-5" />
                  </div>
                  <span className="text-sm font-bold text-brand-text-secondary group-hover:text-white transition-colors">Buatkan roadmap otomatis ✨</span>
                </label>
              </div>
              
              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => setShowSkillModal(false)}
                  className="flex-1 py-3 rounded-xl border border-brand-border font-bold hover:bg-brand-surface transition-all text-sm"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    if (selectedSkillName.trim()) {
                      handleAddSkillAuto(selectedSkillName, autoRoadmap);
                      setSelectedSkillName('');
                    }
                  }}
                  disabled={!selectedSkillName.trim()}
                  className="flex-1 py-3 bg-amber-500 text-brand-background rounded-xl font-bold hover:opacity-90 transition-all text-sm disabled:opacity-40"
                >
                  Mulai Belajar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showNoteEditor && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-brand-surface border border-brand-border rounded-3xl p-8 space-y-6"
            >
              <h3 className="text-xl font-bold">Catatan Baru</h3>
              <textarea 
                placeholder="Tulis insight atau catatanmu di sini..." 
                className="w-full h-64 bg-brand-background border border-brand-border rounded-xl px-4 py-3 outline-none focus:border-amber-500 resize-none text-sm"
                onChange={(e) => setNoteContent(e.target.value)}
              />
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowNoteEditor(false)}
                  className="flex-1 py-3 rounded-xl border border-brand-border font-bold hover:bg-brand-surface transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    if (noteContent) {
                      const newNote: DailyNote = {
                        id: Math.random().toString(36).substr(2, 9),
                        content: noteContent,
                        date: new Date().toISOString()
                      };
                      setNotes(prev => [newNote, ...prev]);
                      setShowNoteEditor(false);
                      setNoteContent('');
                    }
                  }}
                  className="flex-1 py-3 bg-amber-500 text-brand-background rounded-xl font-bold hover:opacity-90 transition-all"
                >
                  Simpan Catatan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-[200] px-6 py-3 bg-amber-500 text-brand-background rounded-full font-bold shadow-2xl flex items-center gap-2"
          >
            <Check size={18} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={confirmState.open} 
        message={confirmState.msg} 
        onConfirm={confirmState.onOk} 
        onCancel={() => setConfirmState(p => ({...p, open: false}))} 
      />
      
      <InputModal 
        isOpen={inputState.open}
        title={inputState.title}
        label={inputState.label}
        defaultValue={inputState.defaultVal}
        onConfirm={inputState.onOk}
        onCancel={() => setInputState(p => ({...p, open: false}))}
      />

      <DoubleInputModal
        isOpen={doubleInputState.open}
        title={doubleInputState.title}
        label1={doubleInputState.l1}
        label2={doubleInputState.l2}
        defaultValue1={doubleInputState.d1}
        defaultValue2={doubleInputState.d2}
        onConfirm={doubleInputState.onOk}
        onCancel={() => setDoubleInputState(p => ({...p, open: false}))}
      />
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group",
        active ? "bg-amber-500/10 text-amber-500 shadow-[inset_0_0_10px_rgba(245,158,11,0.05)]" : "text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-surface"
      )}
    >
      <div className={cn("transition-transform group-hover:scale-110", active && "text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]")}>
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
      {active && <motion.div layoutId="nav-glow" className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,1)]" />}
    </button>
  );
}

function CalendarView({ events, setEvents }: { events: any[], setEvents: React.Dispatch<React.SetStateAction<any[]>> }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ activity: '', time: '09:00', category: 'personal' });
  
  const HOLIDAYS_2026: Record<string, string> = {
    '2026-01-01': 'Tahun Baru Masehi',
    '2026-01-27': 'Isra Miraj',
    '2026-02-17': 'Tahun Baru Imlek',
    '2026-03-19': 'Hari Raya Nyepi',
    '2026-04-02': 'Wafat Isa Al Masih',
    '2026-04-03': 'Hari Paskah',
    '2026-03-31': 'Cuti Bersama Lebaran',
    '2026-04-01': 'Cuti Bersama Lebaran',
    '2026-04-20': 'Hari Raya Idul Fitri 1447H',
    '2026-04-21': 'Hari Raya Idul Fitri (hari kedua)',
    '2026-05-01': 'Hari Buruh',
    '2026-05-12': 'Kenaikan Isa Al Masih',
    '2026-05-22': 'Hari Raya Waisak',
    '2026-06-01': 'Hari Lahir Pancasila',
    '2026-05-28': 'Idul Adha 1447H',
    '2026-06-18': 'Tahun Baru Islam',
    '2026-08-17': 'HUT RI',
    '2026-12-25': 'Hari Natal',
    '2026-12-26': 'Cuti Bersama Natal',
  };

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  const monthName = currentDate.toLocaleString('id-ID', { month: 'long' });
  const year = currentDate.getFullYear();
  const days = Array.from({ length: daysInMonth(currentDate) }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth(currentDate) }, (_, i) => i);

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() && 
           currentDate.getMonth() === selectedDate.getMonth() && 
           currentDate.getFullYear() === selectedDate.getFullYear();
  };

  const isPast = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date < today;
  };

  const getHoliday = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return HOLIDAYS_2026[dateStr];
  };

  const isSunday = (day: number) => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay() === 0;
  };

  const getDayEvents = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr);
  };

  const selectedDateEvents = getDayEvents(selectedDate);
  const selectedHoliday = getHoliday(selectedDate.getDate());

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-20 lg:pb-0 h-full">
      {/* GRID KALENDER (60%) */}
      <div className="flex-[3] space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-baseline gap-3">
             <h2 className="text-4xl font-black text-amber-500 uppercase tracking-tighter">{monthName}</h2>
             <span className="text-xl font-bold text-brand-text-secondary">{year}</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="p-3 rounded-2xl bg-brand-surface border border-brand-border hover:border-amber-500 transition-all text-brand-text-secondary"
            >
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="p-3 rounded-2xl bg-brand-surface border border-brand-border hover:border-amber-500 transition-all text-brand-text-secondary"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <DarkCard className="p-4 md:p-8">
          <div className="grid grid-cols-7 gap-1 md:gap-4 mb-6">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, index) => (
              <div key={d} className={cn(
                "text-center text-[10px] md:text-xs font-black uppercase tracking-[0.2em]",
                index === 0 ? "text-red-500" : "text-brand-text-secondary"
              )}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 md:gap-4">
            {emptyDays.map(i => <div key={`empty-${i}`} />)}
            {days.map(day => {
              const holiday = getHoliday(day);
              const sunday = isSunday(day);
              const dayEvents = getDayEvents(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
              const past = isPast(day);
              const today = isToday(day);
              const selected = isSelected(day);

              return (
                <div 
                  key={day} 
                  onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                  title={holiday}
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center rounded-xl md:rounded-2xl border transition-all cursor-pointer relative group",
                    today ? "bg-amber-500 border-amber-500 text-brand-background shadow-[0_0_20px_rgba(245,158,11,0.4)]" : "bg-brand-background border-brand-border hover:bg-brand-surface",
                    selected && !today && "border-amber-500 ring-1 ring-amber-500/50",
                    past && !today && "opacity-40"
                  )}
                >
                  <span className={cn(
                    "text-xs md:text-xl font-black",
                    (sunday || holiday) && !today ? "text-red-500" : "",
                    today && "text-brand-background"
                  )}>
                    {day}
                  </span>
                  
                  {/* Event Dots */}
                  <div className="absolute bottom-2 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((e, idx) => (
                      <div key={idx} className={cn(
                        "w-1 h-1 rounded-full",
                        e.category === 'work' ? "bg-blue-500" :
                        e.category === 'health' ? "bg-green-500" :
                        e.category === 'learning' ? "bg-amber-500" : "bg-purple-500",
                        today && "bg-brand-background/60"
                      )} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </DarkCard>
      </div>

      {/* PANEL DETAIL (40%) */}
      <div className="flex-[2] flex flex-col space-y-6">
        <DarkCard className="flex-1 flex flex-col space-y-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold">
              {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            {selectedHoliday && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-black uppercase text-red-500 tracking-widest">
                <Info size={12} />
                {selectedHoliday}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
            {selectedDateEvents.length > 0 ? selectedDateEvents.map(item => (
              <div key={item.id} className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border-l-[6px] bg-brand-surface transition-all hover:translate-x-1",
                item.category === 'work' ? "border-l-blue-500" :
                item.category === 'health' ? "border-l-green-500" :
                item.category === 'learning' ? "border-l-amber-500" : "border-l-purple-500"
              )}>
                 <div className="text-sm font-mono font-bold text-brand-text-secondary w-14 shrink-0">{item.time}</div>
                 <div className="flex-1">
                   <h4 className="text-sm font-bold text-brand-text-primary">{item.activity}</h4>
                   <p className="text-[10px] uppercase text-brand-text-secondary font-bold tracking-widest">{item.category}</p>
                 </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 text-brand-text-secondary">
                <div className="w-16 h-16 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center opacity-40">
                  <CalendarIcon size={32} />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-brand-text-primary/80 text-sm">Agenda Kosong</p>
                  <p className="text-xs italic opacity-60">Belum ada agenda khusus untuk hari ini.</p>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setShowEventModal(true)}
            className="w-full py-4 bg-amber-500 text-brand-background rounded-2xl font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Tambah Event
          </button>
        </DarkCard>
      </div>

      {/* Modal Tambah Event Internal */}
      <AnimatePresence>
        {showEventModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-8 space-y-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold">Tambah Agenda</h3>
              <div className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-[10px] uppercase font-bold text-brand-text-secondary">Kegiatan</label>
                   <input 
                    type="text" 
                    placeholder="Apa yang akan dilakukan?"
                    value={newEvent.activity}
                    onChange={e => setNewEvent({...newEvent, activity: e.target.value})}
                    className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none"
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-brand-text-secondary">Jam</label>
                      <input 
                        type="time" 
                        value={newEvent.time}
                        onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                        className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-brand-text-secondary">Kategori</label>
                      <select 
                        value={newEvent.category}
                        onChange={e => setNewEvent({...newEvent, category: e.target.value})}
                        className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none"
                      >
                        <option value="personal">Personal</option>
                        <option value="work">Work</option>
                        <option value="health">Health</option>
                        <option value="learning">Learning</option>
                      </select>
                    </div>
                 </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowEventModal(false)} className="flex-1 py-3 text-brand-text-secondary font-bold hover:bg-brand-surface rounded-xl transition-all">Batal</button>
                <button 
                  onClick={() => {
                    const event = {
                      id: Math.random().toString(36).substr(2, 9),
                      ...newEvent,
                      date: selectedDate.toISOString().split('T')[0]
                    };
                    setEvents([...events, event]);
                    setShowEventModal(false);
                    setNewEvent({ activity: '', time: '09:00', category: 'personal' });
                  }}
                  className="flex-1 py-3 bg-amber-500 text-brand-background font-bold rounded-xl hover:opacity-90 transition-all"
                >
                  Simpan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileNavItem({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-all",
        active ? "text-amber-500 bg-amber-500/10" : "text-brand-text-secondary"
      )}
    >
      {icon}
      {active && <div className="w-1 h-1 rounded-full bg-amber-500" />}
    </button>
  );
}

function StatItem({ label, value }: { label: string, value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-xs font-medium text-brand-text-secondary">{label}</span>
        <span className="text-xs font-mono font-bold">{value}</span>
      </div>
      <div className="h-1 w-full bg-brand-border rounded-full overflow-hidden">
        <div className="h-full bg-brand-accent/40" style={{ width: `${(value / 100) * 100}%` }} />
      </div>
    </div>
  );
}

function AbstractAvatar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="35" r="15" fill="currentColor" />
      <path d="M20 85C20 65 30 55 50 55C70 55 80 65 80 85" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="opacity-20" />
    </svg>
  );
}
