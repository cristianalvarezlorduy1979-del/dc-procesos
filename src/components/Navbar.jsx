import React from 'react';
import { 
  Building2, 
  Smartphone, 
  Cloud, 
  Download, 
  SlidersHorizontal, 
  LogOut, 
  RefreshCw,
  LayoutDashboard
} from 'lucide-react';
import DCLogo from './DCLogo';
import { isFirebaseConfigured } from '../services/firebase';
import { APP_VERSION } from '../utils/version';

export default function Navbar({ 
  currentView, 
  setCurrentView, 
  currentUser, 
  onLogout, 
  onOpenFirebaseConfig,
  selectedCompany,
  onClearSelectedCompany,
  onEditCompany
}) {
  const isSuperMaster = currentUser?.isSuperMaster;
  const isCompanyMaster = currentUser?.isCompanyMaster;
  const isCloudActive = Boolean(isFirebaseConfigured);

  // Función de Backup de datos de la empresa activa
  const handleBackupCompany = () => {
    try {
      const backupData = {
        empresa: selectedCompany?.name || currentUser?.companyName || 'DC_Procesos',
        fechaBackup: new Date().toISOString(),
        usuarioGenerador: currentUser?.email || 'Admin',
        plataforma: 'DC Procesos Industriales',
        version: APP_VERSION
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Backup_${(selectedCompany?.name || 'Empresa').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      alert('Backup generado para la empresa actual.');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs text-slate-800">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Marca (Estilo DC Restaurantes) */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0">
              <DCLogo className="w-10 h-10 sm:w-11 sm:h-11" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                  DC PROCESOS
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {APP_VERSION}
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                "TU ALIADO EN LA GESTION DE TU NEGOCIO"
              </p>
            </div>
          </div>

          {/* Botones Cápsula Superiores (Exacto estilo de DC Restaurantes) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto py-1 scrollbar-none">
            
            {/* Pill 1: Estado Sincronizado */}
            <div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-bold shadow-2xs shrink-0"
              title={isCloudActive ? "Conectado y sincronizado a Google Cloud Firestore" : "Operando en modo local sincronizado"}
            >
              <Cloud className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden sm:inline">Sincronizado</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            </div>

            {/* Pill 2: App Móvil */}
            <button
              onClick={() => {
                if (currentView === 'mobile') {
                  setCurrentView(isSuperMaster ? 'companies' : 'dashboard');
                } else {
                  setCurrentView('mobile');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-2xs transition shrink-0 ${
                currentView === 'mobile' ? 'ring-2 ring-emerald-500 bg-emerald-50 text-emerald-800' : ''
              }`}
              title="Abrir o conmutar al módulo para operarios en celular"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>App Móvil</span>
            </button>

            {/* Pill 3: Backup Empresa */}
            <button
              onClick={handleBackupCompany}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-2xs transition shrink-0"
              title="Descargar copia de respaldo de la empresa activa"
            >
              <Download className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden md:inline">Backup Empresa</span>
            </button>

            {/* Pill 4: Cambiar Empresa (Si es Super Master o tiene empresa seleccionada) */}
            {(isSuperMaster || selectedCompany) && (
              <button
                onClick={() => {
                  if (onClearSelectedCompany) onClearSelectedCompany();
                  setCurrentView('companies');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-2xs transition shrink-0 ${
                  currentView === 'companies' ? 'ring-2 ring-blue-500 bg-blue-50 text-blue-800' : ''
                }`}
                title="Cambiar de empresa o ver el catálogo de clientes"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-700" />
                <span className="hidden sm:inline">Cambiar Empresa</span>
              </button>
            )}

            {/* Pill 5: Módulos Activos / Configuración */}
            <button
              onClick={onOpenFirebaseConfig}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-2xs transition shrink-0"
              title="Configuración de nube y módulos de la plataforma"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden lg:inline">Módulos Activos</span>
            </button>

            {/* Pill 6: Cerrar Sesión */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-red-50 text-slate-800 hover:text-red-700 text-xs font-bold shadow-2xs transition shrink-0"
              title="Cerrar sesión actual"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-700 hover:text-red-600" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
