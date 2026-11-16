import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  Scale, 
  Camera, 
  Eye, 
  AlertTriangle, 
  DollarSign, 
  CheckCircle2, 
  FileSpreadsheet, 
  ShieldAlert, 
  Maximize2, 
  X,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import { removeWasteReport } from '../services/firebase';
import { shareWasteReportToWhatsApp } from '../utils/whatsappShare';

export default function WasteReportsView({ 
  wasteReports = [], 
  onOpenNewReportModal, 
  selectedCompany 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [reasonFilter, setReasonFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL'); // 'TODAY' | 'ALL'
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtrado de reportes
  const filteredReports = wasteReports.filter((report) => {
    const textMatch = 
      report.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.responsible?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const reasonMatch = reasonFilter === 'ALL' || report.reason === reasonFilter;
    const dateMatch = dateFilter === 'ALL' || report.date === todayStr;

    return textMatch && reasonMatch && dateMatch;
  });

  // Métricas y KPIs
  const totalReportsCount = wasteReports.length;
  
  // Total Kilos
  const totalKg = wasteReports
    .filter(r => r.unit === 'Kg' || r.unit === 'kg')
    .reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

  // Total Unidades
  const totalUnd = wasteReports
    .filter(r => r.unit === 'Und' || r.unit === 'und' || r.unit === 'Porciones')
    .reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

  // Pérdida valorizada acumulada
  const totalCost = wasteReports.reduce((acc, curr) => acc + (Number(curr.costEstimated) || 0), 0);

  // Motivo más frecuente
  const reasonsCount = {};
  wasteReports.forEach(r => {
    if (r.reason) {
      reasonsCount[r.reason] = (reasonsCount[r.reason] || 0) + 1;
    }
  });
  let topReason = 'N/A';
  let maxCount = 0;
  Object.entries(reasonsCount).forEach(([res, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topReason = res;
    }
  });

  // Exportar a Excel (.xlsx)
  const handleExportExcel = () => {
    if (wasteReports.length === 0) {
      alert('No hay reportes de bajas para exportar.');
      return;
    }

    const headers = [
      'Código Baja',
      'Fecha',
      'Hora',
      'Insumo / Producto',
      'Tipo Ítem',
      'Cantidad',
      'Unidad',
      'Motivo de la Baja',
      'Persona Responsable',
      'Cargo / Área',
      'Costo Estimado ($)',
      'Tiene Foto Prueba',
      'Observaciones / Notas',
      'Empresa'
    ];

    const dataRows = filteredReports.map((r) => [
      r.code || 'BAJA',
      r.date || '',
      r.time || '',
      r.itemName || '',
      r.itemType || '',
      r.quantity || 0,
      r.unit || 'Kg',
      r.reason || '',
      r.responsible || '',
      r.operatorRole || '',
      r.costEstimated || 0,
      r.photoUrl ? 'SÍ (Foto Sellada)' : 'NO',
      r.notes || '',
      r.companyName || selectedCompany?.name || ''
    ]);

    const wsData = [headers, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 28 },
      { wch: 18 },
      { wch: 12 },
      { wch: 10 },
      { wch: 32 },
      { wch: 22 },
      { wch: 18 },
      { wch: 16 },
      { wch: 18 },
      { wch: 35 },
      { wch: 24 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bajas_Desperdicios');

    const compSlug = selectedCompany?.name ? selectedCompany.name.replace(/\s+/g, '_') : 'Planta';
    const fileName = `DC_Procesos_Bajas_${compSlug}_${todayStr}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleDelete = async (reportId) => {
    if (confirm('¿Eliminar este registro de baja? La evidencia fotográfica asociada se retirará del historial.')) {
      try {
        await removeWasteReport(reportId);
      } catch (err) {
        alert('Error eliminando reporte: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-5">
      
      {/* ======================================================== */}
      {/* TARJETAS KPI DE DESPERDICIOS Y PÉRDIDAS                  */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* KPI 1: Total Bajas Registradas */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Bajas Reportadas
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {totalReportsCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Con respaldo fotográfico pericial
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Kilos Dados de Baja */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Kilos Desperdiciados
            </p>
            <p className="text-2xl font-black text-rose-600 mt-1">
              {totalKg.toFixed(2)} <span className="text-sm font-bold text-slate-500">Kg</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              + {totalUnd} unidades/piezas
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Pérdida Valorizada Estimada */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Costo de Pérdida
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              ${totalCost.toLocaleString('es-CO')}
            </p>
            <p className="text-[11px] text-emerald-600 font-bold mt-0.5">
              Valorizado según costo de insumos
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Causa Principal */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Causa más Frecuente
            </p>
            <p className="text-xs font-black text-slate-800 mt-1 truncate max-w-[170px]" title={topReason}>
              {topReason}
            </p>
            <p className="text-[11px] text-amber-700 font-bold mt-0.5">
              {maxCount > 0 ? `${maxCount} incidencias registradas` : 'Sin registros'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* BARRA DE HERRAMIENTAS: BÚSQUEDA, FILTROS Y BOTONES       */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        
        {/* Buscador y Filtros */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código, insumo, operario o motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-rose-500"
            >
              <option value="ALL">Todos los Motivos</option>
              <option value="Caída al suelo / Contaminación física">Caída al suelo</option>
              <option value="Vencimiento / Descomposición / Mal olor">Vencimiento</option>
              <option value="Error en corte / desposte / porcionado">Error en corte</option>
              <option value="Pérdida de cadena de frío / temperatura inadecuada">Cadena de frío</option>
              <option value="Rotura o defecto en empaque al vacío">Defecto empaque</option>
              <option value="Quemadura severa por congelación">Congelación</option>
              <option value="Defecto de proveedor / hematoma / hueso astillado">Proveedor</option>
              <option value="Merma excesiva no recuperable">Merma excesiva</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-rose-500"
            >
              <option value="ALL">Todas las Fechas</option>
              <option value="TODAY">Solo Hoy ({todayStr})</option>
            </select>
          </div>
        </div>

        {/* Acciones: Nuevo Reporte y Exportar */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
            title="Exportar bajas a Excel con fecha, hora y motivo"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>

          <button
            onClick={onOpenNewReportModal}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-red-600/20 active:scale-98 transition cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>+ Registrar Baja o Desperdicio</span>
          </button>
        </div>

      </div>

      {/* ======================================================== */}
      {/* LISTADO DE REPORTES CON EVIDENCIA FOTOGRÁFICA            */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                Historial de Bajas y Desperdicios Registrados
              </h3>
              <p className="text-xs text-slate-500">
                Mostrando {filteredReports.length} de {wasteReports.length} bajas registradas en planta
              </p>
            </div>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Camera className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
            <p className="font-bold text-slate-700 text-sm">No hay bajas ni desperdicios registrados</p>
            <p className="text-xs max-w-md mx-auto text-slate-400">
              Cuando un operario o supervisor registre una baja con foto de prueba, aparecerá aquí con su sello pericial de fecha y hora.
            </p>
            <button
              onClick={onOpenNewReportModal}
              className="mt-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primera Baja Ahora</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 text-center">Foto Pericial</th>
                  <th className="py-3 px-3.5">Código / Fecha</th>
                  <th className="py-3 px-3.5">Insumo / Producto</th>
                  <th className="py-3 px-3.5 text-center">Cantidad</th>
                  <th className="py-3 px-3.5">Motivo de la Baja</th>
                  <th className="py-3 px-3.5">Reportado Por</th>
                  <th className="py-3 px-3.5 text-right">Pérdida ($)</th>
                  <th className="py-3 px-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => (
                  <tr key={report.id || report.code} className="hover:bg-slate-50/80 transition">
                    
                    {/* Foto Pericial Miniatura */}
                    <td className="py-3 px-3.5 text-center">
                      {report.photoUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedPhotoModal(report)}
                          className="relative group w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition mx-auto block cursor-pointer"
                          title="Clic para ver foto pericial completa"
                        >
                          <img 
                            src={report.photoUrl} 
                            alt={report.itemName} 
                            className="w-full h-full object-cover group-hover:scale-105 transition" 
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                        </button>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
                          <Camera className="w-4 h-4" />
                        </div>
                      )}
                    </td>

                    {/* Código y Fecha */}
                    <td className="py-3 px-3.5">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                        {report.code || 'BAJA'}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{report.date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{report.time}</span>
                      </div>
                    </td>

                    {/* Insumo */}
                    <td className="py-3 px-3.5">
                      <p className="font-bold text-slate-900 text-xs sm:text-sm">
                        {report.itemName}
                      </p>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 inline-block mt-0.5">
                        {report.itemType || 'Insumo'}
                      </span>
                      {report.notes && (
                        <p className="text-[11px] text-slate-500 mt-1 italic line-clamp-1" title={report.notes}>
                          "{report.notes}"
                        </p>
                      )}
                    </td>

                    {/* Cantidad */}
                    <td className="py-3 px-3.5 text-center">
                      <span className="text-base font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                        {report.quantity} {report.unit}
                      </span>
                    </td>

                    {/* Motivo */}
                    <td className="py-3 px-3.5 max-w-[200px]">
                      <span className="font-bold text-slate-800 text-xs block leading-snug">
                        {report.reason}
                      </span>
                    </td>

                    {/* Persona que realizó la baja */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-800 leading-tight">
                            {report.responsible}
                          </p>
                          {report.operatorRole && (
                            <p className="text-[10px] text-slate-400">
                              {report.operatorRole}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Costo Estimado */}
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-800">
                      {report.costEstimated > 0 ? (
                        <span className="text-slate-900">
                          ${report.costEstimated.toLocaleString('es-CO')}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">--</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const targetPhone = selectedCompany?.phone || selectedCompany?.whatsapp || '';
                            shareWasteReportToWhatsApp(report, targetPhone);
                          }}
                          className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                          title="Compartir Reporte y Foto por WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        {report.photoUrl && (
                          <button
                            type="button"
                            onClick={() => setSelectedPhotoModal(report)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Ver Foto Pericial con Sello"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(report.id || report.docId)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Eliminar reporte de baja"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* MODAL LIGHTBOX PARA VISUALIZACIÓN DE FOTO PERICIAL       */}
      {/* ======================================================== */}
      {selectedPhotoModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="relative w-full max-w-3xl bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[95vh]">
            
            {/* Header Lightbox */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-rose-500" />
                <div>
                  <h4 className="font-black text-sm sm:text-base text-white">
                    Evidencia Pericial: {selectedPhotoModal.code} • {selectedPhotoModal.itemName}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Baja de {selectedPhotoModal.quantity} {selectedPhotoModal.unit} • Motivo: {selectedPhotoModal.reason}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPhotoModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Imagen Grande con Sello */}
            <div className="p-3 sm:p-6 flex items-center justify-center bg-black/60 overflow-y-auto">
              <img 
                src={selectedPhotoModal.photoUrl} 
                alt="Foto pericial de baja" 
                className="max-h-[65vh] w-auto object-contain rounded-2xl border border-slate-800 shadow-2xl" 
              />
            </div>

            {/* Footer con Metadatos del Acta y Compartir WhatsApp */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 text-slate-300 text-xs flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p>
                  📅 <strong className="text-white">Fecha y Hora:</strong> {selectedPhotoModal.date} a las {selectedPhotoModal.time}
                </p>
                <p>
                  👤 <strong className="text-white">Persona que Realizó la Baja:</strong> {selectedPhotoModal.responsible}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="space-y-0.5 text-right">
                  <p>
                    ⚖️ <strong className="text-rose-400">Cantidad:</strong> {selectedPhotoModal.quantity} {selectedPhotoModal.unit}
                  </p>
                  {selectedPhotoModal.notes && (
                    <p className="text-slate-400 italic max-w-xs truncate" title={selectedPhotoModal.notes}>
                      "{selectedPhotoModal.notes}"
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const targetPhone = selectedCompany?.phone || selectedCompany?.whatsapp || '';
                    shareWasteReportToWhatsApp(selectedPhotoModal, targetPhone);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white font-bold text-xs flex items-center gap-2 transition shadow-sm"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Enviar a WhatsApp</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
