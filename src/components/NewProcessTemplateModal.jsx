import React, { useState, useEffect } from 'react';
import { X, Layers, Plus, Check, Info, Droplet, Bone, Flame, Scale, Scissors, AlertCircle, Trash2, UtensilsCrossed, PackagePlus } from 'lucide-react';
import { createProcessTemplate, updateProcessTemplate } from '../services/firebase';

export default function NewProcessTemplateModal({ 
  isOpen, 
  onClose, 
  selectedCompany, 
  templateToEdit = null,
  inventoryItems = []
}) {
  if (!isOpen) return null;

  const [code, setCode] = useState(templateToEdit?.code || `PROC-${Math.floor(100 + Math.random() * 900)}`);
  const [name, setName] = useState(templateToEdit?.name || '');
  const [category, setCategory] = useState(templateToEdit?.category || 'Bovino (Res)');
  const [unit, setUnit] = useState(templateToEdit?.unit || 'Kg');
  const [expectedYield, setExpectedYield] = useState(templateToEdit?.expectedYield || '70');
  const [description, setDescription] = useState(templateToEdit?.description || '');
  const [loading, setLoading] = useState(false);

  // Receta e Ingredientes preestablecidos
  const [recipe, setRecipe] = useState(
    templateToEdit?.recipe && Array.isArray(templateToEdit.recipe) 
      ? JSON.parse(JSON.stringify(templateToEdit.recipe)) 
      : []
  );

  // Mermas y subproductos configurables para este proceso
  const [hasBlood, setHasBlood] = useState(templateToEdit?.lossFields?.hasBlood ?? false);
  const [hasBone, setHasBone] = useState(templateToEdit?.lossFields?.hasBone ?? false);
  const [hasFat, setHasFat] = useState(templateToEdit?.lossFields?.hasFat ?? false);
  const [hasEvaporation, setHasEvaporation] = useState(templateToEdit?.lossFields?.hasEvaporation ?? false);
  const [hasDraining, setHasDraining] = useState(templateToEdit?.lossFields?.hasDraining ?? false);
  const [hasTrimmings, setHasTrimmings] = useState(templateToEdit?.lossFields?.hasTrimmings ?? false);
  const [hasShrinkage, setHasShrinkage] = useState(templateToEdit?.lossFields?.hasShrinkage ?? true);

  // Auto-configurar según la categoría seleccionada si es nuevo
  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    if (!templateToEdit) {
      if (newCat.includes('Bovino') || newCat.includes('Porcino')) {
        setHasBlood(true);
        setHasBone(true);
        setHasFat(true);
        setHasEvaporation(false);
        setHasDraining(false);
        setHasTrimmings(true);
        setUnit('Kg');
      } else if (newCat.includes('Avícola')) {
        setHasBlood(false);
        setHasBone(false);
        setHasFat(true);
        setHasEvaporation(false);
        setHasDraining(true);
        setHasTrimmings(true);
        setUnit('Kg');
      } else if (newCat.includes('Salsa') || newCat.includes('Aderezo')) {
        setHasBlood(false);
        setHasBone(false);
        setHasFat(false);
        setHasEvaporation(true); // Salsas manejan evaporación térmica
        setHasDraining(false);
        setHasTrimmings(false);
        setUnit('Litros / Kg');
      } else if (newCat.includes('Embutido')) {
        setHasBlood(false);
        setHasBone(false);
        setHasFat(false);
        setHasEvaporation(true);
        setHasDraining(false);
        setHasTrimmings(true);
        setUnit('Kg');
      }
    }
  };

  // Manejo de Ingredientes de la Receta
  const handleAddIngredient = () => {
    setRecipe(prev => [
      ...prev,
      {
        id: `ING-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: '',
        standardQty: 1,
        unit: 'Kg',
        notes: ''
      }
    ]);
  };

  const handleUpdateIngredient = (index, field, value) => {
    setRecipe(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveIngredient = (index) => {
    setRecipe(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddFromInventoryItem = (invItem) => {
    if (!invItem) return;
    setRecipe(prev => [
      ...prev,
      {
        id: `ING-${Date.now()}-${invItem.id || Math.floor(Math.random() * 1000)}`,
        name: invItem.name,
        standardQty: 1,
        unit: invItem.unit || 'Kg',
        notes: ''
      }
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor ingresa el nombre del proceso.');
      return;
    }

    try {
      setLoading(true);
      const cleanRecipe = recipe
        .filter(r => r.name && r.name.trim().length > 0)
        .map(r => ({
          id: r.id || `ING-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: r.name.trim(),
          standardQty: Number(r.standardQty) || 0,
          unit: r.unit || 'Kg',
          notes: (r.notes || '').trim()
        }));

      const payload = {
        code: code.trim(),
        name: name.trim(),
        category,
        unit,
        expectedYield: Number(expectedYield) || 70,
        description: description.trim(),
        recipe: cleanRecipe,
        lossFields: {
          hasBlood,
          hasBone,
          hasFat,
          hasEvaporation,
          hasDraining,
          hasTrimmings,
          hasShrinkage
        },
        companyId: selectedCompany?.id || null,
        companyName: selectedCompany?.name || null
      };

      if (templateToEdit?.id) {
        await updateProcessTemplate(templateToEdit.id, payload);
      } else {
        await createProcessTemplate(payload);
      }

      onClose();
    } catch (err) {
      alert('Error guardando proceso: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between p-6 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {templateToEdit ? 'Editar Proceso Estándar' : 'Crear Nuevo Proceso Estándar'}
              </h2>
              <p className="text-xs text-slate-400">
                Define qué mermas y datos requerirá informar el operario (ej. salsas sin sangre vs carnes)
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Código del Proceso *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre del Proceso *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Elaboración Salsa BBQ o Desposte de Res"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Categoría / Tipo *
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Bovino (Res)">Bovino (Res)</option>
                <option value="Porcino (Cerdo)">Porcino (Cerdo)</option>
                <option value="Avícola (Pollo)">Avícola (Pollo)</option>
                <option value="Salsas y Aderezos">Salsas y Aderezos</option>
                <option value="Embutidos / Procesados">Embutidos / Procesados</option>
                <option value="Lácteos y Derivados">Lácteos y Derivados</option>
                <option value="Panadería y Repostería">Panadería y Repostería</option>
                <option value="Otro Proceso Industrial">Otro Proceso</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unidad de Medida
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Kg">Kilogramos (Kg)</option>
                <option value="Litros / Kg">Litros / Kg</option>
                <option value="Gramos">Gramos (g)</option>
                <option value="Unidades">Unidades / Paquetes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rendimiento Esperado (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={expectedYield}
                onChange={(e) => setExpectedYield(e.target.value)}
                placeholder="Ej. 72.5"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descripción o Instrucciones Técnicas
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Separación de lomo y pulpa, sin hueso..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* ========================================================= */}
          {/* SECCIÓN RECETA ESTÁNDAR / INGREDIENTES PREESTABLECIDOS */}
          {/* ========================================================= */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                  <span>🥣 Receta Estándar / Ingredientes Preestablecidos</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  El operario verá estos insumos en su celular para saber cuánto agregar y podrá editar las cantidades reales si necesitó más de alguno.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {inventoryItems && inventoryItems.length > 0 && (
                  <select
                    onChange={(e) => {
                      const item = inventoryItems.find(it => it.id === e.target.value);
                      if (item) handleAddFromInventoryItem(item);
                      e.target.value = '';
                    }}
                    defaultValue=""
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 outline-none cursor-pointer"
                  >
                    <option value="" disabled>+ De Insumos ({inventoryItems.length})</option>
                    {inventoryItems.map(it => (
                      <option key={it.id} value={it.id}>
                        {it.name} ({it.unit})
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Ingrediente</span>
                </button>
              </div>
            </div>

            {/* Datalist para autocompletado si hay insumos */}
            {inventoryItems && inventoryItems.length > 0 && (
              <datalist id="inventory-autocomplete-list">
                {inventoryItems.map(it => (
                  <option key={it.id} value={it.name}>
                    {it.category} ({it.unit})
                  </option>
                ))}
              </datalist>
            )}

            {recipe.length === 0 ? (
              <div className="p-4 bg-emerald-50/40 border border-dashed border-emerald-200 rounded-2xl text-center space-y-1.5">
                <p className="text-xs font-bold text-emerald-900">
                  Sin ingredientes formulados en la receta todavía
                </p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Agrega los ingredientes o materias primas que componen este proceso para que el operario tenga la receta preestablecida lista en su celular.
                </p>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Crear primer ingrediente
                </button>
              </div>
            ) : (
              <div className="space-y-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
                <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500 px-1">
                  <div className="col-span-5">Ingrediente / Materia Prima</div>
                  <div className="col-span-2 text-center">Cant. Estándar</div>
                  <div className="col-span-2">Unidad</div>
                  <div className="col-span-2">Indicaciones / Notas</div>
                  <div className="col-span-1 text-center">Quitar</div>
                </div>

                {recipe.map((ing, idx) => (
                  <div key={ing.id || idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                    <div className="sm:col-span-5">
                      <span className="sm:hidden text-[10px] font-bold text-slate-500 block mb-0.5">Ingrediente:</span>
                      <input
                        type="text"
                        list="inventory-autocomplete-list"
                        value={ing.name}
                        onChange={(e) => handleUpdateIngredient(idx, 'name', e.target.value)}
                        placeholder="Ej. Pasta de Tomate / Carne / Sal"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <span className="sm:hidden text-[10px] font-bold text-slate-500 block mb-0.5">Cant. Estándar:</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={ing.standardQty}
                        onChange={(e) => handleUpdateIngredient(idx, 'standardQty', e.target.value)}
                        placeholder="1.0"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 text-center outline-none focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <span className="sm:hidden text-[10px] font-bold text-slate-500 block mb-0.5">Unidad:</span>
                      <select
                        value={ing.unit || 'Kg'}
                        onChange={(e) => handleUpdateIngredient(idx, 'unit', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Kg">Kg</option>
                        <option value="Litros">Litros</option>
                        <option value="g">Gramos (g)</option>
                        <option value="ml">Mililitros (ml)</option>
                        <option value="Unidades">Unidades</option>
                        <option value="Madejas">Madejas</option>
                        <option value="Paquetes">Paquetes</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="sm:hidden text-[10px] font-bold text-slate-500 block mb-0.5">Notas / Opcional:</span>
                      <input
                        type="text"
                        value={ing.notes || ''}
                        onChange={(e) => handleUpdateIngredient(idx, 'notes', e.target.value)}
                        placeholder="Ej. al hervir"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Eliminar ingrediente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-semibold px-1">
                  <span>Total ingredientes en fórmula: <strong>{recipe.length}</strong></span>
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar otro insumo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* CONFIGURADOR DE MERMAS Y SUBPRODUCTOS DEL PROCESO */}
          {/* ========================================================= */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <span>⚙️ Mermas & Subproductos que Aplican a este Proceso</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Marca solo las variables que el operario deberá informar en el celular al ejecutar este proceso:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
              
              {/* Sangre */}
              <label className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                hasBlood ? 'bg-red-50/70 border-red-300 text-red-950' : 'bg-slate-50 border-slate-200 text-slate-600 opacity-60'
              }`}>
                <input
                  type="checkbox"
                  checked={hasBlood}
                  onChange={(e) => setHasBlood(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded mt-0.5 accent-red-600"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Droplet className="w-3.5 h-3.5 text-red-600" />
                    <span>Sangre (Kg)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    Aplica en beneficio y desposte de res, cerdo y animales en canal.
                  </p>
                </div>
              </label>

              {/* Hueso */}
              <label className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                hasBone ? 'bg-amber-50/70 border-amber-300 text-amber-950' : 'bg-slate-50 border-slate-200 text-slate-600 opacity-60'
              }`}>
                <input
                  type="checkbox"
                  checked={hasBone}
                  onChange={(e) => setHasBone(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded mt-0.5 accent-amber-600"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Bone className="w-3.5 h-3.5 text-amber-700" />
                    <span>Hueso (Kg)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    Aplica en deshuese primario y cortes con estructura ósea.
                  </p>
                </div>
              </label>

              {/* Gordos / Grasa */}
              <label className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                hasFat ? 'bg-yellow-50/70 border-yellow-300 text-yellow-950' : 'bg-slate-50 border-slate-200 text-slate-600 opacity-60'
              }`}>
                <input
                  type="checkbox"
                  checked={hasFat}
                  onChange={(e) => setHasFat(e.target.checked)}
                  className="w-4 h-4 text-yellow-600 rounded mt-0.5 accent-yellow-600"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Scale className="w-3.5 h-3.5 text-yellow-700" />
                    <span>Gordos / Grasa (Kg)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    Grasa de pulido, cebo o tejido adiposo retirado.
                  </p>
                </div>
              </label>

              {/* Merma Evaporación / Cocción (Para Salsas, procesados, cocidos) */}
              <label className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                hasEvaporation ? 'bg-orange-50/70 border-orange-300 text-orange-950' : 'bg-slate-50 border-slate-200 text-slate-600 opacity-60'
              }`}>
                <input
                  type="checkbox"
                  checked={hasEvaporation}
                  onChange={(e) => setHasEvaporation(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded mt-0.5 accent-orange-600"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Flame className="w-3.5 h-3.5 text-orange-600" />
                    <span>Merma por Evaporación / Cocción</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    Crucial para salsas, reducciones térmicas, caldos y cocidos.
                  </p>
                </div>
              </label>

              {/* Drenaje / Descongelación */}
              <label className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                hasDraining ? 'bg-cyan-50/70 border-cyan-300 text-cyan-950' : 'bg-slate-50 border-slate-200 text-slate-600 opacity-60'
              }`}>
                <input
                  type="checkbox"
                  checked={hasDraining}
                  onChange={(e) => setHasDraining(e.target.checked)}
                  className="w-4 h-4 text-cyan-600 rounded mt-0.5 accent-cyan-600"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Droplet className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Merma por Drenaje / Descongelación</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    Pérdida de agua libre en materias primas congeladas.
                  </p>
                </div>
              </label>

              {/* Recortes / Retal de Limpieza */}
              <label className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                hasTrimmings ? 'bg-purple-50/70 border-purple-300 text-purple-950' : 'bg-slate-50 border-slate-200 text-slate-600 opacity-60'
              }`}>
                <input
                  type="checkbox"
                  checked={hasTrimmings}
                  onChange={(e) => setHasTrimmings(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded mt-0.5 accent-purple-600"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Scissors className="w-3.5 h-3.5 text-purple-600" />
                    <span>Recortes / Retal de Limpieza</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    Retal de estandarización reutilizable en embutidos o molidas.
                  </p>
                </div>
              </label>

              {/* Merma General de Proceso */}
              <label className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition sm:col-span-2 ${
                hasShrinkage ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-600 opacity-60'
              }`}>
                <input
                  type="checkbox"
                  checked={hasShrinkage}
                  onChange={(e) => setHasShrinkage(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded mt-0.5 accent-emerald-600"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Scale className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Merma General / Pérdida Natural de Proceso</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    Diferencia normal no recuperable inherente a la manipulación.
                  </p>
                </div>
              </label>

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
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {loading ? 'Guardando...' : (templateToEdit ? 'Actualizar Proceso' : 'Guardar en Catálogo')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
