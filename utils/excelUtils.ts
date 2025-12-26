import * as XLSX from 'xlsx';
import { Patient } from '../types';

export const exportToExcel = (patients: Patient[], fileName: string = 'pacientes_clinica.xlsx') => {
  // Excluimos la foto y los estudios pesados del Excel para evitar archivos corruptos o gigantes
  // Unimos las rutas clínicas con comas para el string del excel
  const dataToExport = patients.map(({ foto, estudios, rutaClinica, ...rest }) => ({
    ...rest,
    rutaClinica: Array.isArray(rutaClinica) ? rutaClinica.join(', ') : rutaClinica,
    enArchivoMuerto: rest.enArchivoMuerto ? 'SI' : 'NO', // Export boolean as readable string
    esCasoEspecial: rest.esCasoEspecial ? 'SI' : 'NO',
    esCasoLegal: rest.esCasoLegal ? 'SI' : 'NO',
    esRetenido: rest.esRetenido ? 'SI' : 'NO',
    esExtraviado: rest.esExtraviado ? 'SI' : 'NO',
    esDadoDeAlta: rest.esDadoDeAlta ? 'SI' : 'NO',
    detallesCaso: rest.detallesCaso || ''
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pacientes");
  XLSX.writeFile(workbook, fileName);
};

export const importFromExcel = (file: File): Promise<Patient[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // cellDates: true permite leer fechas de excel correctamente en lugar de número serial
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        // Map and validate fields to ensure they match Patient interface
        const patients: Patient[] = jsonData.map((row: any) => {
          // Parse rutaClinica from comma separated string to array
          let rutas: string[] = [];
          const rawRuta = row.rutaClinica || row["Ruta Clínica"] || "";
          if (typeof rawRuta === 'string' && rawRuta.trim().length > 0) {
            rutas = rawRuta.split(',').map((s: string) => s.trim());
          }

          // Parse Booleans (Handle SI, TRUE, 1, yes case insensitive)
          const parseBool = (val: any) => {
             if (typeof val === 'string') {
                 const v = val.trim().toUpperCase();
                 return v === 'SI' || v === 'TRUE' || v === 'YES';
             }
             return val === true || val === 1;
          };

          // Helper para fechas seguras
          const parseDate = (val: any) => {
             if (val instanceof Date) return val.toISOString().split('T')[0];
             if (typeof val === 'string' && val.includes('/')) {
                 // Intentar parsear dd/mm/yyyy o mm/dd/yyyy básico
                 const parts = val.split('/');
                 if(parts.length === 3) return new Date(val).toISOString().split('T')[0]; 
             }
             return new Date().toISOString().split('T')[0]; // Fallback
          }

          return {
            id: row.id || crypto.randomUUID(),
            numeroExpediente: row.numeroExpediente || row["Número de Expediente"] || row.expediente || "",
            foto: undefined, // No importamos fotos del excel para mantener integridad
            estudios: [], // Inicializar array vacío
            nombre: row.nombre || row.Nombre || "Sin Nombre",
            edad: Number(row.edad) || Number(row.Edad) || 0,
            estadoProcedencia: row.estadoProcedencia || row["Estado de Procedencia"] || "",
            
            // New Administrative Fields
            fechaRealizacion: parseDate(row.fechaRealizacion || row["Fecha Realización"]),
            cuatrimestre: row.cuatrimestre || 'Enero-Abril ' + new Date().getFullYear(),

            // Contact fields
            direccion: row.direccion || row["Dirección"] || "",
            telefono: row.telefono || row.Telefono || "",
            telefono2: row.telefono2 || row["Teléfono 2"] || "",
            telefono3: row.telefono3 || row["Teléfono 3"] || "",
            email: row.email || row.Email || "",
            
            // New fields mapping
            rutaClinica: rutas,
            alumno: row.alumno || row.Alumno || "",
            medicoTratante: row.medicoTratante || row["Médico Tratante"] || "",
            docenteAutoriza: row.docenteAutoriza || row["Docente Autoriza"] || "",
            ultimoTratamiento: row.ultimoTratamiento || row["Último Tratamiento"] || row.tratamientoActual || "", 
            estadoExpediente: row.estadoExpediente || row["Estado Expediente"] || "Activo",
            
            // Separate Logic: Type vs Status
            tipoArchivo: (['Azul', 'Verde', 'Pediatrico'].includes(row.tipoArchivo) ? row.tipoArchivo : 'Azul') as any,
            
            enArchivoMuerto: parseBool(row.enArchivoMuerto || row["En Archivo Muerto"]),
            esCasoEspecial: parseBool(row.esCasoEspecial || row["Es Caso Especial"]),
            esCasoLegal: parseBool(row.esCasoLegal || row["Es Caso Legal"]),
            esRetenido: parseBool(row.esRetenido || row["Es Retenido"]),
            esExtraviado: parseBool(row.esExtraviado || row["Es Extraviado"]),
            esDadoDeAlta: parseBool(row.esDadoDeAlta || row["Es Dado De Alta"]),
            detallesCaso: row.detallesCaso || row["Detalles Caso"] || "",

            asaScore: (['ASA I', 'ASA II', 'ASA III', 'ASA IV', 'ASA V'].includes(row.asaScore) ? row.asaScore : 'ASA I') as any,

            ultimaVisita: row.ultimaVisita ? parseDate(row.ultimaVisita) : "",
            proximaCita: row.proximaCita ? parseDate(row.proximaCita) : "",
            historialMedico: row.historialMedico || row["Historial Médico"] || "",
            estadoPago: (['Al día', 'Pendiente', 'Deuda'].includes(row.estadoPago) ? row.estadoPago : 'Pendiente') as any,
            notas: row.notas || ""
          };
        });

        resolve(patients);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};