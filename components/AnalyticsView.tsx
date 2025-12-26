

import React, { useMemo } from 'react';
import { Patient, ASAScore, ClinicRequest } from '../types';
import { PieChart, BarChart, Activity, MapPin, DollarSign, Users, AlertTriangle, TrendingUp, Calendar, ClipboardList, Scale, Star, Archive, AlertOctagon, BookmarkMinus, CheckCircle2 } from 'lucide-react';

interface AnalyticsViewProps {
  patients: Patient[];
  requests?: ClinicRequest[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ patients, requests = [] }) => {
  
  // 1. Cálculos Estadísticos Generales
  const stats = useMemo(() => {
    const total = patients.length;
    
    // Status Counts (New)
    const statusCounts = {
        dead: patients.filter(p => p.enArchivoMuerto).length,
        special: patients.filter(p => p.esCasoEspecial).length,
        legal: patients.filter(p => p.esCasoLegal).length,
        retained: patients.filter(p => p.esRetenido).length,
        lost: patients.filter(p => p.esExtraviado).length,
        discharged: patients.filter(p => p.esDadoDeAlta).length
    };

    // ASA Stats
    const asaCounts = patients.reduce((acc, p) => {
      const score = p.asaScore || 'ASA I';
      acc[score] = (acc[score] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Clinical Route Stats (Un paciente puede tener varias rutas)
    const routeCounts = patients.reduce((acc, p) => {
      p.rutaClinica.forEach(ruta => {
        acc[ruta] = (acc[ruta] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Ordenar rutas por popularidad
    const topRoutes = Object.entries(routeCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5); // Top 5

    // Estado de Pago
    const paymentCounts = patients.reduce((acc, p) => {
      acc[p.estadoPago] = (acc[p.estadoPago] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Procedencia
    const originCounts = patients.reduce((acc, p) => {
      const origin = p.estadoProcedencia || 'No especificado';
      acc[origin] = (acc[origin] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Ordenar procedencia
    const topOrigins = Object.entries(originCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5);

    // Grupos de Edad
    const ageGroups: Record<string, number> = {
      'Infancia (0-11)': 0,
      'Adolescencia (12-18)': 0,
      'Juventud (19-26)': 0,
      'Adultez (27-59)': 0,
      'Vejez (60+)': 0
    };

    patients.forEach(p => {
      if (p.edad <= 11) ageGroups['Infancia (0-11)']++;
      else if (p.edad <= 18) ageGroups['Adolescencia (12-18)']++;
      else if (p.edad <= 26) ageGroups['Juventud (19-26)']++;
      else if (p.edad <= 59) ageGroups['Adultez (27-59)']++;
      else ageGroups['Vejez (60+)']++;
    });

    return { total, statusCounts, asaCounts, topRoutes, paymentCounts, topOrigins, ageGroups };
  }, [patients]);


  // 2. Cálculos Estadísticos de Solicitudes (Flujo Temporal)
  const requestStats = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDateStr = today.toISOString().split('T')[0];

    // Helper para determinar cuatrimestre (0=Ene-Abr, 1=May-Ago, 2=Sep-Dic)
    const getCuatriIndex = (date: Date) => {
        const m = date.getMonth();
        if (m <= 3) return 0;
        if (m <= 7) return 1;
        return 2;
    }
    const currentCuatriIndex = getCuatriIndex(today);

    // Helper para determinar semana actual (simplificado a ISO week string YYYY-WW o misma semana de año)
    // Usaremos algo mas simple: si la fecha está en los ultimos 7 dias (incluyendo hoy)
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);

    let daily = 0;
    let weekly = 0;
    let monthly = 0;
    let cuatri = 0;
    let yearly = 0;

    requests.forEach(req => {
        // Parsear fecha de solicitud (req.date es string YYYY-MM-DD)
        const [y, m, d] = req.date.split('-').map(Number);
        const reqDate = new Date(y, m - 1, d); // Meses en JS son 0-11
        
        const patientCount = req.requestedPatients.length;

        // Anual
        if (y === currentYear) {
            yearly += patientCount;

            // Cuatrimestre
            if (getCuatriIndex(reqDate) === currentCuatriIndex) {
                cuatri += patientCount;
            }

            // Mensual
            if (m - 1 === currentMonth) {
                monthly += patientCount;
            }

            // Diario
            if (req.date === currentDateStr) {
                daily += patientCount;
            }
        }

        // Semanal (Últimos 7 días)
        if (reqDate >= oneWeekAgo && reqDate <= today) {
            weekly += patientCount;
        }
    });

    return { daily, weekly, monthly, cuatri, yearly };

  }, [requests]);


  // Helper para colores ASA
  const getASAColor = (score: string) => {
    switch (score) {
      case 'ASA I': return 'bg-green-500';
      case 'ASA II': return 'bg-blue-500';
      case 'ASA III': return 'bg-yellow-500';
      case 'ASA IV': return 'bg-red-500';
      case 'ASA V': return 'bg-purple-500';
      default: return 'bg-slate-500';
    }
  };

  const getPercent = (val: number) => ((val / stats.total) * 100).toFixed(1);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Sección 1: KPI Cards Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] p-5 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden">
           <div className="flex justify-between items-start z-10 relative">
             <div>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pacientes Totales</p>
               <h3 className="text-3xl font-bold text-white mt-1">{stats.total}</h3>
             </div>
             <div className="p-2 bg-blue-900/30 rounded-lg text-blue-400">
               <Users size={20} />
             </div>
           </div>
           <div className="mt-4 flex items-center gap-1 text-xs text-green-400">
             <TrendingUp size={12} />
             <span>Base de datos activa</span>
           </div>
        </div>

        <div className="bg-[#111827] p-5 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden">
           <div className="flex justify-between items-start z-10 relative">
             <div>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pacientes con Deuda</p>
               <h3 className="text-3xl font-bold text-white mt-1">{stats.paymentCounts['Deuda'] || 0}</h3>
             </div>
             <div className="p-2 bg-red-900/30 rounded-lg text-red-400">
               <DollarSign size={20} />
             </div>
           </div>
           <div className="mt-4 text-xs text-slate-500">
             Requieren gestión de cobranza
           </div>
           <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-red-500/10 rounded-full blur-xl"></div>
        </div>

        <div className="bg-[#111827] p-5 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden">
           <div className="flex justify-between items-start z-10 relative">
             <div>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Casos Sistémicos</p>
               <h3 className="text-3xl font-bold text-white mt-1">
                 {(stats.asaCounts['ASA II'] || 0) + (stats.asaCounts['ASA III'] || 0) + (stats.asaCounts['ASA IV'] || 0)}
               </h3>
             </div>
             <div className="p-2 bg-yellow-900/30 rounded-lg text-yellow-400">
               <Activity size={20} />
             </div>
           </div>
           <div className="mt-4 text-xs text-yellow-500/80">
             ASA II o superior
           </div>
        </div>

        <div className="bg-[#111827] p-5 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden">
           <div className="flex justify-between items-start z-10 relative">
             <div>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Clínica Más Activa</p>
               <h3 className="text-2xl font-bold text-white mt-1 truncate">
                 {stats.topRoutes[0] ? stats.topRoutes[0][0] : 'N/A'}
               </h3>
             </div>
             <div className="p-2 bg-purple-900/30 rounded-lg text-purple-400">
               <BarChart size={20} />
             </div>
           </div>
           <div className="mt-4 text-xs text-slate-500">
             Mayor volumen de pacientes
           </div>
        </div>
      </div>

      {/* Sección 2: Gestión Institucional (NUEVO) */}
      <h3 className="text-white font-bold flex items-center gap-2 mt-4">
            <Scale size={18} className="text-slate-400" />
            Gestión Institucional y Estatus Administrativos
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
         <div className="bg-[#111827] p-4 rounded-xl border border-slate-800 flex items-center justify-between shadow-lg relative overflow-hidden">
             <div className="absolute right-0 top-0 bottom-0 w-1 bg-amber-600"></div>
             <div>
                <p className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Scale size={14}/> Casos Legales
                </p>
                <p className="text-2xl font-bold text-white">{stats.statusCounts.legal}</p>
             </div>
         </div>
         <div className="bg-[#111827] p-4 rounded-xl border border-slate-800 flex items-center justify-between shadow-lg relative overflow-hidden">
             <div className="absolute right-0 top-0 bottom-0 w-1 bg-purple-600"></div>
             <div>
                <p className="text-purple-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Star size={14}/> Casos Especiales
                </p>
                <p className="text-2xl font-bold text-white">{stats.statusCounts.special}</p>
             </div>
         </div>
         <div className="bg-[#111827] p-4 rounded-xl border border-slate-800 flex items-center justify-between shadow-lg relative overflow-hidden">
             <div className="absolute right-0 top-0 bottom-0 w-1 bg-slate-600"></div>
             <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Archive size={14}/> Archivo Muerto
                </p>
                <p className="text-2xl font-bold text-white">{stats.statusCounts.dead}</p>
             </div>
         </div>
         {/* Retenidos */}
         <div className="bg-[#111827] p-4 rounded-xl border border-slate-800 flex items-center justify-between shadow-lg relative overflow-hidden">
             <div className="absolute right-0 top-0 bottom-0 w-1 bg-pink-600"></div>
             <div>
                <p className="text-pink-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <BookmarkMinus size={14}/> Retenidos
                </p>
                <p className="text-2xl font-bold text-white">{stats.statusCounts.retained}</p>
             </div>
         </div>
         {/* Extraviados */}
         <div className="bg-[#111827] p-4 rounded-xl border border-red-900/50 flex items-center justify-between shadow-lg relative overflow-hidden">
             <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-600"></div>
             <div>
                <p className="text-red-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <AlertOctagon size={14}/> Extraviados
                </p>
                <p className="text-2xl font-bold text-white">{stats.statusCounts.lost}</p>
             </div>
         </div>
         {/* Dados de Alta (NUEVO) */}
         <div className="bg-[#111827] p-4 rounded-xl border border-emerald-900/50 flex items-center justify-between shadow-lg relative overflow-hidden">
             <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
             <div>
                <p className="text-emerald-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <CheckCircle2 size={14}/> Dados de Alta
                </p>
                <p className="text-2xl font-bold text-white">{stats.statusCounts.discharged}</p>
             </div>
         </div>
      </div>

      {/* Sección 3: Flujo de Solicitudes */}
      <div className="bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-lg">
         <h3 className="text-white font-bold mb-6 flex items-center gap-2">
            <ClipboardList size={18} className="text-cyan-400" />
            Flujo de Expedientes (Solicitudes Aprobadas)
         </h3>
         <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
             {/* Diario */}
             <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-center">
                 <p className="text-xs text-slate-400 uppercase font-bold mb-1">Hoy</p>
                 <p className="text-2xl font-bold text-white">{requestStats.daily}</p>
                 <span className="text-[10px] text-slate-500">Pacientes</span>
             </div>
             {/* Semanal */}
             <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-center">
                 <p className="text-xs text-slate-400 uppercase font-bold mb-1">Semana</p>
                 <p className="text-2xl font-bold text-white">{requestStats.weekly}</p>
                 <span className="text-[10px] text-slate-500">Últimos 7 días</span>
             </div>
             {/* Mensual */}
             <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-center">
                 <p className="text-xs text-slate-400 uppercase font-bold mb-1">Mes Actual</p>
                 <p className="text-2xl font-bold text-cyan-400">{requestStats.monthly}</p>
                 <span className="text-[10px] text-slate-500">Pacientes</span>
             </div>
             {/* Cuatrimestre */}
             <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-center">
                 <p className="text-xs text-slate-400 uppercase font-bold mb-1">Cuatrimestre</p>
                 <p className="text-2xl font-bold text-white">{requestStats.cuatri}</p>
                 <span className="text-[10px] text-slate-500">Periodo actual</span>
             </div>
             {/* Anual */}
             <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-center">
                 <p className="text-xs text-slate-400 uppercase font-bold mb-1">Año {new Date().getFullYear()}</p>
                 <p className="text-2xl font-bold text-white">{requestStats.yearly}</p>
                 <span className="text-[10px] text-slate-500">Acumulado</span>
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfica ASA */}
        <div className="lg:col-span-2 bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-lg">
          <h3 className="text-white font-bold mb-6 flex items-center gap-2">
            <Activity size={18} className="text-blue-500" />
            Distribución de Riesgo (Clasificación ASA)
          </h3>
          <div className="space-y-4">
            {(['ASA I', 'ASA II', 'ASA III', 'ASA IV', 'ASA V'] as string[]).map(score => {
              const count = stats.asaCounts[score] || 0;
              const percent = Number(getPercent(count));
              return (
                <div key={score} className="relative">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">{score}</span>
                    <span className="text-slate-400">{count} pacientes ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-2.5 rounded-full ${getASAColor(score)} transition-all duration-1000 ease-out`} 
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gráfica Procedencia */}
        <div className="bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-lg">
          <h3 className="text-white font-bold mb-6 flex items-center gap-2">
            <MapPin size={18} className="text-emerald-500" />
            Top Procedencia
          </h3>
          <div className="space-y-4">
            {stats.topOrigins.map(([origin, count], idx) => (
              <div key={origin} className="flex items-center gap-3 pb-3 border-b border-slate-800/50 last:border-0">
                <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-slate-200 font-medium truncate">{origin}</p>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1">
                    <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${(count / stats.total) * 100}%` }}></div>
                  </div>
                </div>
                <span className="text-xs font-bold text-white">{count}</span>
              </div>
            ))}
            {stats.topOrigins.length === 0 && <p className="text-sm text-slate-500 italic">No hay datos de procedencia.</p>}
          </div>
        </div>

        {/* Gráfica Rutas Clínicas */}
        <div className="bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-lg">
          <h3 className="text-white font-bold mb-6 flex items-center gap-2">
            <PieChart size={18} className="text-purple-500" />
            Carga por Clínica
          </h3>
          <div className="space-y-4">
             {stats.topRoutes.map(([route, count]) => (
               <div key={route} className="group">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 group-hover:text-white transition-colors">{route}</span>
                    <span className="text-slate-500">{count}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${(count / stats.total) * 100}%` }}
                    ></div>
                  </div>
               </div>
             ))}
          </div>
        </div>

        {/* Gráfica Edades */}
        <div className="lg:col-span-2 bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-lg">
           <h3 className="text-white font-bold mb-6 flex items-center gap-2">
            <Users size={18} className="text-orange-500" />
            Demografía por Edad
          </h3>
          <div className="flex items-end justify-between h-40 gap-2 mt-4 px-4">
            {Object.entries(stats.ageGroups).map(([group, count]) => {
               // Calcular altura relativa (max height 100%)
               const maxVal = Math.max(...(Object.values(stats.ageGroups) as number[]));
               const heightPercent = maxVal > 0 ? ((count as number) / maxVal) * 100 : 0;
               
               return (
                 <div key={group} className="flex flex-col items-center flex-1 group">
                    <span className="text-xs font-bold text-white mb-2 opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                    <div className="w-full max-w-[40px] bg-slate-800 rounded-t-lg relative overflow-hidden h-full flex items-end">
                       <div 
                         className="w-full bg-orange-500/80 group-hover:bg-orange-500 transition-all rounded-t-lg"
                         style={{ height: `${heightPercent}%` }}
                       ></div>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-2 text-center leading-tight">{group.split(' ')[0]}</span>
                 </div>
               );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};