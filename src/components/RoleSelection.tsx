
import React, { useState } from 'react';
import { Shield, UserPlus, GraduationCap, ArrowRight, Lock, KeyRound, X } from 'lucide-react';
import { UserRole } from '../types';

interface RoleSelectionProps {
  onSelectRole: (role: UserRole) => void;
}

const ROLE_PASSWORDS: Record<UserRole, string> = {
  admin: 'admin2024',
  registrar: 'registro2024',
  student: 'alumno2024'
};

export const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelectRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRoleClick = (role: UserRole) => {
    setSelectedRole(role);
    setPassword('');
    setError('');
    setIsModalOpen(true);
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedRole && ROLE_PASSWORDS[selectedRole] === password) {
      onSelectRole(selectedRole);
    } else {
      setError('Contraseña incorrecta');
      setPassword('');
    }
  };

  const getRoleName = (role: UserRole | null) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'registrar': return 'Personal de Registro';
      case 'student': return 'Alumno / Consulta';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-6xl w-full z-10 space-y-12">
        <div className="text-center">
          <h1 className="text-6xl font-black text-white mb-4 tracking-tighter uppercase italic">
            Archivo <span className="text-blue-500 not-italic">Dental</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs">Gestión Centralizada de Expedientes Clínicos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Admin */}
          <button onClick={() => handleRoleClick('admin')} className="group bg-[#0B1121] border border-slate-800 p-8 rounded-3xl text-left hover:border-purple-600/50 hover:bg-slate-900 transition-all shadow-2xl">
             <div className="w-14 h-14 bg-purple-600/20 rounded-2xl flex items-center justify-center mb-8 border border-purple-500/30">
               <Shield className="text-purple-400" size={28} />
             </div>
             <h3 className="text-xl font-black text-white mb-2 uppercase italic">Admin</h3>
             <p className="text-slate-400 text-sm leading-relaxed mb-8">Control total, gestión de base de datos y eliminación de registros.</p>
             <div className="flex items-center text-purple-400 font-black text-[10px] tracking-widest uppercase">Entrar <ArrowRight size={14} className="ml-2 group-hover:translate-x-2 transition-transform"/></div>
          </button>

          {/* Registrar */}
          <button onClick={() => handleRoleClick('registrar')} className="group bg-[#0B1121] border border-slate-800 p-8 rounded-3xl text-left hover:border-emerald-600/50 hover:bg-slate-900 transition-all shadow-2xl">
             <div className="w-14 h-14 bg-emerald-600/20 rounded-2xl flex items-center justify-center mb-8 border border-emerald-500/30">
               <UserPlus className="text-emerald-400" size={28} />
             </div>
             <h3 className="text-xl font-black text-white mb-2 uppercase italic">Registro</h3>
             <p className="text-slate-400 text-sm leading-relaxed mb-8">Creación y edición de expedientes. Gestión de préstamos a clínica.</p>
             <div className="flex items-center text-emerald-400 font-black text-[10px] tracking-widest uppercase">Entrar <ArrowRight size={14} className="ml-2 group-hover:translate-x-2 transition-transform"/></div>
          </button>

          {/* Student */}
          <button onClick={() => handleRoleClick('student')} className="group bg-[#0B1121] border border-slate-800 p-8 rounded-3xl text-left hover:border-blue-600/50 hover:bg-slate-900 transition-all shadow-2xl">
             <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-8 border border-blue-500/30">
               <GraduationCap className="text-blue-400" size={28} />
             </div>
             <h3 className="text-xl font-black text-white mb-2 uppercase italic">Alumno</h3>
             <p className="text-slate-400 text-sm leading-relaxed mb-8">Consulta de archivos y generación de solicitudes para uso en clínica.</p>
             <div className="flex items-center text-blue-400 font-black text-[10px] tracking-widest uppercase">Entrar <ArrowRight size={14} className="ml-2 group-hover:translate-x-2 transition-transform"/></div>
          </button>
        </div>

        <div className="text-center pt-8 border-t border-slate-900">
           <p className="text-[10px] font-black uppercase text-slate-700 tracking-widest">Contraseñas Demo: admin2024 | registro2024 | alumno2024</p>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#111827] border border-slate-800 w-full max-w-sm rounded-3xl shadow-3xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                   <h2 className="text-xl font-black text-white uppercase italic">Validación</h2>
                   <p className="text-xs text-slate-500 mt-1">Accediendo como {getRoleName(selectedRole)}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-600 hover:text-white transition-colors"><X size={20}/></button>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input
                    type="password"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    className="w-full bg-slate-900 border border-slate-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                  />
                </div>
                {error && <p className="text-red-500 text-[10px] font-bold uppercase text-center">{error}</p>}
                <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-500 shadow-xl shadow-blue-900/40 transition-all active:scale-95">Acceder al Sistema</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
