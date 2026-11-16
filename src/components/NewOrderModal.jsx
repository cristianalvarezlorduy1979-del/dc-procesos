import React, { useState } from 'react';
import { X, Plus, Calendar, User, Scale, Tag, Layers, UtensilsCrossed, ChevronDown, ChevronUp } from 'lucide-react';
import { createProcessOrder } from '../services/firebase';

export default function NewOrderModal({ 
  isOpen, 
  onClose, 
  selectedCompany, 
  operators = [],
  processTemplates = [],
  initialTemplate = null
}) {
  if (!isOpen) return null;

  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplate?.id || '');
  const [processName, setProcessName] = useState(initialTemplate?.name || '');
  const [batch, setBatch] = useState('');
  const [category, setCategory] = useState(initialTemplate?.category || 'Bovino (Res)');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignedTo, setAssignedTo] = useState('');
  const [estimatedInputKg, setEstimatedInputKg] = useState('');
  const [recipe, setRecipe] = useState(
    initialTemplate?.recipe && Array.isArray(initialTemplate.recipe)
      ? initialTemplate.recipe.map(ing => ({
          ...ing,
          plannedQty: ing.standardQty,
          actualQty: ing.standardQty
        }))
      : []
  );
  const [showRecipeDetails, setShowRecipeDetails] = useState(false);
  const [lossFields, setLossFields] = useState(initialTemplate?.lossFields || {
    hasBlood: true,
    hasBone: true,
    hasFat: true,
    hasShrinkage: true,
    hasEvaporation: false,
    hasDraining: false,
    hasTrimmings: true
  });
  const [loading, setLoading] = useState(false);

  // Generador de código aleatorio
  const [customCode, setCustomCode] = useState(`ORD-${Math.floor(100 + Math.random() * 900)}`);

  // Al seleccionar un proceso estándar del catálogo
  const handleSelectTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    const tmpl = processTemplates.find(p => p.id === templateId);
    if (tmpl) {
      setProcessName(tmpl.name);
      setCategory(tmpl.category);
      if (tmpl.lossFields) {
        setLossFields(tmpl.lossFields);
      }
      if (Array.isArray(tmpl.recipe) && tmpl.recipe.length > 0) {
        setRecipe(tmpl.recipe.map(ing => ({
          ...ing,
          plannedQty: ing.standardQty,
          actualQty: ing.standardQty
        })));
        setShowRecipeDetails(true);
      } else {
        setRecipe([]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!processName || !batch || !estimatedInputKg) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    try {
      setLoading(true);
      await createProcessOrder({
        code: customCode,
        processName: processName.trim(),
        batch: batch.trim().toUpperCase(),
        category,
        targetDate,
        assignedTo: assignedTo.trim() || 'Operario de Turno',
        estimatedInputKg: Number(estimatedInputKg) || 0,
        lossFields, // Mermas dinámicas requeridas para este proceso
        recipe, // Receta con ingredientes preestablecidos para el celular
        companyId: selectedCompany ? selectedCompany.id : null,
        companyName: selectedCompany ? selectedCompany.name : null
      });
      onClose();
    } catch (err) {
      alert('Error creando la orden: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between p-6 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Nueva Orden de Proceso</h2>
              <p className="text-xs text-slate-400">
                {selectedCompany 
                  ? `Para: ${selectedCompany.name} (disponible en celular)` 
                  : 'Programar proceso para el día (disponible en celular)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Selector de Proceso del Catálogo */}
          {processTemplates && processTemplates.length > 0 && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
              <label className="block text-xs font-bold text-emerald-900 mb-1 flex items-center justify-between">
                <span>📋 Cargar desde Catálogo de Procesos:</span>
                <span className="text-[10px] text-emerald-700 font-normal">Auto-configura mermas</span>
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-emerald-300 bg-white rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Seleccionar del Catálogo (ej. Salsa BBQ, Desposte Res...) --</option>
                {processTemplates.map(tmpl => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.code ? `[${tmpl.code}] ` : ''}{tmpl.name} ({tmpl.category})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código Orden
              </label>
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lote de Materia Prima *
              </label>
              <input
                type="text"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="Ej. LT-RES-501"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre del Proceso / Corte *
            </label>
            <input
              type="text"
              value={processName}
              onChange={(e) => setProcessName(e.target.value)}
              placeholder="Ej. Desposte canal de res, Porcionado chuleta, Salsa BBQ..."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Mermas configuradas para este proceso */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
              Mermas que el operario reportará en este proceso:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {lossFields?.hasBlood && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                  Sangre
                </span>
              )}
              {lossFields?.hasBone && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  Hueso
                </span>
              )}
              {lossFields?.hasFat && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-200">
                  Gordos / Grasa
                </span>
              )}
              {lossFields?.hasEvaporation && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
                  Evaporación / Cocción
                </span>
              )}
              {lossFields?.hasDraining && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-200">
                  Drenaje
                </span>
              )}
              {lossFields?.hasTrimmings && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                  Recortes / Retal
                </span>
              )}
              {lossFields?.hasShrinkage !== false && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Merma General
                </span>
              )}
            </div>
          </div>

          {/* Receta preestablecida que se enrutará al operario */}
          {recipe.length > 0 && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowRecipeDetails(!showRecipeDetails)}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                  <UtensilsCrossed className="w-4 h-4 text-emerald-700" />
                  <span>🥣 Receta Preestablecida ({recipe.length} ingredientes para el celular)</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                  <span>{showRecipeDetails ? 'Ocultar' : 'Ver ingredientes'}</span>
                  {showRecipeDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </div>

              {showRecipeDetails && (
                <div className="mt-2.5 pt-2 border-t border-emerald-200/60 space-y-1.5">
                  <p className="text-[10px] text-emerald-800 mb-1">
                    El operario encontrará estas cantidades en su pantalla y podrá editarlas si necesitó agregar más:
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {recipe.map((ing, idx) => (
                      <div key={ing.id || idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-emerald-100">
                        <span className="font-semibold text-slate-800">{ing.name}</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={ing.plannedQty}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRecipe(prev => prev.map((item, i) => i === idx ? { ...item, plannedQty: val, actualQty: val } : item));
                            }}
                            className="w-16 px-1.5 py-0.5 text-center bg-slate-50 border border-slate-200 rounded font-mono font-bold text-slate-900 text-xs"
                          />
                          <span className="text-[11px] font-bold text-slate-500">{ing.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Categoría / Especie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Bovino">Bovino (Res)</option>
                <option value="Porcino">Porcino (Cerdo)</option>
                <option value="Avícola">Avícola (Pollo)</option>
                <option value="Ovino/Caprino">Ovino / Caprino</option>
                <option value="Embutidos">Embutidos / Procesados</option>
                <option value="Otro">Otro Proceso</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha Programada
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Insumo Estimado (Kg) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={estimatedInputKg}
                onChange={(e) => setEstimatedInputKg(e.target.value)}
                placeholder="Ej. 350.00"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                🎯 Enrutar Proceso a Operario
              </label>
              {operators && operators.length > 0 ? (
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-200 bg-blue-50/50 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Operario de Turno (Cualquier Operario)</option>
                  {operators.map(op => (
                    <option key={op.id} value={op.name}>
                      👤 {op.name} ({op.position || 'Operario'})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Nombre de operario"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear y Publicar para Celular'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
