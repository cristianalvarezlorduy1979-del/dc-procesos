import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Building2, 
  AlertCircle,
  MessageCircle,
  Smartphone,
  Search,
  RotateCcw,
  Users,
  ShieldCheck
} from 'lucide-react';
import DCLogo from './DCLogo';
import { 
  loginWithEmailPassword, 
  getCompanyAndOperatorsByCode,
  loginOperatorByNameAndPassword
} from '../services/firebase';
import { executeRecaptcha } from '../utils/recaptcha';
import { APP_VERSION } from '../utils/version';

export default function WelcomeAuthModal() {
  // ================= ESTADOS PARA MASTER EMPRESA (ESCRITORIO / WEB) =================
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showMasterPassword, setShowMasterPassword] = useState(false);

  // ================= ESTADOS PARA OPERARIO CELULAR (MÓVIL LITE) =================
  const [companyCodeInput, setCompanyCodeInput] = useState(() => {
    return localStorage.getItem('dc_last_company_code') || '';
  });
  const [verifiedCompany, setVerifiedCompany] = useState(null);
  const [companyOperators, setCompanyOperators] = useState([]);
  const [selectedOperatorId, setSelectedOperatorId] = useState('');
  const [operatorPassword, setOperatorPassword] = useState('');
  const [showOpPassword, setShowOpPassword] = useState(false);
  const [checkingCompany, setCheckingCompany] = useState(false);

  // ================= ESTADOS GENERALES =================
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Intentar cargar automáticamente la empresa en celulares si ya se guardó un código previo
  useEffect(() => {
    const savedCode = localStorage.getItem('dc_last_company_code');
    if (savedCode && !verifiedCompany) {
      handleSearchCompany(savedCode, true);
    }
  }, []);

  // Buscar empresa por código para el operario móvil
  const handleSearchCompany = async (codeToSearch, isSilent = false) => {
    const targetCode = (codeToSearch || companyCodeInput || '').trim();
    if (!targetCode) {
      if (!isSilent) setErrorMessage('Por favor escribe el código de tu empresa.');
      return;
    }

    try {
      setCheckingCompany(true);
      if (!isSilent) setErrorMessage('');
      const result = await getCompanyAndOperatorsByCode(targetCode);
      setVerifiedCompany(result.company);
      setCompanyOperators(result.operators || []);
      if (result.operators && result.operators.length > 0) {
        setSelectedOperatorId(result.operators[0].id);
      } else {
        setSelectedOperatorId('');
      }
    } catch (err) {
      if (!isSilent) {
        setErrorMessage(err.message || 'No se encontró la empresa. Verifica el código.');
      }
      setVerifiedCompany(null);
      setCompanyOperators([]);
      setSelectedOperatorId('');
    } finally {
      setCheckingCompany(false);
    }
  };

  // Cambiar empresa en el celular
  const handleChangeCompany = () => {
    setVerifiedCompany(null);
    setCompanyOperators([]);
    setSelectedOperatorId('');
    setOperatorPassword('');
    localStorage.removeItem('dc_last_company_code');
  };

  // ================= ENVÍO OPERARIO MÓVIL (CELULAR) =================
  const handleOperatorSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!verifiedCompany) {
      await handleSearchCompany(companyCodeInput);
      return;
    }

    if (!selectedOperatorId) {
      setErrorMessage('Por favor selecciona tu nombre en la lista de operarios.');
      return;
    }

    if (!operatorPassword.trim()) {
      setErrorMessage('Por favor ingresa tu contraseña o PIN.');
      return;
    }

    try {
      setLoading(true);
      try {
        executeRecaptcha('operator_login').catch(() => null);
      } catch (eRecap) {
        console.warn('reCAPTCHA aviso:', eRecap);
      }
      await loginOperatorByNameAndPassword(verifiedCompany, selectedOperatorId, operatorPassword);
    } catch (err) {
      setErrorMessage(err.message || 'Error al iniciar sesión como operario.');
    } finally {
      setLoading(false);
    }
  };

  // ================= ENVÍO MASTER EMPRESA (ESCRITORIO / WEB) =================
  const handleMasterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Por favor ingresa correo y contraseña.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      try {
        executeRecaptcha('master_login').catch(() => null);
      } catch (eRecap) {
        console.warn('reCAPTCHA aviso:', eRecap);
      }
      await loginWithEmailPassword(email, password);
    } catch (err) {
      console.error(err);
      let msg = 'Error al ingresar. Verifica tus datos de acceso.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Correo electrónico o contraseña incorrectos.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert('Para restablecer tu contraseña, por favor contacta al administrador master en dcasesorias@gmail.com o a través de nuestros canales de soporte.');
  };

  return (
    <div className="min-h-screen lg:h-screen w-full bg-[#0b132b] flex flex-col lg:overflow-hidden select-none">
      
      {/* ========================================================================= */}
      {/* 1. VISTA MÓVIL EXCLUSIVA PARA CELULARES (< lg): ÚNICAMENTE OPERARIO LITE  */}
      {/* ========================================================================= */}
      <div className="lg:hidden min-h-screen flex flex-col justify-between bg-gradient-to-b from-[#0b132b] via-[#101b3b] to-slate-900 text-white overflow-y-auto">
        
        {/* Cabecera Superior Móvil */}
        <div className="pt-6 pb-3 px-4 flex flex-col items-center text-center">
          
          {/* Badge de Plataforma */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-400/30 text-[10px] font-black tracking-widest text-blue-300 uppercase mb-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            PLANTA DE PRODUCCIÓN • MÓVIL
          </div>

          {/* Logo Redondo DC PROCESOS */}
          <div className="my-1 p-1">
            <DCLogo className="w-36 h-36 drop-shadow-2xl mx-auto" />
          </div>

          {/* Nombre y Slogan */}
          <div className="mt-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-400">
              DC ASESORÍAS
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              DC PROCESOS
            </h1>
            <p className="text-xs text-slate-300 italic mt-0.5 max-w-xs mx-auto">
              "Innovación, control y crecimiento en tu negocio."
            </p>
          </div>
        </div>

        {/* Tarjeta de Formulario Móvil (Solo Operario Lite) */}
        <div className="bg-white text-slate-900 rounded-t-3xl shadow-2xl p-6 sm:p-8 mt-2 flex-1 flex flex-col justify-between">
          <div className="max-w-md mx-auto w-full">
            
            {/* Título del Formulario Móvil */}
            <div className="text-center mb-5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                MÓVIL PLANTA • OPERARIOS
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                Acceso Operario
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Ingresa con el código de tu empresa y selecciona tu nombre.
              </p>
            </div>

            {/* Mensaje de Error */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Formulario de Operario */}
            <form onSubmit={handleOperatorSubmit} className="space-y-3.5">
              
              {/* Paso 1: Código de Empresa */}
              {!verifiedCompany ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código de la Empresa asignado *
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Building2 className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={companyCodeInput}
                        onChange={(e) => setCompanyCodeInput(e.target.value.toUpperCase())}
                        placeholder="Ej. SLG-101 o NIT"
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSearchCompany(companyCodeInput)}
                      disabled={checkingCompany || !companyCodeInput.trim()}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      {checkingCompany ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5" />
                          <span>Buscar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Digita el código que te dio tu empresa (ej. SLG-101) o el NIT.
                  </p>
                </div>
              ) : (
                /* Empresa Confirmada */
                <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-indigo-950 leading-tight">
                          {verifiedCompany.name}
                        </p>
                        <p className="text-[10px] text-indigo-700 font-mono">
                          Cód: <span className="font-bold">{verifiedCompany.code || verifiedCompany.companyCode}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleChangeCompany}
                      className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-white px-2 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 shadow-2xs"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Cambiar</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 2: Selección de Operario y Contraseña */}
              {verifiedCompany && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Selecciona tu Nombre de Operario *
                    </label>
                    {companyOperators.length === 0 ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                        No hay operarios registrados en esta empresa. Solicita al administrador Master que te agregue.
                      </div>
                    ) : (
                      <div className="relative">
                        <Users className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={selectedOperatorId}
                          onChange={(e) => setSelectedOperatorId(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition appearance-none"
                          required
                        >
                          <option value="">-- Selecciona tu Nombre --</option>
                          {companyOperators.map((op) => (
                            <option key={op.id} value={op.id}>
                              {op.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Contraseña o PIN *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showOpPassword ? 'text' : 'password'}
                        value={operatorPassword}
                        onChange={(e) => setOperatorPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowOpPassword(!showOpPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                      >
                        {showOpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Ingresa la contraseña asignada por tu empresa.
                    </p>
                  </div>
                </>
              )}

              {/* Botón Ingresar */}
              <button
                type="submit"
                disabled={loading || (verifiedCompany && companyOperators.length === 0)}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-4"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {!verifiedCompany ? 'VERIFICAR EMPRESA' : 'INGRESAR A PROCESOS & CONTEOS'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>

            {/* Redes y Contacto en Móvil */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
              <span className="text-[10px] text-slate-400 font-medium">Soporte DC Asesorías:</span>
              <a
                href="https://wa.me/573000000000?text=Hola,%20deseo%20soporte%20sobre%20DC%20Procesos"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-xs"
                title="WhatsApp Soporte"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="mailto:dcasesorias@gmail.com?subject=Consulta%20DC%20Procesos"
                className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-xs"
                title="Correo Directo"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>

            {/* Badge Legal Google reCAPTCHA v3 */}
            <div className="mt-3 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Protegido con <strong>reCAPTCHA v3</strong> · </span>
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">Privacidad</a>
              <span> y </span>
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">Condiciones</a>
            </div>

          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. VISTA ESCRITORIO EXCLUSIVA (>= lg): ÚNICAMENTE USUARIO MASTER EMPRESA */}
      {/* ========================================================================= */}
      <div className="hidden lg:grid w-full h-screen grid-cols-2 bg-[#f8fafc] overflow-hidden">
        
        {/* COLUMNA IZQUIERDA: HERO BRANDING (ESTILO EJECUTIVO AZUL MEDIANOCHE) */}
        <div className="relative bg-gradient-to-br from-[#0b132b] via-[#101b3b] to-[#0f172a] text-white p-8 xl:p-12 flex flex-col justify-between h-full overflow-hidden border-r border-slate-800/80 shadow-lg">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          {/* Tag Superior */}
          <div className="relative z-10 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] font-black tracking-widest text-blue-300 uppercase px-2.5 py-0.5 rounded-full bg-blue-900/40 border border-blue-500/30">
              ECOSISTEMA DC ASESORÍAS
            </span>
          </div>

          {/* Centro: Logo Redondo y Slogan */}
          <div className="relative z-10 my-auto py-2 flex flex-col items-center text-center">
            <DCLogo className="w-40 h-40 xl:w-48 xl:h-48 drop-shadow-2xl" />

            <div className="mt-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-400">
                DC ASESORÍAS
              </span>
              <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight mt-0.5">
                DC PROCESOS
              </h1>
            </div>

            <p className="mt-2 text-sm italic text-slate-200 font-medium max-w-sm">
              "Innovación, control y crecimiento en tu negocio."
            </p>

            <p className="mt-1 text-xs text-slate-400 max-w-sm leading-relaxed">
              Control integral de procesos, rendimientos, mermas, inventarios y valorización en tiempo real.
            </p>
          </div>

          {/* Footer Inferior */}
          <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
            <span>Sistema Integral de Procesos</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              DC Procesos <span className="font-mono text-[10px] text-blue-300 font-bold px-1.5 py-0.5 rounded bg-blue-900/50 border border-blue-500/30">{APP_VERSION}</span>
            </span>
          </div>
        </div>

        {/* COLUMNA DERECHA: FORMULARIO MASTER (PÁGINA WEB) */}
        <div className="flex flex-col justify-center items-center p-8 xl:p-12 bg-[#f8fafc] h-full overflow-hidden">
          <div className="w-full max-w-md bg-white p-7 sm:p-9 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            
            <div className="text-center space-y-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                SISTEMA INTEGRAL GASTRONÓMICO
              </span>
              <h2 className="text-2xl xl:text-3xl font-black text-slate-900 tracking-tight">
                Iniciar Sesión
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                Accede a la plataforma con tu usuario o correo electrónico y contraseña
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Formulario Master */}
            <form onSubmit={handleMasterSubmit} className="space-y-4 pt-1">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico o Usuario *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dcasesorias@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Contraseña *
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showMasterPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowMasterPassword(!showMasterPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showMasterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-[#4338ca] hover:bg-indigo-700 active:scale-[0.99] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>INGRESAR AL SISTEMA</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>

            <div className="pt-3 border-t border-slate-100">
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  o conéctate con nosotros
                </span>
              </div>

              <div className="flex items-center justify-center gap-3.5 mt-2.5">
                <a
                  href="https://wa.me/573000000000?text=Hola,%20deseo%20informaci%C3%B3n%20sobre%20DC%20Procesos"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors shadow-2xs"
                  title="WhatsApp Soporte"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>

                <a
                  href="mailto:dcasesorias@gmail.com?subject=Consulta%20DC%20Procesos"
                  className="w-9 h-9 rounded-full border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors shadow-2xs"
                  title="Contacto Directo por Correo"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>

              {/* Badge Legal Google reCAPTCHA v3 */}
              <div className="mt-3 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Protegido con <strong>Google reCAPTCHA v3</strong> · </span>
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">Privacidad</a>
                <span> y </span>
                <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">Condiciones</a>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
