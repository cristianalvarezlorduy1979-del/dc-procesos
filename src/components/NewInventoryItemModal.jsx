import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  X, 
  Plus, 
  Package, 
  DollarSign, 
  Layers, 
  FileSpreadsheet, 
  Sparkles, 
  Check, 
  AlertCircle,
  Download,
  Upload,
  Percent,
  MapPin,
  TrendingDown
} from 'lucide-react';
import { createInventoryItem, bulkImportInventoryItems } from '../services/firebase';

const CATEGORIES = [
  'Cárnicos y Proteínas',
  'Insumos y Aditivos',
  'Material de Empaque',
  'Condimentos y Especias',
  'Lácteos y Derivados',
  'Frutas y Verduras',
  'Granos y Harinas',
  'Químicos y Aseo',
  'Otros'
];

const UNITS = [
  'Kg',
  'Gramos',
  'Unidades',
  'Millar',
  'Madejas',
  'Litros',
  'Mililitros',
  'Cajas',
  'Bolsas',
  'Metros'
];

export default function NewInventoryItemModal({ isOpen, onClose, selectedCompany, existingItems = [] }) {
  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'bulk'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulario Individual
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Cárnicos y Proteínas');
  const [unit, setUnit] = useState('Kg');
  const [unitCost, setUnitCost] = useState('');
  const [expectedWastePct, setExpectedWastePct] = useState('0');
  const [currentStock, setCurrentStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [location, setLocation] = useState('');

  // Carga Masiva (Excel / Pegar)
  const fileInputRef = useRef(null);
  const [bulkText, setBulkText] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [bulkError, setBulkError] = useState('');

  if (!isOpen) return null;

  // Descargar Plantilla Excel Oficial (.xlsx) con columnas completas
  const handleDownloadTemplateExcel = () => {
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
      { wch: 14 }, // Codigo
      { wch: 35 }, // Nombre
      { wch: 25 }, // Categoria
      { wch: 16 }, // Unidad
      { wch: 18 }, // Costo
      { wch: 20 }, // Merma %
      { wch: 16 }, // Stock Inicial
      { wch: 16 }, // Stock Minimo
      { wch: 24 }  // Ubicacion
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Insumos');
    XLSX.writeFile(wb, `DC_Procesos_Plantilla_Insumos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Cargar archivo Excel de Insumos (.xlsx / .xls)
  const handleFileUploadExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setBulkError('');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheet];
      const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonRows.length === 0) {
        setBulkError('El archivo Excel no contiene filas con datos.');
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
        setBulkError('No se encontraron insumos válidos en el archivo Excel. Asegúrate de incluir la columna "Nombre_Insumo".');
      } else {
        setParsedItems(items);
        setBulkError('');
      }
    } catch (err) {
      setBulkError('Error leyendo el archivo Excel: ' + err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setCode('');
    setName('');
    setCategory('Cárnicos y Proteínas');
    setUnit('Kg');
    setUnitCost('');
    setExpectedWastePct('0');
    setCurrentStock('');
    setMinStock('');
    setLocation('');
    setBulkText('');
    setParsedItems([]);
    setBulkError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Crear ítem individual
  const handleSubmitSingle = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor ingresa el nombre del insumo.');
      return;
    }
    if (!unitCost || Number(unitCost) < 0) {
      alert('Por favor ingresa un costo unitario válido.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createInventoryItem({
        code: code.trim() || `INS-${String(Math.floor(Math.random() * 900) + 100)}`,
        name: name.trim(),
        category,
        unit,
        unitCost: Number(unitCost),
        expectedWastePct: parseFloat(expectedWastePct) || 0,
        currentStock: Number(currentStock) || 0,
        minStock: Number(minStock) || 0,
        location: location.trim() || 'Bodega Principal',
        companyId: selectedCompany?.id || null,
        companyName: selectedCompany?.name || null
      });

      handleClose();
    } catch (err) {
      alert('Error creando el insumo: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Analizar texto pegado de Excel
  const handleParseBulk = () => {
    setBulkError('');
    if (!bulkText.trim()) {
      setParsedItems([]);
      return;
    }

    const lines = bulkText.trim().split('\n');
    const items = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      let cols = [];
      if (line.includes('\t')) {
        cols = line.split('\t').map(c => c.trim());
      } else if (line.includes(';')) {
        cols = line.split(';').map(c => c.trim());
      } else if (line.includes(',')) {
        cols = line.split(',').map(c => c.trim());
      } else {
        cols = [line];
      }

      const lower0 = (cols[0] || '').toLowerCase();
      if (lower0.includes('codigo') || lower0.includes('nombre') || lower0.includes('insumo') || lower0.includes('item')) {
        continue;
      }

      let itemCode = '';
      let itemName = '';
      let itemCat = 'Cárnicos y Proteínas';
      let itemUnit = 'Kg';
      let itemCost = 0;
      let itemWaste = 0;
      let itemStock = 0;
      let itemMinStock = 0;
      let itemLoc = 'Bodega Principal';

      if (cols.length >= 6) {
        itemCode = cols[0];
        itemName = cols[1];
        itemCat = cols[2] || 'Cárnicos y Proteínas';
        itemUnit = cols[3] || 'Kg';
        itemCost = parseFloat(cols[4].replace(/[^0-9.]/g, '')) || 0;
        itemWaste = parseFloat(cols[5].replace(/[^0-9.]/g, '')) || 0;
        itemStock = cols[6] ? parseFloat(cols[6].replace(/[^0-9.]/g, '')) || 0 : 0;
        itemMinStock = cols[7] ? parseFloat(cols[7].replace(/[^0-9.]/g, '')) || 0 : 0;
        itemLoc = cols[8] || 'Bodega Principal';
      } else if (cols.length === 5) {
        itemCode = cols[0];
        itemName = cols[1];
        itemCat = cols[2] || 'Cárnicos y Proteínas';
        itemUnit = cols[3] || 'Kg';
        itemCost = parseFloat(cols[4].replace(/[^0-9.]/g, '')) || 0;
      } else if (cols.length === 4) {
        itemCode = cols[0];
        itemName = cols[1];
        itemUnit = cols[2] || 'Kg';
        itemCost = parseFloat(cols[3].replace(/[^0-9.]/g, '')) || 0;
      } else if (cols.length === 3) {
        itemName = cols[0];
        itemUnit = cols[1] || 'Kg';
        itemCost = parseFloat(cols[2].replace(/[^0-9.]/g, '')) || 0;
      } else if (cols.length === 2) {
        itemName = cols[0];
        itemCost = parseFloat(cols[1].replace(/[^0-9.]/g, '')) || 0;
      } else {
        itemName = cols[0];
      }

      if (itemName) {
        items.push({
          code: itemCode || `INS-${String(100 + i + Math.floor(Math.random() * 800))}`,
          name: itemName,
          category: itemCat,
          unit: itemUnit,
          unitCost: itemCost,
          expectedWastePct: itemWaste,
          currentStock: itemStock,
          minStock: itemMinStock,
          location: itemLoc,
          companyId: selectedCompany?.id || null,
          companyName: selectedCompany?.name || null
        });
      }
    }

    if (items.length === 0) {
      setBulkError('No se pudieron detectar insumos válidos. Revisa los datos pegados.');
    } else {
      setParsedItems(items);
    }
  };

  // Guardar importación masiva
  const handleSubmitBulk = async () => {
    if (parsedItems.length === 0) return;

    try {
      setIsSubmitting(true);
      await bulkImportInventoryItems(parsedItems, selectedCompany?.id);
      alert(`¡Se importaron / actualizaron exitosamente ${parsedItems.length} insumos en el catálogo!`);
      handleClose();
    } catch (err) {
      alert('Error en importación masiva: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCOP = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Módulo de Insumos & Materias Primas</h2>
              <p className="text-xs text-slate-300">
                {selectedCompany ? `Empresa: ${selectedCompany.name}` : 'Catálogo Oficial de Insumos'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de modo: Individual vs Carga Masiva */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'single'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Plus className="w-4 h-4" />
            Registro Individual
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'bulk'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Carga Masiva desde Excel (.xlsx)
          </button>
        </div>

        {/* Contenido según pestaña */}
        <div className="p-6">
          {activeTab === 'single' ? (
            <form onSubmit={handleSubmitSingle} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código de Insumo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ej: INS-010"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
                  />
                  <span className="text-[10px] text-slate-400">Si lo dejas vacío, se generará automáticamente</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Insumo / Materia Prima *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Canal de Res, Lomo de Cerdo, Pasta de Tomate, Bolsa al Vacío..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
                />
              </div>

              {/* Fila: Unidad, Costo Unitario, Merma Esperada % */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unidad de Medida *
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
                  >
                    {UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Costo Unitario ($ COP) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">$</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      placeholder="18500"
                      className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
                    />
                  </div>
                  {unitCost > 0 && (
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      {formatCOP(unitCost)} / {unit}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Merma Esperada (%)</span>
                    <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={expectedWastePct}
                      onChange={(e) => setExpectedWastePct(e.target.value)}
                      placeholder="0.0"
                      className="w-full pr-7 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-amber-700 focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none transition"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-bold text-xs">%</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Pérdida esperada en proceso</span>
                </div>
              </div>

              {/* Fila: Stock Actual, Stock Mínimo, Ubicación */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stock Teórico Inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stock Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    placeholder="Ej: 50"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>Ubicación en Bodega</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ej: Cuarto Frío 1, Estante B2..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Integración Automática:</strong> Este insumo estará disponible inmediatamente para armar <strong>Subrecetas</strong> (con cálculo automático de costos) y en la <strong>Toma Física Móvil</strong> para que los operarios registren el conteo físico valorizado.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Guardando...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Guardar Insumo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* ========================================================== */
            /* PESTAÑA 2: CARGA MASIVA DE EXCEL CON MERMA Y COSTOS       */
            /* ========================================================== */
            <div className="space-y-5">
              
              {/* Opciones de carga: Botón Subir Archivo + Descargar Plantilla */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Cargar Archivo Excel Oficial (.xlsx)</h4>
                  <p className="text-[11px] text-slate-500">
                    Sube tu archivo con columnas de código, nombre, categoría, unidad, costo, merma y stock.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadTemplateExcel}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                    title="Descargar plantilla de Excel con formato oficial"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Descargar Plantilla</span>
                  </button>
                  <label className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Excel</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUploadExcel}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* O bien, pegar directamente desde Excel */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    O pega las celdas copiadas directamente desde Excel:
                  </label>
                  <button
                    type="button"
                    onClick={handleParseBulk}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                  >
                    Procesar texto pegado
                  </button>
                </div>
                <textarea
                  rows="4"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Ejemplo: Copia las filas desde Excel (Código | Nombre | Categoría | Unidad | Costo | Merma) y pégalas aquí..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
                />
              </div>

              {bulkError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{bulkError}</span>
                </div>
              )}

              {/* Vista previa de los insumos detectados */}
              {parsedItems.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 flex items-center justify-between border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Insumos listos para cargar: <strong>{parsedItems.length}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setParsedItems([])}
                      className="text-[11px] text-slate-500 hover:text-red-600 cursor-pointer"
                    >
                      Limpiar lista
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                    {parsedItems.map((item, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              {item.code}
                            </span>
                            <span className="font-bold text-slate-900 truncate">{item.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>{item.category}</span>
                            <span>•</span>
                            <span>{item.unit}</span>
                            {item.expectedWastePct > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-amber-700 font-bold">Merma: {item.expectedWastePct}%</span>
                              </>
                            )}
                            {item.location && (
                              <>
                                <span>•</span>
                                <span>{item.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-emerald-700 block">
                            {formatCOP(item.unitCost)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Stock: {item.currentStock} {item.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmitBulk}
                  disabled={parsedItems.length === 0 || isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Guardando {parsedItems.length} insumos...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Importar {parsedItems.length} Insumos</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
