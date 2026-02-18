import React, { useState, useRef } from 'react';
import { Character, ComicStyle, Language } from '../types';
import { generateCharacterAvatar, analyzeCharacterImage, generateDescriptionFromConcept } from '../services/geminiService';
import { Trash2, User, Sparkles, Loader2, Camera, Save, RefreshCcw, Image as ImageIcon, Edit2, X, Wand2, Download, Share2, Scan } from 'lucide-react';

interface CharacterCreatorProps {
  characters: Character[];
  onAddCharacter: (char: Character) => void;
  onRemoveCharacter: (id: string) => void;
  lang: Language;
  t: any;
}

interface CharacterDraft {
  id: string;
  imageUrl: string;
}

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ characters, onAddCharacter, onRemoveCharacter, lang, t }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [conceptPrompt, setConceptPrompt] = useState('');
  const [showAIInput, setShowAIInput] = useState(false);
  const [isExpandingPrompt, setIsExpandingPrompt] = useState(false);

  const [selectedStyle, setSelectedStyle] = useState<ComicStyle>('comic-book');
  const [isFullBody, setIsFullBody] = useState(false); 
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
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
      if (!editingId && !description) {
          setAnalyzingImage(true);
          try {
            const aiDescription = await analyzeCharacterImage(base64String, lang);
            setDescription(aiDescription);
          } catch(err) { console.warn("Auto-caption failed"); } 
          finally { setAnalyzingImage(false); }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExpandConcept = async () => {
      if (!conceptPrompt.trim()) return;
      setIsExpandingPrompt(true);
      try {
          const detailedDesc = await generateDescriptionFromConcept(conceptPrompt, lang);
          setDescription(detailedDesc);
          setShowAIInput(false);
          setConceptPrompt('');
      } catch (e) {
          alert("Error expanding concept.");
      } finally {
          setIsExpandingPrompt(false);
      }
  };

  const handleGenerateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { alert("Please enter a name."); return; }
    setIsGenerating(true);
    try {
      const avatarUrl = await generateCharacterAvatar(name, description, selectedStyle, referenceImage || undefined, isFullBody);
      const newDraft: CharacterDraft = { id: crypto.randomUUID(), imageUrl: avatarUrl };
      setDrafts(prev => [newDraft, ...prev]);
    } catch (err) { alert("Generation failed. Try again."); } 
    finally { setIsGenerating(false); }
  };

  const handleSaveCharacter = (draft: CharacterDraft) => {
      if (editingId) {
          onRemoveCharacter(editingId);
          onAddCharacter({ id: editingId, name, description, avatarUrl: draft.imageUrl });
          setEditingId(null);
      } else {
          onAddCharacter({ id: crypto.randomUUID(), name, description: description || "AI Generated", avatarUrl: draft.imageUrl });
      }
      resetForm();
  };
  
  const resetForm = () => {
      setDrafts([]); setName(''); setDescription(''); setReferenceImage(null); setEditingId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEditClick = (char: Character) => {
      setEditingId(char.id); setName(char.name); setDescription(char.description); setReferenceImage(char.avatarUrl);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = (char: Character) => {
      const link = document.createElement('a');
      link.href = char.avatarUrl;
      link.download = `${char.name.replace(/\s+/g, '_')}_avatar.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleShare = async (char: Character) => {
      try {
          const response = await fetch(char.avatarUrl);
          const blob = await response.blob();
          const file = new File([blob], `${char.name}.png`, { type: 'image/png' });

          if (navigator.share && navigator.canShare({ files: [file] })) {
              await navigator.share({
                  title: `AI Comix Character: ${char.name}`,
                  text: char.description,
                  files: [file]
              });
          } else {
              alert("Share not supported. Download instead.");
          }
      } catch (error) {
          console.error("Share failed:", error);
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
        <div className={`p-6 rounded-2xl border shadow-xl transition-colors ${editingId ? 'bg-indigo-900/30 border-indigo-500' : 'bg-slate-800 border-slate-700'}`}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {editingId ? <Edit2 className="w-5 h-5 text-indigo-400" /> : <User className="w-5 h-5 text-yellow-500" />}
                    {t.editor_title}
                </h2>
                {editingId && <button onClick={resetForm} className="text-xs text-slate-400 hover:text-white"><X className="w-3 h-3" /> Cancel</button>}
            </div>
            
            <form onSubmit={handleGenerateDraft} className="space-y-5">
            {/* Reference Image */}
            <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">{t.char_ref_label}</label>
                <div onClick={() => fileInputRef.current?.click()} className={`cursor-pointer border-2 border-dashed rounded-xl transition flex flex-col items-center justify-center relative h-24 group ${referenceImage ? 'border-green-500 bg-slate-900' : 'border-slate-600 hover:bg-slate-700/50'}`}>
                    {referenceImage ? (
                        <img src={referenceImage} alt="Ref" className="absolute inset-0 w-full h-full object-cover opacity-60 rounded-xl" />
                    ) : (
                        <div className="flex flex-col items-center"><Camera className="w-5 h-5 text-slate-500 mb-1" /><span className="text-[10px] text-slate-400">{t.upload}</span></div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isGenerating}/>
                </div>
                {analyzingImage && <p className="text-xs text-blue-400 mt-1 animate-pulse">{t.analyzing}</p>}
            </div>

            {/* Name & Style */}
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t.char_name_label}</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none" placeholder="Ex: Super Dan" />
                </div>
                <div className="col-span-2">
                     <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t.char_style_label}</label>
                     <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value as ComicStyle)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none">
                        <option value="comic-book">Comix Clasic (Marvel/DC)</option>
                        <option value="anime">Anime / Manga Color</option>
                        <option value="realistic">Cinematic Realistic</option>
                        <option value="black-white">Noir / Alb-Negru</option>
                        <option value="pixel">Pixel Art</option>
                        <option value="watercolor">Acuarelă (Artistic)</option>
                        <option value="cyberpunk">Cyberpunk / Neon</option>
                        <option value="steampunk">Steampunk</option>
                        <option value="3d-render">3D Pixar/Disney</option>
                        <option value="sketch">Schiță Creion</option>
                        <option value="retro-80s">Retro 80s Synthwave</option>
                        <option value="flat-art">Flat Art (Vector)</option>
                     </select>
                </div>
            </div>

            {/* FULL BODY TOGGLE */}
            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2">
                    <Scan className={`w-5 h-5 ${isFullBody ? 'text-green-400' : 'text-slate-500'}`}/>
                    <span className="text-sm font-bold text-slate-300">{t.char_fullbody}</span>
                </div>
                <button 
                    type="button" 
                    onClick={() => setIsFullBody(!isFullBody)} 
                    className={`relative w-11 h-6 rounded-full transition-colors ${isFullBody ? 'bg-green-600' : 'bg-slate-700'}`}
                >
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isFullBody ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
            </div>

            {/* Description with AI Assist */}
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold uppercase text-slate-500">{t.char_desc_label}</label>
                    <button type="button" onClick={() => setShowAIInput(!showAIInput)} className="text-[10px] flex items-center gap-1 text-purple-400 hover:text-purple-300 transition">
                        <Wand2 className="w-3 h-3" /> {showAIInput ? t.hide_ai : t.generate_ai}
                    </button>
                </div>
                
                {showAIInput && (
                    <div className="mb-2 p-2 bg-purple-900/20 border border-purple-500/30 rounded-lg animate-fade-in">
                        <input 
                            type="text" 
                            value={conceptPrompt} 
                            onChange={(e) => setConceptPrompt(e.target.value)} 
                            placeholder="Concept..."
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white mb-2"
                        />
                        <button 
                            type="button" 
                            onClick={handleExpandConcept} 
                            disabled={isExpandingPrompt || !conceptPrompt}
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1"
                        >
                            {isExpandingPrompt ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>} {t.expand_concept}
                        </button>
                    </div>
                )}

                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none h-24 resize-none text-sm" placeholder="..." />
            </div>

            <button type="submit" disabled={isGenerating || !name} className={`w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg ${editingId ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-gradient-to-r from-yellow-500 to-orange-600 text-slate-900'}`}>
                {isGenerating ? <Loader2 className="animate-spin" /> : editingId ? <Edit2 className="w-5 h-5"/> : <RefreshCcw className="w-5 h-5" />}
                {editingId ? t.update_btn : t.gen_btn}
            </button>
            </form>
        </div>
      </div>

      <div className="lg:col-span-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-2 pb-10">
        {drafts.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl animate-fade-in">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Sparkles className="text-yellow-400 w-5 h-5" /> {t.results_title}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {drafts.map((draft) => (
                        <div key={draft.id} className="bg-slate-900 rounded-xl overflow-hidden border-2 border-yellow-500/50 relative group">
                            <img src={draft.imageUrl} alt="Draft" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">
                                <button onClick={() => handleSaveCharacter(draft)} className="bg-green-500 text-white p-2 rounded-full hover:scale-110"><Save className="w-5 h-5" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
        <div>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-slate-300 flex items-center gap-2"><ImageIcon className="w-5 h-5" /> {t.gallery_title} ({characters.length})</h3></div>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {characters.map((char) => (
                <div key={char.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 group flex flex-col relative shadow-md hover:border-slate-500 transition">
                    <div className="aspect-[3/4] w-full relative">
                        <img src={char.avatarUrl} alt={char.name} className="w-full h-full object-cover" />
                        
                        {/* Actions Overlay */}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 p-2">
                             <div className="flex gap-2">
                                 <button onClick={() => handleEditClick(char)} className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg" title="Edit"><Edit2 className="w-3 h-3"/></button>
                                 <button onClick={() => onRemoveCharacter(char.id)} className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg" title="Delete"><Trash2 className="w-3 h-3"/></button>
                             </div>
                             <div className="flex gap-2 mt-1">
                                 <button onClick={() => handleDownload(char)} className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-full shadow-lg" title="Download"><Download className="w-3 h-3"/></button>
                                 <button onClick={() => handleShare(char)} className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-lg" title="Share"><Share2 className="w-3 h-3"/></button>
                             </div>
                        </div>
                    </div>
                    <div className="p-2 text-center bg-slate-900"><h3 className="text-xs font-bold text-white truncate">{char.name}</h3></div>
                </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterCreator;