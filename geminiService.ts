
import { GoogleGenAI } from "@google/genai";
import { Patient } from "./types";

// Inicialización centralizada siguiendo las guías de @google/genai
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analiza la base de datos de pacientes para responder consultas administrativas o clínicas.
 */
export const analyzePatientData = async (query: string, patients: Patient[]): Promise<string> => {
  try {
    // Proporcionamos un contexto resumido para eficiencia de tokens
    const dataContext = JSON.stringify(patients.slice(0, 50).map(p => ({
      exp: p.numeroExpediente,
      nombre: p.nombre,
      rutas: p.rutaClinica,
      pago: p.estadoPago,
      estatus: p.enArchivoMuerto ? 'Archivo Muerto' : (p.esExtraviado ? 'EXTRAVIADO' : 'Activo'),
      asa: p.asaScore
    })));

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `
        Actúa como el Asistente Inteligente del Archivo Clínico Dental CEUMH.
        Contexto de la base de datos: ${dataContext}
        Consulta del usuario: "${query}"
        
        Instrucciones:
        1. Responde de forma profesional, amable y concisa.
        2. Si se solicitan estadísticas, preséntalas en formato de lista.
        3. Si se trata de una urgencia o caso legal, destaca la importancia.
      `,
    });

    return response.text || "No se pudo procesar la respuesta.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Error al conectar con el motor de IA. Verifique su API KEY.";
  }
};

/**
 * Genera un resumen ejecutivo para el clínico.
 */
export const generatePatientSummary = async (patient: Patient): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Resume el historial clínico de: ${patient.nombre}. Historial: ${patient.historialMedico}. ASA: ${patient.asaScore}.`,
    });
    return response.text || "Resumen no disponible.";
  } catch (error) {
    return "Error al generar resumen.";
  }
};
