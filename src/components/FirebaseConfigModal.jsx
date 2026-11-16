import React, { useState } from 'react';
import { 
  Flame, 
  X, 
  Check, 
  ExternalLink, 
  Copy, 
  HelpCircle, 
  Trash2, 
  Save, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { 
  getStoredFirebaseConfig, 
  saveFirebaseConfig, 
  clearFirebaseConfig, 
  isFirebaseConfigured 
} from '../services/firebase';

export default function FirebaseConfigModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const initialConfig = getStoredFirebaseConfig();
  const [apiKey, setApiKey] = useState(initialConfig.apiKey || '');
  const [authDomain, setAuthDomain] = useState(initialConfig.authDomain || '');
  const [projectId, setProjectId] = useState(initialConfig.projectId || '');
  const [storageBucket, setStorageBucket] = useState(initialConfig.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(initialConfig.messagingSenderId || '');
  const [appId, setAppId] = useState(initialConfig.appId || '');

  const [rawJson, setRawJson] = useState('');
  const [showJsonInput, setShowJsonInput] = useState(false);
  const [copiedStep, setCopiedStep] = useState(false);

  const handleParseJson = () => {
    try {
      // Intentar extraer claves comunes de JavaScript o JSON copiado de Firebase console
      const clean = rawJson
        .replace(/const firebaseConfig = /g, '')
        .replace(/;/g, '')
        .replace(/([a-zA-Z0-9_]+):/g, '"$1":')
        .replace(/'/g, '"');
      
      const parsed = JSON.parse(clean);
      if (parsed.apiKey) setApiKey(parsed.apiKey);
      if (parsed.authDomain) setAuthDomain(parsed.authDomain);
      if (parsed.projectId) setProjectId(parsed.projectId);
      if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
      if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId);
      if (parsed.appId) setAppId(parsed.appId);
      setShowJsonInput(false);
      setRawJson('');
    } catch (e) {
      alert('No se pudo interpretar el bloque. Por favor llena los campos individualmente o verifica el formato.');
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!projectId || !apiKey) {
      alert('Debes ingresar al menos el Project ID y el API Key de tu proyecto Firebase.');
      return;
    }

    const newConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim()
    };

    saveFirebaseConfig(newConfig);
  };

  const handleReset = () => {
    if (confirm('¿Deseas desvincular Firebase y volver al almacenamiento local de prueba?')) {
      clearFirebaseConfig();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 max-h-[90vh] flex flex-col">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between p-6 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Flame className="w-6 h-6 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Conectar a tu Firebase</h2>
              <p className="text-xs text-slate-400">
                {isFirebaseConfigured 
                  ? `Conectado al proyecto: ${projectId}`
                  : 'Guarda tus datos en tiempo real en tu propia base de datos'}
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

        {/* Contenido con Scroll */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Tarjeta de Guía Rápida */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900">
            <div className="flex items-center justify-between font-semibold mb-2 text-sm text-blue-950">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                ¿Cómo obtener estas credenciales en Firebase? (3 Pasos)
              </span>
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-800 underline font-medium"
              >
                <span>Abrir Firebase Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <ol className="list-decimal pl-4 space-y-1.5 text-blue-800/90 leading-relaxed">
              <li>Ingresa a <strong>console.firebase.google.com</strong> y pulsa <strong>"Agregar proyecto"</strong> (ej. <em>DC Procesos</em>).</li>
              <li>En el menú lateral activa <strong>Authentication</strong> (habilita proveedor <em>Correo electrónico/Contraseña</em>) y en <strong>Firestore Database</strong> pulsa <em>Crear base de datos</em> (modo de prueba).</li>
              <li>Ve a <strong>Configuración del proyecto (ícono de engranaje)</strong> &gt; sección <em>Tus apps</em> &gt; agrega una app Web y copia el objeto <code>firebaseConfig</code>.</li>
            </ol>
          </div>

          {/* Pegar JSON Rápido */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Credenciales del Proyecto</span>
            <button
              type="button"
              onClick={() => setShowJsonInput(!showJsonInput)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium underline"
            >
              {showJsonInput ? 'Ocultar pegado rápido' : '¿Tienes el bloque firebaseConfig completo? Pegar aquí'}
            </button>
          </div>

          {showJsonInput && (
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Pega el objeto completo copiado de Firebase:
              </label>
              <textarea
                rows={4}
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
                placeholder={'const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "dc-procesos-...",\n  ...\n};'}
                className="w-full p-3 font-mono text-xs bg-slate-950 text-emerald-400 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleParseJson}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                Autocompletar campos
              </button>
            </div>
          )}

          {/* Formulario de campos */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project ID *
                </label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="dc-procesos-xxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  API Key *
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSyBxxxx..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Auth Domain
                </label>
                <input
                  type="text"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  placeholder="dc-procesos-xxxx.firebaseapp.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Storage Bucket
                </label>
                <input
                  type="text"
                  value={storageBucket}
                  onChange={(e) => setStorageBucket(e.target.value)}
                  placeholder="dc-procesos-xxxx.appspot.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Messaging Sender ID
                </label>
                <input
                  type="text"
                  value={messagingSenderId}
                  onChange={(e) => setMessagingSenderId(e.target.value)}
                  placeholder="1029384756..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  App ID
                </label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1:102938...:web:..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Reglas de Seguridad recomendadas */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-600">
              <p className="font-semibold text-slate-700">Reglas de Cloud Firestore recomendadas:</p>
              <pre className="p-2 bg-slate-900 text-slate-200 rounded-lg text-[11px] overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
              </pre>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
              {isFirebaseConfigured ? (
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center justify-center gap-2 border border-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Desvincular Firebase</span>
                </button>
              ) : (
                <span className="text-xs text-amber-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Actualmente operando en almacenamiento local seguro
                </span>
              )}

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar y Conectar</span>
                </button>
              </div>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
}
