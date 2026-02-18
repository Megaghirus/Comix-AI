import React, { useState, useRef, useEffect } from 'react';
import { Character, ComicPanel, ComicStyle, TextBubble, PanelSize, CoverData, Language } from '../types';
import { generatePanelTextData, generatePanelImage, enhanceSceneDescription, generateCoverImage, generateStoryScript, ScriptPanel } from '../services/geminiService';
import { Send, Loader2, Trash2, Download, PenTool, Users, Settings2, Grid, Plus, MessageCircle, Wand2, Sparkles, ChevronLeft, ChevronRight, FilePlus, Printer, Layout, Move, RefreshCw, Book, Cpu, Zap, Scaling } from 'lucide-react';

interface ComicBoardProps {
  characters: Character[];
  panels: ComicPanel[];
  onAddPanel: (panel: ComicPanel) => void;
  onRemovePanel: (id: string) => void;
  lang: Language;
  t: any;
  systemPrompt: string;
}

type SidebarTab = 'cover' | 'story' | 'cast' | 'style';

const ComicBoard: React.FC<ComicBoardProps> = ({ characters, panels, onAddPanel, onRemovePanel, lang, t, systemPrompt }) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('story');
  const [currentPage, setCurrentPage] = useState(0); 
  const [totalPages, setTotalPages] = useState(1);
  
  // Cover State
  const [coverData, setCoverData] = useState<CoverData | null>(null);
  const [coverTitle, setCoverTitle] = useState('');
  const [coverSubtitle, setCoverSubtitle] = useState('');
  const [coverAuthor, setCoverAuthor] = useState('');
  const [isGenCover, setIsGenCover] = useState(false);

  // Lazy Mode (Auto Story) State
  const [showAutoStory, setShowAutoStory] = useState(false);
  const [storyIdea, setStoryIdea] = useState('');
  const [generatedScript, setGeneratedScript] = useState<ScriptPanel[]>([]);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isAutoCreatingPanels, setIsAutoCreatingPanels] = useState(false);
  const [autoProgress, setAutoProgress] = useState(0);

  // Panel Gen State
  const [prompt, setPrompt] = useState('');
  const [selectedPanelSize, setSelectedPanelSize] = useState<PanelSize>('medium');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3-pro-image-preview');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null); 
  
  const [status, setStatus] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<ComicStyle>('comic-book');
  const [selectedCharIds, setSelectedCharIds] = useState<Set<string>>(new Set());

  // RESIZE STATE
  const [resizingPanelId, setResizingPanelId] = useState<string | null>(null);
  const resizeStartRef = useRef<{ x: number, startWidth: number } | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  
  const stagedPanels = panels.filter(p => p.pageIndex === undefined).sort((a,b) => a.orderIndex - b.orderIndex);
  const placedPanels = panels.filter(p => p.pageIndex === currentPage).sort((a,b) => a.orderIndex - b.orderIndex);

  const isProMode = localStorage.getItem('ai_comix_pro_mode') === 'true';

  React.useEffect(() => {
      const maxPage = panels.reduce((max, p) => Math.max(max, (p.pageIndex || 0)), 0);
      if (maxPage + 1 > totalPages) setTotalPages(maxPage + 1);
  }, [panels]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!resizingPanelId || !resizeStartRef.current || !pageRef.current) return;
        
        const deltaX = e.clientX - resizeStartRef.current.x;
        const containerWidth = pageRef.current.offsetWidth;
        const deltaPercent = (deltaX / containerWidth) * 100;
        let newWidth = resizeStartRef.current.startWidth + deltaPercent;
        
        if (newWidth < 15) newWidth = 15;
        if (newWidth > 100) newWidth = 100;
        
        const panel = panels.find(p => p.id === resizingPanelId);
        if (panel) {
            onAddPanel({ ...panel, widthPercent: newWidth, size: 'medium' });
             onRemovePanel(panel.id);
        }
    };

    const handleMouseUp = () => {
        setResizingPanelId(null);
        resizeStartRef.current = null;
        document.body.style.cursor = 'default';
    };

    if (resizingPanelId) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'ew-resize';
    }

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
    };
  }, [resizingPanelId, panels, onAddPanel, onRemovePanel]);

  const startResize = (e: React.MouseEvent, panel: ComicPanel) => {
      e.stopPropagation();
      e.preventDefault();
      
      let currentWidthPercent = panel.widthPercent;
      if (!currentWidthPercent) {
          if (panel.size === 'small') currentWidthPercent = 31;
          else if (panel.size === 'medium') currentWidthPercent = 48;
          else currentWidthPercent = 100;
      }

      setResizingPanelId(panel.id);
      resizeStartRef.current = { x: e.clientX, startWidth: currentWidthPercent };
  };

  const handleEnhancePrompt = async () => {
      if (!prompt.trim()) return;
      setIsEnhancing(true);
      try {
          const enhanced = await enhanceSceneDescription(prompt, lang);
          setPrompt(enhanced);
      } catch (e) { console.error(e); } finally { setIsEnhancing(false); }
  };

  const handleGenerateCover = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!coverTitle) return;
      setIsGenCover(true);
      try {
          const url = await generateCoverImage(coverTitle, selectedStyle);
          setCoverData({ title: coverTitle, subtitle: coverSubtitle, author: coverAuthor, imageUrl: url });
      } catch (e) { alert("Cover generation failed"); }
      finally { setIsGenCover(false); }
  };

  const handleDraftScript = async () => {
      if(!storyIdea) return;
      setIsGeneratingScript(true);
      setGeneratedScript([]);
      const activeCharacters = characters.filter(c => selectedCharIds.has(c.id));
      
      try {
          const script = await generateStoryScript(storyIdea, activeCharacters.length > 0 ? activeCharacters : characters.slice(0, 2), lang, systemPrompt);
          setGeneratedScript(script);
      } catch (e) {
          alert("Script error.");
      } finally {
          setIsGeneratingScript(false);
      }
  };

  const updateScriptItem = (index: number, field: keyof ScriptPanel, value: string) => {
      const newScript = [...generatedScript];
      newScript[index] = { ...newScript[index], [field]: value };
      setGeneratedScript(newScript);
  };

  const executeAutoStory = async () => {
      if (generatedScript.length === 0) return;
      setIsAutoCreatingPanels(true);
      const activeCharacters = characters.filter(c => selectedCharIds.has(c.id));
      const charsToUse = activeCharacters.length > 0 ? activeCharacters : [];
      
      for (let i = 0; i < generatedScript.length; i++) {
          setAutoProgress(i + 1);
          const item = generatedScript[i];
          try {
              const imageUrl = await generatePanelImage(item.description, charsToUse, selectedModel, '16:9');
              const newPanel: ComicPanel = {
                  id: crypto.randomUUID(),
                  imageUrl,
                  caption: item.caption,
                  prompt: item.description,
                  bubbles: [],
                  size: 'medium', 
                  widthPercent: 48, 
                  orderIndex: stagedPanels.length + i,
                  modelUsed: selectedModel,
                  pageIndex: currentPage 
              };
              onAddPanel(newPanel);
          } catch (e) {
              console.error(`Failed to generate panel ${i+1}`, e);
          }
      }
      setIsAutoCreatingPanels(false);
      setShowAutoStory(false);
      setGeneratedScript([]);
      setStoryIdea('');
      setAutoProgress(0);
  };

  const handleGenerateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    const activeCharacters = characters.filter(c => selectedCharIds.has(c.id));
    const charsToUse = activeCharacters.length > 0 ? activeCharacters : [];

    setIsGenerating(true);
    setStatus(editingPanelId ? 'Regen...' : 'Analiz...');

    try {
      const textData = await generatePanelTextData(prompt, charsToUse, selectedStyle, lang, systemPrompt, isProMode);
      setStatus(`Gen Imagine...`);
      
      const ar = selectedPanelSize === 'large' ? '16:9' : (selectedPanelSize === 'small' ? '1:1' : '4:3');

      const imageUrl = await generatePanelImage(textData.imagePrompt, charsToUse, selectedModel, ar);

      if (editingPanelId) {
          const oldPanel = panels.find(p => p.id === editingPanelId);
          if (oldPanel) {
              const updatedPanel: ComicPanel = {
                  ...oldPanel,
                  imageUrl,
                  caption: textData.caption,
                  prompt: prompt,
                  size: selectedPanelSize,
                  widthPercent: oldPanel.widthPercent,
                  modelUsed: selectedModel
              };
              onRemovePanel(editingPanelId);
              onAddPanel(updatedPanel);
              setEditingPanelId(null);
          }
      } else {
          let wP = 48;
          if (selectedPanelSize === 'small') wP = 31;
          if (selectedPanelSize === 'large') wP = 100;

          const newPanel: ComicPanel = {
            id: crypto.randomUUID(),
            imageUrl,
            caption: textData.caption,
            prompt: prompt,
            bubbles: [],
            size: selectedPanelSize,
            widthPercent: wP,
            orderIndex: stagedPanels.length,
            modelUsed: selectedModel
          };
          onAddPanel(newPanel);
      }
      setPrompt('');
      if(!editingPanelId) setStatus('OK!');
    } catch (err) {
      console.error(err);
      alert("Error.");
    } finally {
      setIsGenerating(false);
      setStatus('');
    }
  };

  const loadPanelForEdit = (panel: ComicPanel) => {
      setEditingPanelId(panel.id);
      setPrompt(panel.prompt);
      setSelectedPanelSize(panel.size);
      if (panel.modelUsed) setSelectedModel(panel.modelUsed);
      setActiveTab('story');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
      setEditingPanelId(null);
      setPrompt('');
  };

  const toggleCharSelection = (id: string) => {
    const newSet = new Set(selectedCharIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedCharIds(newSet);
  };

  const moveToPage = (panelId: string) => {
      const panel = panels.find(p => p.id === panelId);
      if (!panel) return;
      const newW = panel.widthPercent || 48;
      onRemovePanel(panelId);
      onAddPanel({...panel, pageIndex: currentPage, widthPercent: newW, orderIndex: placedPanels.length});
  };

  const moveToStaging = (panelId: string) => {
      const panel = panels.find(p => p.id === panelId);
      if (!panel) return;
      onRemovePanel(panelId);
      onAddPanel({...panel, pageIndex: undefined});
  };

  const changeSize = (panelId: string, newSize: PanelSize) => {
      const panel = panels.find(p => p.id === panelId);
      if (!panel) return;
      let wP = 48;
      if (newSize === 'small') wP = 31;
      if (newSize === 'large') wP = 100;
      onRemovePanel(panelId);
      onAddPanel({...panel, size: newSize, widthPercent: wP});
  };

  const addBubble = (panelId: string) => {
      const panel = panels.find(p => p.id === panelId);
      if (!panel) return;
      const newBubble: TextBubble = { id: crypto.randomUUID(), text: "Text...", x: 50, y: 50, scale: 1, type: 'speech' };
      onRemovePanel(panelId);
      onAddPanel({...panel, bubbles: [...panel.bubbles, newBubble]});
  };

  const updateBubble = (panelId: string, bubbleId: string, updates: Partial<TextBubble>) => {
      const panel = panels.find(p => p.id === panelId);
      if (!panel) return;
      onRemovePanel(panelId);
      onAddPanel({...panel, bubbles: panel.bubbles.map(b => b.id === bubbleId ? {...b, ...updates} : b)});
  };
  
  const removeBubble = (panelId: string, bubbleId: string) => {
      const panel = panels.find(p => p.id === panelId);
      if (!panel) return;
      onRemovePanel(panelId);
      onAddPanel({...panel, bubbles: panel.bubbles.filter(b => b.id !== bubbleId)});
  };

  const styles: {id: ComicStyle, label: string}[] = [
    { id: 'comic-book', label: 'Comix Clasic' },
    { id: 'anime', label: 'Anime / Manga' },
    { id: 'realistic', label: 'Realistic (Film)' },
    { id: 'black-white', label: 'Noir / Alb-Negru' },
    { id: 'pixel', label: 'Pixel Art' },
    { id: 'watercolor', label: 'Acuarelă' },
    { id: 'cyberpunk', label: 'Cyberpunk' },
    { id: 'steampunk', label: 'Steampunk' },
    { id: '3d-render', label: '3D Pixar Style' },
    { id: 'sketch', label: 'Schiță Creion' },
    { id: 'retro-80s', label: 'Retro 80s' },
    { id: 'flat-art', label: 'Flat Art' },
  ];

  const models = [
      { id: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro (Max Quality)' },
      { id: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash (Fast)' },
      { id: 'imagen-3.0-generate-001', label: 'Imagen 3 (Photo)' },
  ];

  const addNewPage = () => { setTotalPages(prev => prev + 1); setCurrentPage(prev => prev + 1); };
  const handlePrint = () => { window.print(); };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] overflow-hidden bg-slate-950 rounded-xl border border-slate-800 shadow-2xl print:border-none print:shadow-none print:h-auto print:bg-white print:overflow-visible">
      
      {/* SIDEBAR */}
      <div className="w-full lg:w-96 flex flex-col border-r border-slate-800 bg-slate-900 z-10 print:hidden">
        <div className="flex border-b border-slate-800">
            {[{id:'cover',icon:Book,l:t.tab_cover},{id:'story',icon:PenTool,l:t.tab_story},{id:'cast',icon:Users,l:t.tab_cast},{id:'style',icon:Settings2,l:t.tab_style}].map((x) => (
                 <button key={x.id} onClick={() => setActiveTab(x.id as SidebarTab)} className={`flex-1 py-3 flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition ${activeTab === x.id ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800' : 'text-slate-500 hover:bg-slate-800/50'}`}>
                    <x.icon className="w-4 h-4" /> {x.l}
                </button>
            ))}
        </div>

        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-slate-900">
             
             {/* COVER CREATOR TAB */}
             {activeTab === 'cover' && (
                 <div className="space-y-4 animate-fade-in">
                     <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">{t.cover_creator}</h3>
                     <form onSubmit={handleGenerateCover} className="space-y-3">
                         <input value={coverTitle} onChange={e => setCoverTitle(e.target.value)} placeholder={t.title_main} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-blue-500 outline-none font-bold text-lg" />
                         <input value={coverSubtitle} onChange={e => setCoverSubtitle(e.target.value)} placeholder={t.subtitle} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none text-sm" />
                         <input value={coverAuthor} onChange={e => setCoverAuthor(e.target.value)} placeholder={t.author} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none text-sm" />
                         <button type="submit" disabled={isGenCover || !coverTitle} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50">
                             {isGenCover ? <Loader2 className="animate-spin"/> : <Sparkles className="w-4 h-4"/>} {t.gen_cover_btn}
                         </button>
                     </form>
                     {coverData && (
                         <div className="mt-4 border border-slate-700 rounded-lg p-2 bg-slate-950">
                             <img src={coverData.imageUrl} className="w-full rounded mb-2" alt="Cover" />
                             <p className="text-center text-xs text-green-400 font-bold">Active Cover</p>
                         </div>
                     )}
                 </div>
             )}

             {activeTab === 'story' && (
                <div className="space-y-4">
                    
                    {/* --- LAZY MODE TOGGLE --- */}
                    <button onClick={() => setShowAutoStory(!showAutoStory)} className="w-full py-2 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg mb-2">
                        <Zap className="w-4 h-4 text-yellow-300" /> {showAutoStory ? t.hide_lazy_mode : t.lazy_mode_btn}
                    </button>

                    {showAutoStory ? (
                        <div className="bg-slate-800 p-3 rounded-xl border border-pink-500/50 animate-fade-in space-y-3">
                            <h4 className="text-xs font-bold text-pink-300 uppercase">{t.auto_story_title}</h4>
                            <p className="text-[10px] text-slate-400">{t.auto_story_desc}</p>
                            
                            {!isAutoCreatingPanels ? (
                                <>
                                    <textarea 
                                        value={storyIdea} 
                                        onChange={e => setStoryIdea(e.target.value)} 
                                        placeholder="..." 
                                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white h-20 resize-none"
                                    />
                                    <button onClick={handleDraftScript} disabled={isGeneratingScript || !storyIdea} className="w-full bg-pink-700 hover:bg-pink-600 text-white py-2 rounded text-xs font-bold flex justify-center items-center gap-2">
                                        {isGeneratingScript ? <Loader2 className="animate-spin w-3 h-3"/> : <PenTool className="w-3 h-3"/>} {t.create_draft_btn}
                                    </button>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto mb-2"/>
                                    <p className="text-xs text-white font-bold">... ({autoProgress} / {generatedScript.length})</p>
                                    <p className="text-[10px] text-slate-400">{t.waiting_art}</p>
                                </div>
                            )}

                            {generatedScript.length > 0 && !isAutoCreatingPanels && (
                                <div className="space-y-2 mt-2 border-t border-slate-700 pt-2">
                                    <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                                        {generatedScript.map((item, idx) => (
                                            <div key={idx} className="bg-slate-900 p-2 rounded text-[10px] border border-slate-700">
                                                <div className="font-bold text-slate-400 mb-1">#{idx+1}</div>
                                                <textarea 
                                                    value={item.description} 
                                                    onChange={e => updateScriptItem(idx, 'description', e.target.value)} 
                                                    className="w-full bg-black/50 text-slate-300 p-1 rounded mb-1 border border-slate-800"
                                                />
                                                <input 
                                                    value={item.caption} 
                                                    onChange={e => updateScriptItem(idx, 'caption', e.target.value)}
                                                    className="w-full bg-black/50 text-yellow-200 p-1 rounded border border-slate-800 font-comic"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={executeAutoStory} className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded text-xs font-bold flex justify-center items-center gap-2 shadow-lg animate-pulse">
                                        <Sparkles className="w-3 h-3"/> {t.gen_full_comic_btn}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* STANDARD MODE FORM */
                        <>
                        {editingPanelId && (
                            <div className="bg-indigo-900/30 border border-indigo-500 p-3 rounded-lg mb-2 flex justify-between items-center">
                                <span className="text-xs text-indigo-300 font-bold flex items-center gap-1"><RefreshCw className="w-3 h-3"/> Edit Mode</span>
                                <button onClick={cancelEdit} className="text-xs text-slate-400 hover:text-white underline">Cancel</button>
                            </div>
                        )}

                        <form onSubmit={handleGenerateOrUpdate} className="flex flex-col gap-3">
                            {/* MANUAL MODEL SELECTION */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Cpu className="w-3 h-3"/> {t.model_ai}</label>
                                <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none">
                                    {models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                                </select>
                            </div>

                            {/* PANEL SIZE SELECTOR */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Layout className="w-3 h-3"/> {t.panel_size}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button type="button" onClick={() => setSelectedPanelSize('small')} className={`p-2 border rounded text-xs ${selectedPanelSize === 'small' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400'}`}>{t.size_small}</button>
                                    <button type="button" onClick={() => setSelectedPanelSize('medium')} className={`p-2 border rounded text-xs ${selectedPanelSize === 'medium' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400'}`}>{t.size_medium}</button>
                                    <button type="button" onClick={() => setSelectedPanelSize('large')} className={`p-2 border rounded text-xs ${selectedPanelSize === 'large' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400'}`}>{t.size_large}</button>
                                </div>
                            </div>

                            <div className="relative">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder={t.prompt_placeholder}
                                    className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-4 pr-10 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none shadow-inner text-sm"
                                    disabled={isGenerating}
                                />
                                <button 
                                    type="button"
                                    onClick={handleEnhancePrompt}
                                    disabled={isEnhancing || !prompt}
                                    className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-purple-600 rounded-lg text-slate-400 hover:text-white transition disabled:opacity-30"
                                >
                                    {isEnhancing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Wand2 className="w-4 h-4"/>}
                                </button>
                            </div>
                            {status && <div className="text-xs text-center text-blue-400 animate-pulse">{status}</div>}
                            <button
                                type="submit"
                                disabled={isGenerating || !prompt}
                                className={`w-full text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg ${editingPanelId ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gradient-to-r from-blue-600 to-cyan-600'}`}
                            >
                                {isGenerating ? <Loader2 className="animate-spin" /> : editingPanelId ? <RefreshCw className="w-4 h-4"/> : <Send className="w-4 h-4" />}
                                {editingPanelId ? t.update_panel_btn : t.gen_panel_btn}
                            </button>
                        </form>
                        </>
                    )}
                    
                    <div className="border-t border-slate-800 pt-4 mt-2">
                        <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-2"><Grid className="w-4 h-4"/>{t.staging_area}</h4>
                        <div className="space-y-3">
                            {stagedPanels.length === 0 && !isGenerating && <p className="text-xs text-slate-600 italic">{t.staging_empty}</p>}
                            {stagedPanels.map(panel => (
                                <div key={panel.id} className="bg-slate-950 p-2 rounded-lg border border-slate-800 group relative">
                                    <div className="relative">
                                        <img src={panel.imageUrl} className="w-full h-24 object-cover rounded mb-2 opacity-80 group-hover:opacity-100 transition cursor-pointer" onClick={() => loadPanelForEdit(panel)} title="Edit"/>
                                        <div className="absolute top-1 right-1 bg-black/60 rounded px-1 text-[10px] text-white uppercase">{panel.size}</div>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                         <span className="text-[10px] text-slate-500 truncate max-w-[100px]">{panel.caption}</span>
                                         <div className="flex gap-1">
                                             <button onClick={() => loadPanelForEdit(panel)} className="p-1 text-blue-400 hover:bg-blue-900/30 rounded"><PenTool className="w-3 h-3"/></button>
                                             <button onClick={() => onRemovePanel(panel.id)} className="p-1 text-red-500 hover:bg-red-900/30 rounded"><Trash2 className="w-3 h-3"/></button>
                                         </div>
                                    </div>
                                    <button onClick={() => moveToPage(panel.id)} className="w-full py-1 bg-slate-800 hover:bg-green-600 text-[10px] text-slate-400 hover:text-white rounded border border-slate-700 transition flex items-center justify-center gap-1">
                                        <Move className="w-3 h-3" /> {t.add_to_page}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'cast' && (
                <div className="space-y-2">
                    {characters.map(c => (
                        <div key={c.id} onClick={() => toggleCharSelection(c.id)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border ${selectedCharIds.has(c.id) ? 'bg-green-900/20 border-green-500' : 'bg-slate-950 border-slate-800'}`}>
                            <img src={c.avatarUrl} className="w-8 h-8 rounded-full object-cover" />
                            <span className="text-sm font-bold truncate flex-1">{c.name}</span>
                        </div>
                    ))}
                </div>
            )}
            {activeTab === 'style' && (
                 <div className="grid grid-cols-1 gap-2">
                    {styles.map(s => (
                        <button key={s.id} onClick={() => setSelectedStyle(s.id)} className={`p-3 rounded-lg border text-left text-sm ${selectedStyle === s.id ? 'bg-purple-900/20 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>{s.label}</button>
                    ))}
                 </div>
            )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 bg-slate-900 relative flex flex-col print:bg-white print:block">
          
          <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900 print:hidden">
                <div className="flex items-center gap-4">
                    <span className="text-slate-400 text-sm font-semibold uppercase tracking-widest flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div> 
                        {t.page} {currentPage + 1} / {totalPages}
                    </span>
                    <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
                        <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className="p-1 text-slate-400 hover:text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4"/></button>
                        <button onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage === totalPages - 1} className="p-1 text-slate-400 hover:text-white disabled:opacity-30"><ChevronRight className="w-4 h-4"/></button>
                    </div>
                    <button onClick={addNewPage} className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-green-400 px-3 py-1.5 rounded-lg border border-slate-700 transition">
                        <FilePlus className="w-3 h-3"/> {t.new_page}
                    </button>
                </div>
                <button onClick={handlePrint} className="bg-slate-800 text-slate-300 hover:text-white hover:bg-blue-900/50 flex items-center gap-2 text-sm px-4 py-1.5 rounded-lg border border-slate-700 transition">
                    <Printer className="w-4 h-4" /> {t.print_pdf}
                </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-950 flex justify-center print:p-0 print:overflow-visible print:bg-white print:block">
                
                {coverData && (
                    <div className="hidden print:flex flex-col items-center justify-center w-full h-[297mm] bg-white text-black page-break-after-always relative overflow-hidden">
                        <img src={coverData.imageUrl} className="absolute inset-0 w-full h-full object-cover z-0" alt="Cover Art"/>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50 z-10"></div>
                        <div className="absolute top-20 left-0 right-0 text-center z-20">
                            <h1 className="font-comic text-9xl text-yellow-400 drop-shadow-[4px_4px_0_#000] tracking-wider uppercase">{coverData.title}</h1>
                            <h2 className="font-comic text-4xl text-white mt-4 tracking-widest">{coverData.subtitle}</h2>
                        </div>
                        <div className="absolute bottom-10 right-10 text-right z-20">
                            <p className="text-white text-xl font-bold">Created by</p>
                            <p className="text-yellow-400 text-3xl font-comic">{coverData.author}</p>
                        </div>
                    </div>
                )}

                {/* A4 CANVAS */}
                <div ref={pageRef} className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black shadow-2xl relative print:shadow-none print:w-full print:h-full print:max-w-none print:aspect-auto page-break-after-always flex flex-col">
                    <div className="flex-1 p-[10mm] flex flex-wrap content-start gap-3">
                        {placedPanels.length === 0 && (
                            <div className="w-full h-96 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-300 rounded-xl print:hidden">
                                <Plus className="w-12 h-12 mb-2 opacity-50"/>
                                <span className="text-sm font-bold uppercase tracking-widest">{t.add_to_page}</span>
                            </div>
                        )}

                        {placedPanels.map((panel) => {
                            const widthStyle = panel.widthPercent 
                                ? `${panel.widthPercent}%`
                                : (panel.size === 'small' ? '31%' : (panel.size === 'medium' ? '48%' : '100%'));

                            const isBeingResized = resizingPanelId === panel.id;
                            
                            return (
                                <div 
                                    key={panel.id} 
                                    className={`aspect-auto relative border-2 border-black bg-slate-100 group flex-grow print:border-black ${isBeingResized ? 'z-50 ring-4 ring-purple-500' : ''}`} 
                                    style={{
                                        minHeight: '150px', 
                                        width: widthStyle,
                                        flexGrow: panel.widthPercent ? 0 : 1 
                                    }}
                                >
                                    <img src={panel.imageUrl} className="w-full h-full object-cover select-none pointer-events-none" alt="" />
                                    
                                    {panel.caption && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-yellow-100 border-t-2 border-black p-2 text-[10px] md:text-xs font-comic uppercase text-center leading-tight">
                                            {panel.caption}
                                        </div>
                                    )}
                                    
                                    <div 
                                        className="absolute bottom-0 right-0 w-8 h-8 cursor-ew-resize opacity-0 group-hover:opacity-100 z-40 print:hidden flex items-end justify-end p-1 transition-opacity hover:opacity-100"
                                        onMouseDown={(e) => startResize(e, panel)}
                                    >
                                        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-b-[10px] border-b-purple-600 drop-shadow-md"></div>
                                    </div>
                                    
                                    {isBeingResized && (
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-3 py-2 rounded-lg text-lg font-bold z-50 shadow-2xl backdrop-blur-sm border border-white/20 flex items-center gap-2">
                                            <Scaling className="w-5 h-5 text-purple-400" />
                                            {Math.round(panel.widthPercent || 48)}%
                                        </div>
                                    )}

                                    {panel.bubbles?.map(bubble => (
                                        <div key={bubble.id} className="absolute cursor-move max-w-[80%] print:cursor-auto" style={{left: `${bubble.x}%`, top: `${bubble.y}%`, transform: `translate(-50%, -50%) scale(${bubble.scale})`}}>
                                            <div className="bg-white border-[3px] border-black px-3 py-2 rounded-[50%] shadow-lg relative min-w-[80px] text-center">
                                                    <input value={bubble.text} onChange={(e) => updateBubble(panel.id, bubble.id, {text: e.target.value})} className="font-comic text-xs md:text-sm uppercase text-center w-full bg-transparent outline-none text-black placeholder-slate-400 print:placeholder-transparent"/>
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex bg-black rounded p-1 opacity-0 group-hover:opacity-100 gap-1 z-50 print:hidden">
                                                        <button onClick={() => removeBubble(panel.id, bubble.id)} className="text-red-500"><Trash2 className="w-3 h-3"/></button>
                                                    </div>
                                            </div>
                                            <div className="w-3 h-3 bg-white border-r-[3px] border-b-[3px] border-black absolute -bottom-1 left-1/2 -translate-x-1/2 rotate-45"></div>
                                        </div>
                                    ))}

                                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition bg-white/90 p-1 rounded border border-black z-20 print:hidden">
                                        <button onClick={() => loadPanelForEdit(panel)} className="p-1 hover:text-blue-500"><PenTool className="w-4 h-4"/></button>
                                        <button onClick={() => moveToStaging(panel.id)} className="p-1 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                        <button onClick={() => addBubble(panel.id)} className="p-1 hover:text-blue-500"><MessageCircle className="w-4 h-4"/></button>
                                        
                                        <div className="h-px bg-slate-300 my-1"></div>
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => changeSize(panel.id, 'small')} className={`text-[8px] border px-1 ${panel.size==='small' && !panel.widthPercent ?'bg-black text-white':''}`}>1/3</button>
                                            <button onClick={() => changeSize(panel.id, 'medium')} className={`text-[8px] border px-1 ${panel.size==='medium' && !panel.widthPercent ?'bg-black text-white':''}`}>1/2</button>
                                            <button onClick={() => changeSize(panel.id, 'large')} className={`text-[8px] border px-1 ${panel.size==='large' && !panel.widthPercent ?'bg-black text-white':''}`}>FULL</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="text-center text-xs font-bold p-4 print:block">{currentPage + 1}</div>
                </div>
          </div>
          
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .print\\:block, .print\\:block * { visibility: visible; }
              .print\\:block { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
              .page-break-after-always { page-break-after: always; min-height: 100vh; }
              .print\\:flex { display: flex !important; }
              ::-webkit-scrollbar { display: none; }
            }
          `}</style>
      </div>
    </div>
  );
};

export default ComicBoard;