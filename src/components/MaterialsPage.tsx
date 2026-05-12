import React, { useState, useRef } from 'react';
import { Plus, FileText, Image, Mic, X, Loader2, BookOpen } from 'lucide-react';
import { Material } from '../types';
import { DarkCard } from './ui/DarkCard';
import { CustomModal } from './ui/Modal';
import { geminiService } from '../services/geminiService';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';

interface MaterialsPageProps {
  materials: Material[];
  onUpdate: (materials: Material[]) => void;
  showToast: (msg: string) => void;
  storageWarning: boolean;
}

type Tab = 'text' | 'image' | 'audio';

export function MaterialsPage({ materials, onUpdate, showToast, storageWarning }: MaterialsPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [viewMaterial, setViewMaterial] = useState<Material | null>(null);
  const [isEditingMaterial, setIsEditingMaterial] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editJudul, setEditJudul] = useState('');
  const [filterMatkul, setFilterMatkul] = useState('');
  const [judul, setJudul] = useState('');
  const [matkul, setMatkul] = useState('');
  const [isi, setIsi] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [ringkasan, setRingkasan] = useState('');
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setJudul(''); setMatkul(''); setIsi('');
    setImageFiles([]); setImagePreviews([]);
    setAudioFiles([]); setRingkasan('');
    setLoading(false); setLoadingMsg(''); setErrorMsg('');
    setSaved(false);
  };

  const handleEditSave = () => {
    if (!viewMaterial) return;
    onUpdate(materials.map(m => m.id === viewMaterial.id ? { ...m, content: editContent, judul: editJudul } : m));
    setViewMaterial({ ...viewMaterial, content: editContent, judul: editJudul });
    setIsEditingMaterial(false);
    showToast('Materi diperbarui!');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024);
    if (validFiles.length < files.length) setErrorMsg('Beberapa foto terlalu besar dan diabaikan. Maks 10MB.');
    setImageFiles(prev => [...prev, ...validFiles]);
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (re) => setImagePreviews(prev => [...prev, re.target?.result as string]);
      reader.readAsDataURL(file);
    });
    setErrorMsg('');
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const validFiles = files.filter(f => f.size <= 50 * 1024 * 1024);
    if (validFiles.length < files.length) setErrorMsg('Beberapa file audio terlalu besar. Maks 50MB.');
    setAudioFiles(prev => [...prev, ...validFiles]);
    setErrorMsg('');
  };

  const allMatkul = [...new Set(materials.map(m => m.matkul).filter(Boolean))];
  const filtered = filterMatkul ? materials.filter(m => m.matkul === filterMatkul) : materials;

  const handleSave = async (withSummary: boolean) => {
    setLoading(true);
    let summary = '';

    if (withSummary) {
      setLoadingMsg('Vox sedang memproses materi...');
      if (isi.trim()) summary = await geminiService.summarizeText(isi);
      else if (imageFiles.length > 0) summary = await geminiService.summarizeImage(imageFiles[0]);
      else if (audioFiles.length > 0) summary = await geminiService.summarizeAudio(audioFiles[0], () => {});
    }

    const newMaterial: Material = {
      id: Math.random().toString(36).substr(2, 9),
      judul: judul || (isi.trim() ? isi.split(' ').slice(0, 5).join(' ') : 'Catatan Baru'),
      matkul,
      type: 'mixed',
      content: isi,
      images: imagePreviews,
      audios: audioFiles.map(f => ({ name: f.name, url: `[audio] ${f.name}` })),
      ringkasan: summary,
      createdAt: new Date().toISOString()
    };

    onUpdate([newMaterial, ...materials]);
    setRingkasan(summary);
    setSaved(true);
    setLoading(false);
    showToast(withSummary ? 'Materi diringkas & disimpan!' : 'Materi disimpan!');
  };

  const handleRequestSummary = async (e: React.MouseEvent, material: Material) => {
    e.stopPropagation();
    setLoading(true);
    showToast('Vox sedang meringkas...');
    
    let summary = '';
    if (material.type === 'text') {
      summary = await geminiService.summarizeText(material.content);
    } else if (material.type === 'image') {
      const blob = await fetch(material.content).then(res => res.blob());
      const file = new File([blob], "image.png", { type: "image/png" });
      summary = await geminiService.summarizeImage(file);
    } else if (material.type === 'audio') {
        showToast('Maaf, ringkasan audio hanya saat upload baru.');
        setLoading(false);
        return;
    }
    
    if (summary) {
      onUpdate(materials.map(m => m.id === material.id ? { ...m, ringkasan: summary } : m));
      showToast('Ringkasan siap!');
    }
    setLoading(false);
  };

  const deleteMaterial = (id: string) => {
    onUpdate(materials.filter(m => m.id !== id));
    setViewMaterial(null);
    showToast('Materi dihapus.');
  };

  const inputClass = "w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F59E0B] transition-colors";

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl md:text-3xl font-bold">Materi</h2>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-brand-accent text-brand-background rounded-xl text-sm font-bold hover:opacity-90">
          <Plus size={16} /> <span>Materi Baru</span>
        </button>
      </div>

      {storageWarning && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs font-bold text-center">
          ⚠ Storage hampir penuh. Pertimbangkan hapus materi lama.
        </div>
      )}

      {/* Filter chips */}
      {allMatkul.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterMatkul('')} className={cn("px-3 py-1 rounded-lg text-xs font-bold transition-all", !filterMatkul ? "bg-brand-accent text-brand-background" : "bg-brand-surface border border-brand-border text-brand-text-secondary")}>Semua</button>
          {allMatkul.map(m => (
            <button key={m} onClick={() => setFilterMatkul(m)} className={cn("px-3 py-1 rounded-lg text-xs font-bold transition-all", filterMatkul === m ? "bg-brand-accent text-brand-background" : "bg-brand-surface border border-brand-border text-brand-text-secondary")}>{m}</button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(m => (
          <DarkCard key={m.id} onClick={() => setViewMaterial(m)} className="cursor-pointer hover:border-brand-accent/30 transition-all space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{m.judul}</p>
                <div className="flex items-center gap-2 mt-1">
                  {m.matkul && <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-accent/10 text-brand-accent rounded">{m.matkul}</span>}
                  <span className="text-[10px] text-brand-text-secondary">{m.type === 'mixed' ? '📚' : m.type === 'text' ? '✏️' : m.type === 'image' ? '📷' : '🎙'}</span>
                  <span className="text-[10px] text-brand-text-secondary">{new Date(m.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            </div>
            {m.ringkasan ? (
              <p className="text-xs text-brand-text-secondary line-clamp-2 overflow-y-auto max-h-[200px] custom-scrollbar">
                {m.ringkasan.replace(/[*#-]/g, '').substring(0, 100)}...
              </p>
            ) : (
              <button 
                onClick={(e) => handleRequestSummary(e, m)}
                className="text-[10px] font-bold text-amber-500 flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                ✨ Minta Ringkasan
              </button>
            )}
          </DarkCard>
        ))}
        {materials.length === 0 && (
          <div className="col-span-full py-20 border-2 border-dashed border-brand-border rounded-3xl flex flex-col items-center justify-center gap-4 text-brand-text-secondary bg-brand-surface/30">
            <div className="w-16 h-16 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center opacity-50">
              <BookOpen size={32} />
            </div>
            <div className="text-center space-y-1">
              <p className="font-bold text-brand-text-primary">Belum ada materi</p>
              <p className="text-xs italic opacity-60">Simpan catatan, foto, atau rekaman kuliahmu di sini.</p>
            </div>
          </div>
        )}
      </div>

      {/* View Material */}
      <CustomModal isOpen={!!viewMaterial} onClose={() => { setViewMaterial(null); setIsEditingMaterial(false); }} title={viewMaterial?.judul || ''} maxWidth="max-w-2xl">
        {viewMaterial && !isEditingMaterial && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {viewMaterial.matkul && <span className="text-xs font-bold px-2 py-0.5 bg-brand-accent/10 text-brand-accent rounded">{viewMaterial.matkul}</span>}
              <span className="text-xs text-brand-text-secondary">{new Date(viewMaterial.createdAt).toLocaleDateString('id-ID')}</span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar space-y-4 pr-2">
              {viewMaterial.images && viewMaterial.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {viewMaterial.images.map((img, i) => (
                    <img key={i} src={img} alt="" className="w-full rounded-xl object-contain bg-brand-surface" />
                  ))}
                </div>
              )}
              {viewMaterial.audios && viewMaterial.audios.length > 0 && (
                <div className="space-y-2">
                  {viewMaterial.audios.map((aud, i) => (
                    <div key={i} className="p-3 bg-brand-surface rounded-xl flex items-center gap-2 border border-brand-border">
                      <Mic size={16} className="text-brand-accent shrink-0" />
                      <span className="text-sm font-bold truncate">{aud.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {viewMaterial.type === 'image' && viewMaterial.content.startsWith('data:') && (
                <img src={viewMaterial.content} alt="" className="w-full rounded-xl object-contain bg-brand-surface" />
              )}
              {viewMaterial.type === 'audio' && (
                <div className="p-3 bg-brand-surface rounded-xl flex items-center gap-2 border border-brand-border">
                  <Mic size={16} className="text-brand-accent shrink-0" />
                  <span className="text-sm font-bold truncate">{viewMaterial.content.replace('[audio] ', '')}</span>
                </div>
              )}
              {((viewMaterial.type === 'text' || viewMaterial.type === 'mixed') && viewMaterial.content) && (
                <div className="text-sm text-brand-text-secondary whitespace-pre-wrap break-words break-all bg-brand-surface p-4 rounded-xl">{viewMaterial.content}</div>
              )}
              {viewMaterial.ringkasan && (
                <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-xl p-4">
                  <p className="text-xs font-bold text-brand-accent uppercase tracking-widest mb-2">Ringkasan AI</p>
                  <div className="markdown-body text-sm max-h-[300px] overflow-y-auto overflow-x-auto custom-scrollbar break-words"><Markdown>{viewMaterial.ringkasan}</Markdown></div>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-brand-border">
              <button onClick={() => deleteMaterial(viewMaterial.id)} className="text-xs text-brand-danger hover:underline">Hapus materi ini</button>
              {(viewMaterial.type === 'text' || viewMaterial.type === 'mixed') && (
                <button onClick={() => { setEditContent(viewMaterial.content); setEditJudul(viewMaterial.judul); setIsEditingMaterial(true); }} className="text-xs font-bold text-amber-500 hover:underline">Edit Materi</button>
              )}
            </div>
          </div>
        )}
        {viewMaterial && isEditingMaterial && (
          <div className="space-y-4">
            <input value={editJudul} onChange={e => setEditJudul(e.target.value)} className={inputClass} placeholder="Judul" />
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={10} className={`${inputClass} resize-y`} placeholder="Isi materi" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setIsEditingMaterial(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-brand-text-secondary border border-brand-border hover:bg-brand-surface">Batal</button>
              <button onClick={handleEditSave} className="px-4 py-2 rounded-lg text-sm font-bold bg-amber-500 text-brand-background">Simpan Perubahan</button>
            </div>
          </div>
        )}
      </CustomModal>

      {/* Add Modal */}
      <CustomModal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title="Materi Baru" maxWidth="max-w-lg">
        <div className="space-y-4">
          {errorMsg && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold text-center">{errorMsg}</div>}

          {/* Common fields */}
          <div className="grid grid-cols-2 gap-3">
            <input value={judul} onChange={e => setJudul(e.target.value)} placeholder="Judul materi" className={inputClass} />
            <input value={matkul} onChange={e => setMatkul(e.target.value)} placeholder="Mata kuliah" className={inputClass} />
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {/* Tab content */}
            <div>
              <label className="text-xs font-bold text-brand-text-secondary mb-2 block">Catatan Teks</label>
              <textarea value={isi} onChange={e => setIsi(e.target.value)} placeholder="Tulis isi catatan materi..." rows={4} className={`${inputClass} resize-none`} />
            </div>

            <div>
              <label className="text-xs font-bold text-brand-text-secondary mb-2 block">Foto Materi (Bisa pilih banyak)</label>
              <input ref={imageInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageSelect} />
              {imagePreviews.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {imagePreviews.map((preview, i) => (
                      <div key={i} className="relative group">
                        <img src={preview} alt="" className="w-full h-32 rounded-xl object-cover bg-brand-surface" />
                        <button onClick={() => { 
                          setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
                          setImageFiles(prev => prev.filter((_, idx) => idx !== i));
                        }} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => imageInputRef.current?.click()} className="text-xs text-amber-500 font-bold hover:underline">+ Tambah foto lagi</button>
                </div>
              ) : (
                <button onClick={() => imageInputRef.current?.click()} className="w-full py-8 border-2 border-dashed border-brand-border rounded-xl text-brand-text-secondary text-sm hover:border-brand-accent/50 transition-all">
                  📷 Klik untuk upload foto (max 10MB)
                </button>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-brand-text-secondary mb-2 block">Rekaman Audio (Bisa pilih banyak)</label>
              <input ref={audioInputRef} type="file" multiple accept=".mp3,.wav,.m4a,.ogg,.aac,audio/*" className="hidden" onChange={handleAudioSelect} />
              {audioFiles.length > 0 ? (
                <div className="space-y-2">
                  {audioFiles.map((file, i) => (
                    <div key={i} className="p-3 bg-brand-surface rounded-xl flex items-center justify-between border border-brand-border">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mic size={16} className="text-brand-accent shrink-0" />
                        <div className="min-w-0"><p className="text-xs font-bold truncate">{file.name}</p><p className="text-[10px] text-brand-text-secondary">{(file.size / 1024 / 1024).toFixed(1)} MB</p></div>
                      </div>
                      <button onClick={() => setAudioFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-1 text-brand-text-secondary hover:text-white shrink-0"><X size={16} /></button>
                    </div>
                  ))}
                  <button onClick={() => audioInputRef.current?.click()} className="text-xs text-amber-500 font-bold hover:underline mt-2">+ Tambah rekaman lagi</button>
                </div>
              ) : (
                <button onClick={() => audioInputRef.current?.click()} className="w-full py-8 border-2 border-dashed border-brand-border rounded-xl text-brand-text-secondary text-sm hover:border-brand-accent/50 transition-all">
                  🎙 Klik untuk upload rekaman (max 50MB)
                </button>
              )}
            </div>
          </div>

          {/* Loading / Result */}
          {loading && <div className="flex items-center gap-2 text-sm text-brand-accent"><Loader2 size={16} className="animate-spin" />{loadingMsg}</div>}
          {ringkasan && saved && (
            <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-xl p-4">
              <p className="text-xs font-bold text-brand-accent uppercase tracking-widest mb-2">Ringkasan</p>
              <div className="markdown-body text-sm max-h-[300px] overflow-y-auto overflow-x-auto custom-scrollbar break-words"><Markdown>{ringkasan}</Markdown></div>
            </div>
          )}

          {/* Action buttons */}
          {!saved && (
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="px-5 py-2 border border-[#2A2A2A] text-[#A0A0A0] rounded-lg text-sm font-semibold hover:bg-[#2A2A2A]">Batal</button>
              <button
                onClick={() => handleSave(false)}
                disabled={loading || (!isi.trim() && imageFiles.length === 0 && audioFiles.length === 0)}
                className="px-5 py-2 bg-brand-surface border border-brand-border text-white rounded-lg text-sm font-semibold hover:bg-brand-border disabled:opacity-40"
              >
                Simpan
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={loading || (!isi.trim() && imageFiles.length === 0 && audioFiles.length === 0)}
                className="px-5 py-2 bg-[#F59E0B] text-black rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-40"
              >
                Simpan & Ringkas
              </button>
            </div>
          )}
          {saved && (
            <button onClick={() => { setShowModal(false); resetForm(); }} className="w-full py-2 bg-brand-accent text-brand-background rounded-lg text-sm font-bold">Selesai</button>
          )}
        </div>
      </CustomModal>
    </div>
  );
}
