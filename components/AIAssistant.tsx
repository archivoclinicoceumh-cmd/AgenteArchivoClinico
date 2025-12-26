
import React, { useState } from 'react';
import { Patient } from '../types';
import { analyzePatientData } from '../services/geminiService';
// Added ChevronRight to the icons imported from lucide-react
import { Send, Bot, User, Loader2, Sparkles, HelpCircle, ChevronRight } from 'lucide-react';

interface AIAssistantProps {
  patients: Patient[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ patients }) => {
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy tu asistente inteligente de la Clínica. Analizo tu base de datos de pacientes en tiempo real.\n\n¿En qué puedo apoyarte hoy?' }
  ]);

  const SUGGESTED_QUESTIONS = [
    "¿Cuántos pacientes tienen deudas pendientes?",
    "¿Qué pacientes están en ruta de Endodoncia?",
    "¿Quiénes son mis pacientes con ASA III?",
    "Redacta un mensaje de recordatorio para mis pacientes activos.",
    "Analiza qué clínica tiene mayor carga de trabajo."
  ];

  const handleSearch = async (userQuery: string) => {
    if (!userQuery.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setQuery('');
    setIsThinking(true);

    const response = await analyzePatientData(userQuery, patients);
    
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsThinking(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#111827] rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
      <div className="bg-[#0B1121] p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-purple-600/20 p-2.5 rounded-xl border border-purple-500/30">
             <Bot size={24} className="text-purple-400" />
          </div>
          <div>
            <h2 className="font-bold text-white text-base">Asistente Inteligente</h2>
            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Motorizado por Gemini 3</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Conexión Segura</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll bg-slate-950/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-5 shadow-lg text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-[#1F2937] text-slate-200 border border-slate-800 rounded-bl-none'
            }`}>
              <div className="flex items-start gap-3">
                {msg.role === 'assistant' && <Sparkles size={18} className="mt-1 flex-shrink-0 text-purple-400" />}
                <div className="prose prose-invert prose-sm max-w-none text-inherit">
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className="mb-2 last:mb-0">{line}</p>
                  ))}
                </div>
                {msg.role === 'user' && <User size={18} className="mt-1 flex-shrink-0 text-blue-200" />}
              </div>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-[#1F2937] text-slate-400 border border-slate-800 rounded-2xl p-5 rounded-bl-none flex items-center gap-3 text-sm shadow-inner">
              <Loader2 size={18} className="animate-spin text-purple-400" />
              <span className="font-medium">Consultando expedientes...</span>
            </div>
          </div>
        )}
        
        {/* Sugerencias cuando no hay muchos mensajes */}
        {messages.length === 1 && !isThinking && (
          <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex items-center gap-2 text-slate-500 mb-4 px-2">
                <HelpCircle size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Preguntas Sugeridas</span>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSearch(q)}
                    className="text-left p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:border-purple-500 hover:text-white hover:bg-slate-800 transition-all flex justify-between items-center group shadow-sm"
                  >
                    {q}
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
             </div>
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSearch(query); }} className="p-5 bg-[#0B1121] border-t border-slate-800">
        <div className="flex gap-3 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe tu consulta sobre la base de datos..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm text-white placeholder-slate-600 shadow-inner"
          />
          <button 
            type="submit" 
            disabled={isThinking || !query.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg shadow-blue-900/30"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-600 mt-3 font-medium uppercase tracking-tight">Los datos analizados son privados y no salen de tu entorno seguro.</p>
      </form>
    </div>
  );
};
