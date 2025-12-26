
import { GoogleGenAI } from "@google/genai";
import { Patient } from "../types";

// Always use process.env.API_KEY directly when initializing the GoogleGenAI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzePatientData = async (query: string, patients: Patient[]): Promise<string> => {
  try {
    const dataContext = JSON.stringify(patients.slice(0, 50).map(p => ({
      exp: p.numeroExpediente,
      nombre: p.nombre,
      ruta: p.rutaClinica,
      medico: p.medicoTratante,
      pago: p.estadoPago,
      estatus: p.enArchivoMuerto ? 'Muerto' : 'Activo'
    })));

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `
        Eres un asistente dental experto. Analiza estos datos: ${dataContext}
        Pregunta del usuario: "${query}"
        Responde profesionalmente en español.
      `,
    });

    return response.text || "No tengo una respuesta clara en este momento.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Lo siento, hubo un error al conectar con la IA. Verifica tu API KEY.";
  }
};

export const generatePatientSummary = async (patient: Patient): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Haz un resumen médico breve para el paciente: ${patient.nombre}. Historial: ${patient.historialMedico}. Último tratamiento: ${patient.ultimoTratamiento}.`,
    });
    return response.text || "Resumen no disponible.";
  } catch (error) {
    return "Error al generar resumen.";
  }
};
