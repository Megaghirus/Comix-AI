import React, { useState, useRef, useEffect } from 'react';
import { Character, ComicPanel, ComicStyle } from '../types';
import { generatePanelTextData, generatePanelImage } from '../services/geminiService';
import { Send, Loader2, ImagePlus, RefreshCw, Trash2, Download, Move, Palette, Type, CheckCircle, PenTool, Users, Settings2 } from 'lucide-react';

interface ComicBoardProps {
  characters: Character[];
  panels: ComicPanel[];
  onAddPanel: (panel: ComicPanel) => void;
  onRemovePanel: (id: string) => void;
}

type SidebarTab = 'story' | 'cast' | 'style';

const ComicBoard: React.FC<ComicBoardProps> = ({ characters, panels, onAddPanel, onRemovePanel }) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('story');
  
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<ComicStyle>('comic-book');
  const [selectedCharIds, setSelectedCharIds] = useState<Set<string>>(new Set());
  
  // Drag and drop state
  const [draggingPanelId, setDraggingPanelId] = useState<string | null>(null);
  const dragStartRef = useRef<{x: number, y: number}>({x: 0, y: 0});
  const [localPanels, setLocalPanels] = useState<ComicPanel[]>(panels);

  useEffect(() => {
    setLocalPanels(panels);
  }, [panels]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    const activeCharacters = characters.filter(c => selectedCharIds.has(c.id));
    
    // Auto-select all characters if none selected (DX improvement)
    const charsToUse = activeCharacters.length > 0 ? activeCharacters : [];

    setIsGenerating(true);
    setStatus('Scriem scenariul...');

    try {
      const textData = await generatePanelTextData(prompt, charsToUse, selectedStyle);
      
      setStatus('Generăm imaginea...');
      const imageUrl = await generatePanelImage(textData.imagePrompt);

      const newPanel: ComicPanel = {
        id: crypto.randomUUID(),
        imageUrl,
        caption: textData.caption,
        prompt: prompt,
        textPosition: { x: 50, y: 90, scale: 1 } // Default position bottom center
      };

      onAddPanel(newPanel);
      setPrompt('');
    } catch (err) {
      console.error(err);
      alert("Eroare la generare.");
    } finally {
      setIsGenerating(false);
      setStatus('');
    }
  };

  const toggleCharSelection = (id: string) => {
    const newSet = new Set(selectedCharIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedCharIds(newSet);
  };

  // --- Drag & Drop Logic ---
  const handleMouseDown = (e: React.MouseEvent, panelId: string) => {
    setDraggingPanelId(panelId);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent, panel: ComicPanel) => {
    if (draggingPanelId !== panel.id) return;
    
    const container = e.currentTarget.getBoundingClientRect();
    const deltaX = (e.clientX - dragStartRef.current.x) / container.width * 100;
    const deltaY = (e.clientY - dragStartRef.current.y) / container.height * 100;
    
    const updated = localPanels.map(p => {
        if (p.id === panel.id) {
            return {
                ...p,
                textPosition: {
                    ...p.textPosition,
                    x: Math.min(Math.max(p.textPosition.x + deltaX, 0), 100),
                    y: Math.min(Math.max(p.textPosition.y + deltaY, 0), 100)
                }
            };
        }
        return p;
    });
    setLocalPanels(updated);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setDraggingPanelId(null);
  };

  const handleScaleChange = (panelId: string, newScale: number) => {
    const updated = localPanels.map(p => p.id === panelId ? { ...p, textPosition: { ...p.textPosition, scale: newScale } } : p);
    setLocalPanels(updated);
  };
  
  const handleCaptionChange = (panelId: string, newCaption: string) => {
    const updated = localPanels.map(p => p.id === panelId ? { ...p, caption: newCaption } : p);
    setLocalPanels(updated);
  };

  const styles: {id: ComicStyle, label: string}[] = [
    { id: 'comic-book', label: 'Comix Clasic' },
    { id: 'anime', label: 'Anime / Manga' },
    { id: 'realistic', label: 'Realistic (Film)' },
    { id: 'black-white', label: 'Noir / Alb-Negru' },
    { id: 'pixel', label: 'Pixel Art' },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] overflow-hidden bg-slate-950 rounded-xl border border-slate-800 shadow-2xl">
      
      {/* 1. LEFT SIDEBAR - CONTROL PANEL */}
      <div className="w-full lg:w-96 flex flex-col border-r border-slate-800 bg-slate-900">
        
        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800">
            <button 
                onClick={() => setActiveTab('story')}
                className={`flex-1 py-4 flex flex-col items-center gap-1 text-xs font-bold uppercase tracking-wider transition hover:bg-slate-800 ${activeTab === 'story' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800' : 'text-slate-500'}`}
            >
                <PenTool className="w-5 h-5" /> Scenariu
            </button>
            <button 
                onClick={() => setActiveTab('cast')}
                className={`flex-1 py-4 flex flex-col items-center gap-1 text-xs font-bold uppercase tracking-wider transition hover:bg-slate-800 ${activeTab === 'cast' ? 'text-green-400 border-b-2 border-green-400 bg-slate-800' : 'text-slate-500'}`}
            >
                <Users className="w-5 h-5" /> Actori
                {selectedCharIds.size > 0 && <span className="absolute ml-6 mb-4 w-2 h-2 bg-green-500 rounded-full"></span>}
            </button>
            <button 
                onClick={() => setActiveTab('style')}
                className={`flex-1 py-4 flex flex-col items-center gap-1 text-xs font-bold uppercase tracking-wider transition hover:bg-slate-800 ${activeTab === 'style' ? 'text-purple-400 border-b-2 border-purple-400 bg-slate-800' : 'text-slate-500'}`}
            >
                <Settings2 className="w-5 h-5" /> Stil
            </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            
            {/* TAB: STORY */}
            {activeTab === 'story' && (
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <h3 className="text-white font-bold text-lg mb-2">Ce se întâmplă acum?</h3>
                        <p className="text-slate-400 text-sm mb-4">Descrie acțiunea, dialogul și atmosfera. AI-ul va folosi personajele selectate în tab-ul "Actori".</p>
                        <form onSubmit={handleGenerate} className="flex flex-col gap-4">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Ex: Eroii intră într-o peșteră întunecată. Ion spune 'Nu văd nimic'..."
                                className="w-full h-40 bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none shadow-inner"
                                disabled={isGenerating}
                            />
                            
                            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                                <span>Personaje active: <span className="text-white">{selectedCharIds.size > 0 ? selectedCharIds.size : 'Toate'}</span></span>
                                <span>Stil: <span className="text-white capitalize">{selectedStyle}</span></span>
                            </div>

                            <button
                                type="submit"
                                disabled={isGenerating || !prompt}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg transform active:scale-95"
                            >
                                {isGenerating ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5" />}
                                GENEREAZĂ PAGINA
                            </button>
                            {status && (
                                <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg text-blue-300 text-sm flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    {status}
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* TAB: CAST */}
            {activeTab === 'cast' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center mb-2">
                         <h3 className="text-white font-bold">Selectează Personaje</h3>
                         <span className="text-xs text-slate-500">{characters.length} disponibile</span>
                    </div>
                    
                    {characters.length === 0 ? (
                        <div className="text-center p-8 border-2 border-dashed border-slate-800 rounded-xl text-slate-500">
                            Nu ai creat niciun personaj. <br/> Mergi la tab-ul "Personaje".
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {characters.map(c => (
                                <div 
                                key={c.id} 
                                onClick={() => toggleCharSelection(c.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${selectedCharIds.has(c.id) ? 'bg-green-900/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                                >
                                    <img src={c.avatarUrl} className="w-12 h-12 rounded-lg object-cover bg-slate-900" alt="" />
                                    <div className="flex-1">
                                        <h4 className={`font-bold ${selectedCharIds.has(c.id) ? 'text-white' : 'text-slate-400'}`}>{c.name}</h4>
                                        <p className="text-xs text-slate-500 truncate w-40">{c.description}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedCharIds.has(c.id) ? 'border-green-500 bg-green-500' : 'border-slate-600'}`}>
                                        {selectedCharIds.has(c.id) && <CheckCircle className="w-3 h-3 text-black" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: STYLE */}
            {activeTab === 'style' && (
                <div className="space-y-4 animate-fade-in">
                    <h3 className="text-white font-bold mb-2">Estetică Vizuală</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {styles.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedStyle(s.id)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${selectedStyle === s.id ? 'bg-purple-900/20 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                            >
                                <span className="font-bold block">{s.label}</span>
                                <span className="text-xs opacity-60">
                                    {s.id === 'comic-book' && "Linii groase, culori vibrante."}
                                    {s.id === 'anime' && "Expresiv, stil japonez."}
                                    {s.id === 'realistic' && "Fotorealism cinematic."}
                                    {s.id === 'black-white' && "Atmosferă dark, cerneală."}
                                    {s.id === 'pixel' && "Retro gaming 16-bit."}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

        </div>
      </div>

      {/* 2. MAIN CONTENT - COMIC CANVAS */}
      <div className="flex-1 bg-slate-900 relative flex flex-col">
          {/* Canvas Toolbar (Optional for Zoom/Download later) */}
          <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900">
                <span className="text-slate-400 text-sm font-semibold uppercase tracking-widest">
                    Previzualizare Pagini: {localPanels.length}
                </span>
                <button onClick={() => window.print()} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm transition">
                    <Download className="w-4 h-4" /> Exportă PDF
                </button>
          </div>

          {/* SCROLLABLE AREA */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                {localPanels.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-60">
                        <ImagePlus className="w-24 h-24 mb-4 opacity-50" />
                        <h2 className="text-2xl font-comic tracking-wide mb-2">Pânza este goală</h2>
                        <p>Folosește panoul din stânga pentru a începe povestea.</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-12 pb-20">
                        {localPanels.map((panel, index) => (
                            <div key={panel.id} className="relative w-full max-w-4xl group">
                                
                                {/* Header Tools for Panel */}
                                <div className="flex justify-between items-end mb-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <span className="text-slate-500 font-comic text-2xl">#{index + 1}</span>
                                    <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
                                        <Type className="w-4 h-4 text-slate-400 ml-2" />
                                        <input 
                                            type="range" 
                                            min="0.5" max="2" step="0.1"
                                            value={panel.textPosition.scale}
                                            onChange={(e) => handleScaleChange(panel.id, parseFloat(e.target.value))}
                                            className="w-24 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                            title="Mărime Text"
                                        />
                                        <div className="w-px h-4 bg-slate-600 mx-1"></div>
                                        <button 
                                            onClick={() => onRemovePanel(panel.id)}
                                            className="p-1 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded transition"
                                            title="Șterge"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* THE PANEL ITSELF - Clean, straight lines */}
                                <div 
                                    className="relative bg-white shadow-2xl overflow-hidden select-none border-0 ring-4 ring-black"
                                    onMouseMove={(e) => handleMouseMove(e, panel)}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                >
                                    <img src={panel.imageUrl} alt="Comic Panel" className="w-full h-auto block pointer-events-none" />
                                    
                                    {/* Draggable Text Bubble */}
                                    <div 
                                        className="absolute cursor-move transform -translate-x-1/2 -translate-y-1/2 max-w-[80%]"
                                        style={{
                                            left: `${panel.textPosition.x}%`,
                                            top: `${panel.textPosition.y}%`,
                                            transform: `translate(-50%, -50%) scale(${panel.textPosition.scale})`
                                        }}
                                        onMouseDown={(e) => handleMouseDown(e, panel.id)}
                                    >
                                        <div className="bg-white border-[3px] border-black p-4 rounded-[1.5rem] relative group/bubble shadow-lg">
                                            <textarea
                                                value={panel.caption}
                                                onChange={(e) => handleCaptionChange(panel.id, e.target.value)}
                                                className="font-comic text-xl uppercase leading-tight text-black text-center bg-transparent border-none outline-none resize-none overflow-hidden w-full min-w-[200px]"
                                                rows={Math.max(2, Math.ceil(panel.caption.length / 25))}
                                                spellCheck={false}
                                            />
                                            {/* Hint for dragging */}
                                            <div className="absolute -top-3 -right-3 p-1 opacity-0 group-hover/bubble:opacity-100 bg-blue-500 text-white rounded-full shadow-md transition-opacity">
                                                <Move className="w-3 h-3" />
                                            </div>
                                        </div>
                                        {/* Tail */}
                                        <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[18px] border-t-black absolute left-1/2 -bottom-[15px] -translate-x-1/2"></div>
                                        <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-white absolute left-1/2 -bottom-[11px] -translate-x-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
          </div>
      </div>
    </div>
  );
};

export default ComicBoard;