import React, { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { GoalsData } from '../types';
import { DarkCard } from './ui/DarkCard';
import { cn } from '../lib/utils';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

interface GoalsPageProps {
  goals: GoalsData;
  onUpdate: (goals: GoalsData) => void;
}

export function GoalsPage({ goals, onUpdate }: GoalsPageProps) {
  const [yearlyText, setYearlyText] = useState(goals.yearly.text);
  const [editingWeeklyId, setEditingWeeklyId] = useState<string | null>(null);
  const [editingWeeklyText, setEditingWeeklyText] = useState('');
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Get current week range
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekLabel = `${monday.getDate()} ${MONTH_NAMES[monday.getMonth()]} - ${sunday.getDate()} ${MONTH_NAMES[sunday.getMonth()]}`;

  const saveYearly = () => {
    onUpdate({ ...goals, yearly: { ...goals.yearly, text: yearlyText } });
  };

  const updateMilestone = (bulan: number, field: 'target' | 'done', value: any) => {
    const newMilestones = goals.yearly.milestones.map(m =>
      m.bulan === bulan ? { ...m, [field]: value } : m
    );
    onUpdate({ ...goals, yearly: { ...goals.yearly, milestones: newMilestones } });
  };

  const addWeeklyGoal = () => {
    const newGoal = { id: Math.random().toString(36).substr(2, 9), text: '', done: false, deadline: '' };
    const updated = { ...goals, weekly: [...goals.weekly, newGoal] };
    onUpdate(updated);
    setEditingWeeklyId(newGoal.id);
    setEditingWeeklyText('');
  };

  const saveWeeklyText = (id: string) => {
    if (!editingWeeklyText.trim()) {
      onUpdate({ ...goals, weekly: goals.weekly.filter(w => w.id !== id) });
    } else {
      onUpdate({ ...goals, weekly: goals.weekly.map(w => w.id === id ? { ...w, text: editingWeeklyText } : w) });
    }
    setEditingWeeklyId(null);
  };

  const toggleWeekly = (id: string) => {
    onUpdate({ ...goals, weekly: goals.weekly.map(w => w.id === id ? { ...w, done: !w.done } : w) });
  };

  const deleteWeekly = (id: string) => {
    onUpdate({ ...goals, weekly: goals.weekly.filter(w => w.id !== id) });
  };

  return (
    <div className="space-y-8 pb-20 lg:pb-0">
      <h2 className="text-2xl md:text-3xl font-bold">Goals</h2>

      {/* Yearly Goal */}
      <DarkCard className="space-y-6">
        <h3 className="text-lg font-bold">🎯 Goal {currentYear}</h3>
        <div className="space-y-3">
          <textarea
            value={yearlyText}
            onChange={(e) => setYearlyText(e.target.value)}
            placeholder="Apa yang ingin kamu capai tahun ini?"
            className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-3 text-base font-medium focus:outline-none focus:border-brand-accent transition-colors resize-none"
            rows={2}
          />
          <button onClick={saveYearly} className="px-6 py-2 bg-brand-accent text-brand-background rounded-lg text-sm font-bold hover:opacity-90 transition-all">
            Simpan
          </button>
        </div>

        {/* 12-month milestones */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {goals.yearly.milestones.map(m => {
            const isPast = m.bulan < currentMonth;
            const isCurrent = m.bulan === currentMonth;
            return (
              <div key={m.bulan} className={cn(
                "p-3 rounded-xl border transition-all space-y-2",
                isCurrent ? "border-brand-accent bg-brand-accent/5" : "border-brand-border bg-brand-surface",
                isPast && "opacity-50"
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary">{MONTH_NAMES[m.bulan - 1]}</span>
                  <button
                    onClick={() => updateMilestone(m.bulan, 'done', !m.done)}
                    className={cn("w-5 h-5 rounded border flex items-center justify-center transition-all",
                      m.done ? "bg-brand-success border-brand-success text-brand-background" : "border-brand-border hover:border-brand-accent"
                    )}
                  >
                    {m.done && <Check size={12} />}
                  </button>
                </div>
                <input
                  value={m.target}
                  onChange={(e) => updateMilestone(m.bulan, 'target', e.target.value)}
                  placeholder="Milestone..."
                  className="w-full bg-transparent text-xs focus:outline-none text-brand-text-primary placeholder:text-brand-text-secondary/50"
                />
              </div>
            );
          })}
        </div>
      </DarkCard>

      {/* Weekly Goals */}
      <DarkCard className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Target Minggu Ini</h3>
            <p className="text-xs text-brand-text-secondary">{weekLabel}</p>
          </div>
        </div>

        <div className="space-y-2">
          {goals.weekly.map(w => (
            <div key={w.id} className="flex items-center gap-3 group">
              <button
                onClick={() => toggleWeekly(w.id)}
                className={cn("w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0",
                  w.done ? "bg-brand-success border-brand-success text-brand-background" : "border-brand-border hover:border-brand-accent"
                )}
              >
                {w.done && <Check size={12} />}
              </button>

              {editingWeeklyId === w.id ? (
                <input
                  autoFocus
                  value={editingWeeklyText}
                  onChange={(e) => setEditingWeeklyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveWeeklyText(w.id); if (e.key === 'Escape') setEditingWeeklyId(null); }}
                  onBlur={() => saveWeeklyText(w.id)}
                  placeholder="Tulis target..."
                  className="flex-1 bg-transparent text-sm focus:outline-none border-b border-brand-accent text-brand-text-primary py-1"
                />
              ) : (
                <span
                  onClick={() => { setEditingWeeklyId(w.id); setEditingWeeklyText(w.text); }}
                  className={cn("flex-1 text-sm cursor-text py-1", w.done && "line-through text-brand-text-secondary", !w.text && "text-brand-text-secondary italic")}
                >
                  {w.text || 'Klik untuk edit...'}
                </span>
              )}

              <button
                onClick={() => deleteWeekly(w.id)}
                className="p-1 text-brand-text-secondary hover:text-brand-danger opacity-0 group-hover:opacity-100 transition-all"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <button onClick={addWeeklyGoal} className="flex items-center gap-2 text-sm font-bold text-brand-accent hover:opacity-80 transition-all">
          <Plus size={16} /> Tambah Target
        </button>
      </DarkCard>
    </div>
  );
}
