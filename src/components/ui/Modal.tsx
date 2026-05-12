import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';


// ─── BASE MODAL ───────────────────────────────────────
interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const CustomModal: React.FC<CustomModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "relative bg-[#1A1A1A]/90 border border-[#2A2A2A] rounded-3xl p-8 w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden",
              maxWidth
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Subtle Gradient Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="relative z-10">
              {title && (
                <div className="flex items-start justify-between mb-6 gap-4">
                  <h3 className="text-xl font-bold text-white tracking-tight flex-1 min-w-0 break-words break-all">{title}</h3>
                  <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all text-brand-text-secondary hover:text-white shrink-0 mt-[-4px]">
                    <X size={20} />
                  </button>
                </div>
              )}
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ─── CONFIRM MODAL ────────────────────────────────────
interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen, title = 'Konfirmasi', message, confirmText = 'OK', cancelText = 'Batal', danger = false, onConfirm, onCancel
}) => {
  return (
    <CustomModal isOpen={isOpen} onClose={onCancel} title={title}>
      <p className="text-sm text-[#A0A0A0] leading-relaxed mb-5">{message}</p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-5 py-2 bg-transparent border border-[#2A2A2A] text-[#A0A0A0] rounded-lg text-sm font-semibold hover:bg-[#2A2A2A] transition-colors"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
            danger
              ? 'bg-[#EF4444] text-white hover:bg-red-600'
              : 'bg-[#F59E0B] text-black hover:opacity-90'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </CustomModal>
  );
};

// ─── INPUT MODAL ──────────────────────────────────────
interface InputModalProps {
  isOpen: boolean;
  title?: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  multiline?: boolean;
}

export const InputModal: React.FC<InputModalProps> = ({
  isOpen, title = 'Input', label, placeholder = '', defaultValue = '',
  confirmText = 'Simpan', cancelText = 'Batal', onConfirm, onCancel, multiline = false
}) => {
  const [value, setValue] = React.useState(defaultValue);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = () => {
    onConfirm(value);
  };

  const inputClasses = "w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-[#F59E0B] transition-colors";

  return (
    <CustomModal isOpen={isOpen} onClose={onCancel} title={title}>
      {label && <p className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-widest mb-2">{label}</p>}
      {multiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          rows={5}
          className={`${inputClasses} resize-none`}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          placeholder={placeholder}
          className={inputClasses}
        />
      )}
      <div className="flex gap-2 justify-end mt-5">
        <button
          onClick={onCancel}
          className="px-5 py-2 bg-transparent border border-[#2A2A2A] text-[#A0A0A0] rounded-lg text-sm font-semibold hover:bg-[#2A2A2A] transition-colors"
        >
          {cancelText}
        </button>
        <button
          onClick={handleSubmit}
          className="px-5 py-2 bg-[#F59E0B] text-black rounded-lg text-sm font-semibold hover:opacity-90 transition-colors"
        >
          {confirmText}
        </button>
      </div>
    </CustomModal>
  );
};

// ─── DOUBLE INPUT MODAL ───────────────────────────────
interface DoubleInputModalProps {
  isOpen: boolean;
  title?: string;
  label1?: string;
  label2?: string;
  placeholder1?: string;
  placeholder2?: string;
  defaultValue1?: string;
  defaultValue2?: string;
  confirmText?: string;
  onConfirm: (value1: string, value2: string) => void;
  onCancel: () => void;
}

export const DoubleInputModal: React.FC<DoubleInputModalProps> = ({
  isOpen, title = 'Input', label1, label2, placeholder1 = '', placeholder2 = '',
  defaultValue1 = '', defaultValue2 = '', confirmText = 'Simpan', onConfirm, onCancel,
}) => {
  const [value1, setValue1] = React.useState(defaultValue1);
  const [value2, setValue2] = React.useState(defaultValue2);

  useEffect(() => {
    if (isOpen) {
      setValue1(defaultValue1);
      setValue2(defaultValue2);
    }
  }, [isOpen, defaultValue1, defaultValue2]);

  return (
    <CustomModal isOpen={isOpen} onClose={onCancel} title={title}>
      <div className="space-y-4">
        <div>
          {label1 && <p className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-widest mb-2">{label1}</p>}
          <input
            autoFocus
            type="text"
            value={value1}
            onChange={(e) => setValue1(e.target.value)}
            placeholder={placeholder1}
            className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-[#F59E0B] transition-colors"
          />
        </div>
        <div>
          {label2 && <p className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-widest mb-2">{label2}</p>}
          <input
            type="text"
            value={value2}
            onChange={(e) => setValue2(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(value1, value2); }}
            placeholder={placeholder2}
            className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-[#F59E0B] transition-colors"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end mt-5">
        <button onClick={onCancel} className="px-5 py-2 bg-transparent border border-[#2A2A2A] text-[#A0A0A0] rounded-lg text-sm font-semibold hover:bg-[#2A2A2A] transition-colors">
          Batal
        </button>
        <button onClick={() => onConfirm(value1, value2)} className="px-5 py-2 bg-[#F59E0B] text-black rounded-lg text-sm font-semibold hover:opacity-90 transition-colors">
          {confirmText}
        </button>
      </div>
    </CustomModal>
  );
};
