
import { GoogleGenAI } from "@google/genai";
import { Patient } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analiza los datos de los pacientes usando el modelo gemini-3-pro-preview para razonamiento complejo.
 */
export const analyzePatientData = async (query: string, patients: Patient[]): Promise<string> => {
  try {
    const dataContext = JSON.stringify(patients.map(p => ({
      expediente: p.numeroExpediente,
      tipoArchivo: p.tipoArchivo,
      nombre: p.nombre,
      ruta: p.rutaClinica,
      alumno: p.alumno,
      medico: p.medicoTratante,
      ultimoTratamiento: p.ultimoTratamiento,
      pago: p.estadoPago,
      estatus: p.enArchivoMuerto ? 'Archivo Muerto' : (p.esExtraviado ? 'EXTRAVIADO' : 'Activo')
    })));

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `
        Actúa como un asistente administrativo y clínico experto para un consultorio dental.
        
        Base de datos actual (JSON):
        ${dataContext}

        Consulta del usuario: "${query}"

        Instrucciones:
        1. Responde de forma profesional y concisa en español.
        2. Si se solicitan estadísticas, dales formato de lista.
        3. Si se solicita redactar un mensaje para un paciente, usa un tono cordial y médico.
      `,
    });

    return response.text || "No se obtuvo respuesta de la IA.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Error al procesar la consulta con la IA. Verifique su conexión.";
  }
};

/**
 * Genera un resumen clínico rápido usando gemini-3-flash-preview.
 */
export const generatePatientSummary = async (patient: Patient): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Genera un resumen clínico ejecutivo para el dentista sobre el siguiente paciente:
        Nombre: ${patient.nombre}
        Expediente: ${patient.numeroExpediente}
        Historial: ${patient.historialMedico}
        Último Tratamiento: ${patient.ultimoTratamiento}
        Estado ASA: ${patient.asaScore}
        
        Enfócate en riesgos clínicos y alertas.
      `,
    });

    return response.text || "No se pudo generar el resumen.";
  } catch (error) {
    return "Error al generar resumen clínico.";
  }
};
