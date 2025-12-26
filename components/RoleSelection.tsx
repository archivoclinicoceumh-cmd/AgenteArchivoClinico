import React, { useState } from 'react';
import { Shield, UserPlus, GraduationCap, ArrowRight, Lock, KeyRound, X } from 'lucide-react';
import { UserRole } from '../types';

interface RoleSelectionProps {
  onSelectRole: (role: UserRole) => void;
}

// Contraseñas predefinidas para demostración
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
      setError('Contraseña incorrecta. Intente nuevamente.');
      setPassword('');
    }
  };

  const getRoleName = (role: UserRole | null) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'registrar': return 'Registro';
      case 'student': return 'Alumnado';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-5xl w-full z-10">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            Archivo <span className="text-blue-500">Clínico</span>
          </h1>
          <div className="h-1 w-24 bg-blue-600 mx-auto rounded-full mb-6"></div>
          <p className="text-slate-400 text-lg">Sistema Integral de Gestión de Expedientes</p>
          <p className="text-slate-600 text-sm mt-2 uppercase tracking-widest">Seleccione perfil e ingrese credenciales</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student Card */}
          <button
            onClick={() => handleRoleClick('student')}
            className="group relative bg-[#0B1121] hover:bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-blue-500 transition-all duration-300 text-left flex flex-col h-full shadow-2xl hover:shadow-blue-900/20 hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-blue-900/30 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform border border-blue-900/50">
              <GraduationCap className="text-blue-400" size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Alumnado</h3>
            <p className="text-slate-400 text-sm mb-8 flex-1 leading-relaxed">
              Acceso exclusivo de consulta. Visualiza expedientes y estados sin permisos de edición o descarga.
            </p>
            <div className="flex items-center text-blue-400 text-sm font-bold group-hover:translate-x-2 transition-transform">
              INGRESAR <ArrowRight size={16} className="ml-2" />
            </div>
          </button>

          {/* Registrar Card */}
          <button
            onClick={() => handleRoleClick('registrar')}
            className="group relative bg-[#0B1121] hover:bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-emerald-500 transition-all duration-300 text-left flex flex-col h-full shadow-2xl hover:shadow-emerald-900/20 hover:-translate-y-1"
          >
             <div className="w-14 h-14 bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform border border-emerald-900/50">
              <UserPlus className="text-emerald-400" size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Registro</h3>
            <p className="text-slate-400 text-sm mb-8 flex-1 leading-relaxed">
              Permite integrar nuevos expedientes y actualizar información. Gestión operativa sin eliminación.
            </p>
            <div className="flex items-center text-emerald-400 text-sm font-bold group-hover:translate-x-2 transition-transform">
              INGRESAR <ArrowRight size={16} className="ml-2" />
            </div>
          </button>

          {/* Admin Card */}
          <button
            onClick={() => handleRoleClick('admin')}
            className="group relative bg-[#0B1121] hover:bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-purple-500 transition-all duration-300 text-left flex flex-col h-full shadow-2xl hover:shadow-purple-900/20 hover:-translate-y-1"
          >
             <div className="w-14 h-14 bg-purple-900/30 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform border border-purple-900/50">
              <Shield className="text-purple-400" size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Administrador</h3>
            <p className="text-slate-400 text-sm mb-8 flex-1 leading-relaxed">
              Control total del sistema. Gestión de expedientes, permisos completos y exportación de datos.
            </p>
            <div className="flex items-center text-purple-400 text-sm font-bold group-hover:translate-x-2 transition-transform">
              INGRESAR <ArrowRight size={16} className="ml-2" />
            </div>
          </button>
        </div>
        
        {/* Credenciales Demo (Visible para facilitar pruebas) */}
        <div className="mt-16 text-center border-t border-slate-800 pt-8">
           <p className="text-xs text-slate-500 mb-2">CREDENCIALES DEMO (PARA PRUEBAS)</p>
           <div className="flex justify-center gap-6 text-xs font-mono text-slate-400">
              <span>Admin: <span className="text-slate-300">admin2024</span></span>
              <span>Registro: <span className="text-slate-300">registro2024</span></span>
              <span>Alumno: <span className="text-slate-300">alumno2024</span></span>
           </div>
           <div className="mt-4 text-xs text-slate-700">
             &copy; {new Date().getFullYear()} Clínica Dental Universitaria. Sistema de Archivo Clínico v1.0
           </div>
        </div>
      </div>

      {/* Password Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                   <h2 className="text-xl font-bold text-white flex items-center gap-2">
                     <Lock className="text-blue-500" size={20} />
                     Autenticación Requerida
                   </h2>
                   <p className="text-sm text-slate-400 mt-1">
                     Ingrese contraseña para perfil: <span className="text-white font-medium">{getRoleName(selectedRole)}</span>
                   </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="password"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña de acceso"
                    className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-600"
                  />
                </div>

                {error && (
                  <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-900/50 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    {error}
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 font-medium transition-colors shadow-lg shadow-blue-900/20"
                  >
                    Acceder
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
