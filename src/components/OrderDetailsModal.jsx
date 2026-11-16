import React from 'react';
import { 
  X, 
  Printer, 
  Scale, 
  Droplet, 
  Bone, 
  Layers, 
  Flame,
  Waves,
  Scissors,
  PackageCheck, 
  Clock, 
  Calendar, 
  User, 
  FileText, 
  TrendingUp,
  CheckCircle2,
  Building2,
  UtensilsCrossed
} from 'lucide-react';

export default function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;

  const isFinished = order.status === 'Finalizado';
  const totalInput = Number(order.totalInputKg) || Number(order.estimatedInputKg) || 0;
  const finishedKg = Number(order.finishedWeightKg) || 0;
  const blood = Number(order.bloodKg) || 0;
  const bone = Number(order.boneKg) || 0;
  const fat = Number(order.fatKg) || 0;
  const evaporation = Number(order.evaporationKg) || 0;
  const draining = Number(order.drainingKg) || 0;
  const trimmings = Number(order.trimmingsKg) || 0;
  const shrinkage = Number(order.shrinkageKg) || 0;
  
  const sumOutputs = finishedKg + blood + bone + fat + evaporation + draining + trimmings + shrinkage;
  const yieldPct = order.yieldPercentage || (totalInput > 0 ? ((finishedKg / totalInput) * 100).toFixed(1) : 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 max-h-[90vh] flex flex-col print:m-0 print:p-0 print:max-w-none print:shadow-none print:border-none">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between p-6 bg-slate-900 text-white print:bg-white print:text-black print:border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white print:hidden">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30 print:border-black print:text-black">
                  {order.code}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 print:border-black print:text-black">
                  Lote: {order.batch}
                </span>
              </div>
              <h2 className="text-xl font-bold mt-1">{order.processName}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Imprimir Ficha Técnica"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Fila Informativa */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block">Fecha:</span>
              <strong className="text-slate-800">{order.targetDate || 'Hoy'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Operario:</span>
              <strong className="text-slate-800">{order.assignedTo || 'Sin asignar'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Estado:</span>
              <strong className={`${isFinished ? 'text-emerald-600' : 'text-amber-600'}`}>
                {order.status}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Rendimiento:</span>
              <strong className="text-blue-600 text-sm">{yieldPct}%</strong>
            </div>
          </div>

          {/* Tarjeta Destacada: Insumo y Producto Terminado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                <Scale className="w-4 h-4 text-blue-600" />
                Materia Prima (Insumo Tomado)
              </span>
              <div className="text-3xl font-black text-slate-900">
                {Number(order.totalInputKg || order.estimatedInputKg).toFixed(2)} <span className="text-base font-semibold text-slate-500">Kg</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {order.totalInputKg ? 'Peso verificado al iniciar proceso' : 'Insumo estimado'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                <PackageCheck className="w-4 h-4 text-emerald-600" />
                Producto Terminado Obtenido
              </span>
              <div className="text-3xl font-black text-emerald-700">
                {finishedKg.toFixed(2)} <span className="text-base font-semibold text-emerald-600">Kg</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                <span><strong>{order.finishedUnits || 0}</strong> Unidades</span>
                <span>•</span>
                <span><strong>{Number(order.finishedWeightGrams || 0).toLocaleString()}</strong> Grs</span>
              </div>
            </div>
          </div>

          {/* Control de Receta y Dosificación Real vs Planificada */}
          {Array.isArray(order.recipe) && order.recipe.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                  <span>Receta & Dosificación de Ingredientes (Planificada vs Real)</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-500 font-bold">
                  {order.recipe.length} insumos controlados
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 text-[11px] font-black uppercase">
                      <th className="py-2.5 px-3">Ingrediente / Insumo</th>
                      <th className="py-2.5 px-2 text-center">Fórmula Planificada</th>
                      <th className="py-2.5 px-2 text-center">Real Agregado</th>
                      <th className="py-2.5 px-2 text-center">Variación</th>
                      <th className="py-2.5 px-3">Observación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {order.recipe.map((ing, idx) => {
                      const planned = Number(ing.plannedQty !== undefined ? ing.plannedQty : ing.standardQty) || 0;
                      const actual = Number(ing.actualQty !== undefined ? ing.actualQty : planned) || 0;
                      const diff = Number((actual - planned).toFixed(2));

                      return (
                        <tr key={ing.id || idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{ing.name}</span>
                              {ing.isExtra && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-600 text-white">
                                  Extra en Planta
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-600 font-semibold">
                            {planned > 0 ? `${planned} ${ing.unit}` : '-'}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-black text-slate-900">
                            {actual} {ing.unit}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold">
                            {ing.isExtra ? (
                              <span className="text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded text-[11px]">
                                +{actual} {ing.unit} (Nuevo)
                              </span>
                            ) : diff > 0 ? (
                              <span className="text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded text-[11px]">
                                +{diff} {ing.unit} extra
                              </span>
                            ) : diff < 0 ? (
                              <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                {diff} {ing.unit}
                              </span>
                            ) : (
                              <span className="text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded text-[11px]">
                                Exacto
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-500 italic">
                            {ing.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Desglose de Subproductos y Desechos */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Desglose de Subproductos y Merma Registrados
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(!order.lossFields || order.lossFields.hasBlood !== false || blood > 0) && (
                <div className="p-3 bg-white border border-rose-200 rounded-xl">
                  <div className="flex items-center gap-1 text-xs text-rose-700 font-bold mb-1">
                    <Droplet className="w-3.5 h-3.5" />
                    <span>Sangre</span>
                  </div>
                  <div className="text-xl font-black text-slate-900">{blood.toFixed(2)} Kg</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {totalInput > 0 ? ((blood / totalInput) * 100).toFixed(1) : 0}% del insumo
                  </div>
                </div>
              )}

              {(!order.lossFields || order.lossFields.hasBone !== false || bone > 0) && (
                <div className="p-3 bg-white border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-1 text-xs text-amber-700 font-bold mb-1">
                    <Bone className="w-3.5 h-3.5" />
                    <span>Hueso</span>
                  </div>
                  <div className="text-xl font-black text-slate-900">{bone.toFixed(2)} Kg</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {totalInput > 0 ? ((bone / totalInput) * 100).toFixed(1) : 0}% del insumo
                  </div>
                </div>
              )}

              {(!order.lossFields || order.lossFields.hasFat !== false || fat > 0) && (
                <div className="p-3 bg-white border border-orange-200 rounded-xl">
                  <div className="flex items-center gap-1 text-xs text-orange-700 font-bold mb-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Gordos / Grasa</span>
                  </div>
                  <div className="text-xl font-black text-slate-900">{fat.toFixed(2)} Kg</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {totalInput > 0 ? ((fat / totalInput) * 100).toFixed(1) : 0}% del insumo
                  </div>
                </div>
              )}

              {(!order.lossFields || order.lossFields.hasEvaporation || evaporation > 0) && (
                <div className="p-3 bg-white border border-red-200 rounded-xl">
                  <div className="flex items-center gap-1 text-xs text-red-700 font-bold mb-1">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Evaporación/Cocción</span>
                  </div>
                  <div className="text-xl font-black text-slate-900">{evaporation.toFixed(2)} Kg</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {totalInput > 0 ? ((evaporation / totalInput) * 100).toFixed(1) : 0}% del insumo
                  </div>
                </div>
              )}

              {(!order.lossFields || order.lossFields.hasDraining || draining > 0) && (
                <div className="p-3 bg-white border border-sky-200 rounded-xl">
                  <div className="flex items-center gap-1 text-xs text-sky-700 font-bold mb-1">
                    <Waves className="w-3.5 h-3.5" />
                    <span>Drenaje / Suero</span>
                  </div>
                  <div className="text-xl font-black text-slate-900">{draining.toFixed(2)} Kg</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {totalInput > 0 ? ((draining / totalInput) * 100).toFixed(1) : 0}% del insumo
                  </div>
                </div>
              )}

              {(!order.lossFields || order.lossFields.hasTrimmings || trimmings > 0) && (
                <div className="p-3 bg-white border border-yellow-200 rounded-xl">
                  <div className="flex items-center gap-1 text-xs text-yellow-700 font-bold mb-1">
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Recortes / Retazos</span>
                  </div>
                  <div className="text-xl font-black text-slate-900">{trimmings.toFixed(2)} Kg</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {totalInput > 0 ? ((trimmings / totalInput) * 100).toFixed(1) : 0}% del insumo
                  </div>
                </div>
              )}

              {(!order.lossFields || order.lossFields.hasShrinkage !== false || shrinkage > 0) && (
                <div className="p-3 bg-white border border-slate-300 rounded-xl">
                  <div className="flex items-center gap-1 text-xs text-slate-700 font-bold mb-1">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Merma General</span>
                  </div>
                  <div className="text-xl font-black text-slate-900">{shrinkage.toFixed(2)} Kg</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {totalInput > 0 ? ((shrinkage / totalInput) * 100).toFixed(1) : 0}% del insumo
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Gráfico de Balance de Masa */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 uppercase">Balance de Masa del Proceso</span>
              <span className="font-mono text-emerald-400">
                Suma Salidas: {sumOutputs.toFixed(2)} Kg / Insumo: {totalInput.toFixed(2)} Kg
              </span>
            </div>

            <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
              <div 
                style={{ width: `${Math.min(100, (finishedKg / (totalInput || 1)) * 100)}%` }} 
                className="bg-emerald-500" 
                title={`Terminado: ${finishedKg} Kg`} 
              />
              {blood > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (blood / (totalInput || 1)) * 100)}%` }} 
                  className="bg-rose-500" 
                  title={`Sangre: ${blood} Kg`} 
                />
              )}
              {bone > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (bone / (totalInput || 1)) * 100)}%` }} 
                  className="bg-amber-500" 
                  title={`Hueso: ${bone} Kg`} 
                />
              )}
              {fat > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (fat / (totalInput || 1)) * 100)}%` }} 
                  className="bg-orange-500" 
                  title={`Gordos: ${fat} Kg`} 
                />
              )}
              {evaporation > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (evaporation / (totalInput || 1)) * 100)}%` }} 
                  className="bg-red-500" 
                  title={`Evaporación: ${evaporation} Kg`} 
                />
              )}
              {draining > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (draining / (totalInput || 1)) * 100)}%` }} 
                  className="bg-sky-500" 
                  title={`Drenaje: ${draining} Kg`} 
                />
              )}
              {trimmings > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (trimmings / (totalInput || 1)) * 100)}%` }} 
                  className="bg-yellow-500" 
                  title={`Recortes: ${trimmings} Kg`} 
                />
              )}
              {shrinkage > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (shrinkage / (totalInput || 1)) * 100)}%` }} 
                  className="bg-slate-400" 
                  title={`Merma: ${shrinkage} Kg`} 
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Terminado ({finishedKg.toFixed(1)} Kg)</div>
              {blood > 0 && <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Sangre ({blood.toFixed(1)} Kg)</div>}
              {bone > 0 && <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Hueso ({bone.toFixed(1)} Kg)</div>}
              {fat > 0 && <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Gordos ({fat.toFixed(1)} Kg)</div>}
              {evaporation > 0 && <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Evaporación ({evaporation.toFixed(1)} Kg)</div>}
              {draining > 0 && <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Drenaje ({draining.toFixed(1)} Kg)</div>}
              {trimmings > 0 && <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Recortes ({trimmings.toFixed(1)} Kg)</div>}
              {shrinkage > 0 && <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Merma ({shrinkage.toFixed(1)} Kg)</div>}
            </div>
          </div>

          {/* Observaciones del Operario */}
          {order.operatorNotes && (
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl">
              <span className="text-xs font-bold text-amber-900 block mb-1">
                Observaciones y Notas de Planta:
              </span>
              <p className="text-xs text-slate-700 italic">
                "{order.operatorNotes}"
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl"
          >
            Cerrar Ficha
          </button>
        </div>

      </div>
    </div>
  );
}
