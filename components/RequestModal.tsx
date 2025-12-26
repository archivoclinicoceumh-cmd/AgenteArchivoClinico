
import React, { useState } from 'react';
import { Patient, ClinicRequest } from '../types';
import { X, Search, Plus, Trash2, Save, Clock, MapPin, User, Calendar, ClipboardList, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ClinicRequest) => void;
  allPatients: Patient[];
  currentUser: string; // Nombre del alumno si está logueado, o input manual
}

export const RequestModal: React.FC<RequestModalProps> = ({ isOpen, onClose, onSubmit, allPatients, currentUser }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkMessage, setBulkMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // Form Data
  const [formData, setFormData] = useState({
    studentName: currentUser || '',
    studentPhone: '',
    guardia: '',
    clinicNumber: '1',
    clinicName: 'Integral 1',
    teacher: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '07:00',
    endTime: '13:00'
  });

  const [selectedPatients, setSelectedPatients] = useState<Patient[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPatient = (patient: Patient) => {
    if (!selectedPatients.find(p => p.id === patient.id)) {
      setSelectedPatients(prev => [...prev, patient]);
    }
    setSearchTerm('');
  };

  const handleRemovePatient = (id: string) => {
    setSelectedPatients(prev => prev.filter(p => p.id !== id));
  };

  const handleBulkProcess = () => {
    if (!bulkText.trim()) return;

    // Split by commas, newlines, spaces, or tabs and clean whitespace
    const identifiers = bulkText.split(/[\n,\t\s]+/).map(s => s.trim()).filter(s => s.length > 0);
    
    if (identifiers.length === 0) return;

    let foundCount = 0;
    const newPatients: Patient[] = [];

    identifiers.forEach(id => {
        // Find patient matching the ID (case insensitive)
        const patient = allPatients.find(p => p.numeroExpediente.toLowerCase() === id.toLowerCase());
        
        // Check if patient exists and isn't already selected
        if (patient && !selectedPatients.some(sp => sp.id === patient.id) && !newPatients.some(np => np.id === patient.id)) {
            newPatients.push(patient);
            foundCount++;
        }
    });

    if (foundCount > 0) {
        setSelectedPatients(prev => [...prev, ...newPatients]);
        setBulkMessage({ type: 'success', text: `Se agregaron ${foundCount} expedientes exitosamente.` });
        setBulkText('');
        setTimeout(() => setBulkMessage(null), 3000);
    } else {
        setBulkMessage({ type: 'error', text: 'No se encontraron expedientes coincidentes o ya están agregados.' });
    }
  };

  const handleSubmit = () => {
    if (selectedPatients.length === 0) {
      alert("Debe seleccionar al menos un paciente.");
      return;
    }
    if (!formData.studentName || !formData.teacher) {
        alert("Por favor complete los datos del responsable y docente.");
        return;
    }

    const newRequest: ClinicRequest = {
      id: crypto.randomUUID(),
      ...formData,
      status: 'pending',
      requestedPatients: selectedPatients,
      createdAt: new Date().toISOString()
    };

    onSubmit(newRequest);
    onClose();
  };

  const filteredSearchPatients = allPatients.filter(p => 
    (p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.numeroExpediente.toLowerCase().includes(searchTerm.toLowerCase())) &&
    !selectedPatients.find(sp => sp.id === p.id)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111827] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-800 text-slate-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-[#0B1121] rounded-t-xl shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Solicitud de Expedientes</h2>
            <p className="text-xs text-slate-400 mt-1">Paso {step} de 2: {step === 1 ? 'Datos de la Clínica' : 'Selección de Pacientes'}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* STEP 1: CLINIC DATA */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Section: Alumno */}
                <div className="space-y-4">
                   <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">
                     <User size={14} /> Responsable
                   </h3>
                   <div>
                     <label className="block text-xs font-medium text-slate-400 mb-1">Nombre del Alumno</label>
                     <input
                       type="text"
                       name="studentName"
                       value={formData.studentName}
                       onChange={handleInputChange}
                       className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-medium text-slate-400 mb-1">Teléfono de Contacto</label>
                     <input
                       type="text"
                       name="studentPhone"
                       value={formData.studentPhone}
                       onChange={handleInputChange}
                       placeholder="Celular para notificaciones"
                       className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-medium text-slate-400 mb-1">Guardia Responsable</label>
                     <input
                       type="text"
                       name="guardia"
                       value={formData.guardia}
                       onChange={handleInputChange}
                       placeholder="Ej: Guardia A, B, C..."
                       className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500"
                     />
                   </div>
                </div>

                {/* Section: Clínica */}
                <div className="space-y-4">
                   <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">
                     <MapPin size={14} /> Ubicación y Docencia
                   </h3>
                   <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">No. Clínica</label>
                        <select
                          name="clinicNumber"
                          value={formData.clinicNumber}
                          onChange={handleInputChange}
                          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500"
                        >
                          {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>Clínica {n}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Especialidad</label>
                        <select
                           name="clinicName"
                           value={formData.clinicName}
                           onChange={handleInputChange}
                           className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500"
                        >
                           <option value="Integral 1">Integral 1</option>
                           <option value="Integral 2">Integral 2</option>
                           <option value="Integral 3">Integral 3</option>
                           <option value="Operatoria">Operatoria</option>
                           <option value="Endodoncia">Endodoncia</option>
                           <option value="Exodoncia">Exodoncia</option>
                           <option value="Protesis">Prótesis</option>
                           <option value="Cirugia">Cirugía</option>
                           <option value="PCS">PCS</option>
                        </select>
                      </div>
                   </div>
                   <div>
                     <label className="block text-xs font-medium text-slate-400 mb-1">Docente a Cargo</label>
                     <input
                       type="text"
                       name="teacher"
                       value={formData.teacher}
                       onChange={handleInputChange}
                       className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500"
                     />
                   </div>
                </div>

                {/* Section: Horario */}
                <div className="space-y-4 md:col-span-2">
                   <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">
                     <Clock size={14} /> Horario de Atención
                   </h3>
                   <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Fecha</label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Hora Inicio</label>
                        <input
                          type="time"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleInputChange}
                          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Hora Fin</label>
                        <input
                          type="time"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleInputChange}
                          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT PATIENTS */}
          {step === 2 && (
            <div className="h-full flex flex-col">
              
              {/* Option toggle: Search vs Bulk */}
              <div className="flex gap-2 mb-4">
                  <button 
                    onClick={() => setShowBulkInput(false)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${!showBulkInput ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                  >
                    Búsqueda Individual
                  </button>
                  <button 
                    onClick={() => setShowBulkInput(true)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${showBulkInput ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                  >
                    Pegar Lista de Expedientes
                  </button>
              </div>

              {!showBulkInput ? (
                /* Search Bar */
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                    type="text"
                    placeholder="Buscar paciente para agregar a la lista..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    
                    {searchTerm && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#1F2937] border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto z-10">
                        {filteredSearchPatients.length > 0 ? (
                        filteredSearchPatients.map(p => (
                            <div 
                            key={p.id} 
                            onClick={() => handleAddPatient(p)}
                            className="p-3 hover:bg-slate-800 cursor-pointer flex justify-between items-center border-b border-slate-700/50 last:border-0"
                            >
                            <div>
                                <p className="font-bold text-sm text-white">{p.nombre}</p>
                                <p className="text-xs text-slate-400">{p.numeroExpediente} • {p.tipoArchivo}</p>
                            </div>
                            <button className="text-blue-400 hover:text-white">
                                <Plus size={18} />
                            </button>
                            </div>
                        ))
                        ) : (
                        <div className="p-4 text-center text-slate-500 text-sm">No se encontraron pacientes.</div>
                        )}
                    </div>
                    )}
                </div>
              ) : (
                /* Bulk Input */
                <div className="mb-6 p-4 bg-slate-900/50 border border-slate-700 rounded-xl">
                    <label className="block text-xs font-medium text-slate-300 mb-2">Ingrese números de expediente (separados por comas o saltos de línea)</label>
                    <textarea 
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder="Ej: EXP-2024-001, EXP-2024-002..."
                        className="w-full h-24 rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 resize-none mb-3"
                    />
                    <div className="flex justify-between items-center">
                        <div className="text-xs">
                            {bulkMessage && (
                                <span className={`flex items-center gap-1 ${bulkMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {bulkMessage.type === 'success' ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                                    {bulkMessage.text}
                                </span>
                            )}
                        </div>
                        <button 
                            onClick={handleBulkProcess}
                            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                        >
                            <ClipboardList size={14} /> Procesar Lista
                        </button>
                    </div>
                </div>
              )}

              {/* Selected List */}
              <div className="flex-1 bg-slate-900/30 rounded-xl border border-slate-800 p-4 overflow-y-auto">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
                  <span>Pacientes Solicitados</span>
                  <span className="text-xs bg-blue-900 px-2 py-1 rounded-full text-blue-200">{selectedPatients.length} expedientes</span>
                </h3>
                
                {selectedPatients.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPatients.map((p, idx) => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-[#111827] border border-slate-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 font-mono">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-medium text-sm text-slate-200">{p.nombre}</p>
                            <div className="flex gap-2 text-[10px] text-slate-500">
                               <span className="font-mono">{p.numeroExpediente}</span>
                               <span className={
                                 p.tipoArchivo === 'Azul' ? 'text-blue-400' :
                                 p.tipoArchivo === 'Verde' ? 'text-emerald-400' : 'text-pink-400'
                               }>{p.tipoArchivo}</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemovePatient(p.id)}
                          className="text-slate-500 hover:text-red-400 p-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 opacity-50">
                    <Calendar size={40} />
                    <p className="text-sm">Agregue pacientes usando el buscador o carga masiva.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-between bg-[#0B1121] rounded-b-xl shrink-0">
          {step === 2 ? (
             <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-slate-400 hover:text-white text-sm"
              >
                ← Volver a Datos
              </button>
          ) : <div></div>}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 text-sm"
            >
              Cancelar
            </button>
            
            {step === 1 ? (
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-medium text-sm"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-medium flex items-center gap-2 text-sm shadow-lg shadow-emerald-900/20"
              >
                <Save size={16} /> Finalizar Solicitud
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
