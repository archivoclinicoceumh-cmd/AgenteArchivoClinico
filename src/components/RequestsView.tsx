import React, { useState } from 'react';
import { ClinicRequest, RequestStatus, UserRole } from '../types';
import { Clock, MapPin, User, CheckCircle, Truck, FileText, Phone, Printer, Copy } from 'lucide-react';

interface RequestsViewProps {
  requests: ClinicRequest[];
  onStatusChange: (id: string, status: RequestStatus) => void;
  currentUserRole: UserRole;
  currentUser: string;
}

export const RequestsView: React.FC<RequestsViewProps> = ({ requests, onStatusChange, currentUserRole, currentUser }) => {
  const [filterStatus, setFilterStatus] = useState<RequestStatus | 'all'>('all');

  // Filter logic:
  // If Student: See only own requests.
  // If Admin/Registrar: See all requests.
  const visibleRequests = requests.filter(req => {
    const statusMatch = filterStatus === 'all' || req.status === filterStatus;
    const userMatch = currentUserRole === 'student' ? req.studentName.toLowerCase().includes(currentUser.toLowerCase()) : true;
    return statusMatch && userMatch;
  });

  // Sort by date/time (newest first)
  const sortedRequests = [...visibleRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusColor = (status: RequestStatus) => {
    switch(status) {
      case 'pending': return 'bg-yellow-900/30 text-yellow-500 border-yellow-800';
      case 'ready': return 'bg-blue-900/30 text-blue-400 border-blue-800';
      case 'delivered': return 'bg-emerald-900/30 text-emerald-500 border-emerald-800';
    }
  };

  const getStatusLabel = (status: RequestStatus) => {
    switch(status) {
      case 'pending': return 'Pendiente';
      case 'ready': return 'Listo para Recoger';
      case 'delivered': return 'Entregado';
    }
  };

  const copyFileNumbers = (req: ClinicRequest) => {
    const numbers = req.requestedPatients.map(p => p.numeroExpediente).join(', ');
    navigator.clipboard.writeText(numbers);
    alert('Lista de expedientes copiada al portapapeles.');
  };

  return (
    <div className="h-full flex flex-col bg-[#111827] rounded-xl shadow-xl border border-slate-800">
      
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0B1121] rounded-t-xl">
        <h2 className="font-bold text-white text-lg flex items-center gap-2">
          <FileText className="text-blue-500" />
          Gestión de Solicitudes
        </h2>
        
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
          {(['all', 'pending', 'ready', 'delivered'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                filterStatus === status 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status === 'all' ? 'Todas' : getStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
        {sortedRequests.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
             <div className="p-4 bg-slate-900 rounded-full opacity-50">
               <FileText size={40} />
             </div>
             <p>No hay solicitudes {filterStatus !== 'all' ? 'con este estatus' : 'registradas'}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedRequests.map(req => (
              <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col hover:border-slate-700 transition-colors shadow-lg">
                
                {/* Card Header */}
                <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-sm">{req.clinicName} (Clínica {req.clinicNumber})</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <Clock size={12} />
                      <span>{req.date} • {req.startTime} - {req.endTime}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${getStatusColor(req.status)}`}>
                    {getStatusLabel(req.status)}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 space-y-4">
                  {/* Info Blocks */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                     <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
                        <span className="block text-slate-500 mb-0.5">Responsable</span>
                        <div className="text-slate-200 font-medium flex items-center gap-1">
                          <User size={12} className="text-blue-400" /> {req.studentName}
                        </div>
                        <div className="text-slate-400 mt-0.5 flex items-center gap-1">
                          <Phone size={10} /> {req.studentPhone}
                        </div>
                     </div>
                     <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
                        <span className="block text-slate-500 mb-0.5">Docente / Guardia</span>
                        <div className="text-slate-200 font-medium truncate">{req.teacher}</div>
                        <div className="text-slate-400 mt-0.5 truncate">{req.guardia}</div>
                     </div>
                  </div>

                  {/* Patient List */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Expedientes ({req.requestedPatients.length})</p>
                        <button 
                            onClick={() => copyFileNumbers(req)}
                            className="text-[10px] flex items-center gap-1 text-blue-400 hover:text-blue-300"
                            title="Copiar lista de números al portapapeles"
                        >
                            <Copy size={12} /> Copiar Lista
                        </button>
                    </div>
                    <div className="space-y-1">
                      {req.requestedPatients.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-1.5 hover:bg-slate-800 rounded border border-transparent hover:border-slate-700 transition-colors">
                          <span className="text-slate-300 font-medium truncate w-2/3">{p.nombre}</span>
                          <span className="font-mono text-slate-500">{p.numeroExpediente}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer (Actions) */}
                {(currentUserRole === 'admin' || currentUserRole === 'registrar') && (
                  <div className="p-3 bg-[#0B1121] border-t border-slate-800 flex justify-between gap-2">
                     <button className="p-2 text-slate-400 hover:text-white rounded hover:bg-slate-800" title="Imprimir Lista">
                        <Printer size={16} />
                     </button>

                     <div className="flex gap-2">
                        {req.status === 'pending' && (
                          <button 
                            onClick={() => onStatusChange(req.id, 'ready')}
                            className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded flex items-center gap-1"
                          >
                            <CheckCircle size={12} /> Marcar Listo
                          </button>
                        )}
                        {req.status === 'ready' && (
                          <button 
                            onClick={() => onStatusChange(req.id, 'delivered')}
                            className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded flex items-center gap-1"
                          >
                            <Truck size={12} /> Entregar
                          </button>
                        )}
                         {req.status === 'delivered' && (
                           <span className="text-xs text-emerald-500 font-medium flex items-center px-2">
                             Entregado
                           </span>
                        )}
                     </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};