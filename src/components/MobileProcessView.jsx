import React, { useState } from 'react';
import { 
  Smartphone, 
  Play, 
  CheckCircle2, 
  Clock, 
  Scale, 
  Droplet, 
  Bone, 
  Flame, 
  Layers, 
  PackageCheck, 
  AlertCircle, 
  FileText, 
  ChevronRight, 
  ArrowLeft, 
  RefreshCw,
  Calculator,
  Percent,
  Package,
  Scissors,
  UtensilsCrossed,
  Plus,
  Trash2,
  Zap,
  Camera,
  ShieldAlert,
  Eye,
  Maximize2,
  Calendar,
  User,
  X,
  MessageCircle
} from 'lucide-react';
import { startProcessOrder, completeProcessOrder } from '../services/firebase';
import { shareWasteReportToWhatsApp } from '../utils/whatsappShare';
import MobileInventoryCountView from './MobileInventoryCountView';
import DCLogo from './DCLogo';

export default function MobileProcessView({ 
  orders, 
  currentUser, 
  onOrderCompleted,
  inventoryItems = [],
  selectedCompany,
  onInventorySaved,
  wasteReports = [],
  onOpenNewWasteReportModal
}) {
  const [mobileModule, setMobileModule] = useState('orders'); // 'orders' | 'inventory' | 'waste'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedMobilePhoto, setSelectedMobilePhoto] = useState(null);
  const [filterTab, setFilterTab] = useState('Pendiente'); // 'Pendiente' | 'En Proceso' | 'Finalizado'

  // Estados del Formulario de Cierre de Proceso
  const [totalInputKg, setTotalInputKg] = useState('');
  const [orderRecipe, setOrderRecipe] = useState([]);
  const [isAddingExtra, setIsAddingExtra] = useState(false);
  const [extraName, setExtraName] = useState('');
  const [extraQty, setExtraQty] = useState('');
  const [extraUnit, setExtraUnit] = useState('Kg');
  const [bloodKg, setBloodKg] = useState('');
  const [boneKg, setBoneKg] = useState('');
  const [fatKg, setFatKg] = useState('');
  const [evaporationKg, setEvaporationKg] = useState('');
  const [drainingKg, setDrainingKg] = useState('');
  const [trimmingsKg, setTrimmingsKg] = useState('');
  const [shrinkageKg, setShrinkageKg] = useState('');
  const [autoCalculateShrinkage, setAutoCalculateShrinkage] = useState(false);
  const [finishedUnits, setFinishedUnits] = useState('');
  const [unitType, setUnitType] = useState('kg'); // 'kg' | 'grams'
  const [finishedWeight, setFinishedWeight] = useState('');
  const [operatorNotes, setOperatorNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  // Filtrar ordenes según pestaña
  const filteredOrders = orders.filter(o => {
    if (filterTab === 'Todos') return true;
    return o.status === filterTab;
  });

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    // Prellenar con datos existentes o estimados
    setTotalInputKg(order.totalInputKg > 0 ? String(order.totalInputKg) : (order.estimatedInputKg ? String(order.estimatedInputKg) : ''));
    
    // Cargar receta preestablecida
    let rec = [];
    if (Array.isArray(order.recipe) && order.recipe.length > 0) {
      rec = order.recipe.map(item => ({
        ...item,
        actualQty: item.actualQty !== undefined && item.actualQty !== null 
          ? String(item.actualQty) 
          : String(item.plannedQty !== undefined ? item.plannedQty : (item.standardQty || '0'))
      }));
    }
    setOrderRecipe(rec);
    setIsAddingExtra(false);
    setExtraName('');
    setExtraQty('');
    setExtraUnit('Kg');

    setBloodKg(order.bloodKg > 0 ? String(order.bloodKg) : '');
    setBoneKg(order.boneKg > 0 ? String(order.boneKg) : '');
    setFatKg(order.fatKg > 0 ? String(order.fatKg) : '');
    setEvaporationKg(order.evaporationKg > 0 ? String(order.evaporationKg) : '');
    setDrainingKg(order.drainingKg > 0 ? String(order.drainingKg) : '');
    setTrimmingsKg(order.trimmingsKg > 0 ? String(order.trimmingsKg) : '');
    setShrinkageKg(order.shrinkageKg > 0 ? String(order.shrinkageKg) : '');
    setFinishedUnits(order.finishedUnits > 0 ? String(order.finishedUnits) : '');
    
    if (order.finishedWeightKg > 0) {
      setUnitType('kg');
      setFinishedWeight(String(order.finishedWeightKg));
    } else if (order.finishedWeightGrams > 0) {
      setUnitType('grams');
      setFinishedWeight(String(order.finishedWeightGrams));
    } else {
      setFinishedWeight('');
    }

    setOperatorNotes(order.operatorNotes || '');
  };

  // Handlers de la Receta en Celular
  const handleUpdateRecipeQty = (idx, val) => {
    setOrderRecipe(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], actualQty: val };
      return next;
    });
  };

  const handleStepRecipeQty = (idx, step) => {
    setOrderRecipe(prev => {
      const next = [...prev];
      const cur = parseFloat(next[idx].actualQty) || 0;
      const res = Math.max(0, Number((cur + step).toFixed(2)));
      next[idx] = { ...next[idx], actualQty: String(res) };
      return next;
    });
  };

  const handleRemoveRecipeItem = (idx) => {
    setOrderRecipe(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddExtraIngredient = () => {
    if (!extraName.trim()) {
      alert('Por favor escribe el nombre del insumo o ingrediente extra.');
      return;
    }
    const qty = parseFloat(extraQty) || 0;
    if (qty <= 0) {
      alert('Por favor ingresa una cantidad mayor a 0.');
      return;
    }

    const newExtra = {
      id: `EXTRA-${Date.now()}`,
      name: extraName.trim(),
      standardQty: 0,
      plannedQty: 0,
      actualQty: String(qty),
      unit: extraUnit,
      notes: 'Insumo extra agregado en planta',
      isExtra: true
    };

    setOrderRecipe(prev => [...prev, newExtra]);
    setExtraName('');
    setExtraQty('');
    setIsAddingExtra(false);
  };

  const handleFillAllStandard = () => {
    setOrderRecipe(prev => prev.map(item => ({
      ...item,
      actualQty: String(item.plannedQty !== undefined ? item.plannedQty : (item.standardQty || '0'))
    })));
  };

  const handleAutoSumRecipeToInput = () => {
    let totalKg = 0;
    orderRecipe.forEach(item => {
      const qty = parseFloat(item.actualQty) || 0;
      const u = (item.unit || '').toLowerCase();
      if (u.includes('kg') || u.includes('kilo') || u.includes('litro') || u.includes('lt')) {
        totalKg += qty;
      } else if (u === 'g' || u === 'gramos' || u === 'ml') {
        totalKg += (qty / 1000);
      }
    });

    if (totalKg > 0) {
      setTotalInputKg(String(Number(totalKg.toFixed(2))));
    } else {
      alert('No se encontraron ingredientes con unidades en Kg, Litros o Gramos para sumar.');
    }
  };

  const handleStartOrder = async (order, e) => {
    e.stopPropagation();
    try {
      const operatorName = currentUser?.displayName || currentUser?.email || 'Operario de Turno';
      await startProcessOrder(order.id, operatorName);
      handleSelectOrder({ ...order, status: 'En Proceso' });
    } catch (err) {
      alert('Error iniciando la orden: ' + err.message);
    }
  };

  // Mermas activas para este proceso (ej. una salsa no pide sangre ni hueso)
  const activeLosses = selectedOrder?.lossFields || {
    hasBlood: true,
    hasBone: true,
    hasFat: true,
    hasShrinkage: true,
    hasEvaporation: false,
    hasDraining: false,
    hasTrimmings: true
  };

  // Cálculos en tiempo real
  const numInput = Number(totalInputKg) || 0;
  const numBlood = activeLosses.hasBlood ? (Number(bloodKg) || 0) : 0;
  const numBone = activeLosses.hasBone ? (Number(boneKg) || 0) : 0;
  const numFat = activeLosses.hasFat ? (Number(fatKg) || 0) : 0;
  const numEvaporation = activeLosses.hasEvaporation ? (Number(evaporationKg) || 0) : 0;
  const numDraining = activeLosses.hasDraining ? (Number(drainingKg) || 0) : 0;
  const numTrimmings = activeLosses.hasTrimmings ? (Number(trimmingsKg) || 0) : 0;
  
  let numFinishedKg = 0;
  let numFinishedGrams = 0;
  const rawFinishedWeight = Number(finishedWeight) || 0;

  if (unitType === 'kg') {
    numFinishedKg = rawFinishedWeight;
    numFinishedGrams = rawFinishedWeight * 1000;
  } else {
    numFinishedGrams = rawFinishedWeight;
    numFinishedKg = rawFinishedWeight / 1000;
  }

  // Total de subproductos sin merma general
  const outputsWithoutShrinkage = numFinishedKg + numBlood + numBone + numFat + numEvaporation + numDraining + numTrimmings;

  // Merma manual o calculada
  let finalShrinkage = Number(shrinkageKg) || 0;
  if (autoCalculateShrinkage && numInput > 0) {
    const diff = numInput - outputsWithoutShrinkage;
    finalShrinkage = diff > 0 ? Number(diff.toFixed(2)) : 0;
  }

  const sumOutputs = outputsWithoutShrinkage + finalShrinkage;
  const balanceDifference = numInput > 0 ? Number((numInput - sumOutputs).toFixed(2)) : 0;
  const yieldPercent = numInput > 0 ? ((numFinishedKg / numInput) * 100).toFixed(1) : 0;

  const handleSubmitProcess = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    if (numInput <= 0) {
      alert('Por favor ingresa el total de insumo tomado.');
      return;
    }

    if (numFinishedKg <= 0 && (!finishedUnits || Number(finishedUnits) <= 0)) {
      alert('Por favor registra las unidades o peso del producto terminado.');
      return;
    }

    try {
      setIsSubmitting(true);
      await completeProcessOrder(selectedOrder.id, {
        totalInputKg: numInput,
        recipe: orderRecipe.map(r => ({
          ...r,
          actualQty: Number(r.actualQty) || 0
        })),
        bloodKg: numBlood,
        boneKg: numBone,
        fatKg: numFat,
        evaporationKg: numEvaporation,
        drainingKg: numDraining,
        trimmingsKg: numTrimmings,
        shrinkageKg: finalShrinkage,
        finishedUnits: Number(finishedUnits) || 0,
        finishedWeightKg: numFinishedKg,
        finishedWeightGrams: numFinishedGrams,
        operatorNotes: operatorNotes.trim(),
        completedBy: currentUser?.displayName || currentUser?.email || 'Operario'
      });

      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
        setSelectedOrder(null);
        if (onOrderCompleted) onOrderCompleted();
      }, 1500);

    } catch (err) {
      alert('Error guardando la orden: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-[calc(100vh-4rem)] p-3 sm:p-4 pb-20">
      
      {/* Toast de Éxito */}
      {successToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>¡Orden guardada con éxito en la web principal!</span>
        </div>
      )}

      {/* Selector de Módulo Operario Móvil: Procesos vs Conteos vs Bajas */}
      {!selectedOrder && (
        <div className="grid grid-cols-3 rounded-2xl bg-white p-1 mb-3 text-xs font-bold border border-slate-300 shadow-2xs gap-1">
          <button
            onClick={() => setMobileModule('orders')}
            className={`py-2 px-1 rounded-xl transition flex flex-col items-center justify-center gap-1 text-[11px] ${
              mobileModule === 'orders'
                ? 'bg-[#4338ca] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Procesos ({orders.length})</span>
          </button>
          <button
            onClick={() => setMobileModule('inventory')}
            className={`py-2 px-1 rounded-xl transition flex flex-col items-center justify-center gap-1 text-[11px] ${
              mobileModule === 'inventory'
                ? 'bg-[#4338ca] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Conteos ({inventoryItems.length})</span>
          </button>
          <button
            onClick={() => setMobileModule('waste')}
            className={`py-2 px-1 rounded-xl transition flex flex-col items-center justify-center gap-1 text-[11px] ${
              mobileModule === 'waste'
                ? 'bg-[#4338ca] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bajas 📸 ({wasteReports.length})</span>
          </button>
        </div>
      )}

      {/* Si el operario seleccionó Módulo de Bajas y Desperdicios */}
      {mobileModule === 'waste' && !selectedOrder ? (
        <div className="space-y-4">
          
          {/* Banner de Cabecera Móvil de Bajas */}
          <div className="bg-gradient-to-r from-red-900 via-rose-900 to-slate-950 p-4 rounded-2xl text-white shadow-lg border border-red-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-white shrink-0">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block">
                    PLANTA MÓVIL • CONTROL DE MERMAS
                  </span>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                    Bajas & Desperdicios
                  </h2>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-red-950 text-rose-300 border border-red-800">
                {wasteReports.length} hoy
              </span>
            </div>
          </div>

          {/* Botón Táctil Principal: Reportar Baja con Cámara */}
          <button
            type="button"
            onClick={onOpenNewWasteReportModal}
            className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-red-600/30 active:scale-98 transition cursor-pointer"
          >
            <Camera className="w-5 h-5 animate-pulse" />
            <span>📸 Tomar Foto y Reportar Baja</span>
          </button>

          {/* Listado de Bajas Registradas */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 px-1">
              Bajas Registradas Recientemente
            </h3>

            {wasteReports.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 space-y-2 shadow-2xs">
                <Camera className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                <p className="font-bold text-slate-700 text-sm">No hay bajas registradas hoy</p>
                <p className="text-xs">
                  Toca el botón rojo arriba para tomar la foto con fecha y hora y reportar cualquier caída, vencimiento o merma.
                </p>
              </div>
            ) : (
              wasteReports.map((report) => (
                <div
                  key={report.id || report.code}
                  className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs space-y-2.5 hover:border-rose-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      {report.photoUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedMobilePhoto(report)}
                          className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 relative group"
                        >
                          <img 
                            src={report.photoUrl} 
                            alt={report.itemName} 
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition">
                            <Eye className="w-4 h-4" />
                          </div>
                        </button>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <Camera className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                            {report.code || 'BAJA'}
                          </span>
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            {report.reason}
                          </span>
                        </div>
                        <h4 className="font-black text-slate-900 text-sm mt-1 leading-snug">
                          {report.itemName}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Reportó: <strong className="text-slate-700">{report.responsible}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-rose-600 block">
                        {report.quantity} {report.unit}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {report.time}
                      </span>
                    </div>
                  </div>

                  {report.notes && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 italic">
                      "{report.notes}"
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    {report.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setSelectedMobilePhoto(report)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ver Foto</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const targetPhone = selectedCompany?.phone || selectedCompany?.whatsapp || '';
                        shareWasteReportToWhatsApp(report, targetPhone);
                      }}
                      className="py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition shrink-0"
                      title="Enviar a WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Modal Lightbox Foto Móvil */}
          {selectedMobilePhoto && (
            <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xs flex flex-col p-4 justify-between">
              <div className="flex items-center justify-between text-white pb-2 border-b border-slate-800">
                <span className="font-bold text-sm truncate max-w-[240px]">
                  {selectedMobilePhoto.itemName} ({selectedMobilePhoto.quantity} {selectedMobilePhoto.unit})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMobilePhoto(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 flex items-center justify-center py-3 overflow-hidden">
                <img 
                  src={selectedMobilePhoto.photoUrl} 
                  alt="Foto pericial" 
                  className="max-h-full max-w-full object-contain rounded-xl border border-slate-800 shadow-2xl" 
                />
              </div>

              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-white text-xs space-y-2">
                <div className="space-y-0.5">
                  <p>📅 <strong>Fecha:</strong> {selectedMobilePhoto.date} • ⏰ <strong>Hora:</strong> {selectedMobilePhoto.time}</p>
                  <p>👤 <strong>Responsable:</strong> {selectedMobilePhoto.responsible}</p>
                  <p>⚠️ <strong>Motivo:</strong> {selectedMobilePhoto.reason}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const targetPhone = selectedCompany?.phone || selectedCompany?.whatsapp || '';
                    shareWasteReportToWhatsApp(selectedMobilePhoto, targetPhone);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2 transition shadow-md"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>📲 Enviar esta Foto a WhatsApp</span>
                </button>
              </div>
            </div>
          )}

        </div>
      ) : mobileModule === 'inventory' && !selectedOrder ? (
        <MobileInventoryCountView
          inventoryItems={inventoryItems}
          currentUser={currentUser}
          selectedCompany={selectedCompany}
          onInventorySaved={onInventorySaved}
        />
      ) : (
        <>
          {/* VISTA 1: Lista de Procesos a Realizar */}
          {!selectedOrder ? (
            <div className="space-y-4">
              
              {/* Encabezado Móvil Oficial DC PROCESOS */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-4 rounded-2xl text-white shadow-lg border border-slate-700/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DCLogo className="w-11 h-11 shrink-0 drop-shadow-md" />
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                        DC ASESORÍAS • PLANTA
                      </span>
                      <h2 className="text-lg font-black tracking-tight text-white">
                        Procesos a Realizar
                      </h2>
                    </div>
                  </div>
                  {selectedCompany && (
                    <span className="text-[11px] font-bold bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 text-emerald-300">
                      {selectedCompany.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-2 pt-2 border-t border-slate-700/50">
                  Listado de procesos y órdenes de producción asignadas para realizar en planta.
                </p>
              </div>

          {/* Filtros por Estado */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200 rounded-xl text-xs font-semibold">
            {['Pendiente', 'En Proceso', 'Finalizado'].map((tab) => {
              const count = orders.filter(o => o.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`py-2 px-1 rounded-lg text-center transition-all ${
                    filterTab === tab
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className="truncate">{tab}</div>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Lista de Órdenes */}
          <div className="space-y-2.5">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No hay órdenes en "{filterTab}"</p>
                <p className="text-xs text-slate-400 mt-1">
                  Cambia de pestaña o crea una nueva orden desde el menú de la página principal.
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isPending = order.status === 'Pendiente';
                const isInProgress = order.status === 'En Proceso';
                const isFinished = order.status === 'Finalizado';

                return (
                  <div
                    key={order.id}
                    onClick={() => handleSelectOrder(order)}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 active:scale-[0.99] transition-all cursor-pointer relative overflow-hidden"
                  >
                    {/* Barra de estado lateral */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      isPending ? 'bg-amber-400' : isInProgress ? 'bg-blue-600 animate-pulse' : 'bg-emerald-500'
                    }`} />

                    <div className="flex items-start justify-between gap-2 pl-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-xs font-bold text-slate-900">{order.code}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border">
                            Lote: {order.batch}
                          </span>
                          {currentUser?.displayName && order.assignedTo?.toLowerCase().includes(currentUser.displayName.toLowerCase()) ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                              🎯 ENRUTADO A TI
                            </span>
                          ) : order.assignedTo ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              👤 {order.assignedTo}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800">
                          {order.processName}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                          <span>Insumo Est: <strong>{order.estimatedInputKg} kg</strong></span>
                          {isFinished && (
                            <span className="text-emerald-700 font-bold">
                              Rend: {order.yieldPercentage}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botón de acción */}
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        {isPending ? (
                          <button
                            onClick={(e) => handleStartOrder(order, e)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/30 flex items-center gap-1 transition-all"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Tomar</span>
                          </button>
                        ) : isInProgress ? (
                          <span className="px-2.5 py-1 rounded-xl bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 border border-blue-200">
                            <Clock className="w-3 h-3 animate-spin" />
                            <span>Completar</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Listo</span>
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      ) : (
        /* VISTA 2: Formulario de Cierre de Proceso (Optimizado para Celular) */
        <div className="space-y-4">
          
          {/* Botón Volver y Cabecera de la Orden */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg">
            <button
              onClick={() => setSelectedOrder(null)}
              className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white font-medium mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la lista de órdenes</span>
            </button>

            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-blue-600 px-2 py-0.5 rounded-md">
                    {selectedOrder.code}
                  </span>
                  <span className="text-xs text-slate-300">
                    Lote: <strong>{selectedOrder.batch}</strong>
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">
                  {selectedOrder.processName}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Insumo inicial estimado: <strong>{selectedOrder.estimatedInputKg} Kg</strong>
                </p>
              </div>
              <span className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                selectedOrder.status === 'Finalizado' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {selectedOrder.status}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmitProcess} className="space-y-4">
            
            {/* SECCIÓN RECETA & DOSIFICACIÓN DE INGREDIENTES */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      Receta & Dosificación de Ingredientes
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Cantidades preestablecidas para este lote (editables si agregaste más o menos)
                    </p>
                  </div>
                </div>

                {orderRecipe.length > 0 && (
                  <button
                    type="button"
                    onClick={handleFillAllStandard}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 shrink-0"
                    title="Restablecer todas las cantidades a la fórmula estándar"
                  >
                    Estándar
                  </button>
                )}
              </div>

              {/* Lista de Ingredientes de la Receta */}
              {orderRecipe.length > 0 ? (
                <div className="space-y-2.5">
                  {orderRecipe.map((ing, idx) => {
                    const stdVal = Number(ing.plannedQty !== undefined ? ing.plannedQty : ing.standardQty) || 0;
                    const actVal = Number(ing.actualQty) || 0;
                    const diff = Number((actVal - stdVal).toFixed(2));

                    return (
                      <div 
                        key={ing.id || idx} 
                        className={`p-3 rounded-2xl border transition-all ${
                          ing.isExtra 
                            ? 'bg-purple-50/60 border-purple-200' 
                            : diff > 0 
                              ? 'bg-amber-50/60 border-amber-300' 
                              : 'bg-slate-50/80 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-slate-900">
                                {ing.name}
                              </span>
                              {ing.isExtra && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-600 text-white">
                                  Extra Añadido
                                </span>
                              )}
                            </div>
                            {!ing.isExtra && stdVal > 0 && (
                              <span className="text-[10px] text-slate-500 block">
                                Fórmula sugerida: <strong>{stdVal} {ing.unit}</strong>
                              </span>
                            )}
                            {ing.notes && (
                              <span className="text-[10px] text-slate-400 italic block mt-0.5">
                                • {ing.notes}
                              </span>
                            )}
                          </div>

                          {ing.isExtra && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRecipeItem(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Quitar insumo extra"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Input Numérico Táctil con Botones +/- */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => handleStepRecipeQty(idx, -0.5)}
                            className="w-9 h-9 rounded-xl bg-white border border-slate-300 text-slate-700 font-black text-base flex items-center justify-center active:scale-95 shadow-xs"
                          >
                            -
                          </button>

                          <div className="relative flex-1">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={ing.actualQty}
                              onChange={(e) => handleUpdateRecipeQty(idx, e.target.value)}
                              placeholder="0.00"
                              className="w-full text-center text-lg font-black text-slate-900 bg-white border border-slate-300 rounded-xl py-1.5 px-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                              required
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                              {ing.unit}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleStepRecipeQty(idx, 0.5)}
                            className="w-9 h-9 rounded-xl bg-white border border-slate-300 text-slate-700 font-black text-base flex items-center justify-center active:scale-95 shadow-xs"
                          >
                            +
                          </button>
                        </div>

                        {/* Aviso de variación si se agregó más o menos */}
                        {!ing.isExtra && diff > 0 && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                            <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Agregaste +{diff} {ing.unit} adicional a la fórmula</span>
                          </div>
                        )}
                        {!ing.isExtra && diff < 0 && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded-md">
                            <span>Usaste {Math.abs(diff)} {ing.unit} menos de lo formulado</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-1">
                  <p className="text-xs font-semibold text-slate-600">
                    Este proceso no tiene receta preestablecida registrada.
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Puedes agregar los insumos que utilizaste usando el botón inferior.
                  </p>
                </div>
              )}

              {/* Botón y Formulario para Insumos Extras */}
              {isAddingExtra ? (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                    <span>➕ Agregar Insumo o Ingrediente Extra</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingExtra(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      Cancelar
                    </button>
                  </div>

                  <input
                    type="text"
                    value={extraName}
                    onChange={(e) => setExtraName(e.target.value)}
                    placeholder="Nombre del insumo (ej. Sal extra, Colorante, Salsa...)"
                    className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:ring-1 focus:ring-purple-500"
                    autoFocus
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={extraQty}
                      onChange={(e) => setExtraQty(e.target.value)}
                      placeholder="Cantidad"
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:ring-1 focus:ring-purple-500"
                    />

                    <select
                      value={extraUnit}
                      onChange={(e) => setExtraUnit(e.target.value)}
                      className="w-full px-2 py-2 bg-white border border-purple-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="Kg">Kg</option>
                      <option value="Litros">Litros</option>
                      <option value="g">Gramos (g)</option>
                      <option value="ml">Mililitros (ml)</option>
                      <option value="Unidades">Unidades</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddExtraIngredient}
                    className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
                  >
                    Confirmar Insumo Extra
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingExtra(true)}
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Agregar Insumo Extra</span>
                  </button>

                  {orderRecipe.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAutoSumRecipeToInput}
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                      title="Suma los insumos en Kg/Litros y llena automáticamente la casilla de Insumo Tomado"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Copiar Suma a Materia Prima</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* SECCIÓN 1: Total Insumo Tomado */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Total Insumo Tomado (Materia Prima)
                  </h3>
                  <p className="text-[11px] text-slate-500">Peso total de insumos que ingresaron a producción</p>
                </div>
              </div>

              <div className="relative mt-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalInputKg}
                  onChange={(e) => setTotalInputKg(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-2xl font-black text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                  Kg
                </span>
              </div>
            </div>

            {/* SECCIÓN 2: Subproductos y Mermas (Configurados específicamente para este proceso) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Mermas y Subproductos del Proceso
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Variables específicas para: <strong>{selectedOrder.processName}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Sangre */}
                {activeLosses.hasBlood && (
                  <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-rose-900 mb-1">
                      <Droplet className="w-3.5 h-3.5 text-rose-600" />
                      <span>Sangre (Kg)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={bloodKg}
                      onChange={(e) => setBloodKg(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-base font-bold bg-white border border-rose-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-rose-500 outline-none"
                    />
                  </div>
                )}

                {/* Hueso */}
                {activeLosses.hasBone && (
                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                      <Bone className="w-3.5 h-3.5 text-amber-700" />
                      <span>Hueso (Kg)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={boneKg}
                      onChange={(e) => setBoneKg(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-base font-bold bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>
                )}

                {/* Gordos / Grasa */}
                {activeLosses.hasFat && (
                  <div className="bg-yellow-50/60 p-3 rounded-xl border border-yellow-100">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-yellow-900 mb-1">
                      <Layers className="w-3.5 h-3.5 text-yellow-700" />
                      <span>Gordos / Grasa</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={fatKg}
                      onChange={(e) => setFatKg(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-base font-bold bg-white border border-yellow-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-yellow-500 outline-none"
                    />
                  </div>
                )}

                {/* Evaporación / Cocción (Crucial para salsas, reducciones y cocidos) */}
                {activeLosses.hasEvaporation && (
                  <div className="bg-orange-50/70 p-3 rounded-xl border border-orange-200">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-orange-950 mb-1">
                      <Flame className="w-3.5 h-3.5 text-orange-600" />
                      <span>Evaporación / Cocción</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={evaporationKg}
                      onChange={(e) => setEvaporationKg(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-base font-bold bg-white border border-orange-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                  </div>
                )}

                {/* Drenaje / Descongelación */}
                {activeLosses.hasDraining && (
                  <div className="bg-cyan-50/60 p-3 rounded-xl border border-cyan-100">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-cyan-900 mb-1">
                      <Droplet className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Drenaje (Kg)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={drainingKg}
                      onChange={(e) => setDrainingKg(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-base font-bold bg-white border border-cyan-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-cyan-500 outline-none"
                    />
                  </div>
                )}

                {/* Recortes / Retal */}
                {activeLosses.hasTrimmings && (
                  <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-100">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-purple-900 mb-1">
                      <Scissors className="w-3.5 h-3.5 text-purple-600" />
                      <span>Recortes / Retal</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={trimmingsKg}
                      onChange={(e) => setTrimmingsKg(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-base font-bold bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-purple-500 outline-none"
                    />
                  </div>
                )}

                {/* Merma General */}
                {activeLosses.hasShrinkage !== false && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Scale className="w-3.5 h-3.5 text-slate-600" />
                        <span>Merma General</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={autoCalculateShrinkage ? finalShrinkage : shrinkageKg}
                      disabled={autoCalculateShrinkage}
                      onChange={(e) => setShrinkageKg(e.target.value)}
                      placeholder="0.00"
                      className={`w-full text-base font-bold border rounded-lg px-2.5 py-1.5 text-slate-900 outline-none ${
                        autoCalculateShrinkage ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200 focus:ring-1 focus:ring-slate-500'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Botón de auto cálculo de merma por diferencia */}
              {activeLosses.hasShrinkage !== false && (
                <button
                  type="button"
                  onClick={() => setAutoCalculateShrinkage(!autoCalculateShrinkage)}
                  className="w-full py-1.5 px-3 rounded-lg text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Calculator className="w-3 h-3 text-blue-600" />
                  <span>
                    {autoCalculateShrinkage 
                      ? 'Merma en modo automático (Diferencia de Balance)' 
                      : 'Calcular Merma automáticamente por diferencia'}
                  </span>
                </button>
              )}
            </div>

            {/* SECCIÓN 3: Producto Terminado (Unidades y Grs o Kg) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Proceso Terminado
                  </h3>
                  <p className="text-[11px] text-slate-500">Unidades obtenidas y peso final del lote</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Unidades */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unidades Terminadas (und)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={finishedUnits}
                      onChange={(e) => setFinishedUnits(e.target.value)}
                      placeholder="Ej. 120"
                      className="w-full text-xl font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                    />
                    <PackageCheck className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Peso Terminado (Switch Kg / Grs) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Peso Terminado
                    </label>
                    <div className="flex items-center bg-slate-100 rounded-md p-0.5 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setUnitType('kg')}
                        className={`px-2 py-0.5 rounded transition-all ${
                          unitType === 'kg' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                        }`}
                      >
                        Kg
                      </button>
                      <button
                        type="button"
                        onClick={() => setUnitType('grams')}
                        className={`px-2 py-0.5 rounded transition-all ${
                          unitType === 'grams' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                        }`}
                      >
                        Gramos
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={finishedWeight}
                      onChange={(e) => setFinishedWeight(e.target.value)}
                      placeholder={unitType === 'kg' ? 'Ej. 85.50' : 'Ej. 85500'}
                      className="w-full text-xl font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      {unitType}
                    </span>
                  </div>
                  {unitType === 'grams' && numFinishedKg > 0 && (
                    <p className="text-[11px] text-emerald-600 font-medium mt-1">
                      Equivalente: {numFinishedKg.toFixed(2)} Kg
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* BALANCE DE MASA EN VIVO (Cálculo Inmediato) */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-2xl text-white shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5 uppercase">
                  <Scale className="w-3.5 h-3.5 text-blue-400" />
                  Balance y Rendimiento en Vivo
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {yieldPercent}% Rendimiento
                </span>
              </div>

              {/* Barra visual de distribución */}
              <div className="h-3 w-full bg-slate-700 rounded-full overflow-hidden flex">
                <div 
                  style={{ width: `${Math.min(100, (numFinishedKg / (numInput || 1)) * 100)}%` }} 
                  className="bg-emerald-500" 
                  title="Terminado" 
                />
                <div 
                  style={{ width: `${Math.min(100, (numBlood / (numInput || 1)) * 100)}%` }} 
                  className="bg-rose-500" 
                  title="Sangre" 
                />
                <div 
                  style={{ width: `${Math.min(100, (numBone / (numInput || 1)) * 100)}%` }} 
                  className="bg-amber-500" 
                  title="Hueso" 
                />
                <div 
                  style={{ width: `${Math.min(100, (numFat / (numInput || 1)) * 100)}%` }} 
                  className="bg-orange-500" 
                  title="Gordos" 
                />
                <div 
                  style={{ width: `${Math.min(100, (finalShrinkage / (numInput || 1)) * 100)}%` }} 
                  className="bg-slate-400" 
                  title="Merma" 
                />
              </div>

              <div className="grid grid-cols-2 text-xs pt-1 border-t border-slate-700/60">
                <div>
                  <span className="text-slate-400 text-[11px]">Total Insumo:</span>
                  <p className="font-bold text-white text-sm">{numInput.toFixed(2)} Kg</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Suma Salidas:</span>
                  <p className="font-bold text-white text-sm">{sumOutputs.toFixed(2)} Kg</p>
                </div>
              </div>

              {numInput > 0 && (
                <div className={`p-2 rounded-xl text-xs font-medium flex items-center justify-between ${
                  Math.abs(balanceDifference) < 0.1 
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-600/30' 
                    : 'bg-amber-950/70 text-amber-300 border border-amber-600/30'
                }`}>
                  <span>Diferencia de Balance:</span>
                  <strong className="text-sm">
                    {balanceDifference === 0 ? '0.00 Kg (Cuadrado)' : `${balanceDifference > 0 ? '+' : ''}${balanceDifference.toFixed(2)} Kg`}
                  </strong>
                </div>
              )}
            </div>

            {/* Notas del Operario */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Observaciones del Operario (Opcional)</span>
              </label>
              <textarea
                rows={2}
                value={operatorNotes}
                onChange={(e) => setOperatorNotes(e.target.value)}
                placeholder="Ej. Proceso realizado sin novedades, grasa estándar."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* BOTÓN FINALIZAR ORDEN */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white font-black text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Guardar y Finalizar Proceso</span>
                </>
              )}
            </button>

          </form>

        </div>
      )}
      </>
      )}

    </div>
  );
}
