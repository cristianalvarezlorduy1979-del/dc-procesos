import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  Mail, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  Smartphone, 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  CreditCard, 
  Lock, 
  Eye, 
  EyeOff, 
  FileText,
  Calendar,
  Clock,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { removeCompany } from '../services/firebase';
import { getContractStatusInfo, formatContractDate } from '../utils/contractUtils';

export default function MasterCompaniesView({ 
  companies, 
  onSelectCompany, 
  onOpenNewCompanyModal,
  onEditCompany,
  onGoToGlobalProcesses 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const togglePasswordVisibility = (companyId, e) => {
    e.stopPropagation();
    setVisiblePasswords(prev => ({
      ...prev,
      [companyId]: !prev[companyId]
    }));
  };

  const filteredCompanies = companies.filter(company => {
    const term = searchTerm.toLowerCase();
    return (
      company.name?.toLowerCase().includes(term) ||
      company.nit?.toLowerCase().includes(term) ||
      company.email?.toLowerCase().includes(term) ||
      company.city?.toLowerCase().includes(term) ||
      company.code?.toLowerCase().includes(term) ||
      company.companyCode?.toLowerCase().includes(term)
    );
  });

  const handleDeleteCompany = async (companyId, companyName, e) => {
    e.stopPropagation();
    if (confirm(`¿Estás seguro de eliminar la empresa "${companyName}" de la lista?`)) {
      try {
        setDeletingId(companyId);
        await removeCompany(companyId);
        setToastMessage(`Empresa "${companyName}" eliminada con éxito.`);
        setTimeout(() => setToastMessage(''), 3000);
      } catch (err) {
        alert('Error eliminando la empresa: ' + err.message);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5">
      
      {/* Toast de Confirmación */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs sm:text-sm font-semibold animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cabecera Principal Amplia y Panorámica */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-300/80 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-black tracking-wider uppercase mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>ZONA MASTER • DC ASESORÍAS</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Zona de Empresas Creadas
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
              Administración de cuentas de clientes, contratos y accesos de usuarios de plantas productivas.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 flex items-center gap-2 shadow-2xs">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span><strong>{companies.length}</strong> Empresas</span>
            </div>
            <button
              onClick={onOpenNewCompanyModal}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Registrar Nueva Empresa</span>
            </button>
          </div>
        </div>
      </div>
        
        {/* Barra de Búsqueda Panorámica */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por empresa, NIT, correo, código móvil..."
            className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Mostrando <strong>{filteredCompanies.length}</strong> de <strong>{companies.length}</strong> empresas registradas
        </div>
      </div>

      {/* Lista de Empresas Cliente (Tabla Corporativa Panorámica) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Empresa / NIT</th>
                <th className="py-3.5 px-4">Contacto y Ubicación</th>
                <th className="py-3.5 px-4">Acceso Master</th>
                <th className="py-3.5 px-4">Contrato / Vigencia</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No se encontraron empresas</p>
                    <p className="text-[11px] text-slate-500">No hay empresas que coincidan con la búsqueda actual.</p>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => {
                  const billingLabel = company.billingModel || (company.plan ? company.plan.replace('Plan ', '').replace('Cobro ', '') : 'Mensual');
                  const passValue = company.password || company.initialPassword || '123456';
                  const isPassVisible = Boolean(visiblePasswords[company.id]);
                  const statusInfo = getContractStatusInfo(company.contractEndDate);

                  return (
                    <tr
                      key={company.id}
                      className="hover:bg-emerald-50/30 transition-colors"
                    >
                      {/* 1. Empresa / NIT */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#03221a] to-emerald-950 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                            {company.name ? company.name.charAt(0).toUpperCase() : 'E'}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 text-sm block truncate">
                              {company.name}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span>NIT: <strong className="text-slate-700">{company.nit || 'Sin NIT'}</strong></span>
                              {(company.code || company.companyCode) && (
                                <>
                                  <span>·</span>
                                  <span className="font-mono text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded text-[10px] font-bold">
                                    Cód: {company.code || company.companyCode}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Contacto y Ubicación */}
                      <td className="py-3 px-4 text-slate-600">
                        <div className="space-y-0.5 text-xs">
                          {company.email && (
                            <div className="flex items-center gap-1.5 text-slate-700 truncate max-w-[200px]" title={company.email}>
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{company.email}</span>
                            </div>
                          )}
                          {company.phone && (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{company.phone}</span>
                            </div>
                          )}
                          {(company.address || company.city) && (
                            <div className="flex items-center gap-1.5 text-slate-500 truncate max-w-[200px]" title={company.address || company.city}>
                              <span className="text-[10px]">📍</span>
                              <span className="truncate">{company.address || company.city}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 3. Acceso Master */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <code className="bg-amber-50 text-amber-900 border border-amber-200 font-mono font-bold px-1.5 py-0.5 rounded text-[11px]">
                              {isPassVisible ? passValue : '••••••••'}
                            </code>
                            <button
                              type="button"
                              onClick={(e) => togglePasswordVisibility(company.id, e)}
                              className="p-1 text-slate-400 hover:text-slate-600 transition"
                              title={isPassVisible ? 'Ocultar' : 'Ver'}
                            >
                              {isPassVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* 4. Contrato / Vigencia */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CreditCard className="w-3 h-3 text-emerald-600" />
                              <span>{billingLabel}</span>
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${statusInfo.badgeColor}`}>
                              {statusInfo.isExpired && <AlertTriangle className="w-2.5 h-2.5" />}
                              <span>{statusInfo.label}</span>
                            </span>
                          </div>
                          <div className="text-[10.5px] text-slate-500 font-mono">
                            Vence: <strong className={statusInfo.isExpired ? 'text-red-600' : 'text-slate-700'}>{formatContractDate(company.contractEndDate)}</strong>
                          </div>
                        </div>
                      </td>

                      {/* 5. Estado */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>{company.status || 'Activa'}</span>
                        </span>
                      </td>

                      {/* 6. Acciones (VER, EDITAR, ELIMINAR) */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* 1. Botón VER */}
                          <button
                            type="button"
                            onClick={() => onSelectCompany(company)}
                            title="Ver y Gestionar Empresa"
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer transition active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver</span>
                          </button>

                          {/* 2. Botón EDITAR */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onEditCompany) onEditCompany(company);
                            }}
                            title="Editar Empresa"
                            className="px-2.5 py-1.5 rounded-lg border border-sky-300 text-sky-700 bg-sky-50 hover:bg-sky-100 font-bold text-xs flex items-center gap-1 cursor-pointer transition active:scale-95"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                            <span>Editar</span>
                          </button>

                          {/* 3. Botón ELIMINAR */}
                          <button
                            type="button"
                            disabled={deletingId === company.id}
                            onClick={(e) => handleDeleteCompany(company.id, company.name, e)}
                            title="Eliminar Empresa"
                            className="px-2.5 py-1.5 rounded-lg border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-xs flex items-center gap-1 cursor-pointer transition active:scale-95 disabled:opacity-40"
                          >
                            <Trash2 className={`w-3.5 h-3.5 text-rose-600 ${deletingId === company.id ? 'animate-spin' : ''}`} />
                            <span>Eliminar</span>
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
