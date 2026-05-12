import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AVATARS } from './avatar';
import { ChevronRight, ArrowLeft, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { storageService } from '../services/storageService';

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState('');
  const [goals, setGoals] = useState('');

  const handleNext = () => {
    if (step === 1 && name.trim().length >= 2) {
      storageService.saveUserName(name.trim());
      setStep(2);
    } else if (step === 2 && selectedAvatarId) {
      storageService.saveAvatarId(selectedAvatarId);
      setStep(3);
    } else if (step === 3) {
      const goalsData = {
        yearly: {
          text: goals.trim() || "",
          year: 2026,
          milestones: []
        },
        weekly: []
      };
      storageService.saveGoals(goalsData);
      storageService.saveOnboardingDone();
      window.dispatchEvent(new Event('storage'));
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const stepVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-brand-background flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="w-full max-w-md flex flex-col items-center">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full space-y-8 flex flex-col items-center text-center"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">Hei! Aku Vox.</h1>
                <p className="text-brand-text-secondary text-lg">Siapa namamu?</p>
              </div>
              <input 
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tulis namamu..."
                className="w-full bg-brand-surface border border-brand-border rounded-2xl px-6 py-4 text-xl focus:outline-none focus:border-brand-accent transition-all text-center"
              />
              <button 
                onClick={handleNext}
                disabled={name.trim().length < 2}
                className="w-full py-4 bg-brand-accent text-brand-background rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-brand-accent/20"
              >
                Lanjut <ChevronRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full space-y-8 flex flex-col items-center text-center"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">Pilih avatarmu</h1>
                <p className="text-brand-text-secondary text-lg">Sesuaikan tampilanmu</p>
              </div>
              
              <div className="grid grid-cols-3 gap-6 w-full">
                {AVATARS.map((avatar) => {
                  const isSelected = selectedAvatarId === avatar.id;
                  return (
                    <button
                      key={avatar.id}
                      onClick={() => setSelectedAvatarId(avatar.id)}
                      className={cn(
                        "relative flex items-center justify-center aspect-square rounded-full transition-all group",
                        isSelected ? "ring-3 ring-brand-accent amber-glow" : "ring-1 ring-brand-border hover:scale-105 hover:ring-2 hover:ring-brand-accent/50"
                      )}
                    >
                      <div className="w-20 h-20 overflow-hidden rounded-full">
                        <avatar.Component />
                      </div>
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 bg-brand-accent text-brand-background rounded-full p-1 shadow-lg">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={handleNext}
                disabled={!selectedAvatarId}
                className="w-full py-4 bg-brand-accent text-brand-background rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-brand-accent/20"
              >
                Lanjut <ChevronRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full space-y-8 flex flex-col items-center text-center"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">Apa yang mau kamu capai tahun ini?</h1>
                <p className="text-brand-text-secondary text-lg">Bantu Vox memahami visimu</p>
              </div>
              
              <textarea 
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="Contoh: Lulus semester 1 dengan IPK 3.5"
                rows={4}
                className="w-full bg-brand-surface border border-brand-border rounded-2xl px-6 py-4 text-lg focus:outline-none focus:border-brand-accent transition-all resize-none"
              />

              <div className="flex gap-4 w-full">
                <button 
                  onClick={handleNext}
                  className="flex-1 py-4 bg-brand-surface border border-brand-border text-brand-text-secondary rounded-2xl font-bold text-lg hover:text-white transition-all"
                >
                  Skip
                </button>
                <button 
                  onClick={handleNext}
                  className="flex-[2] py-4 bg-brand-accent text-brand-background rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-brand-accent/20"
                >
                  Mulai <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-20 flex items-center justify-between w-full">
          <div className="w-24">
            {step > 1 && (
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-brand-text-secondary hover:text-white font-medium transition-colors"
              >
                <ArrowLeft size={18} /> Kembali
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            {[1, 2, 3].map((s) => (
              <div 
                key={s}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  step === s ? "bg-brand-accent w-6" : "bg-brand-border"
                )}
              />
            ))}
          </div>
          
          <div className="w-24" />
        </div>
      </div>
    </div>
  );
}
