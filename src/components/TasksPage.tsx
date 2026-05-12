import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task } from '../types';
import { DarkCard } from './ui/DarkCard';
import { CustomModal } from './ui/Modal';
import { DeadlinePicker } from './ui/DeadlinePicker';
import { cn } from '../lib/utils';

interface TasksPageProps {
  tasks: Task[];
  onUpdate: (tasks: Task[]) => void;
  showToast: (msg: string) => void;
}

const PRIORITY_COLORS = { tinggi: 'bg-[#EF4444]', sedang: 'bg-[#F59E0B]', rendah: 'bg-[#22C55E]' };
const PRIORITY_LABELS = { tinggi: 'Tinggi', sedang: 'Sedang', rendah: 'Rendah' };
const STATUS_OPTIONS = [
  { value: 'belum', label: 'Belum' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'selesai', label: 'Selesai' },
];

function getUrgency(deadline: string, status: string): { label: string; color: string; border: string } | null {
  if (status === 'selesai') return null;
  const now = Date.now();
  const dl = new Date(deadline).getTime();
  const diff = dl - now;
  if (diff < 0) return { label: '⚠ Terlambat', color: 'text-red-400', border: 'border-[#EF4444]' };
  if (diff < 24 * 60 * 60 * 1000) return { label: '⚠ Segera!', color: 'text-red-400', border: 'border-[#EF4444]' };
  if (diff < 72 * 60 * 60 * 1000) return { label: 'Mendekat', color: 'text-amber-400', border: 'border-[#F59E0B]' };
  return null;
}

function groupTasks(tasks: Task[]) {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const weekEnd = new Date(todayEnd.getTime() + 7 * 24 * 60 * 60 * 1000);

  const groups: Record<string, Task[]> = { today: [], week: [], later: [], done: [] };
  for (const t of tasks) {
    if (t.status === 'selesai') { groups.done.push(t); continue; }
    const dl = new Date(t.deadline).getTime();
    if (dl <= todayEnd.getTime()) groups.today.push(t);
    else if (dl <= weekEnd.getTime()) groups.week.push(t);
    else groups.later.push(t);
  }
  return groups;
}

export function TasksPage({ tasks, onUpdate, showToast }: TasksPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [form, setForm] = useState({ nama: '', matkul: '', deadline: '', prioritas: 'sedang' as Task['prioritas'] });

  const groups = groupTasks(tasks);

  const addTask = () => {
    if (!form.nama.trim()) return;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      nama: form.nama.trim(),
      matkul: form.matkul.trim(),
      deadline: form.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      prioritas: form.prioritas,
      status: 'belum',
      createdAt: new Date().toISOString(),
    };
    onUpdate([...tasks, newTask]);
    setShowModal(false);
    setForm({ nama: '', matkul: '', deadline: '', prioritas: 'sedang' });
    showToast('Tugas ditambahkan!');
  };

  const updateStatus = (id: string, status: Task['status']) => {
    onUpdate(tasks.map(t => t.id === id ? { ...t, status } : t));
  };

  const deleteTask = (id: string) => {
    onUpdate(tasks.filter(t => t.id !== id));
    showToast('Tugas dihapus.');
  };

  const formatDeadline = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }) + ' — ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  };

  const renderGroup = (label: string, items: Task[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary">{label} ({items.length})</h3>
        {items.map(t => {
          const urgency = getUrgency(t.deadline, t.status);
          const isDone = t.status === 'selesai';
          return (
            <DarkCard key={t.id} className={cn("space-y-2 group transition-all", isDone && "opacity-40", urgency?.border && `border-l-4 ${urgency.border}`)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className={cn("font-semibold text-sm", isDone && "line-through text-brand-text-secondary")}>{t.nama}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {t.matkul && <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-accent/10 text-brand-accent rounded">{t.matkul}</span>}
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded text-white", PRIORITY_COLORS[t.prioritas])}>{PRIORITY_LABELS[t.prioritas]}</span>
                    {urgency && <span className={cn("text-[10px] font-bold", urgency.color)}>{urgency.label}</span>}
                  </div>
                </div>
                <button onClick={() => deleteTask(t.id)} className="p-1.5 text-brand-text-secondary hover:text-brand-danger opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-brand-text-secondary">
                  <Clock size={12} />
                  <span className="text-[11px]">{formatDeadline(t.deadline)}</span>
                </div>
                <select
                  value={t.status}
                  onChange={(e) => updateStatus(t.id, e.target.value as Task['status'])}
                  className="text-[11px] bg-brand-surface border border-brand-border rounded-lg px-2 py-1 text-brand-text-primary focus:outline-none focus:border-brand-accent"
                >
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </DarkCard>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20 lg:pb-0">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl md:text-3xl font-bold">Tugas</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-accent text-brand-background rounded-xl text-sm font-bold hover:opacity-90 transition-all">
          <Plus size={16} /> <span>Tugas Baru</span>
        </button>
      </div>

      <div className="space-y-8">
        {renderGroup('Hari Ini', groups.today)}
        {renderGroup('Minggu Ini', groups.week)}
        {renderGroup('Lebih Lama', groups.later)}

        {groups.done.length > 0 && (
          <div>
            <button onClick={() => setShowDone(!showDone)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-text-secondary hover:text-brand-text-primary transition-all mb-3">
              Selesai ({groups.done.length}) {showDone ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showDone && <div className="space-y-3">{groups.done.map(t => {
              const isDone = true;
              return (
                <DarkCard key={t.id} className="opacity-40 group">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm line-through text-brand-text-secondary">{t.nama}</p>
                    <button onClick={() => deleteTask(t.id)} className="p-1.5 text-brand-text-secondary hover:text-brand-danger opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </DarkCard>
              );
            })}</div>}
          </div>
        )}

        {tasks.length === 0 && (
          <div className="py-20 border-2 border-dashed border-brand-border rounded-3xl flex flex-col items-center justify-center gap-4 text-brand-text-secondary bg-brand-surface/30">
            <div className="w-16 h-16 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center opacity-50">
              <AlertTriangle size={32} />
            </div>
            <div className="text-center space-y-1">
              <p className="font-bold text-brand-text-primary">Tidak ada tugas</p>
              <p className="text-xs italic opacity-60">Semua tugas sudah beres atau belum kamu catat?</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <CustomModal isOpen={showModal} onClose={() => setShowModal(false)} title="Tugas Baru">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-[#A0A0A0] tracking-widest">Nama Tugas *</label>
            <input value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} placeholder="cth: Tugas Kalkulus Bab 3"
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-[#F59E0B] mt-1" />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-[#A0A0A0] tracking-widest">Mata Kuliah</label>
            <input value={form.matkul} onChange={e => setForm({ ...form, matkul: e.target.value })} placeholder="cth: Kalkulus"
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-[#F59E0B] mt-1" />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-[#A0A0A0] tracking-widest">Deadline</label>
            <DeadlinePicker value={form.deadline} onChange={val => setForm({ ...form, deadline: val })} className="mt-1" />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-[#A0A0A0] tracking-widest">Prioritas</label>
            <div className="flex gap-2 mt-1">
              {(['rendah', 'sedang', 'tinggi'] as const).map(p => (
                <button key={p} onClick={() => setForm({ ...form, prioritas: p })}
                  className={cn("flex-1 py-2 rounded-lg border text-xs font-bold transition-all capitalize",
                    form.prioritas === p ? "bg-brand-accent border-brand-accent text-brand-background" : "border-[#2A2A2A] text-[#A0A0A0] hover:border-brand-accent/50"
                  )}>{p}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setShowModal(false)} className="px-5 py-2 border border-[#2A2A2A] text-[#A0A0A0] rounded-lg text-sm font-semibold hover:bg-[#2A2A2A]">Batal</button>
            <button onClick={addTask} disabled={!form.nama.trim()} className="px-5 py-2 bg-[#F59E0B] text-black rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-40">Simpan</button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
