
import React, { useState, useEffect, useMemo } from 'react';
import { Patient, UserRole, ClinicRequest } from './types';
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
  Menu,
  X
} from 'lucide-react';

const MASTER_KEY = 'dental_archive_v1';
const REQ_KEY = 'dental_requests_v1';

export default function App() {
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem(MASTER_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [requests, setRequests] = useState<ClinicRequest[]>(() => {
    const saved = localStorage.getItem(REQ_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [view, setView] = useState<'dashboard' | 'patients' | 'requests' | 'ai'>('patients');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    localStorage.setItem(MASTER_KEY, JSON.stringify(patients));
    localStorage.setItem(REQ_KEY, JSON.stringify(requests));
  }, [patients, requests]);

  const isAdmin = currentUserRole === 'admin';
  const isRegistrar = currentUserRole === 'registrar';
  const canEdit = isAdmin || isRegistrar;

  const handleSavePatient = (patient: Patient) => {
    if (!canEdit) return;
    if (editingPatient) {
      setPatients(prev => prev.map(p => p.id === patient.id ? patient : p));
    } else {
      setPatients(prev => [{ ...patient, id: crypto.randomUUID() }, ...prev]);
    }
    setIsModalOpen(false);
  };

  const filteredPatients = useMemo(() => {
    return patients.filter(p => 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.numeroExpediente.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  if (!currentUserRole) {
    return <RoleSelection onSelectRole={setCurrentUserRole} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-[#0B1121] border-r border-slate-800 transition-all duration-300 flex flex-col z-20 shadow-2xl`}>
        <div className="p-6 border-b border-slate-800 flex items-center gap-4 overflow-hidden">
          <div className="bg-blue-600 p-2 rounded-xl shrink-0 shadow-lg shadow-blue-900/40">
            <Activity size={24} className="text-white" />
          </div>
          {isSidebarOpen && (
            <div className="animate-in fade-in slide-in-from-left-4">
              <span className="font-black text-white uppercase tracking-tighter text-lg block leading-none">CEUMH</span>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Archivo Clínico</span>
            </div>
          )}
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scroll">
          {isAdmin && (
            <SidebarLink active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={20} />} label="Métricas" collapsed={!isSidebarOpen} />
          )}
          <SidebarLink active={view === 'patients'} onClick={() => setView('patients')} icon={<FolderOpen size={20} />} label="Expedientes" collapsed={!isSidebarOpen} />
          <SidebarLink active={view === 'requests'} onClick={() => setView('requests')} icon={<ClipboardList size={20} />} label="Préstamos" collapsed={!isSidebarOpen} />
          <SidebarLink active={view === 'ai'} onClick={() => setView('ai')} icon={<BrainCircuit size={20} />} label="IA Dental" color="purple" collapsed={!isSidebarOpen} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={() => setCurrentUserRole(null)} className="w-full flex items-center gap-4 p-3.5 text-red-400 hover:bg-red-950/20 rounded-xl transition-all group">
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-bold text-xs uppercase tracking-widest">Salir</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-[#0B1121]/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 shrink-0 z-10">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-blue-900/20 text-blue-400 border border-blue-800/50 rounded-full text-[10px] font-black uppercase tracking-widest">
              Perfil: {currentUserRole}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8 custom-scroll">
          {view === 'dashboard' && <AnalyticsView patients={patients} requests={requests} />}
          
          {view === 'patients' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-[#0B1121] p-6 rounded-2xl border border-slate-800">
                <div className="relative w-full lg:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar expediente..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 w-full lg:w-auto">
                   {canEdit && (
                     <button onClick={() => { setEditingPatient(null); setIsModalOpen(true); }} className="flex-1 lg:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                        <Plus size={16} /> NUEVO
                     </button>
                   )}
                   {isAdmin && (
                     <label className="flex-1 lg:flex-none px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer border border-slate-700">
                        <Upload size={16} /> IMPORTAR
                        <input type="file" className="hidden" accept=".xlsx,.xls" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if(file) {
                            const imported = await importFromExcel(file);
                            setPatients(imported);
                          }
                        }} />
                     </label>
                   )}
                   <button onClick={() => exportToExcel(patients)} className="flex-1 lg:flex-none px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                      <Download size={16} /> EXCEL
                   </button>
                </div>
              </div>

              <div className="bg-[#0B1121] border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-900/50 text-slate-500 uppercase text-[10px] tracking-widest font-black border-b border-slate-800">
                        <th className="px-6 py-4">Expediente</th>
                        <th className="px-6 py-4">Paciente</th>
                        <th className="px-6 py-4">Estatus</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {filteredPatients.map(p => (
                        <tr key={p.id} className="hover:bg-slate-900/50 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="font-mono text-blue-400 font-bold">{p.numeroExpediente}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                                <span className="block font-bold text-slate-200">{p.nombre}</span>
                                <span className="text-[10px] text-slate-500 uppercase">{p.alumno || 'Sin Alumno'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                                p.enArchivoMuerto ? 'bg-slate-900 text-slate-500 border-slate-700' : 'bg-blue-900/20 text-blue-400 border-blue-800'
                              }`}>
                                {p.enArchivoMuerto ? 'ARCHIVO MUERTO' : 'ACTIVO'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => { setEditingPatient(p); setIsModalOpen(true); }} className="p-2 bg-slate-800 hover:bg-blue-600 rounded-lg text-slate-400 hover:text-white transition-all">
                                {canEdit ? <Edit size={16} /> : <Eye size={16} />}
                              </button>
                              {isAdmin && (
                                <button onClick={() => setPatients(prev => prev.filter(x => x.id !== p.id))} className="p-2 bg-slate-800 hover:bg-red-600 rounded-lg text-slate-400 hover:text-white transition-all">
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {view === 'requests' && <RequestsView requests={requests} onStatusChange={(id, status) => setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))} currentUserRole={currentUserRole} currentUser={currentUserRole === 'student' ? 'Alumno' : ''} />}
          {view === 'ai' && <AIAssistant patients={patients} />}
        </main>
      </div>

      <PatientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSavePatient} patient={editingPatient} readOnly={!canEdit} />
      <RequestModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} onSubmit={(req) => setRequests(prev => [req, ...prev])} allPatients={patients} currentUser={currentUserRole === 'student' ? 'Alumno' : ''} />
    </div>
  );
}

function SidebarLink({ active, onClick, icon, label, collapsed, color = 'blue' }: any) {
  const colors: any = {
    blue: active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300',
    purple: active ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'
  };

  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all ${colors[color]}`}>
      <div className="shrink-0">{icon}</div>
      {!collapsed && <span className="font-bold text-xs uppercase tracking-widest truncate">{label}</span>}
    </button>
  );
}
