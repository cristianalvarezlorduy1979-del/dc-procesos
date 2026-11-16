import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Save, 
  CheckCircle2, 
  DollarSign, 
  Hash, 
  Scale, 
  Sparkles, 
  RotateCcw, 
  AlertCircle,
  Building2,
  Calendar,
  User,
  Check
} from 'lucide-react';
import { savePhysicalInventory } from '../services/firebase';

export default function MobileInventoryCountView({
  inventoryItems = [],
  currentUser,
  selectedCompany,
  onInventorySaved
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [countTitle, setCountTitle] = useState(() => {
    const today = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    return `Toma Física - ${today}`;
  });
  const [operatorNotes, setOperatorNotes] = useState('');
  
  // Mapeo de cantidades contadas { [itemId]: number }
  const [counts, setCounts] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Obtener categorías únicas presentes en los insumos
  const categories = useMemo(() => {
    const cats = new Set(inventoryItems.map(i => i.category || 'Otros'));
    return ['ALL', ...Array.from(cats)];
  }, [inventoryItems]);

  // Filtrado de insumos
  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => {
      const matchSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [inventoryItems, searchTerm, selectedCategory]);

  // Manejadores de conteo
  const handleCountChange = (itemId, val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) {
      setCounts(prev => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    } else {
      setCounts(prev => ({ ...prev, [itemId]: num }));
    }
  };

  const handleQuickAdd = (itemId, addVal) => {
    setCounts(prev => {
      const current = prev[itemId] || 0;
      const nextVal = Math.max(0, current + addVal);
      return { ...prev, [itemId]: Number(nextVal.toFixed(2)) };
    });
  };

  const handleClearCount = (itemId) => {
    setCounts(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  // Cálculo en tiempo real de valorización
  const summary = useMemo(() => {
    let totalItemsCounted = 0;
    let totalQuantity = 0;
    let totalValued = 0;

    inventoryItems.forEach(item => {
      const counted = counts[item.id] || 0;
      if (counted > 0) {
        totalItemsCounted++;
        totalQuantity += counted;
        totalValued += counted * (Number(item.unitCost) || 0);
      }
    });

    return {
      totalItemsCounted,
      totalQuantity: Number(totalQuantity.toFixed(2)),
      totalValued: Number(totalValued.toFixed(2))
    };
  }, [inventoryItems, counts]);

  const formatCOP = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Guardar y enviar la toma física a la página web
  const handleSaveInventory = async () => {
    if (summary.totalItemsCounted === 0) {
      alert('Por favor ingresa al menos un conteo físico mayor a cero antes de guardar.');
      return;
    }

    const itemsToSave = inventoryItems
      .filter(item => (counts[item.id] || 0) > 0)
      .map(item => ({
        itemId: item.id,
        code: item.code,
        name: item.name,
        category: item.category || 'Insumos',
        unit: item.unit || 'Kg',
        unitCost: Number(item.unitCost) || 0,
        countedQty: counts[item.id] || 0,
        totalValued: (counts[item.id] || 0) * (Number(item.unitCost) || 0)
      }));

    try {
      setIsSubmitting(true);
      const operatorName = currentUser?.displayName || currentUser?.email || 'Operario Móvil';
      
      const newInv = await savePhysicalInventory({
        title: countTitle,
        countedBy: operatorName,
        companyId: selectedCompany?.id || null,
        companyName: selectedCompany?.name || 'DC Procesos',
        notes: operatorNotes,
        items: itemsToSave
      });

      setSavedSuccess(true);
      setCounts({});
      setOperatorNotes('');
      if (onInventorySaved) onInventorySaved(newInv);

      // Auto-ocultar mensaje de éxito luego de unos segundos
      setTimeout(() => {
        setSavedSuccess(false);
      }, 5000);

    } catch (err) {
      alert('Error guardando la toma de inventario: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto pb-32 px-3 sm:px-4">
      
      {/* Toast de Éxito */}
      {savedSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-black text-sm">¡Toma Física Enviada con Éxito!</h4>
            <p className="text-xs text-emerald-100">
              Llegó en tiempo real a la página web y ya fue valorizada en el informe.
            </p>
          </div>
        </div>
      )}

      {/* Cabecera Móvil */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-4 shadow-xl border border-slate-700/50 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">DC PROCESOS • INVENTARIOS</span>
              <h2 className="text-base font-black">Toma de Conteo Físico</h2>
            </div>
          </div>
          {selectedCompany && (
            <span className="text-[11px] font-bold bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 text-emerald-300">
              {selectedCompany.name}
            </span>
          )}
        </div>

        {/* Título de la sesión */}
        <div className="space-y-2 pt-1 border-t border-slate-700/60">
          <div>
            <label className="text-[10px] font-semibold text-slate-300 block mb-0.5">
              Título o Identificador de la Toma Física:
            </label>
            <input
              type="text"
              value={countTitle}
              onChange={(e) => setCountTitle(e.target.value)}
              placeholder="Ej: Conteo Fin de Mes Bodega 1"
              className="w-full bg-slate-800/80 border border-slate-600 rounded-xl px-3 py-1.5 text-xs font-bold text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentUser?.displayName || currentUser?.email || 'Operario de Planta'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{new Date().toLocaleDateString('es-CO')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Buscador & Filtro de Categoría */}
      <div className="space-y-2 mb-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar insumo por nombre o código..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2 text-xs text-slate-400 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Píldoras de Categoría */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-[11px] ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat === 'ALL' ? 'Todos los Insumos' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Listado de Insumos para Conteo */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No se encontraron insumos</p>
            <p className="text-xs text-slate-400 mt-1">
              Prueba con otro término de búsqueda o agrega insumos al catálogo desde la página web.
            </p>
          </div>
        ) : (
          filteredItems.map(item => {
            const countedQty = counts[item.id] || 0;
            const unitCost = Number(item.unitCost) || 0;
            const lineSubtotal = countedQty * unitCost;
            const isCounted = countedQty > 0;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-3.5 border transition-all shadow-xs ${
                  isCounted
                    ? 'border-emerald-400 bg-emerald-50/20 ring-1 ring-emerald-400/50'
                    : 'border-slate-200'
                }`}
              >
                {/* Encabezado del Ítem */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {item.code}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium truncate">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                      {item.name}
                    </h3>
                  </div>

                  {/* Unidad y Costo Unitario */}
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      {item.unit}
                    </span>
                    <div className="text-[11px] font-bold text-slate-600 mt-0.5">
                      {formatCOP(unitCost)} <span className="text-[9px] font-normal text-slate-400">/ {item.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Input de Conteo y Botones Rápidos */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2 text-[10px] font-bold text-slate-400 uppercase">
                        Físico:
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={counts[item.id] !== undefined ? counts[item.id] : ''}
                        onChange={(e) => handleCountChange(item.id, e.target.value)}
                        placeholder="0"
                        className={`w-full pl-14 pr-3 py-1.5 text-base font-black rounded-xl border text-right focus:outline-none transition ${
                          isCounted 
                            ? 'border-emerald-500 bg-white text-emerald-800 ring-2 ring-emerald-500/20' 
                            : 'border-slate-300 bg-slate-50 text-slate-800'
                        }`}
                      />
                    </div>

                    {/* Botones de incremento táctil */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(item.id, 1)}
                        className="h-9 px-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(item.id, 5)}
                        className="h-9 px-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition"
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(item.id, 10)}
                        className="h-9 px-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition"
                      >
                        +10
                      </button>
                      {isCounted && (
                        <button
                          type="button"
                          onClick={() => handleClearCount(item.id)}
                          title="Reiniciar a cero"
                          className="h-9 px-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Subtotal Valorizado en tiempo real por ítem */}
                  {isCounted && (
                    <div className="mt-2 pt-2 border-t border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-800">
                      <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        Valorización de este ítem:
                      </span>
                      <span className="text-sm font-black text-emerald-700">
                        {formatCOP(lineSubtotal)}
                      </span>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Notas generales del operario */}
      <div className="mt-4 bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Observaciones / Notas del Conteo (Opcional):
        </label>
        <textarea
          rows="2"
          value={operatorNotes}
          onChange={(e) => setOperatorNotes(e.target.value)}
          placeholder="Ej: Se contaron bultos cerrados en bodega de frío, lote de tripa pendiente de verificar..."
          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Barra Fija Inferior con Resumen y Valorización Inmediata */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md text-white border-t border-slate-800 p-3 sm:p-4 shadow-2xl">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          
          <div className="flex-1">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-400">
              <span>{summary.totalItemsCounted} insumos contados</span>
              <span>•</span>
              <span>{summary.totalQuantity} total unidades/Kg</span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Total Valorizado:</span>
              <span className="text-base sm:text-xl font-black text-[#00df82] tracking-tight">
                {formatCOP(summary.totalValued)}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting || summary.totalItemsCounted === 0}
            onClick={handleSaveInventory}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-emerald-900/40 transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar Conteo
          </button>

        </div>
      </div>

    </div>
  );
}
