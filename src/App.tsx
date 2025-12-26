
import React, { useState, useEffect, useMemo } from 'react';
import { Patient, UserRole, ClinicRequest, RequestStatus } from './types';
import { PatientModal } from './components/PatientModal';
import { AIAssistant } from './components/AIAssistant';
import { RoleSelection } from './components/RoleSelection';
import { RequestModal } from './components/RequestModal';
import { RequestsView } from './components/RequestsView';
import { AnalyticsView } from './components/AnalyticsView';
import { exportToExcel, importFromExcel } from './utils/excelUtils';
import { 
  Activity, 
  FolderOpen, 
  ClipboardList, 
  BrainCircuit, 
  LogOut, 
  LayoutDashboard, 
  Search, 
  Plus, 
  Upload, 
  Download, 
  User, 
  Edit, 
  Trash2, 
  Eye, 
  BookOpen, 
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';

const STORAGE_KEY = 'clinic_data_master_v1';
const REQUESTS_KEY = 'requests_data_master_v1';

export default function App() {
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [requests, setRequests] = useState<ClinicRequest[]>(() => {
    const saved = localStorage.getItem(REQUESTS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [view, setView] = useState<'dashboard' | 'patients' | 'requests' | 'ai' | 'guide'>('patients');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  }, [patients, requests]);

  const isAdmin = currentUserRole === 'admin';
  const isRegistrar = currentUserRole === 'registrar';
  const isStudent = currentUserRole === 'student';
  
  const canEdit = isAdmin || isRegistrar;
  const canDelete = isAdmin;

  const handleSelectRole = (role: UserRole) => {
    setCurrentUserRole(role);
    setView(role === 'admin' ? 'dashboard' : 'patients');
  };

  const handleSavePatient = (patient: Patient) => {
    if (!canEdit) return;
    if (editingPatient) {
      setPatients(prev => prev.map(p => p.id === patient.id ? patient : p));
    } else {
      setPatients(prev => [{ ...patient, id: crypto.randomUUID() }, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imported = await importFromExcel(file);
        setPatients(imported);
        alert(`Éxito: ${imported.length} registros cargados.`);
      } catch (err) {
        alert("Error al procesar el archivo Excel.");
      }
    }
  };

  const filteredPatients = useMemo(() => {
    return patients.filter(p => 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.numeroExpediente.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  if (!currentUserRole) {
    return <RoleSelection onSelectRole={handleSelectRole} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-[#0B1121] border-r border-slate-800 transition-all duration-300 flex flex-col z-20 shadow-2xl relative`}>
        <div className="p-6 border-b border-slate-800 flex items-center gap-4 overflow-hidden">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-2xl shrink-0 shadow-lg shadow-blue-900/40">
            <Activity size={24} className="text-white" />
          </div>
          {isSidebarOpen && (
            <div className="animate-in fade-in slide-in-from-left-4">
              <span className="font-black text-white uppercase tracking-tighter text-lg block leading-none">Archivo</span>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Dental CEUMH</span>
            </div>
          )}
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scroll">
          {isAdmin && (
            <SidebarLink 
              active={view === 'dashboard'} 
              onClick={() => setView('dashboard')} 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              collapsed={!isSidebarOpen} 
            />
          )}
          <SidebarLink 
            active={view === 'patients'} 
            onClick={() => setView('patients')} 
            icon={<FolderOpen size={20} />} 
            label="Expedientes" 
            collapsed={!isSidebarOpen} 
          />
          <SidebarLink 
            active={view === 'requests'} 
            onClick={() => setView('requests')} 
            icon={<ClipboardList size={20} />} 
            label="Solicitudes" 
            collapsed={!isSidebarOpen} 
          />
          <SidebarLink 
            active={view === 'ai'} 
            onClick={() => setView('ai')} 
            icon={<BrainCircuit size={20} />} 
            label="Asistente IA" 
            color="purple"
            collapsed={!isSidebarOpen} 
          />
          {isAdmin && (
            <SidebarLink 
              active={view === 'guide'} 
              onClick={() => setView('guide')} 
              icon={<BookOpen size={20} />} 
              label="Manual Admin" 
              color="emerald"
              collapsed={!isSidebarOpen} 
            />
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => setCurrentUserRole(null)} 
            className="w-full flex items-center gap-4 p-3.5 text-red-400 hover:bg-red-950/20 rounded-2xl transition-all duration-200 group"
          >
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="font-bold text-sm uppercase tracking-widest">Salir</span>}
          </button>
        </div>
        
        {/* Toggle button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 bg-blue-600 text-white p-1 rounded-full shadow-lg border border-slate-900 hidden lg:block"
        >
          {isSidebarOpen ? <Menu size={12} /> : <X size={12} />}
        </button>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-[#0B1121]/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-10 shrink-0 z-10">
          <div className="flex items-center gap-6">
             <h2 className="text-white font-black tracking-widest uppercase text-sm italic">
                {view === 'dashboard' ? 'Métricas de Control' : 
                 view === 'patients' ? 'Gestión de Archivo' : 
                 view === 'requests' ? 'Préstamos en Clínica' : 'Inteligencia Artificial'}
             </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
              isAdmin ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 
              isRegistrar ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 
              'bg-blue-900/30 text-blue-400 border-blue-800'
            }`}>
              {isAdmin ? 'Admin Root' : isRegistrar ? 'Registro Operativo' : 'Perfil Alumno'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-10 bg-[#020617] custom-scroll">
          {view === 'guide' && isAdmin && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-10 duration-700">
               <div className="bg-gradient-to-br from-emerald-900/30 to-slate-900 p-10 rounded-[2.5rem] border border-emerald-800/30 relative overflow-hidden shadow-3xl">
                  <h1 className="text-3xl font-black text-white mb-4">Manual de Despliegue</h1>
                  <p className="text-slate-400 text-sm leading-relaxed mb-8">
                    Sigue estos pasos para finalizar la implementación en Vercel. Una vez configurado, tu equipo podrá acceder desde cualquier dispositivo.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GuideStep number="1" title="API KEY" desc="En Vercel Settings -> Environment Variables, añade API_KEY con tu clave de Gemini." />
                    <GuideStep number="2" title="GitHub" desc="Sincroniza tu rama 'main' para despliegues automáticos cada vez que guardes cambios." />
                  </div>
                  <ShieldCheck className="absolute -right-8 -bottom-8 text-emerald-500/5 rotate-12" size={240} />
               </div>
            </div>
          )}

          {view === 'dashboard' && isAdmin && <AnalyticsView patients={patients} requests={requests} />}
          
          {view === 'patients' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col lg:flex-row gap-6 justify-between items-center bg-[#0B1121] p-8 rounded-3xl border border-slate-800 shadow-2xl">
                <div className="relative w-full lg:w-[30rem]">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input 
                    type="text" 
                    placeholder="Buscar por nombre o número de expediente..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-14 pr-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/40 transition-all placeholder:text-slate-600 shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 w-full lg:w-auto">
                   {canEdit && (
                     <button onClick={() => { setEditingPatient(null); setIsModalOpen(true); }} className="flex-1 lg:flex-none px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-3 shadow-xl shadow-blue-900/30 transition-transform active:scale-95">
                        <Plus size={18} /> NUEVO EXPEDIENTE
                     </button>
                   )}
                   {isAdmin && (
                     <label className="flex-1 lg:flex-none px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-black flex items-center justify-center gap-3 cursor-pointer border border-slate-700 shadow-lg">
                        <Upload size={18} /> IMPORTAR EXCEL
                        <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleImport} />
                     </label>
                   )}
                   <button onClick={() => exportToExcel(patients)} className="flex-1 lg:flex-none px-8 py-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20">
                      <Download size={18} /> DESCARGAR BASE
                   </button>
                </div>
              </div>

              <div className="bg-[#0B1121] border border-slate-800 rounded-[2rem] overflow-hidden shadow-3xl">
                <div className="overflow-x-auto custom-scroll">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-900/50 text-slate-500 uppercase text-[10px] tracking-[0.2em] font-black border-b border-slate-800">
                        <th className="px-10 py-6">ID Expediente</th>
                        <th className="px-10 py-6">Información del Paciente</th>
                        <th className="px-10 py-6">Ubicación / Estado</th>
                        <th className="px-10 py-6 text-right">Gestión</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {filteredPatients.map(p => (
                        <tr key={p.id} className="hover:bg-blue-900/5 transition-colors group">
                          <td className="px-10 py-6">
                            <span className="font-mono text-blue-400 font-black text-xs bg-blue-900/10 px-3 py-1 rounded-lg border border-blue-900/20">{p.numeroExpediente}</span>
                          </td>
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-5">
                              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-600 overflow-hidden shadow-inner group-hover:border-blue-500/50 transition-colors">
                                {p.foto ? <img src={p.foto} alt="" className="w-full h-full object-cover"/> : <User size={20} />}
                              </div>
                              <div>
                                  <span className="block font-black text-slate-100 text-base">{p.nombre}</span>
                                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{p.alumno || 'Sin Alumno Asignado'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-6">
                            <div className="flex flex-col gap-1.5">
                              <span className={`w-fit px-3 py-1 rounded-full text-[9px] font-black border ${
                                p.enArchivoMuerto ? 'bg-slate-900 text-slate-500 border-slate-700' : 
                                p.tipoArchivo === 'Azul' ? 'bg-blue-900/20 text-blue-400 border-blue-800' :
                                p.tipoArchivo === 'Verde' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-800' :
                                'bg-pink-900/20 text-pink-400 border-pink-800'
                              }`}>
                                {p.enArchivoMuerto ? 'ARCHIVO MUERTO' : p.tipoArchivo.toUpperCase()}
                              </span>
                              {p.esCasoEspecial && <span className="text-[9px] font-bold text-purple-400 italic">★ Caso Especial</span>}
                            </div>
                          </td>
                          <td className="px-10 py-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => { setEditingPatient(p); setIsModalOpen(true); }}
                                className="p-3 bg-slate-900 hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl transition-all shadow-md group-hover:scale-105"
                                title="Ver / Editar"
                              >
                                {canEdit ? <Edit size={18} /> : <Eye size={18} />}
                              </button>
                              {canDelete && (
                                <button 
                                  onClick={() => { if(confirm('¿Deseas eliminar este expediente permanentemente?')) setPatients(prev => prev.filter(x => x.id !== p.id)); }}
                                  className="p-3 bg-slate-900 hover:bg-red-600 text-slate-400 hover:text-white rounded-xl transition-all shadow-md group-hover:scale-105"
                                  title="Eliminar"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredPatients.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-10 py-32 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-30">
                              <Search size={48} />
                              <p className="text-sm font-bold uppercase tracking-widest italic">No se encontraron resultados</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {view === 'requests' && (
            <div className="h-full space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                 <div>
                    <h3 className="text-white font-black text-xl tracking-tighter uppercase italic flex items-center gap-3">
                      <ClipboardList size={24} className="text-blue-500" /> Control de Préstamos
                    </h3>
                    <p className="text-slate-500 text-xs mt-1">Gestión de salida y entrada de expedientes físicos.</p>
                 </div>
                 {isStudent && (
                   <button 
                    onClick={() => setIsRequestModalOpen(true)}
                    className="w-full sm:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-3 shadow-2xl shadow-blue-900/40 transition-transform active:scale-95"
                  >
                    <Plus size={20} /> CREAR SOLICITUD
                  </button>
                 )}
              </div>
              <RequestsView 
                requests={requests}
                onStatusChange={(id, status) => {
                  if (isStudent) return;
                  setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
                }}
                currentUserRole={currentUserRole}
                currentUser={isStudent ? 'Alumno' : ''}
              />
            </div>
          )}

          {view === 'ai' && <AIAssistant patients={patients} />}
        </main>
      </div>

      <PatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePatient}
        patient={editingPatient}
        readOnly={!canEdit}
      />

      <RequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSubmit={(newRequest) => setRequests(prev => [newRequest, ...prev])}
        allPatients={patients}
        currentUser={isStudent ? 'Alumno' : ''}
      />
    </div>
  );
}

// Subcomponentes de apoyo
function SidebarLink({ active, onClick, icon, label, color = 'blue', collapsed }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, color?: string, collapsed: boolean }) {
  const colorClasses = {
    blue: active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300',
    purple: active ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300',
    emerald: active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300',
  }[color];

  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 ${colorClasses}`}
    >
      <div className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>{icon}</div>
      {!collapsed && <span className="font-bold text-sm uppercase tracking-widest truncate">{label}</span>}
    </button>
  );
}

function GuideStep({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 flex gap-5">
      <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black shrink-0">{number}</div>
      <div>
        <h4 className="font-black text-white text-sm uppercase mb-1">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
