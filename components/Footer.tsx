import React from 'react';
import { Sparkles, Mail, Phone, ExternalLink, Globe, BarChart3, Image, Heart, Send, Feather, BookOpen } from 'lucide-react';

interface FooterProps {
    t: any;
    onOpenManifesto: () => void;
}

const Footer: React.FC<FooterProps> = ({ t, onOpenManifesto }) => {
  return (
    <footer className="bg-slate-950 pt-16 pb-8 border-t border-slate-900">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
          
          {/* Brand & Vision Column */}
          <div className="md:col-span-5 space-y-6">
            <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg shadow-lg shadow-purple-500/20">
                   <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">AI Comix Studio</h3>
            </div>
            
            {/* Philosophical Description */}
            <p className="text-slate-400 text-sm leading-relaxed border-l-2 border-indigo-500 pl-4 italic">
              "{t ? t.footer_desc : "I believe..."}"
            </p>

            <div className="flex flex-wrap gap-3">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/30 border border-green-800 text-green-400 text-xs font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Systems Active
                </div>
                
                {/* Manifesto Trigger */}
                <button onClick={onOpenManifesto} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 text-xs font-bold uppercase tracking-wider hover:bg-yellow-500/20 transition">
                    <BookOpen className="w-3 h-3" />
                    {t ? t.read_manifesto : "READ MANIFESTO"}
                </button>
            </div>
          </div>

          {/* Contact Column (Simplified) */}
          <div className="md:col-span-3 space-y-6">
             <div>
                <h4 className="text-white font-bold uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                    <Send className="w-3 h-3 text-blue-400"/> {t ? t.contact_rapid : "Contact"}
                </h4>
                
                {/* Single Link: Telegram Support */}
                <a href="https://t.me/SEO_Senior" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 bg-slate-900 hover:bg-blue-600 border border-slate-800 hover:border-blue-500 p-3 rounded-xl transition-all duration-300">
                    <div className="bg-blue-500/20 group-hover:bg-white/20 p-2 rounded-full">
                        <Send className="w-5 h-5 text-blue-400 group-hover:text-white" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 group-hover:text-blue-100 uppercase font-bold">Direct Chat</p>
                        {/* Only "Suport Telegram" / "Telegram Support" is shown here via t.contact_link */}
                        <p className="text-white font-bold text-sm">{t ? t.contact_link : "Telegram Support"}</p>
                    </div>
                </a>
             </div>
          </div>

          {/* Sponsored Tools Column */}
          <div className="md:col-span-4 space-y-4">
             <div className="flex justify-between items-center mb-2">
                <h4 className="text-white font-bold uppercase text-xs tracking-widest">{t ? t.sponsored : "Sponsored Tools"}</h4>
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">SPOTLIGHT</span>
             </div>
             
             <a href="https://seo-geo-arhitect.top/" target="_blank" rel="noopener noreferrer" className="group bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-3 rounded-lg cursor-pointer transition flex items-start gap-4">
                <div className="bg-slate-800 group-hover:bg-slate-700 p-2 rounded-md">
                    <Globe className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                    <h5 className="text-white font-bold text-sm flex items-center gap-2">SEO-GEO Arhitect <ExternalLink className="w-3 h-3 opacity-50"/></h5>
                    <p className="text-xs text-slate-500">Optimizare geografică avansată pentru motoare de căutare.</p>
                </div>
             </a>

             <a href="https://organictrafficvalue-swqjazxpndemcnxaduvmd7.streamlit.app/" target="_blank" rel="noopener noreferrer" className="group bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-3 rounded-lg cursor-pointer transition flex items-start gap-4">
                <div className="bg-slate-800 group-hover:bg-slate-700 p-2 rounded-md">
                    <BarChart3 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                    <h5 className="text-white font-bold text-sm flex items-center gap-2">GSC Organic Value Assistant <ExternalLink className="w-3 h-3 opacity-50"/></h5>
                    <p className="text-xs text-slate-500">Analiză de valoare a traficului organic.</p>
                </div>
             </a>

             <a href="https://meta-image-serhio.streamlit.app/" target="_blank" rel="noopener noreferrer" className="group bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-3 rounded-lg cursor-pointer transition flex items-start gap-4">
                <div className="bg-slate-800 group-hover:bg-slate-700 p-2 rounded-md">
                    <Image className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                    <h5 className="text-white font-bold text-sm flex items-center gap-2">Edit Meta Image <ExternalLink className="w-3 h-3 opacity-50"/></h5>
                    <p className="text-xs text-slate-500">Generator și editor pentru imagini meta.</p>
                </div>
             </a>
          </div>

        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <p>© 2026 <a href="https://www.serhio-tomasito.online/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400">Serhio Tomasito</a>. {t ? t.rights : "Rights Reserved"}</p>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-1">
                    <span>{t ? t.made_with : "Made with"}</span> 
                    <Heart className="w-3 h-3 text-red-500 fill-current animate-pulse" /> 
                    <span>{t ? t.for_geo : "for GEO SEO"}</span>
                </div>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;