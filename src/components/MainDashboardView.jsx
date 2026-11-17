import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Layers, 
  Droplet, 
  Bone, 
  Scale, 
  PackageCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Smartphone, 
  Eye, 
  Trash2, 
  FileSpreadsheet, 
  Calendar,
  Package,
  ClipboardList,
  Users,
  ChevronDown,
  Boxes
} from 'lucide-react';
import { removeProcessOrder } from '../services/firebase';
import InventoryDashboardView from './InventoryDashboardView';
import OperatorsManagementView from './OperatorsManagementView';
import ProcessTemplatesView from './ProcessTemplatesView';
import WasteReportsView from './WasteReportsView';

export default function MainDashboardView({ 
  orders = [], 
  onOpenNewOrderModal, 
  onOpenOrderDetails,
  selectedCompany,
  onBackToCompanies,
  inventoryItems = [],
  physicalInventories = [],
  onOpenNewInventoryItemModal,
  operators = [],
  onOpenNewOperatorModal,
  processTemplates = [],
  onOpenNewProcessTemplateModal,
  onEditProcessTemplate,
  onStartOrderFromTemplate,
  wasteReports = [],
  onOpenNewWasteReportModal
}) {
  const [activeMainModule, setActiveMainModule] = useState('production'); // 'production' | 'inventory' | 'waste' | 'operators' | 'templates'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL'); // 'TODAY' | 'ALL'

  // Período de Gestión (Selectores en la barra de módulos estilo DC Restaurantes)
  const now = new Date();
  const currentMonthNum = String(now.getMonth() + 1);
  const currentYearNum = String(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentMonthNum);
  const [selectedYear, setSelectedYear] = useState(currentYearNum);

  const todayStr = now.toISOString().split('T')[0];

  // Fecha actual formateada en español
  const currentDateFormatted = now.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const capitalizedDate = currentDateFormatted.charAt(0).toUpperCase() + currentDateFormatted.slice(1);

  // Período de auditoría
  const monthName = now.toLocaleDateString('es-CO', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const auditPeriodStr = `01 de ${capitalizedMonth} al ${String(now.getDate()).padStart(2, '0')} de ${capitalizedMonth} de ${now.getFullYear()}`;

  // Datos de la empresa activa
  const companyName = selectedCompany?.name || 'DC Procesos Industriales';
  const companyNit = selectedCompany?.nit || '1065594720';
  const companyEmail = selectedCompany?.email || 'contacto@empresa.com';
  const companyPhone = selectedCompany?.phone || '3004610006';
  const companyContact = selectedCompany?.contactName || selectedCompany?.contact || selectedCompany?.responsible || 'Administrador Master';
  const companyAddress = selectedCompany?.address || 'Sede Principal de Operaciones';

  // Filtrado de órdenes
  const safeOrders = orders || [];
  const filteredOrders = safeOrders.filter(order => {
    if (!order) return false;
    const textMatch = 
      (order.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.batch || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.processName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.assignedTo || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const statusMatch = statusFilter === 'ALL' || order.status === statusFilter;
    const dateMatch = dateFilter === 'ALL' || order.targetDate === todayStr;

    return textMatch && statusMatch && dateMatch;
  });

  // Métricas y KPIs calculados en tiempo real
  const completedOrders = safeOrders.filter(o => o && o.status === 'Finalizado');
  const inProgressOrders = safeOrders.filter(o => o && o.status === 'En Proceso');
  const pendingOrders = safeOrders.filter(o => o && o.status === 'Pendiente');

  const totalInputProcessedKg = completedOrders.reduce((acc, curr) => acc + (Number(curr?.totalInputKg) || 0), 0);
  const totalFinishedKg = completedOrders.reduce((acc, curr) => acc + (Number(curr?.finishedWeightKg) || 0), 0);
  const totalFinishedUnits = completedOrders.reduce((acc, curr) => acc + (Number(curr?.finishedUnits) || 0), 0);

  const totalBloodKg = completedOrders.reduce((acc, curr) => acc + (Number(curr?.bloodKg) || 0), 0);
  const totalBoneKg = completedOrders.reduce((acc, curr) => acc + (Number(curr?.boneKg) || 0), 0);
  const totalFatKg = completedOrders.reduce((acc, curr) => acc + (Number(curr?.fatKg) || 0), 0);
  const totalShrinkageKg = completedOrders.reduce((acc, curr) => acc + (Number(curr?.shrinkageKg) || 0), 0);

  const globalYield = totalInputProcessedKg > 0 
    ? ((totalFinishedKg / totalInputProcessedKg) * 100).toFixed(1) 
    : 0;

  // Exportar Órdenes a Formato Nativo Excel (.xlsx)
  const handleExportExcel = () => {
    if (orders.length === 0) {
      alert('No hay órdenes para exportar.');
      return;
    }

    const headers = [
      'Código',
      'Lote',
      'Proceso',
      'Fecha',
      'Estado',
      'Operario',
      'Insumo Total (Kg)',
      'Sangre (Kg)',
      'Hueso (Kg)',
      'Gordos (Kg)',
      'Merma (Kg)',
      'Unidades Terminadas',
      'Peso Terminado (Kg)',
      'Gramos Terminados',
      'Rendimiento (%)',
      'Diferencia Balance (Kg)',
      'Notas / Observaciones'
    ];

    const rows = orders.map(o => [
      o.code || '',
      o.batch || '',
      o.processName || '',
      o.targetDate || '',
      o.status || '',
      o.assignedTo || '',
      Number(o.totalInputKg) || 0,
      Number(o.bloodKg) || 0,
      Number(o.boneKg) || 0,
      Number(o.fatKg) || 0,
      Number(o.shrinkageKg) || 0,
      Number(o.finishedUnits) || 0,
      Number(o.finishedWeightKg) || 0,
      Number(o.finishedWeightGrams) || 0,
      Number(o.yieldPercentage) || 0,
      Number(o.balanceDifferenceKg) || 0,
      o.operatorNotes || ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      { wch: 12 },
      { wch: 16 },
      { wch: 32 },
      { wch: 14 },
      { wch: 14 },
      { wch: 22 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 16 },
      { wch: 22 },
      { wch: 40 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ordenes_Produccion');

    const fileName = `DC_Procesos_${selectedCompany ? selectedCompany.name.replace(/\s+/g, '_') : 'Produccion'}_${todayStr}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleDelete = async (orderId) => {
    if (confirm('¿Eliminar esta orden de proceso? Esta acción no se puede deshacer.')) {
      try {
        await removeProcessOrder(orderId);
      } catch (err) {
        alert('Error eliminando la orden: ' + err.message);
      }
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-4">
      
      {/* ========================================================================= */}
      {/* 1. FICHA CORPORATIVA DE LA EMPRESA (IDÉNTICO A DC RESTAURANTES)          */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-300/80 p-4 sm:p-5 shadow-2xs space-y-4">
        
        {/* Fila Superior: Icono de Empresa + Nombre y Badges Corporativos */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block animate-pulse"></span>
                <span>EMPRESA REGISTRADA EN DC ASESORÍAS</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {companyName}
                </h1>
                {onBackToCompanies && (
                  <button
                    onClick={onBackToCompanies}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold underline transition ml-1"
                    title="Volver a la selección de empresas"
                  >
                    (Cambiar)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Badges superiores a la derecha */}
          <div className="flex flex-col items-start lg:items-end gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                {capitalizedDate}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold shadow-2xs">
                👑 Usuario Master
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold shadow-2xs">
                👑 Plan Premium
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-orange-50 text-orange-800 border border-orange-200 text-xs font-bold shadow-2xs">
                📄 Cobro Mensual
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-300 text-slate-600 text-xs font-medium shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Período de Auditoría: {auditPeriodStr}</span>
            </div>
          </div>

        </div>

        {/* Fila Inferior: Cuadrícula de Datos Corporativos (Pills de Metadatos) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 pt-1">
          <div className="border border-slate-200/90 rounded-xl p-2.5 bg-slate-50/40">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              🏢 NOMBRE DE LA EMPRESA
            </p>
            <p className="text-xs font-black text-slate-800 truncate mt-0.5">{companyName}</p>
          </div>
          <div className="border border-slate-200/90 rounded-xl p-2.5 bg-slate-50/40">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              📑 NIT
            </p>
            <p className="text-xs font-black text-slate-800 font-mono truncate mt-0.5">{companyNit}</p>
          </div>
          <div className="border border-slate-200/90 rounded-xl p-2.5 bg-slate-50/40">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              ✉ CORREO VINCULADO
            </p>
            <p className="text-xs font-black text-slate-800 truncate mt-0.5">{companyEmail}</p>
          </div>
          <div className="border border-slate-200/90 rounded-xl p-2.5 bg-slate-50/40">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              📞 TELÉFONO / WHATSAPP
            </p>
            <p className="text-xs font-black text-slate-800 font-mono truncate mt-0.5">{companyPhone}</p>
          </div>
          <div className="border border-slate-200/90 rounded-xl p-2.5 bg-slate-50/40">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              👤 CONTACTO / ADMIN
            </p>
            <p className="text-xs font-black text-slate-800 truncate mt-0.5">{companyContact}</p>
          </div>
          <div className="border border-slate-200/90 rounded-xl p-2.5 bg-slate-50/40">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              📍 DIRECCIÓN
            </p>
            <p className="text-xs font-black text-slate-800 truncate mt-0.5">{companyAddress}</p>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. BARRA SELECTORA DE MÓDULOS + PERÍODO DE GESTIÓN (DC RESTAURANTES)       */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-300/80 rounded-2xl p-2.5 sm:p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        
        {/* Izquierda: Botones de los Módulos */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Módulo 1: Producción y Rendimientos */}
          {activeMainModule === 'production' ? (
            <div className="bg-[#4338ca] text-white rounded-xl px-4 py-2.5 shadow-md flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <div className="text-left leading-tight">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">PROCESOS Y PRODUCCIÓN</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black">Órdenes de Proceso</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">{orders.length}</span>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setActiveMainModule('production')}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition"
            >
              <Scale className="w-4 h-4 text-slate-600" />
              <span>Órdenes de Proceso</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">{orders.length}</span>
            </button>
          )}

          {/* Módulo Insumos y Materias Primas */}
          {activeMainModule === 'insumos' ? (
            <div className="bg-[#4338ca] text-white rounded-xl px-4 py-2.5 shadow-md flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Boxes className="w-4 h-4 text-white" />
              </div>
              <div className="text-left leading-tight">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">MATERIAS PRIMAS & COSTOS</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black">Insumos</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">{inventoryItems.length}</span>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setActiveMainModule('insumos')}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition"
            >
              <Boxes className="w-4 h-4 text-slate-600" />
              <span>Insumos</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">{inventoryItems.length}</span>
            </button>
          )}

          {/* Módulo Inventarios Físicos */}
          {activeMainModule === 'inventory' ? (
            <div className="bg-[#4338ca] text-white rounded-xl px-4 py-2.5 shadow-md flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <ClipboardList className="w-4 h-4 text-white" />
              </div>
              <div className="text-left leading-tight">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">TOMAS FÍSICAS</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black">Inventarios Físicos</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">{physicalInventories.length}</span>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setActiveMainModule('inventory')}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition"
            >
              <ClipboardList className="w-4 h-4 text-slate-600" />
              <span>Inventarios Físicos</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">{physicalInventories.length}</span>
            </button>
          )}

          {/* Módulo 3: Bajas & Desperdicios */}
          {activeMainModule === 'waste' ? (
            <div className="bg-[#4338ca] text-white rounded-xl px-4 py-2.5 shadow-md flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-white" />
              </div>
              <div className="text-left leading-tight">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">CONTROL DE MERMAS</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black">Bajas & Desperdicios 📸</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">{wasteReports.length}</span>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setActiveMainModule('waste')}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition"
            >
              <Trash2 className="w-4 h-4 text-slate-600" />
              <span>Bajas & Desperdicios 📸</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">{wasteReports.length}</span>
            </button>
          )}

          {/* Módulo 4: Operarios */}
          {activeMainModule === 'operators' ? (
            <div className="bg-[#4338ca] text-white rounded-xl px-4 py-2.5 shadow-md flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="text-left leading-tight">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">PERSONAL DE PLANTA</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black">Operarios Lite</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">{operators.length}</span>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setActiveMainModule('operators')}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition"
            >
              <Users className="w-4 h-4 text-slate-600" />
              <span>Operarios</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">{operators.length}</span>
            </button>
          )}

          {/* Módulo 5: Catálogo de Procesos */}
          {activeMainModule === 'templates' ? (
            <div className="bg-[#4338ca] text-white rounded-xl px-4 py-2.5 shadow-md flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <div className="text-left leading-tight">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">FICHAS TÉCNICAS</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black">Catálogo de Procesos</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">{processTemplates.length}</span>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setActiveMainModule('templates')}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition"
            >
              <Layers className="w-4 h-4 text-slate-600" />
              <span>Catálogo de Procesos</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">{processTemplates.length}</span>
            </button>
          )}

        </div>

        {/* Derecha: Filtros de Período de Gestión */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1 text-slate-600 font-bold">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Período de Gestión:</span>
          </span>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-slate-300 bg-white rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="1">Enero</option>
            <option value="2">Febrero</option>
            <option value="3">Marzo</option>
            <option value="4">Abril</option>
            <option value="5">Mayo</option>
            <option value="6">Junio</option>
            <option value="7">Julio</option>
            <option value="8">Agosto</option>
            <option value="9">Septiembre</option>
            <option value="10">Octubre</option>
            <option value="11">Noviembre</option>
            <option value="12">Diciembre</option>
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-slate-300 bg-white rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Con Información
          </span>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. VISTAS DE CONTENIDO SEGÚN MÓDULO ACTIVO                                */}
      {/* ========================================================================= */}
      {activeMainModule === 'insumos' ? (
        <InventoryDashboardView
          inventoryItems={inventoryItems}
          physicalInventories={physicalInventories}
          selectedCompany={selectedCompany}
          onOpenNewItemModal={onOpenNewInventoryItemModal}
          initialTab="catalog"
        />
      ) : activeMainModule === 'inventory' ? (
        <InventoryDashboardView
          inventoryItems={inventoryItems}
          physicalInventories={physicalInventories}
          selectedCompany={selectedCompany}
          onOpenNewItemModal={onOpenNewInventoryItemModal}
          initialTab="counts"
        />
      ) : activeMainModule === 'waste' ? (
        <WasteReportsView
          wasteReports={wasteReports}
          onOpenNewReportModal={onOpenNewWasteReportModal}
          selectedCompany={selectedCompany}
        />
      ) : activeMainModule === 'operators' ? (
        <OperatorsManagementView
          operators={operators}
          orders={orders}
          selectedCompany={selectedCompany}
          onOpenNewOperatorModal={onOpenNewOperatorModal}
          onOpenNewOrderModal={onOpenNewOrderModal}
        />
      ) : activeMainModule === 'templates' ? (
        <ProcessTemplatesView
          processTemplates={processTemplates}
          inventoryItems={inventoryItems}
          selectedCompany={selectedCompany}
          onOpenNewTemplateModal={onOpenNewProcessTemplateModal}
          onEditTemplate={onEditProcessTemplate}
          onStartOrderFromTemplate={onStartOrderFromTemplate}
        />
      ) : (
        <>
          {/* ========================================================================= */}
          {/* SUB-CABECERA DEL TABLERO DE PRODUCCIÓN Y BOTONES DE ACCIÓN                */}
          {/* ========================================================================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Órdenes de Proceso
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoreo en tiempo real de transacciones, transformaciones y rendimientos
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <button
                onClick={handleExportExcel}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
              >
                <Download className="w-4 h-4 text-amber-800" />
                <span>Imprimir / Descargar Excel</span>
              </button>

              <button
                onClick={onOpenNewOrderModal}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Orden de Proceso</span>
              </button>

              <button
                onClick={() => setActiveMainModule('templates')}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-blue-700 border border-slate-300 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
              >
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Plantillas Exclusivas</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. TARJETAS KPI DE PRODUCCIÓN (ESTILO DC RESTAURANTES)                    */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* KPI 1: Insumo Procesado */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-300/80 shadow-2xs relative">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-blue-600" />
                  Insumo Total a la Fecha
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
                {totalInputProcessedKg.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-sm font-semibold text-slate-400">Kg</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Mismo lapso ant: En {completedOrders.length} órdenes finalizadas</span>
              </p>
            </div>

            {/* KPI 2: Terminado Total */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-300/80 shadow-2xs relative">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Total Producto Terminado
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
                {totalFinishedKg.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-sm font-semibold text-slate-400">Kg</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span className="font-bold text-emerald-700">{totalFinishedUnits.toLocaleString()}</span>
                <span>unidades acumuladas al período</span>
              </p>
            </div>

            {/* KPI 3: Rendimiento Promedio */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-300/80 shadow-2xs relative">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                  Rendimiento Promedio
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-700 tracking-tight mt-2">
                {globalYield}%
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Basado en {completedOrders.length} transformaciones
              </p>
            </div>

            {/* KPI 4: Órdenes Programadas */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-300/80 shadow-2xs relative">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Órdenes Programadas
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
                {orders.length}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                <span className="text-amber-700">{pendingOrders.length} pend.</span>
                <span>•</span>
                <span className="text-blue-700">{inProgressOrders.length} proc.</span>
                <span>•</span>
                <span className="text-emerald-700">{completedOrders.length} fin.</span>
              </p>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* 5. TARJETA DE SUBPRODUCTOS Y MERMAS REGISTRADAS                           */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-300/80 p-5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Total Subproductos y Mermas Registradas
                </h3>
                <p className="text-xs text-slate-500">Balance de mermas y componentes cárnicos en órdenes finalizadas</p>
              </div>
              <div className="text-xs font-bold bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs">
                Total Acumulado: <strong className="font-mono text-slate-900">{(totalBloodKg + totalBoneKg + totalFatKg + totalShrinkageKg).toFixed(1)} Kg</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200">
                <div className="flex items-center gap-1.5 text-xs text-rose-800 font-bold mb-1">
                  <Droplet className="w-3.5 h-3.5 text-rose-600" />
                  <span>Sangre</span>
                </div>
                <div className="text-lg font-black text-slate-900">{totalBloodKg.toFixed(1)} <span className="text-xs font-normal text-slate-500">Kg</span></div>
              </div>

              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                <div className="flex items-center gap-1.5 text-xs text-amber-800 font-bold mb-1">
                  <Bone className="w-3.5 h-3.5 text-amber-600" />
                  <span>Hueso</span>
                </div>
                <div className="text-lg font-black text-slate-900">{totalBoneKg.toFixed(1)} <span className="text-xs font-normal text-slate-500">Kg</span></div>
              </div>

              <div className="bg-orange-50/60 p-3 rounded-xl border border-orange-200">
                <div className="flex items-center gap-1.5 text-xs text-orange-800 font-bold mb-1">
                  <Layers className="w-3.5 h-3.5 text-orange-600" />
                  <span>Gordos / Grasa</span>
                </div>
                <div className="text-lg font-black text-slate-900">{totalFatKg.toFixed(1)} <span className="text-xs font-normal text-slate-500">Kg</span></div>
              </div>

              <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-200">
                <div className="flex items-center gap-1.5 text-xs text-purple-800 font-bold mb-1">
                  <Scale className="w-3.5 h-3.5 text-purple-600" />
                  <span>Merma</span>
                </div>
                <div className="text-lg font-black text-slate-900">{totalShrinkageKg.toFixed(1)} <span className="text-xs font-normal text-slate-500">Kg</span></div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 6. TABLA PRINCIPAL DE ÓRDENES Y FILTROS                                   */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-300/80 shadow-2xs overflow-hidden">
            
            {/* Barra de Búsqueda y Filtros */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por lote, código, proceso..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="ALL">Todos los Estados</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Finalizado">Finalizado</option>
                </select>

                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="ALL">Todas las Fechas</option>
                  <option value="TODAY">Solo Hoy</option>
                </select>
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Orden / Lote</th>
                    <th className="py-3 px-4">Proceso</th>
                    <th className="py-3 px-4 text-right">Insumo Tomado</th>
                    <th className="py-3 px-4 text-right">Sangre</th>
                    <th className="py-3 px-4 text-right">Hueso</th>
                    <th className="py-3 px-4 text-right">Gordos</th>
                    <th className="py-3 px-4 text-right">Merma</th>
                    <th className="py-3 px-4 text-right">Terminado (Kg/Und)</th>
                    <th className="py-3 px-4 text-center">Rendimiento</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="py-12 text-center text-slate-400">
                        No se encontraron órdenes registradas con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isFinished = order.status === 'Finalizado';
                      const isInProgress = order.status === 'En Proceso';

                      return (
                        <tr 
                          key={order.id} 
                          className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                          onClick={() => onOpenOrderDetails(order)}
                        >
                          {/* Código y Lote */}
                          <td className="py-3.5 px-4 font-medium text-slate-900">
                            <div className="font-bold text-blue-600">{order.code}</div>
                            <div className="text-[10px] text-slate-500">Lote: {order.batch}</div>
                          </td>

                          {/* Nombre y Operario */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{order.processName}</div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <span>{order.assignedTo || 'Sin asignar'}</span>
                              <span>•</span>
                              <span>{order.targetDate}</span>
                            </div>
                          </td>

                          {/* Total Insumo */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                            {isFinished 
                              ? `${Number(order.totalInputKg).toFixed(1)} Kg`
                              : <span className="text-slate-400 font-normal">Est. {order.estimatedInputKg} Kg</span>
                            }
                          </td>

                          {/* Sangre */}
                          <td className="py-3.5 px-4 text-right font-mono text-rose-700">
                            {isFinished ? `${Number(order.bloodKg).toFixed(1)} Kg` : '-'}
                          </td>

                          {/* Hueso */}
                          <td className="py-3.5 px-4 text-right font-mono text-amber-800">
                            {isFinished ? `${Number(order.boneKg).toFixed(1)} Kg` : '-'}
                          </td>

                          {/* Gordos */}
                          <td className="py-3.5 px-4 text-right font-mono text-orange-700">
                            {isFinished ? `${Number(order.fatKg).toFixed(1)} Kg` : '-'}
                          </td>

                          {/* Merma */}
                          <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                            {isFinished ? `${Number(order.shrinkageKg).toFixed(1)} Kg` : '-'}
                          </td>

                          {/* Terminado */}
                          <td className="py-3.5 px-4 text-right font-mono">
                            {isFinished ? (
                              <div>
                                <span className="font-bold text-emerald-700">{Number(order.finishedWeightKg).toFixed(1)} Kg</span>
                                <div className="text-[10px] text-slate-500">{order.finishedUnits} und ({Number(order.finishedWeightGrams).toLocaleString()} gr)</div>
                              </div>
                            ) : '-'}
                          </td>

                          {/* Rendimiento % */}
                          <td className="py-3.5 px-4 text-center font-bold">
                            {isFinished ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[11px]">
                                {order.yieldPercentage}%
                              </span>
                            ) : '-'}
                          </td>

                          {/* Estado */}
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              order.status === 'Finalizado'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isInProgress
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {order.status === 'Finalizado' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              {isInProgress && <Clock className="w-3 h-3 text-blue-600 animate-spin" />}
                              <span>{order.status}</span>
                            </span>
                          </td>

                          {/* Acciones */}
                          <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => onOpenOrderDetails(order)}
                                className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                                title="Ver Ficha y Balance de Masa"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(order.id)}
                                className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                                title="Eliminar Orden"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
