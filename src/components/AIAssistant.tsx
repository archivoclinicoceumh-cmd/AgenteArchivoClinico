
import React, { useState } from 'react';
import { Patient } from '../types';
import { analyzePatientData } from '../services/geminiService';
import { Send, Bot, User, Loader2 } from 'lucide-react';

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
    { role: 'assistant', content: 'Hola, soy tu asistente de Archivo Clínico. Puedo ayudarte a encontrar pacientes, redactar recordatorios o analizar tu base de datos.' }
  ]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsThinking(true);

    const response = await analyzePatientData(userMsg, patients);
    
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsThinking(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#111827] rounded-xl shadow-xl border border-slate-800 overflow-hidden">
      <div className="bg-[#0B1121] p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-purple-900/30 p-2 rounded-lg border border-purple-900/50">
           <Bot size={20} className="text-purple-400" />
        </div>
        <div>
          <h2 className="font-bold text-white text-sm">Asistente Inteligente</h2>
          <p className="text-slate-500 text-xs">Potenciado por Gemini 3</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm text-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-[#1F2937] text-slate-200 border border-slate-700 rounded-bl-none'
            }`}>
              <div className="flex items-start gap-2">
                {msg.role === 'assistant' && <Bot size={16} className="mt-1 flex-shrink-0 text-purple-400" />}
                <div className="prose prose-invert prose-sm max-w-none text-inherit leading-relaxed">
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className="mb-1 last:mb-0">{line}</p>
                  ))}
                </div>
                {msg.role === 'user' && <User size={16} className="mt-1 flex-shrink-0 text-blue-200" />}
              </div>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-[#1F2937] text-slate-400 border border-slate-700 rounded-2xl p-4 rounded-bl-none flex items-center gap-2 text-sm">
              <Loader2 size={16} className="animate-spin text-purple-400" />
              <span>Analizando base de datos...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSearch} className="p-4 bg-[#111827] border-t border-slate-800">
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe tu consulta aquí..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-5 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm text-white placeholder-slate-500"
          />
          <button 
            type="submit" 
            disabled={isThinking || !query.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors absolute right-1 top-1 bottom-1 flex items-center justify-center aspect-square"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};
