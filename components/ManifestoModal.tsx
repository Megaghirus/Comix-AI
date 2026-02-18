import React from 'react';
import { X, Sparkles, Rocket, Zap, Palette } from 'lucide-react';

interface ManifestoModalProps {
    onClose: () => void;
    t: any;
}

const ManifestoModal: React.FC<ManifestoModalProps> = ({ onClose, t }) => {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in bg-black/90 backdrop-blur-xl overflow-y-auto">
            {/* Modal Container */}
            <div 
                className="relative w-full max-w-3xl bg-white text-black border-4 border-black shadow-[8px_8px_0px_0px_#facc15] rounded-xl overflow-hidden my-8"
                onClick={(e) => e.stopPropagation()} 
            >
                
                {/* Header Panel */}
                <div className="bg-blue-600 border-b-4 border-black p-6 relative overflow-hidden">
                    {/* Background blob - low z-index */}
                    <div className="absolute top-0 right-0 p-8 opacity-10 z-0">
                        <div className="w-64 h-64 bg-yellow-400 rounded-full blur-3xl"></div>
                    </div>
                    
                    {/* CLOSE BUTTON - HIGH Z-INDEX */}
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 bg-black text-white p-2 rounded hover:rotate-90 transition duration-300 border-2 border-white shadow-[4px_4px_0px_0px_#000] z-50 cursor-pointer"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    
                    <h2 className="relative z-10 font-comic text-5xl md:text-6xl text-yellow-300 drop-shadow-[4px_4px_0_#000] uppercase tracking-wider -rotate-1 mb-2">
                        {t.man_title}
                    </h2>
                    <p className="relative z-10 text-white font-bold text-xl md:text-2xl uppercase tracking-widest bg-black inline-block px-2 transform rotate-1">
                        {t.man_subtitle}
                    </p>
                </div>

                {/* Comic Strip Content */}
                <div className="p-6 md:p-10 space-y-8 bg-[url('https://www.transparenttextures.com/patterns/halftone.png')]">
                    
                    {/* Panel 1 */}
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                         <div className="w-full md:w-1/3 flex justify-center">
                             <div className="w-32 h-32 bg-pink-500 rounded-full border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_#000]">
                                 <Rocket className="w-16 h-16 text-white" />
                             </div>
                         </div>
                         <div className="w-full md:w-2/3 bg-white border-2 border-black p-4 rounded-xl shadow-[6px_6px_0px_0px_#cbd5e1] relative">
                             <div className="absolute -left-3 top-1/2 w-6 h-6 bg-white border-l-2 border-b-2 border-black transform rotate-45 hidden md:block"></div>
                             <h3 className="font-comic text-3xl text-pink-600 mb-2">{t.man_p1_title}</h3>
                             <p className="font-bold text-slate-800">{t.man_p1_desc}</p>
                         </div>
                    </div>

                    {/* Panel 2 (Reverse) */}
                    <div className="flex flex-col md:flex-row-reverse gap-6 items-center">
                         <div className="w-full md:w-1/3 flex justify-center">
                             <div className="w-32 h-32 bg-yellow-400 rounded-full border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_#000]">
                                 <Zap className="w-16 h-16 text-black" />
                             </div>
                         </div>
                         <div className="w-full md:w-2/3 bg-white border-2 border-black p-4 rounded-xl shadow-[6px_6px_0px_0px_#cbd5e1] relative">
                             <div className="absolute -right-3 top-1/2 w-6 h-6 bg-white border-r-2 border-t-2 border-black transform rotate-45 hidden md:block"></div>
                             <h3 className="font-comic text-3xl text-yellow-600 mb-2">{t.man_p2_title}</h3>
                             <p className="font-bold text-slate-800">{t.man_p2_desc}</p>
                         </div>
                    </div>

                    {/* Panel 3 */}
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                         <div className="w-full md:w-1/3 flex justify-center">
                             <div className="w-32 h-32 bg-indigo-600 rounded-full border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_#000]">
                                 <Palette className="w-16 h-16 text-white" />
                             </div>
                         </div>
                         <div className="w-full md:w-2/3 bg-white border-2 border-black p-4 rounded-xl shadow-[6px_6px_0px_0px_#cbd5e1] relative">
                             <div className="absolute -left-3 top-1/2 w-6 h-6 bg-white border-l-2 border-b-2 border-black transform rotate-45 hidden md:block"></div>
                             <h3 className="font-comic text-3xl text-indigo-600 mb-2">{t.man_p3_title}</h3>
                             <p className="font-bold text-slate-800">{t.man_p3_desc}</p>
                         </div>
                    </div>

                </div>

                {/* Footer Action */}
                <div className="bg-black p-6 text-center">
                    <button onClick={onClose} className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white font-comic text-2xl px-12 py-4 rounded-xl border-2 border-white shadow-[0px_0px_20px_rgba(239,68,68,0.5)] transform hover:scale-105 transition flex items-center justify-center gap-3 mx-auto">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                        {t.man_cta}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ManifestoModal;