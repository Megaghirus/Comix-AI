import React, { useState, useEffect } from 'react';
import { Character, ComicPanel, Language } from './types';
import CharacterCreator from './components/CharacterCreator';
import ComicBoard from './components/ComicBoard';
import Footer from './components/Footer';
import ManifestoModal from './components/ManifestoModal'; // Import the new modal
import { setApiKeys, validateKey, LLMProvider, optimizeSystemPrompt } from './services/geminiService';
import { translations } from './services/translations';
import { BookOpen, Users, Key, Sparkles, LogIn, Eye, EyeOff, Loader2, Settings, Zap, CheckCircle, XCircle, BrainCircuit, Server, Cpu, Globe, MessageSquare, Bot, Check } from 'lucide-react';

const App: React.FC = () => {
  // Settings Modal States
  const [showSettings, setShowSettings] = useState(false);
  // NEW: Manifesto Modal State
  const [showManifesto, setShowManifesto] = useState(false);

  const [isHybridActive, setIsHybridActive] = useState(false);
  const [language, setLanguage] = useState<Language>('ro');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  
  // API Keys Management
  const [keys, setKeys] = useState<Record<LLMProvider, string>>({
      gemini: '',
      openai: '',
      deepseek: '',
      grok: '',
      qwen: ''
  });
  
  const [validationStatus, setValidationStatus] = useState<Record<LLMProvider, string>>({
      gemini: 'idle',
      openai: 'idle',
      deepseek: 'idle',
      grok: 'idle',
      qwen: 'idle'
  });

  const [activeTab, setActiveTab] = useState<'characters' | 'comic'>('characters');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [panels, setPanels] = useState<ComicPanel[]>([]);

  // Translation Helper
  const t = translations[language];

  useEffect(() => {
    // Load Application Data
    const savedChars = localStorage.getItem('ai_comix_chars');
    const savedPanels = localStorage.getItem('ai_comix_panels');
    const savedLang = localStorage.getItem('ai_comix_lang');
    const savedPrompt = localStorage.getItem('ai_comix_sys_prompt');
    
    if (savedChars) try { setCharacters(JSON.parse(savedChars) as Character[]); } catch (e) {}
    if (savedPanels) try { setPanels(JSON.parse(savedPanels) as ComicPanel[]); } catch (e) {}
    if (savedLang) setLanguage(savedLang as Language);
    if (savedPrompt) setSystemPrompt(savedPrompt);

    // Load API Keys from LocalStorage
    const loadedKeys: Record<LLMProvider, string> = {
        gemini: localStorage.getItem('key_gemini') || '',
        openai: localStorage.getItem('key_openai') || '',
        deepseek: localStorage.getItem('key_deepseek') || '',
        grok: localStorage.getItem('key_grok') || '',
        qwen: localStorage.getItem('key_qwen') || '',
    };
    
    // Apply loaded keys to state and service
    setKeys(loadedKeys);
    setApiKeys(loadedKeys);
    
    // Check if enough keys are present for Hybrid Mode
    checkHybridStatus(loadedKeys);

    // Initial check: if no Gemini key, show settings immediately (soft onboarding)
    if (!loadedKeys.gemini && !process.env.API_KEY) {
        setShowSettings(true);
    }
  }, []);

  const checkHybridStatus = (currentKeys: typeof keys) => {
      const visualEngine = !!currentKeys.gemini;
      const logicEngine = !!currentKeys.openai || !!currentKeys.deepseek || !!currentKeys.grok || !!currentKeys.qwen;
      setIsHybridActive(visualEngine && logicEngine);
  };

  // Auto-save application data (Characters, Panels) on change
  useEffect(() => { localStorage.setItem('ai_comix_chars', JSON.stringify(characters)); }, [characters]);
  useEffect(() => { localStorage.setItem('ai_comix_panels', JSON.stringify(panels)); }, [panels]);
  
  // NOTE: Language and System Prompt are saved explicitly in handleSaveSettings, 
  // but we also keep auto-save for better UX if user closes tab without saving.
  useEffect(() => { localStorage.setItem('ai_comix_lang', language); }, [language]);
  useEffect(() => { localStorage.setItem('ai_comix_sys_prompt', systemPrompt); }, [systemPrompt]);

  const updateKey = (provider: LLMProvider, value: string) => {
      const newKeys = { ...keys, [provider]: value };
      setKeys(newKeys);
      setValidationStatus({ ...validationStatus, [provider]: 'idle' });
  };

  const validateProvider = async (provider: LLMProvider) => {
      setValidationStatus(prev => ({ ...prev, [provider]: 'loading' }));
      const isValid = await validateKey(provider, keys[provider]);
      setValidationStatus(prev => ({ ...prev, [provider]: isValid ? 'valid' : 'invalid' }));
  };

  const handleOptimizePrompt = async () => {
      if (!systemPrompt.trim()) return;
      setIsOptimizingPrompt(true);
      try {
          const optimized = await optimizeSystemPrompt(systemPrompt, language);
          setSystemPrompt(optimized);
      } catch (e) {
          alert("Optimization failed. Ensure you have a valid API Key.");
      } finally {
          setIsOptimizingPrompt(false);
      }
  };

  const handleSaveSettings = () => {
      // 1. Save Keys to LocalStorage
      Object.entries(keys).forEach(([provider, key]) => {
          if (key) localStorage.setItem(`key_${provider}`, key as string);
          else localStorage.removeItem(`key_${provider}`);
      });

      // 2. Save Preferences Explicitly
      localStorage.setItem('ai_comix_lang', language);
      localStorage.setItem('ai_comix_sys_prompt', systemPrompt);

      // 3. Update Service & Status
      setApiKeys(keys);
      checkHybridStatus(keys);
      
      // 4. Visual Feedback
      setSaveStatus('saved');
      
      // Close modal after delay
      setTimeout(() => {
          setSaveStatus('idle');
          setShowSettings(false);
      }, 1500);
  };

  const addCharacter = (char: Character) => setCharacters(prev => [...prev, char]);
  const removeCharacter = (id: string) => setCharacters(prev => prev.filter(c => c.id !== id));
  const addPanel = (panel: ComicPanel) => setPanels(prev => [...prev, panel]);
  const removePanel = (id: string) => setPanels(prev => prev.filter(p => p.id !== id));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* MANIFESTO MODAL */}
      {showManifesto && (
        <ManifestoModal onClose={() => setShowManifesto(false)} t={t} />
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-slate-950 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                      <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings className="w-6 h-6 text-blue-400"/> {t.settings_title}</h2>
                        <p className="text-xs text-slate-400">{t.settings_desc}</p>
                      </div>
                      
                      {/* LANGUAGE SWITCHER IN HEADER */}
                      <div className="flex gap-2 mr-4">
                          <button onClick={() => setLanguage('ro')} className={`px-2 py-1 rounded text-xs font-bold transition ${language==='ro'?'bg-blue-600 text-white shadow-lg shadow-blue-500/30':'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>RO</button>
                          <button onClick={() => setLanguage('ru')} className={`px-2 py-1 rounded text-xs font-bold transition ${language==='ru'?'bg-blue-600 text-white shadow-lg shadow-blue-500/30':'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>RU</button>
                          <button onClick={() => setLanguage('en')} className={`px-2 py-1 rounded text-xs font-bold transition ${language==='en'?'bg-blue-600 text-white shadow-lg shadow-blue-500/30':'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>EN</button>
                      </div>

                      <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
                      
                      {/* 1. HYBRID STATUS */}
                      <div className={`p-4 rounded-xl border relative overflow-hidden transition-all duration-500 ${isHybridActive ? 'bg-indigo-900/30 border-indigo-500' : 'bg-slate-900 border-slate-800'}`}>
                          <div className="flex items-center gap-4 relative z-10">
                              <div className={`p-3 rounded-full ${isHybridActive ? 'bg-indigo-600 animate-pulse' : 'bg-slate-700'}`}>
                                  <BrainCircuit className="w-8 h-8 text-white" />
                              </div>
                              <div>
                                  <h3 className="text-lg font-bold text-white">{t.hybrid_logic_title}</h3>
                                  <p className="text-sm text-slate-400">
                                      {isHybridActive ? t.hybrid_active_desc : t.hybrid_inactive_desc}
                                  </p>
                              </div>
                          </div>
                          {isHybridActive && <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 blur-[80px] opacity-20"></div>}
                      </div>

                      {/* 2. API KEYS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* VISUAL ENGINE */}
                          <div className="md:col-span-2">
                              <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-2"><Eye className="w-4 h-4"/> {t.visual_engine}</h4>
                              <div className="bg-slate-900 p-4 rounded-xl border border-blue-900/50">
                                  <div className="flex items-center gap-2 mb-2">
                                      <Sparkles className="w-5 h-5 text-blue-400"/>
                                      <span className="font-bold text-white">Google Gemini / Imagen</span>
                                  </div>
                                  <div className="flex gap-2">
                                      <input 
                                        type="password" 
                                        value={keys.gemini} 
                                        onChange={(e) => updateKey('gemini', e.target.value)} 
                                        placeholder="AI Studio API Key (Starts with AIza...)"
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-slate-600"
                                      />
                                      <button onClick={() => validateProvider('gemini')} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-white transition">
                                          {validationStatus.gemini === 'loading' ? <Loader2 className="animate-spin"/> : t.check}
                                      </button>
                                  </div>
                                  {validationStatus.gemini === 'valid' && <span className="text-xs text-green-500 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> {t.validated}</span>}
                              </div>
                          </div>

                          {/* LOGIC ENGINES */}
                          <div className="md:col-span-2 mt-2">
                               <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-2"><Cpu className="w-4 h-4"/> {t.logic_engines}</h4>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   {/* DeepSeek */}
                                   <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-white flex items-center gap-2">DeepSeek V3/R1</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <input type="password" value={keys.deepseek} onChange={e => updateKey('deepseek', e.target.value)} placeholder="sk-..." className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"/>
                                            <button onClick={() => validateProvider('deepseek')} className="px-2 bg-slate-800 rounded text-xs">{validationStatus.deepseek === 'loading' ? <Loader2 className="w-3 h-3 animate-spin"/> : t.check}</button>
                                        </div>
                                   </div>
                                   {/* OpenAI */}
                                   <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-green-500/50 transition">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-white flex items-center gap-2">OpenAI GPT-4o</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <input type="password" value={keys.openai} onChange={e => updateKey('openai', e.target.value)} placeholder="sk-..." className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"/>
                                            <button onClick={() => validateProvider('openai')} className="px-2 bg-slate-800 rounded text-xs">{validationStatus.openai === 'loading' ? <Loader2 className="w-3 h-3 animate-spin"/> : t.check}</button>
                                        </div>
                                   </div>
                                   {/* Grok */}
                                   <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-white/30 transition">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-white flex items-center gap-2">xAI Grok</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <input type="password" value={keys.grok} onChange={e => updateKey('grok', e.target.value)} placeholder="xai-..." className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"/>
                                            <button onClick={() => validateProvider('grok')} className="px-2 bg-slate-800 rounded text-xs">{validationStatus.grok === 'loading' ? <Loader2 className="w-3 h-3 animate-spin"/> : t.check}</button>
                                        </div>
                                   </div>
                                   {/* Qwen */}
                                   <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-purple-500/50 transition">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-white flex items-center gap-2">Alibaba Qwen</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <input type="password" value={keys.qwen} onChange={e => updateKey('qwen', e.target.value)} placeholder="sk-..." className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"/>
                                            <button onClick={() => validateProvider('qwen')} className="px-2 bg-slate-800 rounded text-xs">{validationStatus.qwen === 'loading' ? <Loader2 className="w-3 h-3 animate-spin"/> : t.check}</button>
                                        </div>
                                   </div>
                               </div>
                          </div>
                      </div>

                      {/* 3. SYSTEM PROMPT EDITOR */}
                      <div className="border-t border-slate-800 pt-6">
                           <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-2"><Bot className="w-4 h-4"/> {t.sys_prompt_title}</h4>
                           <div className="bg-slate-900 p-4 rounded-xl border border-purple-900/50">
                               <p className="text-xs text-slate-400 mb-2">{t.sys_prompt_desc}</p>
                               <div className="relative">
                                   <textarea 
                                       value={systemPrompt}
                                       onChange={(e) => setSystemPrompt(e.target.value)}
                                       className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none resize-none mb-2"
                                       placeholder={t.sys_prompt_placeholder}
                                   />
                                   <button 
                                        onClick={handleOptimizePrompt} 
                                        disabled={isOptimizingPrompt || !systemPrompt}
                                        className="absolute bottom-4 right-4 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg disabled:opacity-50 transition transform hover:scale-105"
                                   >
                                       {isOptimizingPrompt ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                                       {isOptimizingPrompt ? t.optimizing : t.optimize_btn}
                                   </button>
                               </div>
                           </div>
                      </div>

                  </div>

                  <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900">
                      <button 
                        onClick={handleSaveSettings} 
                        disabled={saveStatus === 'saved'}
                        className={`px-8 py-3 rounded-xl font-bold shadow-lg transition transform hover:scale-105 flex items-center gap-2 ${saveStatus === 'saved' ? 'bg-green-600 text-white cursor-default' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'}`}
                      >
                          {saveStatus === 'saved' ? <Check className="w-5 h-5" /> : <Server className="w-4 h-4"/>} 
                          {saveStatus === 'saved' ? 'Setări Salvate!' : t.save_config}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab('characters')}>
             {/* LOGO */}
             <div className="relative">
                 <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                 <div className="relative px-3 py-2 bg-black ring-1 ring-slate-900/5 leading-none flex items-center justify-center rounded-lg">
                     <span className="font-comic text-2xl text-yellow-400 -rotate-3 block filter drop-shadow-[2px_2px_0_rgba(255,255,255,0.2)]">AI</span>
                 </div>
             </div>
             <div className="flex flex-col">
                 <h1 className="font-comic text-3xl tracking-wide text-white leading-none drop-shadow-[2px_2px_0px_rgba(79,70,229,1)]">
                     {t.app_title} <span className="text-yellow-400">{t.app_subtitle}</span>
                 </h1>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button onClick={() => setActiveTab('characters')} className={`flex items-center gap-2 px-4 py-2 rounded-md transition text-sm font-semibold ${activeTab === 'characters' ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' : 'text-slate-400 hover:text-white'}`}>
                    <Users className="w-4 h-4" /> {t.nav_chars}
                </button>
                <button onClick={() => setActiveTab('comic')} className={`flex items-center gap-2 px-4 py-2 rounded-md transition text-sm font-semibold ${activeTab === 'comic' ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' : 'text-slate-400 hover:text-white'}`}>
                    <BookOpen className="w-4 h-4" /> {t.nav_studio}
                </button>
            </nav>
            
            <div onClick={() => setShowSettings(true)} className={`cursor-pointer px-3 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-bold transition ${isHybridActive ? 'bg-indigo-900/20 border-indigo-500 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                {isHybridActive ? <BrainCircuit className="w-4 h-4 animate-pulse"/> : <Settings className="w-4 h-4"/>}
                {isHybridActive ? t.hybrid_active : t.setup_ai}
            </div>
            
            <div className="text-xs font-bold bg-slate-800 px-2 py-1 rounded text-slate-400 uppercase">{language}</div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {activeTab === 'characters' ? (
          <div className="animate-fade-in">
             <div className="mb-8 border-b border-slate-800 pb-4">
                <h2 className="text-3xl font-bold text-white mb-2">{t.editor_title}</h2>
                <p className="text-slate-400">{t.editor_desc}</p>
             </div>
             <CharacterCreator 
                characters={characters} 
                onAddCharacter={addCharacter} 
                onRemoveCharacter={removeCharacter} 
                lang={language}
                t={t}
             />
          </div>
        ) : (
          <div className="h-full flex flex-col animate-fade-in">
            <div className="mb-6 flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1">{t.studio_title}</h2>
                    <p className="text-slate-400 text-sm">
                        {t.studio_desc}
                    </p>
                </div>
            </div>
            <ComicBoard 
                characters={characters} 
                panels={panels} 
                onAddPanel={addPanel} 
                onRemovePanel={removePanel}
                lang={language}
                t={t}
                systemPrompt={systemPrompt}
            />
          </div>
        )}
      </main>

      <Footer t={t} onOpenManifesto={() => setShowManifesto(true)} />
    </div>
  );
};

export default App;