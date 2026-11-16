import React, { useState } from 'react';
import { X, UserPlus, Mail, Lock, Phone, Briefcase, ShieldCheck, User } from 'lucide-react';
import { createOperator } from '../services/firebase';

export default function NewOperatorModal({ isOpen, onClose, selectedCompany }) {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('Operario de Desposte');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      alert('Por favor ingresa nombre y correo del operario.');
      return;
    }

    if (password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      await createOperator({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        phone: phone.trim(),
        position,
        companyId: selectedCompany ? selectedCompany.id : null,
        companyName: selectedCompany ? selectedCompany.name : null
      });

      alert(`¡Operario ${name} creado con éxito!\nCredenciales para celular:\nCorreo: ${email}\nContraseña: ${password}`);
      onClose();
    } catch (err) {
      alert('Error creando operario: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between p-6 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Registrar Nuevo Operario</h2>
              <p className="text-xs text-slate-400">
                {selectedCompany 
                  ? `Para la empresa: ${selectedCompany.name}` 
                  : 'Crear acceso para que el operario ingrese desde el celular'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre Completo del Operario *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Carlos Gómez"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Cargo / Especialidad */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Cargo / Puesto en Planta *
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Operario de Desposte">Operario de Desposte</option>
                <option value="Pesador de Planta">Pesador de Planta y Rendimientos</option>
                <option value="Porcionado y Empaque">Porcionado y Empaque al Vacío</option>
                <option value="Encargado de Inventario Físico">Encargado de Inventario Físico</option>
                <option value="Operario General de Producción">Operario General de Producción</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Correo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correo de Acceso para Celular *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="carlos@planta.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contraseña Asignada *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Teléfono / WhatsApp (Opcional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+57 300 123 4567"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Este operario podrá iniciar sesión en la aplicación desde cualquier celular con su correo y contraseña. Accederá automáticamente al <strong>Modo Lite</strong> para ejecutar sus procesos y tomar conteos físicos.
            </p>
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
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {loading ? 'Creando Operario...' : 'Guardar y Habilitar Acceso'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
