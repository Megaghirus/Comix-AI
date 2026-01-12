import React, { useState, useRef } from 'react';
import { Character, ComicStyle } from '../types';
import { generateCharacterAvatar, analyzeCharacterImage } from '../services/geminiService';
import { Trash2, User, Sparkles, Loader2, Camera, Save, RefreshCcw, Image as ImageIcon } from 'lucide-react';

interface CharacterCreatorProps {
  characters: Character[];
  onAddCharacter: (char: Character) => void;
  onRemoveCharacter: (id: string) => void;
}

interface CharacterDraft {
  id: string;
  imageUrl: string;
}

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ characters, onAddCharacter, onRemoveCharacter }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<ComicStyle>('comic-book');
  
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  
  const [drafts, setDrafts] = useState<CharacterDraft[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setReferenceImage(base64String);
      
      if (!description) {
          setAnalyzingImage(true);
          try {
            const aiDescription = await analyzeCharacterImage(base64String);
            setDescription(aiDescription);
          } catch(err) {
              console.warn("Auto-caption failed, ignoring");
          } finally {
              setAnalyzingImage(false);
          }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
        alert("Te rugăm să introduci un nume.");
        return;
    }

    setIsGenerating(true);
    try {
      const avatarUrl = await generateCharacterAvatar(name, description, selectedStyle, referenceImage || undefined);
      
      const newDraft: CharacterDraft = {
        id: crypto.randomUUID(),
        imageUrl: avatarUrl,
      };

      setDrafts(prev => [newDraft, ...prev]);
    } catch (err) {
      alert("Eroare la generarea versiunii. Încearcă din nou.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveCharacter = (draft: CharacterDraft) => {
      const newChar: Character = {
        id: crypto.randomUUID(),
        name,
        description: description || "Personaj generat din imagine",
        avatarUrl: draft.imageUrl,
      };
      onAddCharacter(newChar);
      setDrafts([]);
      setName('');
      setDescription('');
      setReferenceImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteDraft = (id: string) => {
      setDrafts(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      
      {/* LEFT COLUMN: Input Form */}
      <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-yellow-500" />
            Studio Creație
            </h2>
            
            <form onSubmit={handleGenerateDraft} className="space-y-5">
            {/* Reference Image Input */}
            <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">1. Referință Vizuală</label>
                <div 
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer border-2 border-dashed rounded-xl transition flex flex-col items-center justify-center relative overflow-hidden h-32 group ${referenceImage ? 'border-green-500 bg-slate-900' : 'border-slate-600 hover:bg-slate-700/50 bg-slate-900/50'}`}
                >
                    {referenceImage ? (
                        <>
                            <img src={referenceImage} alt="Ref" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition" />
                            <div className="relative z-10 flex flex-col items-center">
                                <span className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded">Schimbă Poza</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <Camera className="w-6 h-6 text-slate-500 mb-2" />
                            <span className="text-xs text-slate-400">Încarcă Poză (Opțional)</span>
                        </>
                    )}
                    <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isGenerating}
                    />
                </div>
                {analyzingImage && <p className="text-xs text-blue-400 mt-1 animate-pulse">Analizez trăsăturile...</p>}
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">2. Nume</label>
                    <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                    placeholder="Ex: Super Dan"
                    disabled={isGenerating}
                    />
                </div>
                <div className="col-span-2">
                     <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Stil</label>
                     <select 
                        value={selectedStyle}
                        onChange={(e) => setSelectedStyle(e.target.value as ComicStyle)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                     >
                        <option value="comic-book">Comix Clasic</option>
                        <option value="anime">Anime</option>
                        <option value="realistic">Realistic</option>
                        <option value="black-white">Noir</option>
                        <option value="pixel">Pixel Art</option>
                     </select>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">3. Descriere / Detalii</label>
                <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none h-24 resize-none text-sm"
                placeholder="Detalii extra despre aspect..."
                disabled={isGenerating}
                />
            </div>

            <button
                type="submit"
                disabled={isGenerating || !name}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-slate-900 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg"
            >
                {isGenerating ? <Loader2 className="animate-spin" /> : <RefreshCcw className="w-5 h-5" />}
                Generează Variante
            </button>
            </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Results & Gallery */}
      <div className="lg:col-span-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-2 pb-10">
        
        {/* Drafts Area */}
        {drafts.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl animate-fade-in">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="text-yellow-400 w-5 h-5" />
                    Rezultate Generate
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {drafts.map((draft) => (
                        <div key={draft.id} className="bg-slate-900 rounded-xl overflow-hidden border-2 border-yellow-500/50 shadow-2xl flex flex-col group">
                            <div className="aspect-square relative">
                                <img src={draft.imageUrl} alt="Draft" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <button 
                                        onClick={() => handleSaveCharacter(draft)}
                                        className="bg-green-500 text-white p-2 rounded-full hover:scale-110 transition"
                                        title="Salvează"
                                    >
                                        <Save className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-2 flex justify-between bg-slate-950">
                                <span className="text-xs text-slate-400 font-mono">Previzualizare</span>
                                <button 
                                    onClick={() => handleDeleteDraft(draft.id)}
                                    className="text-red-500 hover:text-red-400"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Saved Characters List */}
        <div>
            <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Galerie Personaje ({characters.length})
                </h3>
            </div>
           
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {characters.map((char) => (
                <div key={char.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 group flex flex-col relative shadow-md hover:border-slate-500 transition">
                    <div className="aspect-square w-full relative">
                        <img src={char.avatarUrl} alt={char.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                    </div>
                    <div className="p-3 absolute bottom-0 left-0 right-0">
                        <h3 className="text-sm font-bold text-white drop-shadow-md truncate">{char.name}</h3>
                    </div>
                    <button 
                        onClick={() => onRemoveCharacter(char.id)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg backdrop-blur-sm"
                        title="Șterge personaj"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
                ))}
                
                {characters.length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                    <User className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>Galeria este goală.</p>
                </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default CharacterCreator;