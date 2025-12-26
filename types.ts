

export type TipoArchivo = 'Azul' | 'Verde' | 'Pediatrico';

export type UserRole = 'admin' | 'registrar' | 'student';

export type ASAScore = 'ASA I' | 'ASA II' | 'ASA III' | 'ASA IV' | 'ASA V';

export type DocumentCategory = 'historia_clinica' | 'estudio_imagen';

export type RequestStatus = 'pending' | 'ready' | 'delivered';

export type PeriodoCuatrimestre = 'Enero-Abril' | 'Mayo-Agosto' | 'Septiembre-Diciembre';

export interface Study {
  id: string;
  nombre: string;
  tipo: 'imagen' | 'pdf';
  categoria: DocumentCategory;
  fecha: string;
  url: string; // Base64
}

export interface Patient {
  id: string;
  numeroExpediente: string;
  foto?: string;
  nombre: string;
  edad: number;
  estadoProcedencia: string;
  
  // Datos Administrativos de Creación
  fechaRealizacion: string;
  cuatrimestre: string; // Ej: "Enero-Abril 2024"

  // Contacto
  direccion: string;
  telefono: string;
  telefono2: string;
  telefono3: string;
  email: string;
  
  // Campos solicitados
  rutaClinica: string[];
  alumno: string;
  medicoTratante: string;
  docenteAutoriza: string;
  ultimoTratamiento: string;
  estadoExpediente: string;
  tipoArchivo: TipoArchivo;
  
  // Estados de Ubicación / Administrativos
  enArchivoMuerto: boolean;
  esCasoEspecial: boolean;
  esCasoLegal: boolean;
  esRetenido: boolean;   // Nuevo: Retenido en área
  esExtraviado: boolean;  // Nuevo: Extraviado
  esDadoDeAlta: boolean;  // Nuevo: Paciente Dado de Alta (Tratamiento Concluido)
  detallesCaso?: string; 
  
  // Clasificación médica
  asaScore?: ASAScore;

  // Archivos adjuntos
  estudios: Study[];

  // Campos auxiliares
  ultimaVisita: string;
  proximaCita: string;
  historialMedico: string;
  estadoPago: 'Al día' | 'Pendiente' | 'Deuda';
  notas: string;
}

export interface ClinicRequest {
  id: string;
  studentName: string;
  studentPhone: string;
  guardia: string;
  clinicNumber: string; // 1-6
  clinicName: string; // Especialidad (e.g. Endo, Protesis)
  teacher: string;
  date: string;
  startTime: string;
  endTime: string;
  status: RequestStatus;
  requestedPatients: Patient[]; // Lista de pacientes solicitados
  createdAt: string;
}

export interface AIAnalysisResult {
  summary: string;
  suggestedActions: string[];
}