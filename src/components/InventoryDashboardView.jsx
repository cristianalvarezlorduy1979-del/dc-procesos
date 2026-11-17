import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Smartphone, 
  DollarSign, 
  Calendar, 
  User, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Eye, 
  Layers, 
  Sparkles, 
  TrendingUp, 
  Building2, 
  Clock, 
  AlertCircle,
  Download,
  Upload,
  Percent,
  MapPin,
  TrendingDown
} from 'lucide-react';
import { updateInventoryItem, removeInventoryItem, removePhysicalInventory, bulkImportInventoryItems } from '../services/firebase';

export default function InventoryDashboardView({
  inventoryItems = [],
  physicalInventories = [],
  selectedCompany,
  onOpenNewItemModal,
  onSwitchToMobile,
  initialTab = 'catalog'
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'catalog'); // 'counts' | 'catalog'
  const [selectedInventory, setSelectedInventory] = useState(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  // Filtros Catálogo
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('ALL');

  // Filtros Tomas
  const [countsSearch, setCountsSearch] = useState('');

  // Edición rápida de costo unitario y merma esperada
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingCost, setEditingCost] = useState('');
  const [editingWasteId, setEditingWasteId] = useState(null);
  const [editingWaste, setEditingWaste] = useState('');
  const quickExcelRef = useRef(null);

  // Si no hay toma seleccionada y hay tomas disponibles, seleccionar la primera por defecto
  const currentSelectedInv = useMemo(() => {
    if (selectedInventory) {
      const found = physicalInventories.find(i => i.id === selectedInventory.id);
      return found || physicalInventories[0] || null;
    }
    return physicalInventories[0] || null;
  }, [selectedInventory, physicalInventories]);

  // Categorías presentes
  const categories = useMemo(() => {
    const set = new Set(inventoryItems.map(i => i.category || 'Otros'));
    return ['ALL', ...Array.from(set)];
  }, [inventoryItems]);

  // Filtrar catálogo
  const filteredCatalog = useMemo(() => {
    return inventoryItems.filter(item => {
      const matchSearch = 
        item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.code.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchCat = catalogCategoryFilter === 'ALL' || item.category === catalogCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [inventoryItems, catalogSearch, catalogCategoryFilter]);

  // Filtrar tomas
  const filteredInventories = useMemo(() => {
    return physicalInventories.filter(inv => {
      const matchSearch = 
        inv.title?.toLowerCase().includes(countsSearch.toLowerCase()) ||
        inv.code?.toLowerCase().includes(countsSearch.toLowerCase()) ||
        inv.countedBy?.toLowerCase().includes(countsSearch.toLowerCase());
      return matchSearch;
    });
  }, [physicalInventories, countsSearch]);

  const formatCOP = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // KPIs
  const totalCatalogItems = inventoryItems.length;
  const totalSessions = physicalInventories.length;
  const latestSession = physicalInventories[0] || null;
  const latestSessionValued = latestSession ? latestSession.totalValued : 0;

  // Manejar edición rápida de costo
  const handleStartEditCost = (item) => {
    setEditingItemId(item.id);
    setEditingCost(String(item.unitCost || ''));
  };

  const handleSaveCost = async (itemId) => {
    const numCost = parseFloat(editingCost);
    if (isNaN(numCost) || numCost < 0) {
      alert('Por favor ingresa un costo válido.');
      return;
    }
    try {
      await updateInventoryItem(itemId, { unitCost: numCost });
      setEditingItemId(null);
    } catch (err) {
      alert('Error actualizando costo: ' + err.message);
    }
  };

  // Manejar edición rápida de Merma Esperada (%)
  const handleStartEditWaste = (item) => {
    setEditingWasteId(item.id);
    setEditingWaste(String(item.expectedWastePct !== undefined ? item.expectedWastePct : '0'));
  };

  const handleSaveWaste = async (itemId) => {
    const numWaste = parseFloat(editingWaste);
    if (isNaN(numWaste) || numWaste < 0 || numWaste > 100) {
      alert('Por favor ingresa un porcentaje de merma válido entre 0% y 100%.');
      return;
    }
    try {
      await updateInventoryItem(itemId, { expectedWastePct: numWaste });
      setEditingWasteId(null);
    } catch (err) {
      alert('Error actualizando merma esperada: ' + err.message);
    }
  };

  // Carga rápida masiva desde Excel directo en la pestaña
  const handleQuickExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheet];
      const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonRows.length === 0) {
        alert('El archivo Excel está vacío.');
        return;
      }

      const items = jsonRows.map((row, i) => {
        const itemCode = row['Codigo'] || row['Código'] || row['code'] || `INS-${100 + i}`;
        const itemName = row['Nombre_Insumo'] || row['Nombre'] || row['Insumo'] || row['name'] || '';
        const itemCat = row['Categoria'] || row['Categoría'] || row['category'] || 'Cárnicos y Proteínas';
        const itemUnit = row['Unidad_Medida'] || row['Unidad'] || row['unit'] || 'Kg';
        const itemCost = parseFloat(String(row['Costo_Unitario'] || row['Costo'] || row['unitCost'] || 0).replace(/[^0-9.]/g, '')) || 0;
        const itemWaste = parseFloat(String(row['Merma_Esperada_Pct'] || row['Merma_Esperada'] || row['Merma'] || row['expectedWastePct'] || 0).replace(/[^0-9.]/g, '')) || 0;
        const itemStock = parseFloat(String(row['Stock_Inicial'] || row['Stock'] || row['currentStock'] || 0).replace(/[^0-9.]/g, '')) || 0;
        const itemMinStock = parseFloat(String(row['Stock_Minimo'] || row['Stock_Mínimo'] || row['minStock'] || 0).replace(/[^0-9.]/g, '')) || 0;
        const itemLoc = row['Ubicacion'] || row['Ubicación'] || row['location'] || 'Bodega Principal';

        return {
          code: String(itemCode).trim(),
          name: String(itemName).trim(),
          category: String(itemCat).trim(),
          unit: String(itemUnit).trim(),
          unitCost: itemCost,
          expectedWastePct: itemWaste,
          currentStock: itemStock,
          minStock: itemMinStock,
          location: String(itemLoc).trim(),
          companyId: selectedCompany?.id || null,
          companyName: selectedCompany?.name || null
        };
      }).filter(item => item.name && item.name.length > 0);

      if (items.length === 0) {
        alert('No se encontraron insumos válidos en el archivo. Verifica que tenga la columna "Nombre_Insumo".');
        return;
      }

      await bulkImportInventoryItems(items, selectedCompany?.id);
      alert(`¡Éxito! Se procesaron y actualizaron ${items.length} insumos correctamente.`);
    } catch (err) {
      alert('Error leyendo el archivo Excel: ' + err.message);
    } finally {
      if (quickExcelRef.current) quickExcelRef.current.value = '';
    }
  };

  // Eliminar insumo
  const handleDeleteItem = async (itemId, itemName) => {
    if (window.confirm(`¿Estás seguro de eliminar el insumo "${itemName}" del catálogo?`)) {
      try {
        await removeInventoryItem(itemId);
      } catch (err) {
        alert('Error eliminando insumo: ' + err.message);
      }
    }
  };

  // Eliminar toma física
  const handleDeleteInventory = async (invId, invTitle, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (window.confirm(`¿Estás seguro de eliminar el registro de toma física "${invTitle}"?`)) {
      try {
        await removePhysicalInventory(invId);
        if (selectedInventory?.id === invId || selectedInventory?.docId === invId || selectedInventory?.rawId === invId) {
          setSelectedInventory(null);
        }
      } catch (err) {
        alert('Error eliminando toma física: ' + err.message);
      }
    }
  };

  // Exportar Toma Física seleccionada a archivo Excel nativo (.xlsx)
  const handleExportInventoryExcel = (invToExport) => {
    const inv = invToExport || currentSelectedInv;
    if (!inv || !inv.items || inv.items.length === 0) {
      alert('No hay datos en esta toma física para exportar.');
      return;
    }

    const headers = [
      'Código Insumo',
      'Nombre Insumo',
      'Categoría',
      'Unidad de Medida',
      'Cantidad Contada Físico',
      'Costo Unitario ($)',
      'Total Valorizado ($)',
      'Fecha Toma Física',
      'Responsable / Operario',
      'Empresa',
      'Notas / Observaciones'
    ];

    const dateFormatted = new Date(inv.countedAt).toLocaleString('es-CO');

    const rows = inv.items.map(item => [
      item.code || '',
      item.name || '',
      item.category || '',
      item.unit || '',
      Number(item.countedQty) || 0,
      Number(item.unitCost) || 0,
      Number(item.totalValued) || 0,
      dateFormatted,
      inv.countedBy || '',
      inv.companyName || selectedCompany?.name || 'DC Procesos',
      inv.notes || ''
    ]);

    // Fila de Total
    rows.push([
      'TOTAL',
      'VALOR TOTAL INVENTARIO VALORIZADO',
      '',
      '',
      Number(inv.totalQty) || 0,
      '',
      Number(inv.totalValued) || 0,
      dateFormatted,
      inv.countedBy || '',
      '',
      ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      { wch: 16 }, // Código
      { wch: 32 }, // Nombre
      { wch: 24 }, // Categoría
      { wch: 18 }, // Unidad
      { wch: 24 }, // Cantidad Contada
      { wch: 18 }, // Costo Unitario
      { wch: 22 }, // Total Valorizado
      { wch: 20 }, // Fecha
      { wch: 24 }, // Responsable
      { wch: 28 }, // Empresa
      { wch: 35 }  // Notas
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Toma_Fisica_Valorizada');

    const cleanTitle = (inv.title || 'Inventario_Fisico').replace(/\s+/g, '_');
    XLSX.writeFile(wb, `${cleanTitle}_Valorizado_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Exportar Catálogo Completo a archivo Excel nativo (.xlsx)
  const handleExportCatalogExcel = () => {
    if (inventoryItems.length === 0) {
      alert('No hay insumos en el catálogo para exportar.');
      return;
    }

    const headers = [
      'Código',
      'Nombre del Insumo',
      'Categoría',
      'Unidad de Medida',
      'Costo Unitario ($ COP)',
      'Merma Esperada (%)',
      'Stock Teórico',
      'Stock Mínimo',
      'Valor Total Teórico ($ COP)',
      'Ubicación en Bodega',
      'Empresa'
    ];

    let grandTotalValued = 0;
    const rows = inventoryItems.map(item => {
      const cost = Number(item.unitCost) || 0;
      const stock = Number(item.currentStock) || 0;
      const itemValued = cost * stock;
      grandTotalValued += itemValued;

      return [
        item.code || '',
        item.name || '',
        item.category || '',
        item.unit || '',
        cost,
        Number(item.expectedWastePct) || 0,
        stock,
        Number(item.minStock) || 0,
        itemValued,
        item.location || 'Bodega Principal',
        item.companyName || selectedCompany?.name || 'DC Procesos'
      ];
    });

    // Fila de totales
    rows.push([
      'TOTAL',
      'VALOR TOTAL DEL INVENTARIO TEÓRICO',
      '',
      '',
      '',
      '',
      '',
      '',
      grandTotalValued,
      '',
      ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      { wch: 14 }, // Código
      { wch: 35 }, // Nombre
      { wch: 25 }, // Categoría
      { wch: 18 }, // Unidad
      { wch: 22 }, // Costo Unitario
      { wch: 20 }, // Merma %
      { wch: 16 }, // Stock Teórico
      { wch: 16 }, // Stock Mínimo
      { wch: 24 }, // Valor Total
      { wch: 25 }, // Ubicación
      { wch: 25 }  // Empresa
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Catalogo_Insumos');

    XLSX.writeFile(wb, `DC_Procesos_Catalogo_Insumos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Descargar Plantilla Excel para Catálogo de Insumos (.xlsx)
  const handleDownloadCatalogTemplateExcel = () => {
    const headers = [
      'Codigo',
      'Nombre_Insumo',
      'Categoria',
      'Unidad_Medida',
      'Costo_Unitario',
      'Merma_Esperada_Pct',
      'Stock_Inicial',
      'Stock_Minimo',
      'Ubicacion'
    ];

    const demoRows = [
      ['INS-101', 'Canal de Res (Media Canal)', 'Cárnicos y Proteínas', 'Kg', 18500, 15.5, 450, 80, 'Cuarto Frío 1'],
      ['INS-102', 'Lomo de Cerdo Especial', 'Cárnicos y Proteínas', 'Kg', 14200, 12.0, 280, 50, 'Cuarto Frío 1'],
      ['INS-103', 'Pechuga de Pollo Fresca', 'Cárnicos y Proteínas', 'Kg', 12500, 8.5, 150, 40, 'Nevera Aves'],
      ['INS-104', 'Sal Nitrificada Especial', 'Insumos y Aditivos', 'Kg', 8500, 1.0, 40, 10, 'Estante Secos B1'],
      ['INS-105', 'Tripa de Cerdo Calibre 28/30', 'Insumos y Aditivos', 'Madejas', 65000, 3.0, 12, 3, 'Refrigeración Insumos'],
      ['INS-106', 'Bolsa al Vacío 20x30 cm', 'Material de Empaque', 'Millar', 180000, 0.5, 3, 1, 'Almacén Empaque C1']
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...demoRows]);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 35 },
      { wch: 25 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 16 },
      { wch: 16 },
      { wch: 24 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Insumos');
    XLSX.writeFile(wb, `DC_Procesos_Plantilla_Insumos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">

      {/* Encabezado y Botones de Acción */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <Package className="w-4 h-4" />
            <span>Módulo de Inventarios & Tomas Físicas</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Control de Insumos y Valorización Inmediata
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedCompany 
              ? `Gestión para ${selectedCompany.name} • Los conteos físicos desde celulares se valorizan automáticamente aquí.`
              : 'Configura el catálogo con costos y recibe los conteos físicos de los celulares al instante en Excel.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={onOpenNewItemModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            + Montar Insumo / Carga Masiva
          </button>

          {currentSelectedInv && (
            <button
              onClick={() => handleExportInventoryExcel(currentSelectedInv)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Descargar Toma en Excel (.xlsx)
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas de Métricas & Valorización Inmediata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Insumos Registrados */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Insumos en Catálogo</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalCatalogItems}</div>
          <p className="text-[11px] text-slate-500 mt-1">Con costo unitario asignado</p>
        </div>

        {/* KPI 2: Tomas Registradas */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tomas Físicas Realizadas</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalSessions}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {latestSession ? `Última: ${new Date(latestSession.countedAt).toLocaleDateString('es-CO')}` : 'Sin tomas aún'}
          </p>
        </div>

        {/* KPI 3: Cantidad Total Contada */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Última Toma Físico</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {latestSession ? `${latestSession.totalQty} und/Kg` : '0'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            {latestSession ? `Por: ${latestSession.countedBy}` : 'Esperando conteos de operarios'}
          </p>
        </div>

        {/* KPI 4: VALORIZACIÓN INMEDIATA (Highlight) */}
        <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-2xl p-4 shadow-md border border-emerald-500/30 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Valorización Inmediata
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-[#00df82] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#00df82] tracking-tight">
            {formatCOP(latestSessionValued)}
          </div>
          <p className="text-[11px] text-emerald-200 mt-1 font-medium">
            {latestSession ? `Valor total de la toma física` : 'Cálculo automático al recibir conteo'}
          </p>
        </div>

      </div>

      {/* Pestañas de Vista: Tomas Físicas vs Catálogo de Insumos */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white rounded-t-2xl px-5 pt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('counts')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'counts'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Tomas Físicas Registradas ({physicalInventories.length})
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'catalog'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            Catálogo de Insumos & Costos ({inventoryItems.length})
          </button>
        </div>

        {activeTab === 'catalog' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCatalogTemplateExcel}
              className="text-xs font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1.5 transition py-1 px-2 rounded-lg hover:bg-slate-100"
              title="Descargar plantilla Excel para importar insumos masivamente"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              Plantilla Excel Insumos
            </button>
            <button
              onClick={handleExportCatalogExcel}
              className="text-xs font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1.5 transition py-1 px-2 rounded-lg hover:bg-slate-100"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Exportar Catálogo (.xlsx)
            </button>
          </div>
        )}
      </div>

      {/* CONTENIDO PESTAÑA 1: TOMAS FÍSICAS */}
      {activeTab === 'counts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna Izquierda: Listado de Tomas Físicas */}
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Historial de Tomas Físicas
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  {physicalInventories.length} tomas
                </span>
              </div>

              {/* Buscador */}
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={countsSearch}
                  onChange={(e) => setCountsSearch(e.target.value)}
                  placeholder="Buscar toma por título o responsable..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Lista */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredInventories.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No hay tomas físicas registradas aún.
                  </div>
                ) : (
                  filteredInventories.map(inv => {
                    const isSelected = currentSelectedInv?.id === inv.id;
                    const dateStr = new Date(inv.countedAt).toLocaleString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={inv.id}
                        onClick={() => setSelectedInventory(inv)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500/30'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {inv.code}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {dateStr}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteInventory(inv.id, inv.title, e)}
                              className="p-1 rounded-md text-slate-300 hover:text-red-600 hover:bg-red-50 transition"
                              title="Eliminar esta toma física"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {inv.title}
                        </h4>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                          <span className="text-[11px] text-slate-500 truncate">
                            {inv.countedBy}
                          </span>
                          <span className="font-bold text-emerald-700">
                            {formatCOP(inv.totalValued)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Detalle y Desglose Valorizado de la Toma Seleccionada */}
          <div className="lg:col-span-2">
            {currentSelectedInv ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                
                {/* Cabecera del Detalle */}
                <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                        {currentSelectedInv.code}
                      </span>
                      <span className="text-xs text-slate-300">
                        {new Date(currentSelectedInv.countedAt).toLocaleString('es-CO')}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold">{currentSelectedInv.title}</h2>
                    <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                      <span>Responsable: <strong className="text-white">{currentSelectedInv.countedBy}</strong></span>
                      {currentSelectedInv.companyName && (
                        <span>• Empresa: <strong className="text-emerald-300">{currentSelectedInv.companyName}</strong></span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleExportInventoryExcel(currentSelectedInv)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Exportar a Excel (.xlsx)
                    </button>
                    <button
                      onClick={() => handleDeleteInventory(currentSelectedInv.id, currentSelectedInv.title)}
                      title="Eliminar esta toma física"
                      className="p-2 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Banner de Valorización Inmediata */}
                <div className="bg-emerald-50 border-b border-emerald-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Valorización Inmediata Calculada
                      </span>
                      <span className="text-xl font-black text-emerald-900">
                        {formatCOP(currentSelectedInv.totalValued)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-emerald-800">
                    <span>{currentSelectedInv.items?.length || 0} insumos contados</span>
                    <span>•</span>
                    <span>{currentSelectedInv.totalQty || 0} total físico</span>
                  </div>
                </div>

                {/* Notas de la toma */}
                {currentSelectedInv.notes && (
                  <div className="p-4 bg-slate-50 border-b border-slate-100 text-xs text-slate-700">
                    <strong className="text-slate-900 block mb-0.5">Observaciones del Operario:</strong>
                    <p className="italic">{currentSelectedInv.notes}</p>
                  </div>
                )}

                {/* Tabla de Insumos y Subtotales Valorizados */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Código</th>
                        <th className="p-3">Nombre Insumo</th>
                        <th className="p-3">Categoría</th>
                        <th className="p-3">Unidad</th>
                        <th className="p-3 text-right">Cantidad Contada</th>
                        <th className="p-3 text-right">Costo Unitario</th>
                        <th className="p-3 text-right font-black text-emerald-800">Total Valorizado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(currentSelectedInv.items || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono text-slate-500 font-bold">{item.code}</td>
                          <td className="p-3 font-bold text-slate-900">{item.name}</td>
                          <td className="p-3 text-slate-500 text-[11px]">{item.category}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                              {item.unit}
                            </span>
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            {item.countedQty}
                          </td>
                          <td className="p-3 text-right text-slate-600 font-medium">
                            {formatCOP(item.unitCost)}
                          </td>
                          <td className="p-3 text-right font-black text-emerald-700 text-sm">
                            {formatCOP(item.totalValued)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100/80 font-black border-t-2 border-slate-200 text-xs">
                      <tr>
                        <td colSpan="4" className="p-3 text-slate-700 text-right uppercase tracking-wider">
                          Totales de la Toma Física:
                        </td>
                        <td className="p-3 text-right text-slate-900 text-sm">
                          {currentSelectedInv.totalQty}
                        </td>
                        <td className="p-3 text-right text-slate-400">-</td>
                        <td className="p-3 text-right text-emerald-800 text-base">
                          {formatCOP(currentSelectedInv.totalValued)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">Ninguna toma física seleccionada</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Selecciona una toma de la lista izquierda o envía una nueva desde un celular para ver su desglose valorizado.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* CONTENIDO PESTAÑA 2: CATÁLOGO DE INSUMOS & COSTOS */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Barra de Filtros, Búsqueda y Acciones Excel */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            {/* Buscador y Filtro por Categoría */}
            <div className="flex flex-col sm:flex-row items-center gap-2 flex-1 max-w-xl">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Buscar insumo por nombre o código..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={catalogCategoryFilter}
                  onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'ALL' ? 'Todas las Categorías' : cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botones de Excel: Descargar Plantilla, Subir Excel, Exportar */}
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <button
                type="button"
                onClick={handleDownloadCatalogTemplateExcel}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                title="Descargar plantilla de Excel oficial para importar insumos"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Plantilla</span> Excel
              </button>

              <label className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Excel</span>
                <input
                  type="file"
                  ref={quickExcelRef}
                  accept=".xlsx,.xls,.csv"
                  onChange={handleQuickExcelUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleExportCatalogExcel}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                title="Exportar todo el catálogo con costos y existencias a Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Exportar Catálogo</span>
              </button>
            </div>

          </div>

          {/* Tabla de Catálogo de Insumos */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Insumo / Materia Prima</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Unidad</th>
                  <th className="p-3 text-right">Merma Esperada (%)</th>
                  <th className="p-3 text-right">Costo Unitario ($ COP)</th>
                  <th className="p-3 text-center">Stock Teórico</th>
                  <th className="p-3">Ubicación Bodega</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCatalog.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-12 text-center text-slate-400 text-xs">
                      No se encontraron insumos con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  filteredCatalog.map(item => {
                    const isEditingCost = editingItemId === item.id;
                    const isEditingWaste = editingWasteId === item.id;
                    const wasteVal = Number(item.expectedWastePct) || 0;
                    const isLowStock = Number(item.minStock) > 0 && Number(item.currentStock) <= Number(item.minStock);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        
                        {/* Código */}
                        <td className="p-3 font-mono font-bold text-slate-600 whitespace-nowrap">
                          {item.code}
                        </td>

                        {/* Nombre */}
                        <td className="p-3 font-bold text-slate-900">
                          {item.name}
                        </td>

                        {/* Categoría */}
                        <td className="p-3 text-slate-500 text-[11px] whitespace-nowrap">
                          {item.category}
                        </td>

                        {/* Unidad */}
                        <td className="p-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {item.unit}
                          </span>
                        </td>

                        {/* Merma Esperada % con Edición Rápida */}
                        <td className="p-3 text-right font-bold whitespace-nowrap">
                          {isEditingWaste ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={editingWaste}
                                onChange={(e) => setEditingWaste(e.target.value)}
                                className="w-16 px-1.5 py-1 bg-white border border-amber-500 rounded text-right font-bold text-xs outline-none"
                              />
                              <span className="text-xs text-slate-400">%</span>
                              <button
                                onClick={() => handleSaveWaste(item.id)}
                                className="p-1 bg-amber-600 text-white rounded hover:bg-amber-700 cursor-pointer"
                                title="Guardar merma"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingWasteId(null)}
                                className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 cursor-pointer"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              {wasteVal > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                                  <TrendingDown className="w-3 h-3 text-amber-600" />
                                  {wasteVal}%
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">0.0%</span>
                              )}
                              <button
                                onClick={() => handleStartEditWaste(item)}
                                title="Modificar merma esperada"
                                className="text-slate-400 hover:text-amber-600 p-0.5 transition cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Costo Unitario con Edición Rápida */}
                        <td className="p-3 text-right font-bold text-slate-800 whitespace-nowrap">
                          {isEditingCost ? (
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-slate-400 text-xs">$</span>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={editingCost}
                                onChange={(e) => setEditingCost(e.target.value)}
                                className="w-24 px-2 py-1 bg-white border border-emerald-500 rounded text-right font-bold text-xs outline-none"
                              />
                              <button
                                onClick={() => handleSaveCost(item.id)}
                                className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                                title="Guardar costo"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingItemId(null)}
                                className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 cursor-pointer"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-emerald-700 font-black text-xs">
                                {formatCOP(item.unitCost)}
                              </span>
                              <button
                                onClick={() => handleStartEditCost(item)}
                                title="Modificar costo unitario"
                                className="text-slate-400 hover:text-emerald-600 p-0.5 transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Stock Teórico y Alerta */}
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-bold text-slate-900 text-xs">
                              {item.currentStock || 0} {item.unit}
                            </span>
                            {isLowStock && (
                              <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded mt-0.5">
                                Stock Bajo (Mín: {item.minStock})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Ubicación en Bodega */}
                        <td className="p-3 text-slate-600 text-[11px] whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{item.location || 'Bodega Principal'}</span>
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className="p-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            title="Eliminar insumo del catálogo"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
}
