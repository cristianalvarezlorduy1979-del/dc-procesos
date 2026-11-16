import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Trash2, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  User, 
  Scale, 
  Package, 
  FileText, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  ShieldAlert,
  MessageCircle
} from 'lucide-react';
import { saveWasteReport } from '../services/firebase';
import { shareWasteReportToWhatsApp } from '../utils/whatsappShare';

const REASON_PRESETS = [
  'Caída al suelo / Contaminación física',
  'Vencimiento / Descomposición / Mal olor',
  'Error en corte / desposte / porcionado',
  'Pérdida de cadena de frío / temperatura inadecuada',
  'Rotura o defecto en empaque al vacío',
  'Quemadura severa por congelación',
  'Defecto de proveedor / hematoma / hueso astillado',
  'Merma excesiva no recuperable',
  'Otro motivo (especificar en notas)'
];

const UNIT_OPTIONS = ['Kg', 'g', 'L', 'Und', 'Porciones', 'Cajas'];

export default function NewWasteReportModal({ 
  isOpen, 
  onClose, 
  selectedCompany, 
  operators = [], 
  inventoryItems = [],
  currentUser,
  onReportCreated 
}) {
  const [itemName, setItemName] = useState('');
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [itemType, setItemType] = useState('Insumo Cárnico');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Kg');
  const [reason, setReason] = useState(REASON_PRESETS[0]);
  const [customReason, setCustomReason] = useState('');
  const [responsible, setResponsible] = useState('');
  const [operatorRole, setOperatorRole] = useState('');
  const [notes, setNotes] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedReport, setSavedReport] = useState(null);
  const [isSharing, setIsSharing] = useState(false);

  // Fecha y hora actual
  const [currentDateTime, setCurrentDateTime] = useState({
    dateStr: new Date().toISOString().split('T')[0],
    timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  });

  const fileInputCameraRef = useRef(null);
  const fileInputGalleryRef = useRef(null);

  // Actualizar hora cada minuto mientras el modal esté abierto
  useEffect(() => {
    if (!isOpen) return;
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime({
        dateStr: now.toISOString().split('T')[0],
        timeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Inicializar responsable con usuario actual o primer operario
  useEffect(() => {
    if (isOpen) {
      if (currentUser?.displayName) {
        setResponsible(currentUser.displayName);
        setOperatorRole(currentUser.role || 'Operario de Planta');
      } else if (currentUser?.email) {
        setResponsible(currentUser.email);
        setOperatorRole('Operario');
      } else if (operators.length > 0) {
        setResponsible(operators[0].name);
        setOperatorRole(operators[0].role || 'Operario');
      } else {
        setResponsible('');
        setOperatorRole('');
      }
      setErrorMsg('');
      setSavedReport(null);
      setPhotoDataUrl(null);
      setQuantity('');
      setItemName('');
      setSelectedInventoryId('');
      setNotes('');
    }
  }, [isOpen, currentUser, operators]);

  if (!isOpen) return null;

  const companyName = selectedCompany?.name || currentUser?.companyName || 'DC Procesos';

  // Manejo de selección de insumo del catálogo
  const handleSelectInventoryItem = (e) => {
    const invId = e.target.value;
    setSelectedInventoryId(invId);
    if (!invId) {
      return;
    }
    const found = inventoryItems.find(i => (i.id || i.code) === invId);
    if (found) {
      setItemName(found.name);
      setItemType(found.category || 'Insumo Cárnico');
      if (found.unit) setUnit(found.unit);
    }
  };

  // Función de estampado pericial en Canvas
  const stampPhotoWatermark = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Redimensionar para alta fidelidad pero peso optimizado (máx. 1200px)
          const maxWidth = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          // 1. Dibujar imagen de la cámara/galería
          ctx.drawImage(img, 0, 0, width, height);

          // 2. Franja de marca de agua compacta (Solo Fecha, Hora y Empresa)
          const barHeight = Math.max(54, Math.round(height * 0.09));
          
          // Fondo oscuro semitransparente elegante
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(0, height - barHeight, width, barHeight);

          // Línea superior decorativa esmeralda
          ctx.fillStyle = '#10b981';
          ctx.fillRect(0, height - barHeight, width, 3);

          // Tamaños de fuente proporcionales
          const fontLg = Math.max(16, Math.round(barHeight * 0.38));
          const fontSm = Math.max(12, Math.round(barHeight * 0.26));

          const currentNow = new Date();
          const stampDate = currentNow.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
          const stampTime = currentNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

          // Línea 1: Fecha y Hora estampada (amarillo pericial)
          ctx.font = `bold ${fontLg}px sans-serif`;
          ctx.fillStyle = '#fbbf24';
          ctx.fillText(`📅 FECHA: ${stampDate}   ⏰ HORA: ${stampTime}`, 20, height - barHeight + fontLg + 8);

          // Línea 2: Empresa y Responsable
          const opDisplay = responsible || currentUser?.displayName || currentUser?.email || 'Planta Operativa';
          ctx.font = `600 ${fontSm}px sans-serif`;
          ctx.fillStyle = '#f1f5f9';
          ctx.fillText(`🏢 ${companyName}   |   👤 ${opDisplay}`, 20, height - 9);

          // Convertir a JPEG comprimido
          const stampedUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(stampedUrl);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Manejo de subida de archivo / captura de cámara
  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingPhoto(true);
      setErrorMsg('');
      const stamped = await stampPhotoWatermark(file);
      setPhotoDataUrl(stamped);
    } catch (err) {
      console.error('Error procesando foto:', err);
      setErrorMsg('No se pudo procesar la foto tomada. Por favor intenta de nuevo.');
    } finally {
      setIsProcessingPhoto(false);
      // Limpiar inputs de archivo
      if (fileInputCameraRef.current) fileInputCameraRef.current.value = '';
      if (fileInputGalleryRef.current) fileInputGalleryRef.current.value = '';
    }
  };

  // Guardar reporte de baja
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!photoDataUrl) {
      setErrorMsg('⚠️ Es OBLIGATORIO tomar o subir la foto de prueba del desperdicio para respaldar la baja.');
      return;
    }

    const finalItemName = itemName.trim();
    if (!finalItemName) {
      setErrorMsg('Por favor indica el insumo o producto que se va a dar de baja.');
      return;
    }

    const numQty = parseFloat(quantity);
    if (!numQty || numQty <= 0) {
      setErrorMsg('Por favor ingresa una cantidad válida mayor a 0.');
      return;
    }

    const finalReason = reason === 'Otro motivo (especificar en notas)'
      ? (customReason.trim() || 'Otro motivo')
      : reason;

    const finalResponsible = responsible.trim() || currentUser?.displayName || currentUser?.email || 'Operario';

    // Costo estimado si coincide con insumo de inventario
    let costEst = 0;
    if (selectedInventoryId) {
      const inv = inventoryItems.find(i => (i.id || i.code) === selectedInventoryId);
      if (inv?.unitCost) {
        costEst = Number((numQty * inv.unitCost).toFixed(2));
      }
    }

    try {
      setIsSubmitting(true);

      const created = await saveWasteReport({
        itemName: finalItemName,
        itemType,
        quantity: numQty,
        unit,
        reason: finalReason,
        responsible: finalResponsible,
        operatorRole,
        date: currentDateTime.dateStr,
        time: currentDateTime.timeStr,
        notes: notes.trim(),
        photoUrl: photoDataUrl,
        costEstimated: costEst,
        companyId: selectedCompany?.id || currentUser?.companyId || null,
        companyName: companyName
      });

      if (onReportCreated) onReportCreated(created);
      setSavedReport(created);
    } catch (err) {
      setErrorMsg('Error al guardar el reporte: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enviar reporte y foto a WhatsApp
  const handleShareWhatsApp = async () => {
    if (!savedReport) return;
    try {
      setIsSharing(true);
      const targetPhone = selectedCompany?.phone || selectedCompany?.whatsapp || '';
      await shareWasteReportToWhatsApp(savedReport, targetPhone);
    } catch (e) {
      console.error('Error al compartir por WhatsApp:', e);
    } finally {
      setIsSharing(false);
    }
  };

  const handleFinishAndClose = () => {
    setSavedReport(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabecera del Modal */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-inner">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                Reportar Baja o Desperdicio
              </h3>
              <p className="text-xs text-rose-100 flex items-center gap-1.5 mt-0.5">
                <span>{companyName}</span>
                <span>•</span>
                <span className="font-mono text-amber-200">Foto con Fecha y Hora Obligatoria</span>
              </p>
            </div>
          </div>
          <button
            onClick={savedReport ? handleFinishAndClose : onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pantalla Posterior a Guardar: Éxito y Compartir por WhatsApp */}
        {savedReport ? (
          <div className="p-6 sm:p-8 text-center space-y-6 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest block">
                ¡Baja Registrada en el Sistema!
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Reporte Guardado Exitosamente
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
                La baja y su fotografía con sello pericial (fecha y hora) ya están en el sistema. Puedes enviarla de inmediato a WhatsApp de gerencia o supervisión.
              </p>
            </div>

            {/* Tarjeta de Resumen con la Foto */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-left max-w-md mx-auto space-y-3">
              <div className="flex items-center gap-3">
                {savedReport.photoUrl && (
                  <img 
                    src={savedReport.photoUrl} 
                    alt="Evidencia" 
                    className="w-16 h-16 rounded-xl object-cover border border-slate-300 shadow-2xs shrink-0" 
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-black text-slate-900 truncate">
                    {savedReport.itemName}
                  </h4>
                  <p className="text-xs font-bold text-rose-600">
                    {savedReport.quantity} {savedReport.unit}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    ⚠️ {savedReport.reason}
                  </p>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 border-t border-slate-200 pt-2 flex items-center justify-between">
                <span>👤 {savedReport.responsible}</span>
                <span>📅 {savedReport.date} • {savedReport.time}</span>
              </div>
            </div>

            {/* Acciones WhatsApp */}
            <div className="space-y-2.5 max-w-md mx-auto pt-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                disabled={isSharing}
                className="w-full py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.99] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
                <span>{isSharing ? 'Abriendo WhatsApp...' : '📲 Enviar Foto y Reporte a WhatsApp'}</span>
              </button>

              <button
                type="button"
                onClick={handleFinishAndClose}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Listo, volver a la plataforma
              </button>
            </div>
          </div>
        ) : (
          /* Cuerpo del Formulario */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECCIÓN FOTO DE PRUEBA PERICIAL (OBLIGATORIA)           */}
          {/* ======================================================== */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-rose-50/30 border-2 border-dashed border-rose-300 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-rose-600" />
                <span className="font-black text-slate-800 text-xs uppercase tracking-wider">
                  Foto de Prueba de la Baja *
                </span>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                Sello Fecha/Hora Automático
              </span>
            </div>

            {/* Hidden File Inputs */}
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputCameraRef} 
              onChange={handlePhotoCapture} 
              className="hidden" 
            />
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputGalleryRef} 
              onChange={handlePhotoCapture} 
              className="hidden" 
            />

            {/* Vista previa de la foto con su sello */}
            {photoDataUrl ? (
              <div className="space-y-2">
                <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-md max-h-64 sm:max-h-72 bg-slate-900 flex items-center justify-center">
                  <img 
                    src={photoDataUrl} 
                    alt="Evidencia de baja con sello" 
                    className="w-full h-auto object-contain max-h-64 sm:max-h-72" 
                  />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPhotoDataUrl(null)}
                      className="px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-rose-600 text-white text-[11px] font-bold backdrop-blur-xs flex items-center gap-1 shadow-sm transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Repetir Foto</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Foto sellada con fecha, hora y datos periciales
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputCameraRef.current?.click()}
                    className="text-rose-600 hover:text-rose-800 font-bold underline"
                  >
                    Tomar otra
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                {/* Botón Tomar Foto Directo */}
                <button
                  type="button"
                  disabled={isProcessingPhoto}
                  onClick={() => fileInputCameraRef.current?.click()}
                  className="w-full sm:flex-1 py-4 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md shadow-rose-600/20 active:scale-98 transition cursor-pointer"
                >
                  <Camera className="w-5 h-5 animate-pulse" />
                  <span>📸 Abrir Cámara y Tomar Foto</span>
                </button>

                {/* Botón Subir Archivo */}
                <button
                  type="button"
                  disabled={isProcessingPhoto}
                  onClick={() => fileInputGalleryRef.current?.click()}
                  className="w-full sm:w-auto py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Subir de Galería</span>
                </button>
              </div>
            )}

            {isProcessingPhoto && (
              <div className="py-2 flex items-center justify-center gap-2 text-rose-700 text-xs font-bold animate-pulse">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Estampando fecha, hora y sello pericial en la foto...</span>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* SELECCIÓN DE INSUMO O PRODUCTO                           */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Seleccionar Insumo del Catálogo (Opcional)
              </label>
              <select
                value={selectedInventoryId}
                onChange={handleSelectInventoryItem}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              >
                <option value="">-- Seleccionar o escribir abajo --</option>
                {inventoryItems.map((inv) => (
                  <option key={inv.id || inv.code} value={inv.id || inv.code}>
                    {inv.name} ({inv.unit || 'Kg'}) {inv.currentStock ? `- Stock: ${inv.currentStock}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre del Insumo / Producto Dado de Baja *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Lomo fino de res, Masa pizza, etc."
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* CANTIDAD, UNIDAD Y MOTIVO DE LA BAJA                    */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cantidad de la Baja o Desperdicio *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-black text-rose-700 focus:ring-2 focus:ring-rose-500 focus:outline-hidden bg-rose-50/20"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-24 px-2 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-black text-slate-800 focus:ring-2 focus:ring-rose-500"
                >
                  {UNIT_OPTIONS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tipo de Ítem
              </label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-rose-500"
              >
                <option value="Insumo Cárnico">Insumo Cárnico</option>
                <option value="Producto en Proceso">Producto en Proceso</option>
                <option value="Producto Terminado">Producto Terminado</option>
                <option value="Subproducto / Merma">Subproducto / Merma</option>
                <option value="Material de Empaque">Material de Empaque</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          {/* Motivo de la Baja */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Motivo de la Baja o Desperdicio *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50/50 focus:ring-2 focus:ring-rose-500"
            >
              {REASON_PRESETS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {reason === 'Otro motivo (especificar en notas)' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Especificar Motivo Personalizado *
              </label>
              <input
                type="text"
                required
                placeholder="Escribe el motivo detallado de la baja..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-rose-500"
              />
            </div>
          )}

          {/* ======================================================== */}
          {/* PERSONA QUE REALIZÓ LA BAJA Y FECHA/HORA                */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Persona que Realizó la Baja *
              </label>
              <div className="space-y-1">
                {operators.length > 0 && (
                  <select
                    value={responsible}
                    onChange={(e) => {
                      setResponsible(e.target.value);
                      const op = operators.find(o => o.name === e.target.value);
                      if (op?.role) setOperatorRole(op.role);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:ring-2 focus:ring-rose-500 mb-1"
                  >
                    <option value="">-- Seleccionar de la lista de operarios --</option>
                    {operators.map(op => (
                      <option key={op.id || op.name} value={op.name}>
                        {op.name} ({op.role || 'Operario'})
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  required
                  placeholder="Nombre de la persona que reporta"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fecha y Hora de la Baja (Automático)
              </label>
              <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs space-y-1 text-slate-700 font-mono">
                <div className="flex items-center gap-1.5 font-bold">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{currentDateTime.dateStr}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentDateTime.timeStr}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observaciones / Justificación de Planta
            </label>
            <textarea
              rows={2}
              placeholder="Explica qué sucedió, en qué estación ocurrió o qué acciones correctivas se tomaron..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-600 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isProcessingPhoto}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm shadow-md shadow-red-600/20 active:scale-98 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando Reporte...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Reporte de Baja</span>
                </>
              )}
            </button>
          </div>

        </form>
        )}

      </div>
    </div>
  );
}
