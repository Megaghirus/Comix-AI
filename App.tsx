import React, { useState, useEffect } from 'react';
import { Character, ComicPanel } from './types';
import CharacterCreator from './components/CharacterCreator';
import ComicBoard from './components/ComicBoard';
import { checkApiKey, promptForApiKey } from './services/geminiService';
import { BookOpen, Users, Key, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [apiKeySet, setApiKeySet] = useState(false);
  const [activeTab, setActiveTab] = useState<'characters' | 'comic'>('characters');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [panels, setPanels] = useState<ComicPanel[]>([]);

  useEffect(() => {
    // Initial check
    checkApiKey().then(setApiKeySet);
  }, []);

  const handleConnect = async () => {
    await promptForApiKey();
    // Re-check after prompt
    const hasKey = await checkApiKey();
    setApiKeySet(hasKey);
  };

  const addCharacter = (char: Character) => {
    setCharacters(prev => [...prev, char]);
    // Switch to comic tab automatically if it's the first character to encourage flow
    if (characters.length === 0) {
        // Optional: keep on characters tab to let them add more, 
        // or switch. Let's keep on characters tab for bulk creation.
    }
  };

  const removeCharacter = (id: string) => {
    setCharacters(prev => prev.filter(c => c.id !== id));
  };

  const addPanel = (panel: ComicPanel) => {
    setPanels(prev => [...prev, panel]);
    // Scroll to bottom logic could be added here
  };

  const removePanel = (id: string) => {
    setPanels(prev => prev.filter(p => p.id !== id));
  };

  if (!apiKeySet) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
          <Sparkles className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h1 className="text-4xl font-comic text-white mb-4">AI Comix Studio</h1>
          <p className="text-slate-400 mb-8">
            Pentru a crea benzi desenate și personaje uimitoare, avem nevoie de acces la Google Gemini API (Veo & Imagen).
          </p>
          <div className="space-y-4">
            <button
              onClick={handleConnect}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl transition flex items-center justify-center gap-3 text-lg"
            >
              <Key className="w-6 h-6" />
              Conectează API Key
            </button>
            <p className="text-xs text-slate-500">
              Vizitează <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">documentația de facturare</a> pentru detalii.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-yellow-500" />
            <span className="font-comic text-2xl tracking-wide text-white">AI Comix</span>
          </div>
          
          <nav className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('characters')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition text-sm font-semibold ${
                activeTab === 'characters' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Personaje
            </button>
            <button
              onClick={() => setActiveTab('comic')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition text-sm font-semibold ${
                activeTab === 'comic' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Bandă Desenată
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {activeTab === 'characters' ? (
          <div className="animate-fade-in">
             <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Editor Personaje</h1>
                <p className="text-slate-400">Definește eroii și răufăcătorii poveștii tale. AI-ul va folosi aceste descrieri pentru a menține consistența.</p>
             </div>
             <CharacterCreator 
                characters={characters} 
                onAddCharacter={addCharacter} 
                onRemoveCharacter={removeCharacter}
             />
          </div>
        ) : (
          <div className="h-full flex flex-col animate-fade-in">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Creator Povești</h1>
                    <p className="text-slate-400">Scrie ce se întâmplă, iar AI-ul va genera imaginile și dialogurile.</p>
                </div>
                <div className="text-right text-sm text-slate-500">
                    {characters.length} personaje disponibile
                </div>
            </div>
            <ComicBoard 
                characters={characters}
                panels={panels}
                onAddPanel={addPanel}
                onRemovePanel={removePanel}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;