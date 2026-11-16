import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Plus, 
  ShieldCheck, 
  Edit3, 
  CreditCard, 
  Check, 
  Smartphone, 
  Trash2, 
  Users, 
  KeyRound, 
  Eye, 
  EyeOff,
  Hash,
  Calendar,
  Clock,
  RotateCcw
} from 'lucide-react';
import { 
  createCompany, 
  updateCompany, 
  registerWithEmailPassword, 
  generateCompanyCode,
  batchSaveOperatorsForCompany 
} from '../services/firebase';
import { 
  calculateContractEndDate, 
  getContractStatusInfo,
  formatContractDate 
} from '../utils/contractUtils';

export default function NewCompanyModal({ 
  isOpen, 
  onClose, 
  companyToEdit = null,
  existingOperators = []
}) {
  if (!isOpen) return null;

  const isEditing = Boolean(companyToEdit);

  // Estados de la Empresa
  const [name, setName] = useState('');
  const [nit, setNit] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [billingModel, setBillingModel] = useState('Mensual');
  const [contractStartDate, setContractStartDate] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');
  const [status, setStatus] = useState('Activa');
  const [masterPassword, setMasterPassword] = useState('123456');
  const [showMasterPassword, setShowMasterPassword] = useState(false);

  // Estados de los Operarios de Planta vinculados a la Empresa
  const [operatorsList, setOperatorsList] = useState([]);
  const [removedOperatorIds, setRemovedOperatorIds] = useState([]);
  const [newOpName, setNewOpName] = useState('');
  const [newOpPassword, setNewOpPassword] = useState('1234');
  const [showOpPassword, setShowOpPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  // Inicializar o resetear datos al abrir el modal o cambiar la empresa seleccionada
  useEffect(() => {
    if (companyToEdit) {
      setName(companyToEdit.name || '');
      setNit(companyToEdit.nit || '');
      setCity(companyToEdit.city || '');
      setAddress(companyToEdit.address || '');
      setCompanyCode(companyToEdit.code || companyToEdit.companyCode || generateCompanyCode(companyToEdit.name));
      setEmail(companyToEdit.email || '');
      setPhone(companyToEdit.phone || '');
      const initialModel = companyToEdit.billingModel || 
        (companyToEdit.plan?.includes('Trimestral') ? 'Trimestral' :
         companyToEdit.plan?.includes('Semestral') ? 'Semestral' :
         companyToEdit.plan?.includes('Anual') ? 'Anual' : 'Mensual');
      setBillingModel(initialModel);
      
      const today = new Date().toISOString().split('T')[0];
      const initialStart = companyToEdit.contractStartDate || companyToEdit.createdAt?.split('T')[0] || today;
      setContractStartDate(initialStart);
      setContractEndDate(
        companyToEdit.contractEndDate || 
        calculateContractEndDate(initialStart, initialModel)
      );

      setStatus(companyToEdit.status || 'Activa');
      setMasterPassword(companyToEdit.initialPassword || '123456');

      // Cargar operarios vinculados a esta empresa
      const matchingOps = (existingOperators || []).filter(op => 
        op.companyId === companyToEdit.id ||
        (op.companyCode && op.companyCode.toUpperCase() === (companyToEdit.code || companyToEdit.companyCode || '').toUpperCase()) ||
        (op.companyName && op.companyName.toLowerCase() === (companyToEdit.name || '').toLowerCase())
      );
      setOperatorsList(matchingOps.map(op => ({
        id: op.id,
        name: op.name,
        password: op.password || '1234',
        position: op.position || 'Operario de Planta'
      })));
      setRemovedOperatorIds([]);
    } else {
      setName('');
      setNit('');
      setCity('');
      setAddress('');
      setCompanyCode('');
      setEmail('');
      setPhone('');
      setBillingModel('Mensual');
      
      const today = new Date().toISOString().split('T')[0];
      setContractStartDate(today);
      setContractEndDate(calculateContractEndDate(today, 'Mensual'));

      setStatus('Activa');
      setMasterPassword('123456');
      setOperatorsList([
        { id: 'temp_1', name: 'Operario Planta 1', password: '1234', position: 'Operario de Planta' }
      ]);
      setRemovedOperatorIds([]);
    }
    setNewOpName('');
    setNewOpPassword('1234');
  }, [companyToEdit, isOpen]);

  // Generar código automático cuando el usuario escribe el nombre y el código está vacío o es por defecto
  const handleNameChange = (val) => {
    setName(val);
    if (!isEditing && (!companyCode || companyCode.startsWith('EMP-'))) {
      setCompanyCode(generateCompanyCode(val));
    }
  };

  // Cambiar modelo de cobro y recalcular automáticamente fecha de vencimiento
  const handleSelectBillingModel = (modelId) => {
    setBillingModel(modelId);
    const baseStart = contractStartDate || new Date().toISOString().split('T')[0];
    setContractEndDate(calculateContractEndDate(baseStart, modelId));
  };

  // Cambiar fecha de inicio del contrato
  const handleStartDateChange = (newStart) => {
    setContractStartDate(newStart);
    if (newStart) {
      setContractEndDate(calculateContractEndDate(newStart, billingModel));
    }
  };

  // Acción de Renovación Rápida
  const handleQuickRenew = () => {
    const today = new Date().toISOString().split('T')[0];
    const baseDate = (contractEndDate && contractEndDate >= today) ? contractEndDate : today;
    const newEnd = calculateContractEndDate(baseDate, billingModel);
    setContractStartDate(baseDate);
    setContractEndDate(newEnd);
  };

  // Opciones de Facturación
  const BILLING_OPTIONS = [
    { id: 'Mensual', label: 'Mensual', desc: 'Mes a mes' },
    { id: 'Trimestral', label: 'Trimestral', desc: 'Cada 3 meses' },
    { id: 'Semestral', label: 'Semestral', desc: 'Cada 6 meses' },
    { id: 'Anual', label: 'Anual', desc: 'Anual' }
  ];

  // Agregar Operario a la lista local
  const handleAddOperator = (e) => {
    e.preventDefault();
    if (!newOpName.trim()) {
      alert('Ingresa el nombre del operario.');
      return;
    }
    const newEntry = {
      id: `temp_${Date.now()}`,
      name: newOpName.trim(),
      password: (newOpPassword || '1234').trim(),
      position: 'Operario de Planta'
    };
    setOperatorsList([...operatorsList, newEntry]);
    setNewOpName('');
    setNewOpPassword('1234');
  };

  // Quitar Operario de la lista
  const handleRemoveOperator = (opId) => {
    if (confirm('¿Deseas remover este operario?')) {
      if (!String(opId).startsWith('temp_')) {
        setRemovedOperatorIds(prev => [...prev, opId]);
      }
      setOperatorsList(operatorsList.filter(o => o.id !== opId));
    }
  };

  // Guardar Empresa y Operarios
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor ingresa el nombre de la empresa.');
      return;
    }
    if (!email.trim()) {
      alert('Por favor ingresa el correo del usuario Master.');
      return;
    }

    const finalCode = (companyCode || generateCompanyCode(name)).trim().toUpperCase();

    try {
      setLoading(true);

      let savedCompanyId = null;

      const safeStart = contractStartDate || new Date().toISOString().split('T')[0];
      const safeEnd = contractEndDate || calculateContractEndDate(safeStart, billingModel);

      if (isEditing) {
        savedCompanyId = companyToEdit.id;
        await updateCompany(savedCompanyId, {
          name: name.trim(),
          nit: nit.trim() || '901.000.000-1',
          city: city.trim() || 'Colombia',
          address: address.trim() || 'Sede Principal',
          code: finalCode,
          companyCode: finalCode,
          email: email.trim().toLowerCase(),
          password: masterPassword,
          initialPassword: masterPassword,
          phone: phone.trim() || '+57 300 000 0000',
          billingModel,
          contractStartDate: safeStart,
          contractEndDate: safeEnd,
          plan: `Cobro ${billingModel}`,
          status
        });
      } else {
        const created = await createCompany({
          name: name.trim(),
          nit: nit.trim() || '901.000.000-1',
          city: city.trim() || 'Colombia',
          address: address.trim() || 'Sede Principal',
          code: finalCode,
          companyCode: finalCode,
          email: email.trim().toLowerCase(),
          password: masterPassword,
          initialPassword: masterPassword,
          phone: phone.trim() || '+57 300 000 0000',
          billingModel,
          contractStartDate: safeStart,
          contractEndDate: safeEnd,
          plan: `Cobro ${billingModel}`,
          status: 'Activa',
          ordersCount: 0,
          totalInputKg: 0,
          avgYield: 0
        });
        savedCompanyId = created.id;

        // Crear credencial de acceso Master Web
        if (masterPassword && masterPassword.length >= 6) {
          try {
            await registerWithEmailPassword(email, masterPassword, name, name, 'company_master');
          } catch (authErr) {
            console.warn('Usuario Master ya existente o aviso creando Auth:', authErr);
          }
        }
      }

      // Guardar / sincronizar los operarios creados en esta empresa
      if (savedCompanyId) {
        await batchSaveOperatorsForCompany(
          savedCompanyId,
          name.trim(),
          finalCode,
          operatorsList,
          removedOperatorIds
        );
      }

      onClose();
    } catch (err) {
      alert(`Error ${isEditing ? 'actualizando' : 'creando'} la empresa: ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Cabecera Superior Fija */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#03221a] text-white border-b border-emerald-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-400/30 flex items-center justify-center text-[#00df82]">
              {isEditing ? <Edit3 className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  {isEditing ? 'Editar Empresa y Usuarios' : 'Registrar Nueva Empresa & Usuarios'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#00df82] border border-emerald-500/30">
                  {isEditing ? 'Actualización' : 'Cliente Nuevo'}
                </span>
              </div>
              <p className="text-xs text-emerald-300/80">
                Configura los datos del cliente, su acceso Master web y sus operarios para celular.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Formulario con 2 Columnas Limpias */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* ================= COLUMNA 1: DATOS DE LA EMPRESA & FACTURACIÓN ================= */}
            <div className="space-y-4">
              
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  1. Perfil de la Empresa
                </h3>
              </div>

              {/* Nombre de la Empresa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre de la Empresa o Frigorífico *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ej. Siga La Granja S.A.S."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              {/* NIT y Ciudad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIT / Identificación
                  </label>
                  <input
                    type="text"
                    value={nit}
                    onChange={(e) => setNit(e.target.value)}
                    placeholder="901.456.789-0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ciudad / Municipio
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ej. Cali, Valle"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Dirección de la Empresa / Planta */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dirección Corporativa / Sede de Planta
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej. Carrera 15 # 45-20, Zona Industrial"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Código de Empresa para Celulares */}
              <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Código de Empresa para Celulares *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCompanyCode(generateCompanyCode(name))}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline"
                  >
                    Generar otro
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Hash className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={companyCode}
                      onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                      placeholder="SLG-101"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-emerald-300 rounded-xl font-mono font-black text-sm text-emerald-900 uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-white px-2.5 py-2 rounded-xl border border-emerald-200">
                    Móvil
                  </span>
                </div>
                <p className="text-[10px] text-emerald-800/80 mt-1.5 leading-relaxed">
                  Los operarios digitarán este código en el celular para desplegar la lista de sus nombres.
                </p>
              </div>

              {/* Modelo de Cobro */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Modelo de Cobro del Servicio *</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-normal">Facturación</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {BILLING_OPTIONS.map((opt) => {
                    const isSelected = billingModel === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectBillingModel(opt.id)}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{opt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vigencia del Contrato y Renovaciones */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Vigencia del Contrato *
                    </span>
                  </div>
                  {/* Badge de Estado del Contrato */}
                  {contractEndDate && (() => {
                    const statusInfo = getContractStatusInfo(contractEndDate);
                    return (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.badgeColor}`}>
                        {statusInfo.label}
                      </span>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Fecha de Inicio *
                    </label>
                    <input
                      type="date"
                      value={contractStartDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Fecha de Terminación *
                    </label>
                    <input
                      type="date"
                      value={contractEndDate}
                      onChange={(e) => setContractEndDate(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Acciones de Renovación Rápida */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/70 text-[11px]">
                  <span className="text-slate-500 text-[10px]">
                    Ciclo: <strong className="text-slate-700">{billingModel}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleQuickRenew}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100/70 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-300 transition"
                    title={`Extender un ciclo ${billingModel} a partir de la fecha de vencimiento`}
                  >
                    <RotateCcw className="w-3 h-3 text-emerald-700" />
                    <span>Renovar (+1 ciclo {billingModel})</span>
                  </button>
                </div>
              </div>

              {/* Estado (Si está editando) */}
              {isEditing && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estado de la Empresa
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Activa">Activa</option>
                    <option value="Inactiva">Inactiva</option>
                    <option value="Suspendida">Suspendida</option>
                  </select>
                </div>
              )}

            </div>

            {/* ================= COLUMNA 2: ACCESO MASTER & OPERARIOS DE PLANTA ================= */}
            <div className="space-y-4">
              
              {/* Acceso Master Web */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      2. Acceso Master Web (Gerencia / Planta)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Gestión Total
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico Master *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="gerencia@empresa.com"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contraseña Master Web *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showMasterPassword ? 'text' : 'password'}
                        value={masterPassword}
                        onChange={(e) => setMasterPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowMasterPassword(!showMasterPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showMasterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Teléfono / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+57 310 123 4567"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 italic">
                  Desde este acceso se cargan recetas, procesos estándar, inventarios valorizados y se gestionan los pedidos.
                </p>
              </div>

              {/* Operarios de Planta para Celulares */}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200/80 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-700" />
                    <h3 className="text-xs font-black text-blue-950 uppercase tracking-wider">
                      3. Operarios para Celular (Móvil Lite)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                    {operatorsList.length} Operario(s)
                  </span>
                </div>

                <p className="text-[10px] text-blue-900 leading-snug">
                  Crea los operarios únicamente con su <strong>Nombre</strong> y <strong>Contraseña</strong>. Al entrar desde el celular elegirán su nombre en la lista.
                </p>

                {/* Formulario Inline para agregar operario */}
                <div className="p-2.5 bg-white rounded-xl border border-blue-200 shadow-sm space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Nombre del Operario *
                      </label>
                      <input
                        type="text"
                        value={newOpName}
                        onChange={(e) => setNewOpName(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[10px] font-bold text-slate-600">
                          Contraseña o PIN *
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowOpPassword(!showOpPassword)}
                          className="text-[9px] text-blue-600 font-bold"
                        >
                          {showOpPassword ? 'Ocultar' : 'Ver'}
                        </button>
                      </div>
                      <input
                        type={showOpPassword ? 'text' : 'password'}
                        value={newOpPassword}
                        onChange={(e) => setNewOpPassword(e.target.value)}
                        placeholder="1234"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddOperator}
                    className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Agregar Operario a la Empresa</span>
                  </button>
                </div>

                {/* Lista de operarios cargados */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {operatorsList.length === 0 ? (
                    <div className="p-3 bg-white/70 border border-dashed border-blue-200 rounded-xl text-center text-xs text-slate-400">
                      No hay operarios agregados aún. Escribe el nombre y contraseña arriba.
                    </div>
                  ) : (
                    operatorsList.map((op, idx) => (
                      <div
                        key={op.id || idx}
                        className="flex items-center justify-between p-2 bg-white rounded-xl border border-blue-100 shadow-xs text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {op.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{op.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              PIN: <span className="font-bold text-blue-700">{op.password}</span>
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveOperator(op.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                          title="Eliminar operario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

              </div>

            </div>

          </div>

          {/* Barra de Acciones Fija Inferior */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <p className="text-[11px] text-slate-400">
              * Todos los campos marcados son obligatorios.
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {loading 
                  ? (isEditing ? 'Guardando Cambios...' : 'Creando Empresa...') 
                  : (isEditing ? 'Guardar Cambios' : 'Crear y Habilitar Empresa')}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
