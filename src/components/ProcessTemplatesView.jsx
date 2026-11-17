import React, { useState, useRef } from 'react';
import { 
  Layers, 
  Plus, 
  Download, 
  Upload, 
  Search, 
  Trash2, 
  Edit3, 
  Droplet, 
  Bone, 
  Flame, 
  Scale, 
  Scissors, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  UtensilsCrossed,
  ChevronDown,
  ChevronUp,
  DollarSign
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { removeProcessTemplate, importProcessTemplatesBatch } from '../services/firebase';

export default function ProcessTemplatesView({
  processTemplates = [],
  inventoryItems = [],
  selectedCompany,
  onOpenNewTemplateModal,
  onEditTemplate,
  onStartOrderFromTemplate
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isImporting, setIsImporting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);
  const fileInputRef = useRef(null);

  // Categorías disponibles
  const categories = ['ALL', ...Array.from(new Set(processTemplates.map(p => p.category || 'General')))];

  // Filtrar
  const filteredTemplates = processTemplates.filter(p => {
    const matchText = 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchText && matchCat;
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const formatCOP = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Cálculo de costo dinámico de la subreceta basado en el catálogo actual de insumos
  const calculateTemplateCost = (template) => {
    if (!Array.isArray(template.recipe) || template.recipe.length === 0) return 0;
    return template.recipe.reduce((total, ing) => {
      const matched = inventoryItems.find(it => 
        it.id === ing.inventoryItemId || 
        it.name?.toLowerCase() === ing.name?.toLowerCase() ||
        it.code?.toLowerCase() === ing.name?.toLowerCase()
      );
      const cost = Number(ing.unitCost) || Number(matched?.unitCost) || 0;
      const qty = Number(ing.standardQty) || 0;
      return total + (cost * qty);
    }, 0);
  };

  // ==========================================
  // DESCARGAR PLANTILLA EXCEL OFICIAL (.xlsx)
  // ==========================================
  const handleDownloadExcelTemplate = () => {
    const headers = [
      'Codigo',
      'Nombre_Proceso',
      'Categoria',
      'Unidad_Medida',
      'Rendimiento_Esperado_Pct',
      'Receta_Ingredientes',
      'Aplica_Sangre',
      'Aplica_Hueso',
      'Aplica_Gordos',
      'Aplica_Evaporacion_Coccion',
      'Aplica_Drenaje_Descongelacion',
      'Aplica_Recortes_Retal',
      'Descripcion'
    ];

    const sampleRows = [
      [
        'PROC-101',
        'Desposte y Deshuese de Res (Cuarto Trasero)',
        'Bovino (Res)',
        'Kg',
        69.5,
        'Canal de Res (Cuarto Trasero): 150 Kg | Bolsa al Vacío Termoencogible: 25 Unidades',
        'SI',
        'SI',
        'SI',
        'NO',
        'NO',
        'SI',
        'Desposte con hueso, sangre y grasa de pulido'
      ],
      [
        'PROC-102',
        'Elaboración de Salsa BBQ Artesanal',
        'Salsas y Aderezos',
        'Litros / Kg',
        82.0,
        'Pasta de Tomate Concentrada: 10 Kg | Panela: 3.5 Kg | Vinagre: 2 Litros | Salsa de Soya: 1 Litro | Humo Líquido: 0.25 Litros | Sal & Especias: 0.5 Kg',
        'NO',
        'NO',
        'NO',
        'SI',
        'NO',
        'NO',
        'Cocción y reducción térmica. No maneja sangre ni hueso; reporta evaporación'
      ],
      [
        'PROC-103',
        'Porcionado y Fileteado de Pechuga',
        'Avícola (Pollo)',
        'Kg',
        85.0,
        'Pechuga con Hueso y Piel: 40 Kg | Bolsa al Vacío: 20 Unidades',
        'NO',
        'NO',
        'SI',
        'NO',
        'SI',
        'SI',
        'Fileteado de pechuga. Reporta drenaje y retal'
      ],
      [
        'PROC-104',
        'Embutido de Chorizo Santarrosano',
        'Embutidos / Procesados',
        'Kg',
        92.0,
        'Carne de Cerdo Magra: 18 Kg | Grasa de Cerdo: 5 Kg | Condimento Chorizo: 0.65 Kg | Sal: 0.4 Kg | Tripa 28/30: 2 Madejas',
        'NO',
        'NO',
        'NO',
        'SI',
        'NO',
        'SI',
        'Picado, embutido y secado'
      ]
    ];

    // Si ya hay procesos creados por la empresa, incluirlos también en la exportación
    const existingRows = processTemplates.map(p => {
      const formattedRecipe = Array.isArray(p.recipe) && p.recipe.length > 0
        ? p.recipe.map(r => `${r.name}: ${r.standardQty} ${r.unit}${r.notes ? ` (${r.notes})` : ''}`).join(' | ')
        : '';

      return [
        p.code || '',
        p.name || '',
        p.category || 'General',
        p.unit || 'Kg',
        p.expectedYield || 70,
        formattedRecipe,
        p.lossFields?.hasBlood ? 'SI' : 'NO',
        p.lossFields?.hasBone ? 'SI' : 'NO',
        p.lossFields?.hasFat ? 'SI' : 'NO',
        p.lossFields?.hasEvaporation ? 'SI' : 'NO',
        p.lossFields?.hasDraining ? 'SI' : 'NO',
        p.lossFields?.hasTrimmings ? 'SI' : 'NO',
        p.description || ''
      ];
    });

    const dataToExport = [headers, ...(existingRows.length > 0 ? existingRows : sampleRows)];

    const ws = XLSX.utils.aoa_to_sheet(dataToExport);
    
    // Ancho de columnas para visualización clara en Excel
    ws['!cols'] = [
      { wch: 12 }, // Codigo
      { wch: 38 }, // Nombre_Proceso
      { wch: 22 }, // Categoria
      { wch: 15 }, // Unidad_Medida
      { wch: 24 }, // Rendimiento
      { wch: 45 }, // Receta_Ingredientes
      { wch: 14 }, // Sangre
      { wch: 14 }, // Hueso
      { wch: 14 }, // Gordos
      { wch: 26 }, // Evaporacion
      { wch: 28 }, // Drenaje
      { wch: 22 }, // Retal
      { wch: 45 }  // Descripcion
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Procesos');

    const fileName = `DC_Procesos_Plantilla_${selectedCompany ? selectedCompany.name.replace(/\s+/g, '_') : 'Empresa'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast('Plantilla Excel descargada correctamente');
  };

  // ==========================================
  // CARGAR PROCESOS DESDE ARCHIVO EXCEL (.xlsx / .csv)
  // ==========================================
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonRows.length === 0) {
        alert('El archivo no contiene filas con datos.');
        return;
      }

      // Mapear filas al modelo de procesos
      const templatesToImport = jsonRows.map((row) => {
        // Soporta nombres de columnas con variaciones
        const code = row['Codigo'] || row['Código'] || row['code'] || '';
        const name = row['Nombre_Proceso'] || row['Nombre'] || row['name'] || row['Proceso'] || '';
        const category = row['Categoria'] || row['Categoría'] || row['category'] || 'General';
        const unit = row['Unidad_Medida'] || row['Unidad'] || row['unit'] || 'Kg';
        const expectedYield = row['Rendimiento_Esperado_Pct'] || row['Rendimiento'] || 70;
        const description = row['Descripcion'] || row['Descripción'] || row['Notas'] || '';

        const checkBool = (val) => {
          const s = String(val).toLowerCase().trim();
          return s === 'si' || s === 'sí' || s === 'true' || s === '1' || s === 'x';
        };

        return {
          code,
          name,
          category,
          unit,
          expectedYield,
          description,
          receta: row['Receta_Ingredientes'] || row['Receta'] || row['Ingredientes'] || row['recipe'] || '',
          hasBlood: checkBool(row['Aplica_Sangre'] || row['Sangre']),
          hasBone: checkBool(row['Aplica_Hueso'] || row['Hueso']),
          hasFat: checkBool(row['Aplica_Gordos'] || row['Gordos'] || row['Grasa']),
          hasEvaporation: checkBool(row['Aplica_Evaporacion_Coccion'] || row['Evaporacion'] || row['Evaporación']),
          hasDraining: checkBool(row['Aplica_Drenaje_Descongelacion'] || row['Drenaje']),
          hasTrimmings: checkBool(row['Aplica_Recortes_Retal'] || row['Recortes'] || row['Retal'])
        };
      }).filter(t => t.name.trim().length > 0);

      if (templatesToImport.length === 0) {
        alert('No se encontraron procesos válidos. Asegúrate de incluir la columna "Nombre_Proceso".');
        return;
      }

      const imported = await importProcessTemplatesBatch(templatesToImport, selectedCompany);
      showToast(`¡Se importaron ${imported.length} procesos estándar con éxito!`);
    } catch (err) {
      console.error(err);
      alert('Error leyendo el archivo Excel: ' + err.message);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (templateId, templateName) => {
    if (confirm(`¿Estás seguro de eliminar el proceso estándar "${templateName}" del catálogo?`)) {
      try {
        await removeProcessTemplate(templateId);
        showToast('Proceso eliminado del catálogo');
      } catch (err) {
        alert('Error eliminando: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls"
        className="hidden"
      />

      {/* Cabecera del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 mb-1">
            <Layers className="w-4 h-4" />
            <span>Catálogo Maestro de Procesos & Mermas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Catálogo de Procesos de la Empresa
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Estandariza los procesos productivos de tu empresa y define qué mermas específicas aplican (ej. una salsa no maneja sangre ni hueso como la carne). Puedes cargar tu listado masivamente desde una plantilla de Excel.
          </p>
        </div>

        {/* Acciones Superiores */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleDownloadExcelTemplate}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-xs transition"
            title="Descargar archivo Excel con columnas y ejemplos de procesos"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Descargar Plantilla Excel</span>
            <span className="sm:hidden">Plantilla</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2 transition disabled:opacity-50"
            title="Subir archivo Excel (.xlsx / .xls) con tu catálogo de procesos"
          >
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>{isImporting ? 'Cargando...' : 'Cargar desde Excel'}</span>
          </button>

          <button
            onClick={onOpenNewTemplateModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Proceso</span>
          </button>
        </div>
      </div>

      {/* Buscador & Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por proceso, código o descripción..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
          />
        </div>

        {/* Filtro Categorías */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                categoryFilter === cat
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat === 'ALL' ? 'Todos los Tipos' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Procesos Estándar */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            No hay procesos en este filtro
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
            Crea el primer proceso o carga la plantilla de Excel para configurar los procesos de la empresa con sus mermas específicas.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleDownloadExcelTemplate}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Bajar Plantilla</span>
            </button>
            <button
              onClick={onOpenNewTemplateModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Proceso</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const lf = template.lossFields || {};

            return (
              <div
                key={template.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Encabezado */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border">
                      {template.code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Rend. Est: {template.expectedYield}%
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {template.name}
                  </h3>

                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{template.category}</span>
                    <span>•</span>
                    <span>Unidad: <strong>{template.unit}</strong></span>
                  </div>

                  {template.description && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
                      {template.description}
                    </p>
                  )}

                  {/* Receta e Ingredientes Preestablecidos con Costeo Automático */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    {(() => {
                      const templateCost = calculateTemplateCost(template);
                      const isExpanded = expandedRecipeId === template.id;

                      return (
                        <>
                          <button
                            type="button"
                            onClick={() => setExpandedRecipeId(isExpanded ? null : template.id)}
                            className="w-full flex items-center justify-between text-left p-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-950 transition border border-emerald-200/60 cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5 text-xs font-bold">
                              <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Subreceta ({Array.isArray(template.recipe) ? template.recipe.length : 0} insumos)</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {templateCost > 0 && (
                                <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-[11px] shadow-2xs">
                                  {formatCOP(templateCost)}
                                </span>
                              )}
                              <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                                <span>{isExpanded ? 'Ocultar' : 'Ver receta'}</span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </div>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-fadeIn">
                              {Array.isArray(template.recipe) && template.recipe.length > 0 ? (
                                <>
                                  <div className="space-y-1.5 divide-y divide-slate-200/60">
                                    {template.recipe.map((ing, i) => {
                                      const matched = inventoryItems.find(it => 
                                        it.id === ing.inventoryItemId || 
                                        it.name?.toLowerCase() === ing.name?.toLowerCase() ||
                                        it.code?.toLowerCase() === ing.name?.toLowerCase()
                                      );
                                      const cost = Number(ing.unitCost) || Number(matched?.unitCost) || 0;
                                      const qty = Number(ing.standardQty) || 0;
                                      const lineSubtotal = qty * cost;

                                      return (
                                        <div key={ing.id || i} className="flex items-center justify-between text-xs pt-1.5 first:pt-0">
                                          <div>
                                            <span className="font-bold text-slate-800 block">{ing.name}</span>
                                            {ing.notes && (
                                              <span className="text-[10px] text-slate-400 italic block">{ing.notes}</span>
                                            )}
                                          </div>
                                          <div className="text-right shrink-0">
                                            <span className="font-mono font-bold text-slate-900 block">
                                              {ing.standardQty} {ing.unit}
                                            </span>
                                            {cost > 0 && (
                                              <span className="text-[10px] font-bold text-emerald-700 block">
                                                {formatCOP(lineSubtotal)} (@{formatCOP(cost)})
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {templateCost > 0 && (
                                    <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-xs font-black text-slate-900">
                                      <span>Costo Total Estimado Insumos:</span>
                                      <span className="text-emerald-800 text-sm">{formatCOP(templateCost)}</span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <p className="text-[11px] text-slate-400 italic text-center py-1">
                                  Sin insumos aún. Edita el proceso para agregarlos.
                                </p>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Mermas que aplican */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Mermas que Informará el Operario:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {lf.hasBlood && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                          <Droplet className="w-3 h-3 text-red-600" /> Sangre
                        </span>
                      )}
                      {lf.hasBone && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Bone className="w-3 h-3 text-amber-700" /> Hueso
                        </span>
                      )}
                      {lf.hasFat && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-yellow-50 text-yellow-800 border border-yellow-200 flex items-center gap-1">
                          <Scale className="w-3 h-3 text-yellow-700" /> Gordos
                        </span>
                      )}
                      {lf.hasEvaporation && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-orange-50 text-orange-800 border border-orange-200 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-600" /> Evaporación / Cocción
                        </span>
                      )}
                      {lf.hasDraining && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-200 flex items-center gap-1">
                          <Droplet className="w-3 h-3 text-cyan-600" /> Drenaje
                        </span>
                      )}
                      {lf.hasTrimmings && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                          <Scissors className="w-3 h-3 text-purple-600" /> Recortes / Retal
                        </span>
                      )}
                      {lf.hasShrinkage !== false && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <Scale className="w-3 h-3 text-emerald-700" /> Merma General
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pie de Tarjeta */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditTemplate(template)}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                      title="Editar mermas o datos"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id, template.name)}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar proceso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => onStartOrderFromTemplate(template)}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <span>Lanzar Orden</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
