// Utilidades para cálculo de fechas y estado de contratos de empresas

export const calculateContractEndDate = (startDateStr, model = 'Mensual') => {
  if (!startDateStr) return '';
  const d = new Date(startDateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  
  if (model === 'Trimestral') {
    d.setMonth(d.getMonth() + 3);
  } else if (model === 'Semestral') {
    d.setMonth(d.getMonth() + 6);
  } else if (model === 'Anual') {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    // Mensual por defecto (1 mes)
    d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString().split('T')[0];
};

export const getContractStatusInfo = (endDateStr) => {
  if (!endDateStr) {
    return {
      status: 'Indefinido',
      daysLeft: null,
      label: 'Sin fecha de vencimiento',
      badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
      isExpired: false,
      isNearExpiring: false
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr + 'T00:00:00');
  
  if (isNaN(end.getTime())) {
    return {
      status: 'Indefinido',
      daysLeft: null,
      label: 'Fecha no válida',
      badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
      isExpired: false,
      isNearExpiring: false
    };
  }

  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'Vencido',
      daysLeft: diffDays,
      label: `Vencido hace ${Math.abs(diffDays)} d`,
      badgeColor: 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-500/20',
      isExpired: true,
      isNearExpiring: false
    };
  } else if (diffDays <= 7) {
    return {
      status: 'Por vencer',
      daysLeft: diffDays,
      label: diffDays === 0 ? 'Vence hoy' : `Vence en ${diffDays} d`,
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-500/20',
      isExpired: false,
      isNearExpiring: true
    };
  } else {
    return {
      status: 'Vigente',
      daysLeft: diffDays,
      label: `Vigente (${diffDays} d)`,
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      isExpired: false,
      isNearExpiring: false
    };
  }
};

export const formatContractDate = (dateStr) => {
  if (!dateStr) return 'N/D';
  try {
    const [year, month, day] = dateStr.split('T')[0].split('-');
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
};
