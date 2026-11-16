import React, { Component, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Componente ErrorBoundary para evitar que cualquier error visual rompa la pantalla
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary detectó un error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f0f7ff] flex items-center justify-center p-4 text-slate-800 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-red-200 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center font-bold text-lg">⚠️</div>
              <div>
                <h1 className="text-base font-black text-slate-900">Se produjo un error visual</h1>
                <p className="text-xs text-slate-500">La aplicación se protegió para no quedar en blanco</p>
              </div>
            </div>
            <pre className="bg-red-50/60 p-3.5 rounded-2xl border border-red-100 text-xs text-red-700 font-mono overflow-x-auto whitespace-pre-wrap max-h-48">
              {this.state.error?.toString()}
              {'\n'}
              {this.state.error?.stack}
            </pre>
            <div className="pt-2 flex flex-wrap gap-2">
              <button 
                onClick={() => {
                  try {
                    localStorage.clear();
                    sessionStorage.clear();
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(regs => {
                        regs.forEach(r => r.unregister());
                      });
                    }
                  } catch(e) {}
                  window.location.reload();
                }}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
              >
                Limpiar Caché y Recargar Plataforma
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Registrar Service Worker para PWA / WebAPK en Android y iOS
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('DC Procesos Service Worker activo:', reg.scope);
    }).catch((err) => {
      console.warn('Error registrando Service Worker:', err);
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
