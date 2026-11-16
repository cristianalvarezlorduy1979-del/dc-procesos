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
  Upload
} from 'lucide-react';
import { createInventoryItem, bulkImportInventoryItems } from '../services/firebase';

const CATEGORIES = [
  'Cárnicos y Proteínas',
  'Insumos y Aditivos',
  'Material de Empaque',
  'Condimentos y Especias',
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
  'Cajas',
  'Bolsas',
  'Metros'
];

export default function NewInventoryItemModal({ isOpen, onClose, selectedCompany }) {
  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'bulk'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulario Individual
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Cárnicos y Proteínas');
  const [unit, setUnit] = useState('Kg');
  const [unitCost, setUnitCost] = useState('');
  const [currentStock, setCurrentStock] = useState('');

  // Carga Masiva (Copiar y Pegar o Subir Archivo Excel)
  const fileInputRef = useRef(null);
  const [bulkText, setBulkText] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [bulkError, setBulkError] = useState('');

  if (!isOpen) return null;

  // Descargar Plantilla Excel de Insumos (.xlsx)
  const handleDownloadTemplateExcel = () => {
    const headers = [
      'Codigo',
      'Nombre_Insumo',
      'Categoria',
      'Unidad_Medida',
      'Costo_Unitario',
      'Stock_Inicial'
    ];

    const demoRows = [
      ['INS-101', 'Canal de Res (Media Canal)', 'Cárnicos y Proteínas', 'Kg', 18500, 450],
      ['INS-102', 'Lomo de Cerdo Especial', 'Cárnicos y Proteínas', 'Kg', 14200, 280],
      ['INS-103', 'Sal Nitrificada Especial', 'Insumos y Aditivos', 'Kg', 8500, 40],
      ['INS-104', 'Tripa de Cerdo Calibre 28/30', 'Insumos y Aditivos', 'Madejas', 65000, 12],
      ['INS-105', 'Bolsa al Vacío 20x30 cm', 'Material de Empaque', 'Millar', 180000, 3]
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...demoRows]);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 35 },
      { wch: 25 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 }
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
        const itemCat = row['Categoria'] || row['Categoría'] || row['category'] || 'Insumos y Aditivos';
        const itemUnit = row['Unidad_Medida'] || row['Unidad'] || row['unit'] || 'Kg';
        const itemCost = parseFloat(String(row['Costo_Unitario'] || row['Costo'] || row['unitCost'] || 0).replace(/[^0-9.]/g, '')) || 0;
        const itemStock = parseFloat(String(row['Stock_Inicial'] || row['Stock'] || row['currentStock'] || 0).replace(/[^0-9.]/g, '')) || 0;

        return {
          code: String(itemCode).trim(),
          name: String(itemName).trim(),
          category: String(itemCat).trim(),
          unit: String(itemUnit).trim(),
          unitCost: itemCost,
          currentStock: itemStock,
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
    setCurrentStock('');
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
        currentStock: Number(currentStock) || 0,
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

  // Analizar texto pegado de Excel (tab o comas)
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

      // Detectar separador (tabulación de Excel o coma o punto y coma)
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

      // Si es encabezado común, saltar
      const lower0 = (cols[0] || '').toLowerCase();
      if (lower0.includes('codigo') || lower0.includes('nombre') || lower0.includes('insumo') || lower0.includes('item')) {
        continue;
      }

      // Formatos soportados:
      // Formato 1: Código | Nombre | Categoría | Unidad | Costo
      // Formato 2: Nombre | Unidad | Costo
      // Formato 3: Nombre | Costo
      let itemCode = '';
      let itemName = '';
      let itemCat = 'Insumos y Aditivos';
      let itemUnit = 'Kg';
      let itemCost = 0;

      if (cols.length >= 5) {
        itemCode = cols[0];
        itemName = cols[1];
        itemCat = cols[2] || 'Insumos y Aditivos';
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
          currentStock: 0,
          companyId: selectedCompany?.id || null,
          companyName: selectedCompany?.name || null
        });
      }
    }

    if (items.length === 0) {
      setBulkError('No se pudieron detectar insumos válidos. Revisa el formato o los datos pegados.');
    } else {
      setParsedItems(items);
    }
  };

  // Guardar importación masiva
  const handleSubmitBulk = async () => {
    if (parsedItems.length === 0) return;

    try {
      setIsSubmitting(true);
      await bulkImportInventoryItems(parsedItems);
      alert(`¡Se importaron exitosamente ${parsedItems.length} insumos al catálogo!`);
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
              <h2 className="text-lg font-bold">Montar Insumos para Inventario</h2>
              <p className="text-xs text-slate-300">
                {selectedCompany ? `Empresa: ${selectedCompany.name}` : 'Catálogo General de Insumos'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de modo: Individual vs Carga Masiva */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
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
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'bulk'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Carga Masiva (Pegar desde Excel)
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
                  placeholder="Ej: Pierna de Cerdo Deshuesada, Condimento Especial..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
                />
              </div>

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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stock Teórico Inicial (Opcional)
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
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Valorización Inmediata:</strong> Cada vez que los operarios registren conteos de este insumo en sus teléfonos celulares, el sistema multiplicará automáticamente la cantidad contada por <strong>{unitCost ? formatCOP(unitCost) : '$0'}</strong>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Guardar Insumo en Catálogo
                </button>
              </div>
            </form>
          ) : (
            /* Carga Masiva desde Excel */
            <div className="space-y-4">
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUploadExcel}
                accept=".xlsx, .xls"
                className="hidden"
              />

              {/* Botones de Acción Excel */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <span>Carga Masiva con Archivo Excel (.xlsx / .xls)</span>
                  </h4>
                  <p className="text-[11px] text-emerald-800/80 mt-0.5">
                    Descarga la plantilla oficial en Excel, llénala con tus insumos y súbela directamente.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadTemplateExcel}
                    className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Descargar Plantilla Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Archivo Excel</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700">
                <p className="font-bold mb-1 flex items-center gap-1.5 text-slate-800">
                  <span>O también puedes copiar y pegar celdas desde Excel aquí:</span>
                </p>
                <ul className="list-disc list-inside text-[11px] text-slate-600 mt-1 font-mono">
                  <li><strong>Opción completa:</strong> Código | Nombre | Categoría | Unidad | Costo Unitario</li>
                  <li><strong>Opción rápida:</strong> Nombre | Unidad | Costo Unitario</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pega aquí el contenido copiado de Excel (Opcional):
                </label>
                <textarea
                  rows="4"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`Ejemplo:\nINS-011\tCarne de Res Magra\tCárnicos y Proteínas\tKg\t24500\nINS-012\tPimienta Negra Molida\tInsumos y Aditivos\tKg\t32000`}
                  className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleParseBulk}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Analizar Texto Pegado
                </button>
                {parsedItems.length > 0 && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    ✓ {parsedItems.length} insumos listos para importar
                  </span>
                )}
              </div>

              {bulkError && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}

              {/* Previsualización de ítems analizados */}
              {parsedItems.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="p-2">Código</th>
                        <th className="p-2">Nombre</th>
                        <th className="p-2">Categoría</th>
                        <th className="p-2">Unidad</th>
                        <th className="p-2 text-right">Costo Unitario</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-mono text-slate-500">{item.code}</td>
                          <td className="p-2 font-medium text-slate-800">{item.name}</td>
                          <td className="p-2 text-slate-600 text-[11px]">{item.category}</td>
                          <td className="p-2 text-slate-600 font-bold">{item.unit}</td>
                          <td className="p-2 text-right font-bold text-emerald-700">
                            {formatCOP(item.unitCost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmitBulk}
                  disabled={isSubmitting || parsedItems.length === 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Importar {parsedItems.length > 0 ? `(${parsedItems.length})` : ''} Insumos
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
