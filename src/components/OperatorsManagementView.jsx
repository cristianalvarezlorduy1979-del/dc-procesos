import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Smartphone, 
  Briefcase, 
  Mail, 
  Phone, 
  Trash2, 
  ShieldCheck, 
  CheckCircle2, 
  Scale, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { removeOperator, updateOperator } from '../services/firebase';

export default function OperatorsManagementView({
  operators = [],
  orders = [],
  selectedCompany,
  onOpenNewOperatorModal,
  onOpenNewOrderModal
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOperators = operators.filter(op => 
    op.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    op.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    op.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteOperator = async (operatorId, operatorName) => {
    if (confirm(`¿Estás seguro de eliminar el acceso del operario "${operatorName}"? Ya no podrá ingresar desde el celular.`)) {
      try {
        await removeOperator(operatorId);
      } catch (err) {
        alert('Error eliminando operario: ' + err.message);
      }
    }
  };

  const handleToggleActive = async (op) => {
    try {
      await updateOperator(op.id, { active: !op.active });
    } catch (err) {
      alert('Error actualizando estado: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabecera del Módulo de Operarios */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
            <Users className="w-4 h-4" />
            <span>Equipo de Planta • Enrutamiento de Procesos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Operarios Lite de Planta
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Crea y administra los usuarios operarios de tu empresa. Cada operario ingresa desde su celular en modo Lite para ejecutar los procesos que tú le enrutes y registrar tomas físicas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNewOperatorModal}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Operario</span>
          </button>
        </div>
      </div>

      {/* Buscador & Métricas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, correo o cargo..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Total Operarios Registrados:</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold font-mono">
            {operators.length}
          </span>
        </div>
      </div>

      {/* Lista / Grid de Tarjetas de Operarios */}
      {filteredOperators.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            No hay operarios registrados aún
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            Crea el primer operario de tu empresa para que pueda iniciar sesión desde su celular y recibir los procesos que le asignes.
          </p>
          <button
            onClick={onOpenNewOperatorModal}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Primer Operario</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOperators.map((op) => {
            // Contar órdenes enrutadas a este operario
            const assignedOrders = orders.filter(o => 
              o.assignedTo?.toLowerCase() === op.name?.toLowerCase() ||
              o.assignedTo?.toLowerCase() === op.email?.toLowerCase()
            );
            const pendingAssigned = assignedOrders.filter(o => o.status === 'Pendiente' || o.status === 'En Proceso').length;
            const completedAssigned = assignedOrders.filter(o => o.status === 'Finalizado').length;

            return (
              <div 
                key={op.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  
                  {/* Encabezado Tarjeta */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/20">
                        {op.name ? op.name.substring(0, 2).toUpperCase() : 'OP'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">
                          {op.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                            OPERARIO LITE
                          </span>
                          {op.code && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {op.code}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteOperator(op.id, op.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar operario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Datos del Operario */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800">{op.position || 'Operario de Planta'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-slate-600 truncate">{op.email}</span>
                    </div>

                    {op.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{op.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Estado de Enrutamiento de Procesos */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                      Procesos Enrutados a este Operario:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-white p-2 rounded-lg border border-amber-200/60 shadow-xs">
                        <span className="text-base font-black text-amber-600 block">
                          {pendingAssigned}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">Pendientes</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-emerald-200/60 shadow-xs">
                        <span className="text-base font-black text-emerald-600 block">
                          {completedAssigned}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">Finalizados</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Pie de Tarjeta */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${op.active !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <span className="text-[11px] font-semibold text-slate-600">
                      {op.active !== false ? 'Habilitado en Celular' : 'Inactivo'}
                    </span>
                  </div>

                  <button
                    onClick={onOpenNewOrderModal}
                    className="text-blue-600 hover:text-blue-800 font-bold text-[11px] flex items-center gap-1 transition"
                  >
                    <span>Enrutar Proceso</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
