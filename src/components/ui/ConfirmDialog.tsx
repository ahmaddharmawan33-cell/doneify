import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DarkCard } from './DarkCard';
import { Check, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, message, onConfirm, onCancel }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed bottom-8 right-8 z-50 flex items-end justify-end p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 50 }}
            className="w-full max-w-sm"
          >
            <DarkCard className="shadow-2xl border-brand-accent/40 bg-brand-surface/90" glow>
              <h3 className="text-sm font-bold text-brand-accent uppercase tracking-widest mb-2">Konfirmasi Aksi</h3>
              <p className="text-brand-text-primary mb-6 text-sm leading-relaxed">{message}</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={onCancel}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-brand-border hover:bg-brand-border transition-colors text-xs font-medium"
                >
                  <X size={14} />
                  Nggak dulu
                </button>
                <button 
                  onClick={onConfirm}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-accent text-brand-background hover:bg-brand-accent/90 transition-colors text-xs font-bold"
                >
                  <Check size={14} />
                  Iya, lanjut!
                </button>
              </div>
            </DarkCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
