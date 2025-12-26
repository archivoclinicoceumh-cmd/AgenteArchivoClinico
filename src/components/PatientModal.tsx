import React, { useState, useEffect, useRef } from 'react';
import { Patient, ASAScore, Study, DocumentCategory } from '../types';
import { X, Save, Sparkles, Eye, Camera, Upload, Trash2, User, HeartPulse, FileText, Image as ImageIcon, ExternalLink, FileClock, Paperclip, FolderOpen, Archive, Scale, Star, AlertTriangle, AlertOctagon, BookmarkMinus, CheckCircle2 } from 'lucide-react';
import { generatePatientSummary } from '../services/geminiService';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => void;
  patient: Patient | null;
  readOnly?: boolean;
}

const initialPatient: Patient = {
  id: '',
  numeroExpediente: '',
  foto: '',
  nombre: '',
  edad: 0,
  estadoProcedencia: '',
  fechaRealizacion: new Date().toISOString().split('T')[0],
  cuatrimestre: 'Enero-Abril ' + new Date().getFullYear(),
  direccion: '',
  telefono: '',
  telefono2: '',
  telefono3: '',
  email: '',
  rutaClinica: [], // Array vacio inicial
  alumno: '',
  medicoTratante: '',
  docenteAutoriza: '',
  ultimoTratamiento: '',
  estadoExpediente: 'Activo',
  tipoArchivo: 'Azul',
  
  // Estados Iniciales
  enArchivoMuerto: false,
  esCasoEspecial: false,
  esCasoLegal: false,
  esRetenido: false,
  esExtraviado: false,
  esDadoDeAlta: false,
  detallesCaso: '',
  
  asaScore: 'ASA I',
  estudios: [],
  ultimaVisita: '',
  proximaCita: '',
  historialMedico: '',
  estadoPago: 'Al día',
  notas: ''
};

// Rutas Clínicas Predefinidas
const CLINICAL_ROUTES = [
  { value: 'PCS', label: 'Prevención y Conservación (PCS)' },
  { value: 'OD', label: 'Operatoria Dental (OD)' },
  { value: 'EXO', label: 'Exodoncia (EXO)' },
  { value: 'ENDO', label: 'Endodoncia (ENDO)' },
  { value: 'CX', label: 'Cirugía Bucal (CX)' },
  { value: 'PPRYT', label: 'Prótesis Removible y Total (PPRYT)' },
  { value: 'PPF', label: 'Prótesis Parcial Fija (PPF)' },
  { value: 'I1', label: 'Integral 1 (I1)' },
  { value: 'I2', label: 'Integral 2 (I2)' },
  { value: 'I3', label: 'Integral 3 (I3)' },
];

export const PatientModal: React.FC<PatientModalProps> = ({ isOpen, onClose, onSave, patient, readOnly = false }) => {
  const [formData, setFormData] = useState<Patient>(initialPatient);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'info' | 'studies'>('info');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('estudio_imagen');
  const [routeSelectValue, setRouteSelectValue] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const studyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (patient) {
      setFormData({
        ...patient,
        rutaClinica: Array.isArray(patient.rutaClinica) ? patient.rutaClinica : [], // Ensure array
        estudios: patient.estudios || [],
        cuatrimestre: patient.cuatrimestre || ('Enero-Abril ' + new Date().getFullYear()),
        fechaRealizacion: patient.fechaRealizacion || new Date().toISOString().split('T')[0],
        enArchivoMuerto: patient.enArchivoMuerto || false,
        esCasoEspecial: patient.esCasoEspecial || false,
        esCasoLegal: patient.esCasoLegal || false,
        esRetenido: patient.esRetenido || false,
        esExtraviado: patient.esExtraviado || false,
        esDadoDeAlta: patient.esDadoDeAlta || false,
        detallesCaso: patient.detallesCaso || ''
      });
      setAiSummary('');
    } else {
      // Calculate initial cuatrimestre based on today
      const today = new Date();
      const month = today.getMonth();
      const year = today.getFullYear();
      let cuatri = 'Enero-Abril';
      if (month >= 4 && month <= 7) cuatri = 'Mayo-Agosto';
      if (month >= 8) cuatri = 'Septiembre-Diciembre';

      setFormData({ 
          ...initialPatient, 
          id: crypto.randomUUID(), 
          estudios: [], 
          rutaClinica: [],
          cuatrimestre: `${cuatri} ${year}`
      });
      setAiSummary('');
    }
    setActiveTab('info');
    setRouteSelectValue('');
  }, [patient, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (readOnly) return;
    const { name, value } = e.target;
    
    setFormData(prev => {
        const newData = {
            ...prev,
            [name]: name === 'edad' ? Number(value) : value
        };

        // Auto-calcular cuatrimestre y año si cambia la fecha de realizacion
        if (name === 'fechaRealizacion') {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                const year = date.getUTCFullYear(); // Use UTC to avoid timezone shifts on date input
                const month = date.getUTCMonth(); // 0-11
                
                let period = '';
                if (month >= 0 && month <= 3) period = 'Enero-Abril';
                else if (month >= 4 && month <= 7) period = 'Mayo-Agosto';
                else period = 'Septiembre-Diciembre';
                
                newData.cuatrimestre = `${period} ${year}`;
            }
        }
        return newData;
    });
  };

  // Manejo exclusivo de ubicaciones especiales
  const handleLocationToggle = (field: 'enArchivoMuerto' | 'esCasoEspecial' | 'esCasoLegal' | 'esRetenido' | 'esExtraviado' | 'esDadoDeAlta') => {
    if (readOnly) return;
    
    setFormData(prev => {
      // Si activo una, desactivo las otras para evitar conflictos físicos
      const isActivating = !prev[field];
      
      return {
        ...prev,
        enArchivoMuerto: field === 'enArchivoMuerto' ? isActivating : (isActivating ? false : prev.enArchivoMuerto),
        esCasoEspecial: field === 'esCasoEspecial' ? isActivating : (isActivating ? false : prev.esCasoEspecial),
        esCasoLegal: field === 'esCasoLegal' ? isActivating : (isActivating ? false : prev.esCasoLegal),
        esRetenido: field === 'esRetenido' ? isActivating : (isActivating ? false : prev.esRetenido),
        esExtraviado: field === 'esExtraviado' ? isActivating : (isActivating ? false : prev.esExtraviado),
        esDadoDeAlta: field === 'esDadoDeAlta' ? isActivating : (isActivating ? false : prev.esDadoDeAlta),
      };
    });
  };

  const handleAddRoute = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) return;

    if (!formData.rutaClinica.includes(value)) {
      setFormData(prev => ({
        ...prev,
        rutaClinica: [...prev.rutaClinica, value]
      }));
    }
    setRouteSelectValue(''); // Reset select
  };

  const handleRemoveRoute = (routeToRemove: string) => {
    if (readOnly) return;
    setFormData(prev => ({
      ...prev,
      rutaClinica: prev.rutaClinica.filter(r => r !== routeToRemove)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, foto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, foto: '' }));
  };

  // Manejo de Estudios (PDF/Imagen)
  const handleStudyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      if (!isImage && !isPdf) {
        alert('Solo se permiten imágenes (JPG, PNG) o archivos PDF.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const newStudy: Study = {
          id: crypto.randomUUID(),
          nombre: file.name,
          tipo: isPdf ? 'pdf' : 'imagen',
          categoria: uploadCategory, // Usar la categoría seleccionada
          fecha: new Date().toISOString().split('T')[0],
          url: reader.result as string
        };
        
        setFormData(prev => ({
          ...prev,
          estudios: [...(prev.estudios || []), newStudy]
        }));
      };
      reader.readAsDataURL(file);
    }
    if (studyInputRef.current) studyInputRef.current.value = '';
  };

  const handleDeleteStudy = (id: string) => {
    setFormData(prev => ({
      ...prev,
      estudios: prev.estudios.filter(s => s.id !== id)
    }));
  };

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    const summary = await generatePatientSummary(formData);
    setAiSummary(summary);
    setIsGenerating(false);
  };

  const handleASAClick = (score: ASAScore) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, asaScore: score }));
  };

  const getAgeClassification = (age: number) => {
    if (age <= 5) return "Primera Infancia";
    if (age <= 11) return "Infancia";
    if (age <= 18) return "Adolescencia";
    if (age <= 26) return "Juventud";
    if (age <= 59) return "Adultez";
    return "Persona Mayor";
  };

  const getASAColor = (score: ASAScore) => {
    switch (score) {
      case 'ASA I': return 'bg-green-500 border-green-400 text-white';
      case 'ASA II': return 'bg-blue-600 border-blue-400 text-white';
      case 'ASA III': return 'bg-yellow-500 border-yellow-300 text-black font-bold';
      case 'ASA IV': return 'bg-red-600 border-red-400 text-white';
      case 'ASA V': return 'bg-purple-600 border-purple-400 text-white';
      default: return 'bg-slate-700';
    }
  };

  const getASADescription = (score: ASAScore) => {
    switch (score) {
      case 'ASA I': return 'Paciente Sano';
      case 'ASA II': return 'Enf. Sistémica Leve';
      case 'ASA III': return 'Enf. Sistémica Grave';
      case 'ASA IV': return 'Amenaza constante a la vida';
      case 'ASA V': return 'Paciente Agonizante';
      default: return '';
    }
  };

  // Filtrar estudios por categoría
  const clinicalHistoryFiles = formData.estudios?.filter(s => s.categoria === 'historia_clinica') || [];
  const imageStudyFiles = formData.estudios?.filter(s => s.categoria === 'estudio_imagen' || !s.categoria) || []; // Fallback for old data

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111827] rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-slate-800 text-slate-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-[#0B1121] rounded-t-xl shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {readOnly && <Eye size={20} className="text-blue-400" />}
              {readOnly ? 'Consultar Expediente' : (patient ? 'Editar Expediente' : 'Nuevo Expediente')}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {readOnly ? 'Modo de solo lectura' : 'Información clínica y administrativa del paciente'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 shrink-0">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'info' 
                ? 'border-blue-500 text-blue-400 bg-slate-800/50' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Datos Clínicos
          </button>
          <button
            onClick={() => setActiveTab('studies')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'studies' 
                ? 'border-blue-500 text-blue-400 bg-slate-800/50' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <FolderOpen size={16} />
            Expediente Digital ({formData.estudios?.length || 0})
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: DATOS CLÍNICOS */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Columna 1: Foto e Identificación */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-blue-900/50 pb-2">Identificación</h3>
                
                {/* Foto del Paciente */}
                <div className="flex flex-col items-center gap-3 mb-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800 relative overflow-hidden">
                  
                   {/* Banners de Estados Especiales */}
                   <div className="absolute top-0 right-0 flex flex-col items-end gap-1 z-10">
                       {formData.enArchivoMuerto && (
                          <div className="bg-slate-700 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1 shadow-md">
                            <Archive size={12} /> Archivo Muerto
                          </div>
                       )}
                       {formData.esCasoEspecial && (
                          <div className="bg-purple-700 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1 shadow-md">
                            <Star size={12} /> Caso Especial
                          </div>
                       )}
                       {formData.esCasoLegal && (
                          <div className="bg-amber-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1 shadow-md">
                            <Scale size={12} /> Caso Legal
                          </div>
                       )}
                       {formData.esRetenido && (
                          <div className="bg-pink-700 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1 shadow-md">
                            <BookmarkMinus size={12} /> Retenido
                          </div>
                       )}
                       {formData.esExtraviado && (
                          <div className="bg-red-700 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1 shadow-md">
                            <AlertOctagon size={12} /> Extraviado
                          </div>
                       )}
                       {formData.esDadoDeAlta && (
                          <div className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1 shadow-md">
                            <CheckCircle2 size={12} /> Dado de Alta
                          </div>
                       )}
                   </div>

                  <div className={`relative w-32 h-32 rounded-full overflow-hidden border-4 bg-slate-800 shadow-lg group ${
                      formData.esExtraviado ? 'border-red-600 grayscale' :
                      formData.enArchivoMuerto ? 'border-slate-600 grayscale' : 
                      formData.esCasoLegal ? 'border-amber-600' :
                      formData.esCasoEspecial ? 'border-purple-600' :
                      formData.esRetenido ? 'border-pink-500' :
                      formData.esDadoDeAlta ? 'border-emerald-500' :
                      'border-slate-700'
                    }`}>
                    {formData.foto ? (
                      <img src={formData.foto} alt="Paciente" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <User size={48} />
                      </div>
                    )}
                    
                    {/* Overlay para editar foto */}
                    {!readOnly && (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                      >
                        <Camera size={24} />
                        <span className="text-[10px] font-medium mt-1">Cambiar Foto</span>
                      </div>
                    )}
                  </div>

                  {!readOnly && (
                    <div className="flex gap-2">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/30 text-blue-300 rounded-lg hover:bg-blue-900/50 border border-blue-900/50 transition-colors"
                      >
                        <Upload size={14} /> Subir
                      </button>
                      {formData.foto && (
                        <button 
                          onClick={removeImage}
                          className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40 border border-red-900/50 transition-colors"
                        >
                          <Trash2 size={14} /> 
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Número de Expediente</label>
                  <input
                    type="text"
                    name="numeroExpediente"
                    value={formData.numeroExpediente}
                    onChange={handleChange}
                    disabled={readOnly}
                    placeholder="Ej: EXP-2024-001"
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Clasificación de Archivo (Color)</label>
                  <select
                    name="tipoArchivo"
                    value={formData.tipoArchivo}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="Azul">Registro Azul (Estándar)</option>
                    <option value="Verde">Registro Verde</option>
                    <option value="Pediatrico">Pediátrico</option>
                  </select>
                </div>

                {/* Sección de Ubicación Física / Estado Especial */}
                <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Ubicación Física / Estatus Especial</p>
                    
                    <div className="space-y-2">
                        {/* Dado de Alta */}
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900/50 transition-colors">
                            <div className="flex items-center gap-2 text-slate-300 text-xs">
                                <CheckCircle2 size={14} className="text-emerald-500"/>
                                Paciente Dado de Alta
                            </div>
                            <button 
                                onClick={() => handleLocationToggle('esDadoDeAlta')}
                                disabled={readOnly}
                                className={`w-8 h-4 rounded-full relative transition-colors ${formData.esDadoDeAlta ? 'bg-emerald-600' : 'bg-slate-800 border border-slate-600'} ${readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${formData.esDadoDeAlta ? 'left-4' : 'left-0.5'}`}></div>
                            </button>
                        </div>

                        {/* Archivo Muerto */}
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900/50 transition-colors">
                            <div className="flex items-center gap-2 text-slate-300 text-xs">
                                <Archive size={14} className="text-slate-500"/>
                                En Archivo Muerto
                            </div>
                            <button 
                                onClick={() => handleLocationToggle('enArchivoMuerto')}
                                disabled={readOnly}
                                className={`w-8 h-4 rounded-full relative transition-colors ${formData.enArchivoMuerto ? 'bg-slate-500' : 'bg-slate-800 border border-slate-600'} ${readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${formData.enArchivoMuerto ? 'left-4' : 'left-0.5'}`}></div>
                            </button>
                        </div>

                        {/* Caso Especial */}
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900/50 transition-colors">
                            <div className="flex items-center gap-2 text-slate-300 text-xs">
                                <Star size={14} className="text-purple-500"/>
                                Caso Especial
                            </div>
                            <button 
                                onClick={() => handleLocationToggle('esCasoEspecial')}
                                disabled={readOnly}
                                className={`w-8 h-4 rounded-full relative transition-colors ${formData.esCasoEspecial ? 'bg-purple-600' : 'bg-slate-800 border border-slate-600'} ${readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${formData.esCasoEspecial ? 'left-4' : 'left-0.5'}`}></div>
                            </button>
                        </div>

                        {/* Caso Legal */}
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900/50 transition-colors">
                            <div className="flex items-center gap-2 text-slate-300 text-xs">
                                <Scale size={14} className="text-amber-500"/>
                                Caso Legal
                            </div>
                            <button 
                                onClick={() => handleLocationToggle('esCasoLegal')}
                                disabled={readOnly}
                                className={`w-8 h-4 rounded-full relative transition-colors ${formData.esCasoLegal ? 'bg-amber-600' : 'bg-slate-800 border border-slate-600'} ${readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${formData.esCasoLegal ? 'left-4' : 'left-0.5'}`}></div>
                            </button>
                        </div>

                         {/* Retenido */}
                         <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900/50 transition-colors">
                            <div className="flex items-center gap-2 text-slate-300 text-xs">
                                <BookmarkMinus size={14} className="text-pink-500"/>
                                Retenido en Área
                            </div>
                            <button 
                                onClick={() => handleLocationToggle('esRetenido')}
                                disabled={readOnly}
                                className={`w-8 h-4 rounded-full relative transition-colors ${formData.esRetenido ? 'bg-pink-600' : 'bg-slate-800 border border-slate-600'} ${readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${formData.esRetenido ? 'left-4' : 'left-0.5'}`}></div>
                            </button>
                        </div>

                        {/* Extraviado */}
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900/50 transition-colors bg-red-900/10 border border-red-900/20">
                            <div className="flex items-center gap-2 text-red-200 text-xs font-bold">
                                <AlertOctagon size={14} className="text-red-500"/>
                                EXTRAVIADO
                            </div>
                            <button 
                                onClick={() => handleLocationToggle('esExtraviado')}
                                disabled={readOnly}
                                className={`w-8 h-4 rounded-full relative transition-colors ${formData.esExtraviado ? 'bg-red-600' : 'bg-slate-800 border border-slate-600'} ${readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${formData.esExtraviado ? 'left-4' : 'left-0.5'}`}></div>
                            </button>
                        </div>
                    </div>

                    {/* Nuevo Campo: Detalles del Caso (Visible solo si alguno está activo) */}
                    {(formData.esCasoEspecial || formData.esCasoLegal || formData.enArchivoMuerto || formData.esRetenido || formData.esExtraviado || formData.esDadoDeAlta) && (
                        <div className="mt-3 pt-3 border-t border-slate-800/50 animate-in fade-in slide-in-from-top-2">
                            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                                <AlertTriangle size={10} />
                                {formData.enArchivoMuerto ? 'Motivo de Archivo / Ubicación Física' : 
                                 formData.esCasoLegal ? 'Detalles del Caso Legal / Situación Jurídica' : 
                                 formData.esRetenido ? '¿Quién lo retiene / En qué área está?' :
                                 formData.esExtraviado ? 'Fecha y circunstancias del extravío' :
                                 formData.esDadoDeAlta ? 'Fecha de Alta y Motivo de Conclusión' :
                                 'Observaciones del Caso Especial'}
                            </label>
                            <textarea
                                name="detallesCaso"
                                value={formData.detallesCaso || ''}
                                onChange={handleChange}
                                disabled={readOnly}
                                rows={2}
                                placeholder={formData.esRetenido ? "Ej: En dirección con Dr. X" : "Detalles..."}
                                className="w-full rounded-lg bg-slate-900/80 border border-slate-700 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none resize-none placeholder-slate-600"
                            />
                        </div>
                    )}
                </div>
                
                {/* Nuevos Campos: Fecha y Cuatrimestre */}
                <div className="grid grid-cols-2 gap-3 bg-slate-900/30 p-2 rounded-lg border border-slate-800">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Fecha Realización</label>
                        <input
                            type="date"
                            name="fechaRealizacion"
                            value={formData.fechaRealizacion}
                            onChange={handleChange}
                            disabled={readOnly}
                            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Cuatrimestre</label>
                        <input
                            type="text"
                            name="cuatrimestre"
                            value={formData.cuatrimestre}
                            onChange={handleChange}
                            placeholder="Ej: Enero-Abril 2024"
                            disabled={readOnly}
                            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Nombre del Paciente</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Edad</label>
                    <div className="relative">
                        <input
                        type="number"
                        name="edad"
                        value={formData.edad}
                        onChange={handleChange}
                        disabled={readOnly}
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                        />
                    </div>
                    {formData.edad > 0 && (
                        <div className="mt-1 text-[10px] text-blue-400 font-medium px-1 uppercase">
                            {getAgeClassification(formData.edad)}
                        </div>
                    )}
                  </div>
                </div>

                {/* State of Origin */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Estado de Procedencia</label>
                  <input
                    type="text"
                    name="estadoProcedencia"
                    value={formData.estadoProcedencia}
                    onChange={handleChange}
                    disabled={readOnly}
                    placeholder="Ej: Jalisco, CDMX..."
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>

                {/* Address Field */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Dirección Completa</label>
                  <textarea
                    name="direccion"
                    rows={2}
                    value={formData.direccion}
                    onChange={handleChange}
                    disabled={readOnly}
                    placeholder="Calle, Número, Colonia, CP..."
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 resize-none"
                  />
                </div>

                {/* Multiple Phone Numbers */}
                <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-400">Teléfonos de Contacto</label>
                    <input
                      type="text"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      disabled={readOnly}
                      placeholder="Teléfono Principal (Celular)"
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <div className="grid grid-cols-2 gap-2">
                         <input
                          type="text"
                          name="telefono2"
                          value={formData.telefono2}
                          onChange={handleChange}
                          disabled={readOnly}
                          placeholder="Tel. Casa / Recados"
                          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <input
                          type="text"
                          name="telefono3"
                          value={formData.telefono3}
                          onChange={handleChange}
                          disabled={readOnly}
                          placeholder="Tel. Emergencia"
                          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                        />
                    </div>
                </div>

              </div>

              {/* Columna 2: Clasificación ASA y Equipo */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-blue-900/50 pb-2">Clasificación ASA & Equipo</h3>
                
                {/* ASA Selector */}
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">
                        <HeartPulse size={12} className="text-red-400" />
                        Clasificación ASA (Riesgo)
                    </label>
                    <div className="grid grid-cols-5 gap-1 mb-2">
                        {(['ASA I', 'ASA II', 'ASA III', 'ASA IV', 'ASA V'] as ASAScore[]).map((score) => (
                            <button
                                key={score}
                                onClick={() => handleASAClick(score)}
                                disabled={readOnly}
                                className={`
                                    text-[10px] py-1.5 rounded-md font-bold transition-all border
                                    ${formData.asaScore === score 
                                        ? getASAColor(score) + ' scale-105 shadow-lg z-10' 
                                        : 'bg-slate-800 border-transparent text-slate-500 hover:bg-slate-700'}
                                `}
                            >
                                {score.split(' ')[1]}
                            </button>
                        ))}
                    </div>
                    <div className="text-xs text-center font-medium min-h-[1.5em] transition-colors" style={{
                        color: formData.asaScore === 'ASA III' ? '#fbbf24' : 
                              formData.asaScore === 'ASA I' ? '#4ade80' :
                              formData.asaScore === 'ASA II' ? '#60a5fa' :
                              formData.asaScore === 'ASA IV' ? '#f87171' :
                              formData.asaScore === 'ASA V' ? '#c084fc' : '#94a3b8'
                    }}>
                        {getASADescription(formData.asaScore || 'ASA I')}
                    </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Rutas Clínicas Asignadas</label>
                  
                  {/* Lista de rutas seleccionadas (Tags) */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.rutaClinica.length > 0 ? (
                      formData.rutaClinica.map((ruta) => (
                        <span key={ruta} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-900/40 text-blue-200 border border-blue-800 rounded-md text-xs">
                          {ruta}
                          {!readOnly && (
                            <button onClick={() => handleRemoveRoute(ruta)} className="hover:text-white">
                              <X size={12} />
                            </button>
                          )}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-600 italic">Sin rutas asignadas</span>
                    )}
                  </div>

                  {/* Selector para agregar */}
                  {!readOnly && (
                    <div className="flex gap-2">
                      <select
                        value={routeSelectValue}
                        onChange={handleAddRoute}
                        className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">+ Agregar Ruta Clínica...</option>
                        {CLINICAL_ROUTES.map((route) => (
                          <option key={route.value} value={route.value} disabled={formData.rutaClinica.includes(route.value)}>
                            {route.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Alumno Responsable</label>
                  <input
                    type="text"
                    name="alumno"
                    value={formData.alumno}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Médico Tratante</label>
                  <input
                    type="text"
                    name="medicoTratante"
                    value={formData.medicoTratante}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Docente que Autoriza</label>
                  <input
                    type="text"
                    name="docenteAutoriza"
                    value={formData.docenteAutoriza}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Columna 3: Detalles Médicos */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-blue-900/50 pb-2">Seguimiento</h3>
                
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Estado del Expediente</label>
                  <input
                    type="text"
                    name="estadoExpediente"
                    value={formData.estadoExpediente}
                    onChange={handleChange}
                    disabled={readOnly}
                    placeholder="Ej: Activo"
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Último Tratamiento Realizado</label>
                  <input
                    type="text"
                    name="ultimoTratamiento"
                    value={formData.ultimoTratamiento}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Última Visita</label>
                    <input
                      type="date"
                      name="ultimaVisita"
                      value={formData.ultimaVisita}
                      onChange={handleChange}
                      disabled={readOnly}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Estado Pago</label>
                    <select
                      name="estadoPago"
                      value={formData.estadoPago}
                      onChange={handleChange}
                      disabled={readOnly}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <option value="Al día">Al día</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="Deuda">Deuda</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Historial Médico / Notas</label>
                  <textarea
                    name="historialMedico"
                    rows={4}
                    value={formData.historialMedico}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="Alergias, condiciones..."
                  />
                </div>

                {/* AI Summary Button */}
                <div className="pt-2">
                  <button 
                      onClick={handleGenerateSummary}
                      disabled={isGenerating}
                      className="w-full text-xs flex items-center justify-center gap-2 text-purple-300 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-800 py-2.5 rounded-lg font-medium disabled:opacity-50 transition-colors"
                    >
                      <Sparkles size={14} />
                      {isGenerating ? 'Analizando...' : 'Generar Resumen con IA'}
                    </button>
                    {aiSummary && (
                    <div className="mt-2 p-3 bg-slate-900 border border-purple-900/50 rounded-lg text-xs text-slate-300 shadow-sm max-h-32 overflow-y-auto">
                      <div dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\n/g, '<br/>') }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXPEDIENTE DIGITAL */}
          {activeTab === 'studies' && (
            <div className="space-y-8">
              
              {/* Upload Area */}
              {!readOnly && (
                <div className="bg-slate-900/30 border-2 border-dashed border-slate-700 rounded-xl p-6 hover:border-blue-500 hover:bg-slate-900/50 transition-all">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex shrink-0 items-center justify-center text-blue-400">
                      <Upload size={24} />
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-sm font-bold text-white mb-1">Agregar Documento o Imagen</h3>
                        <p className="text-xs text-slate-400 mb-3">Seleccione el tipo de documento y luego cargue el archivo (PDF o Imagen).</p>
                        
                        <div className="flex flex-col sm:flex-row gap-3 items-center">
                            <select 
                                value={uploadCategory}
                                onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                                className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none w-full sm:w-auto"
                            >
                                <option value="historia_clinica">Historia Clínica / Legal</option>
                                <option value="estudio_imagen">Estudio / Radiografía</option>
                            </select>

                            <input
                                type="file"
                                ref={studyInputRef}
                                onChange={handleStudyUpload}
                                accept="image/*,application/pdf"
                                className="hidden"
                            />
                            <button
                                onClick={() => studyInputRef.current?.click()}
                                className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Paperclip size={16} /> Seleccionar Archivo
                            </button>
                        </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN 1: HISTORIA CLÍNICA (Documentos Legales) */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <FileClock size={18} className="text-emerald-400" />
                    Historial Clínico y Documentos Legales
                </h3>
                
                {clinicalHistoryFiles.length === 0 ? (
                    <p className="text-xs text-slate-500 italic px-2">No hay historias clínicas cargadas.</p>
                ) : (
                    <div className="space-y-2">
                        {clinicalHistoryFiles.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg group hover:border-slate-700 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-900/20 rounded-lg">
                                        <FileText size={20} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-200">{doc.nombre}</p>
                                        <p className="text-[10px] text-slate-500">Agregado: {doc.fecha}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <a 
                                        href={doc.url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                        title="Abrir Documento"
                                    >
                                        <ExternalLink size={18} />
                                    </a>
                                    {!readOnly && (
                                        <button 
                                            onClick={() => handleDeleteStudy(doc.id)}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
              </div>

              {/* SECCIÓN 2: ESTUDIOS E IMÁGENES (Grid) */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <ImageIcon size={18} className="text-blue-400" />
                  Galería de Estudios y Radiografías
                </h3>
                
                {imageStudyFiles.length === 0 ? (
                   <p className="text-xs text-slate-500 italic px-2">No hay estudios o radiografías cargadas.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {imageStudyFiles.map((study) => (
                      <div key={study.id} className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                        
                        {/* Preview Area */}
                        <div className="h-32 w-full bg-slate-800 flex items-center justify-center overflow-hidden relative">
                           {study.tipo === 'imagen' ? (
                             <img src={study.url} alt={study.nombre} className="w-full h-full object-cover" />
                           ) : (
                             <div className="flex flex-col items-center gap-2 text-red-400">
                               <FileText size={40} />
                               <span className="text-[10px] font-bold uppercase">PDF</span>
                             </div>
                           )}
                           
                           {/* Hover Actions */}
                           <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                             <a 
                               href={study.url} 
                               target="_blank" 
                               rel="noreferrer"
                               className="p-2 bg-slate-700 text-white rounded-full hover:bg-blue-600 transition-colors"
                               title="Ver Archivo Completo"
                             >
                               <ExternalLink size={16} />
                             </a>
                             {!readOnly && (
                               <button 
                                 onClick={() => handleDeleteStudy(study.id)}
                                 className="p-2 bg-slate-700 text-white rounded-full hover:bg-red-600 transition-colors"
                                 title="Eliminar Archivo"
                               >
                                 <Trash2 size={16} />
                               </button>
                             )}
                           </div>
                        </div>

                        {/* Info Footer */}
                        <div className="p-3">
                          <p className="text-xs font-medium text-slate-200 truncate" title={study.nombre}>{study.nombre}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{study.fecha}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-[#0B1121] rounded-b-xl shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 font-medium transition-colors text-sm"
          >
            {readOnly ? 'Cerrar' : 'Cancelar'}
          </button>
          {!readOnly && (
            <button
              onClick={() => onSave(formData)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/20 text-sm"
            >
              <Save size={16} />
              Guardar Expediente
            </button>
          )}
        </div>
      </div>
    </div>
  );
};