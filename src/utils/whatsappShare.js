/**
 * Utilidad para compartir reportes de bajas y desperdicios con foto pericial a WhatsApp
 */

// Formatear texto profesional para WhatsApp
export const formatWasteReportWhatsAppMessage = (report) => {
  const company = report.companyName || 'DC Procesos';
  const roleText = report.operatorRole ? ` (${report.operatorRole})` : '';
  const notesText = report.notes ? `\n📝 *Observaciones:* ${report.notes}` : '';
  const costText = report.costEstimated > 0 ? `\n💰 *Pérdida Estimada:* $${Number(report.costEstimated).toLocaleString('es-CO')}` : '';

  return (
    `🚨 *REPORTE DE BAJA / DESPERDICIO*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🏢 *Empresa:* ${company}\n` +
    `📦 *Insumo / Ítem:* ${report.itemName}\n` +
    `⚖️ *Cantidad de Baja:* ${report.quantity} ${report.unit}\n` +
    `⚠️ *Motivo:* ${report.reason}\n` +
    `👤 *Responsable:* ${report.responsible}${roleText}\n` +
    `📅 *Fecha:* ${report.date || new Date().toISOString().split('T')[0]}\n` +
    `⏰ *Hora:* ${report.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${costText}${notesText}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📸 *Evidencia Fotográfica:* Foto pericial con sello de fecha y hora generada en sistema.\n` +
    `_DC Procesos • Control de Mermas y Rendimientos_`
  );
};

// Convierte base64 DataURL a objeto File
export const dataUrlToFile = async (dataUrl, filename = 'baja_evidencia.jpg') => {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  } catch (e) {
    console.error('Error convirtiendo imagen a archivo:', e);
    return null;
  }
};

/**
 * Comparte el reporte y la foto a WhatsApp usando Web Share API (celular)
 * o WhatsApp Web / Enlace directo (computador).
 */
export const shareWasteReportToWhatsApp = async (report, customPhone = '') => {
  const messageText = formatWasteReportWhatsAppMessage(report);
  const cleanPhone = (customPhone || '').replace(/[^0-9]/g, '');

  // 1. Intentar compartir con Web Share API (Soporta envío nativo de Foto + Texto en Celulares)
  if (report.photoUrl && typeof navigator !== 'undefined' && navigator.share) {
    try {
      const safeName = `Baja_${(report.itemName || 'item').replace(/[^a-zA-Z0-9]/g, '_')}_${report.date || 'foto'}.jpg`;
      const file = await dataUrlToFile(report.photoUrl, safeName);

      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Reporte de Baja - ${report.itemName}`,
          text: messageText,
          files: [file]
        });
        return { success: true, method: 'native_share_with_file' };
      }
    } catch (shareErr) {
      // Si el usuario canceló el selector nativo de compartir, no hacer nada
      if (shareErr.name === 'AbortError') {
        return { success: false, aborted: true };
      }
      console.warn('Web Share API con archivo no soportada o rechazada, usando enlace WhatsApp:', shareErr);
    }
  }

  // 2. Si Web Share solo soporta texto (sin archivo)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `Reporte de Baja - ${report.itemName}`,
        text: messageText
      });
      return { success: true, method: 'native_share_text_only' };
    } catch (shareErr) {
      if (shareErr.name === 'AbortError') {
        return { success: false, aborted: true };
      }
    }
  }

  // 3. Fallback: Abrir WhatsApp directamente con el texto formateado
  let waUrl = cleanPhone 
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messageText)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;

  window.open(waUrl, '_blank', 'noopener,noreferrer');
  return { success: true, method: 'whatsapp_web_link' };
};
