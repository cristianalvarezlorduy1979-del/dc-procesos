import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import WelcomeAuthModal from './components/WelcomeAuthModal';
import FirebaseConfigModal from './components/FirebaseConfigModal';
import MobileProcessView from './components/MobileProcessView';
import MainDashboardView from './components/MainDashboardView';
import MasterCompaniesView from './components/MasterCompaniesView';
import NewOrderModal from './components/NewOrderModal';
import NewCompanyModal from './components/NewCompanyModal';
import OrderDetailsModal from './components/OrderDetailsModal';
import NewInventoryItemModal from './components/NewInventoryItemModal';
import NewOperatorModal from './components/NewOperatorModal';
import NewProcessTemplateModal from './components/NewProcessTemplateModal';
import NewWasteReportModal from './components/NewWasteReportModal';
import { 
  listenAuthState, 
  subscribeToOrders, 
  subscribeCompanies, 
  subscribeInventoryItems,
  subscribePhysicalInventories,
  subscribeOperators,
  subscribeProcessTemplates,
  subscribeWasteReports,
  logoutSession, 
  isFirebaseConfigured 
} from './services/firebase';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'companies' | 'dashboard' | 'mobile'
  const [orders, setOrders] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [physicalInventories, setPhysicalInventories] = useState([]);
  const [operators, setOperators] = useState([]);
  const [processTemplates, setProcessTemplates] = useState([]);
  const [wasteReports, setWasteReports] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  
  // Modals
  const [isFirebaseConfigOpen, setIsFirebaseConfigOpen] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isNewCompanyModalOpen, setIsNewCompanyModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState(null);
  const [isNewInventoryItemModalOpen, setIsNewInventoryItemModalOpen] = useState(false);
  const [isNewOperatorModalOpen, setIsNewOperatorModalOpen] = useState(false);
  const [isNewProcessTemplateModalOpen, setIsNewProcessTemplateModalOpen] = useState(false);
  const [isNewWasteReportModalOpen, setIsNewWasteReportModalOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState(null);
  const [initialOrderTemplate, setInitialOrderTemplate] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Escuchar estado de autenticación (Firebase Auth o Local)
  useEffect(() => {
    const unsubscribe = listenAuthState((user) => {
      setCurrentUser(user);
      setAuthChecked(true);

      // Enrutamiento por rol al autenticar:
      if (user?.isSuperMaster) {
        // Usuario Master exclusivo (dcasesorias@gmail.com): Ingresa directamente al panel de control de empresas creadas
        setCurrentView('companies');
      } else if (user?.isLite) {
        // Usuario Lite / Operarios de clientes: Ingresan a su módulo móvil/planta
        setCurrentView('mobile');
      } else if (user) {
        // Otros accesos web de empresa cliente: Tablero de procesos
        setCurrentView('dashboard');
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Para usuarios de empresa (Master o Lite), asociar automáticamente su empresa
  useEffect(() => {
    if (currentUser && !currentUser.isSuperMaster) {
      const userCompName = (currentUser.companyName || currentUser.displayName || 'Mi Empresa').toLowerCase();
      const userEmail = (currentUser.email || '').toLowerCase();
      const match = companies.find(c => 
        (c?.name && c.name.toLowerCase() === userCompName) ||
        (userEmail && c?.email && c.email.toLowerCase() === userEmail)
      );
      if (match) {
        setSelectedCompany(match);
      } else {
        setSelectedCompany({
          id: currentUser.uid || 'default-id',
          name: currentUser.companyName || currentUser.displayName || 'Mi Empresa',
          email: currentUser.email || '',
          city: currentUser.city || 'Colombia',
          address: currentUser.address || 'Sede Principal de Producción',
          phone: currentUser.phone || '+57 300 000 0000',
          nit: currentUser.nit || ''
        });
      }
    }
  }, [currentUser, companies]);

  // Escuchar empresas en tiempo real para el Master
  useEffect(() => {
    const unsubscribe = subscribeCompanies((updatedCompanies) => {
      setCompanies(updatedCompanies);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Escuchar órdenes en tiempo real (Cloud Firestore o Local)
  useEffect(() => {
    const unsubscribe = subscribeToOrders((updatedOrders) => {
      setOrders(updatedOrders);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Escuchar insumos de inventario en tiempo real
  useEffect(() => {
    const unsubscribe = subscribeInventoryItems((items) => {
      setInventoryItems(items);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Escuchar tomas físicas de inventario en tiempo real
  useEffect(() => {
    const unsubscribe = subscribePhysicalInventories((inventories) => {
      setPhysicalInventories(inventories);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Escuchar operarios en tiempo real
  useEffect(() => {
    const unsubscribe = subscribeOperators((ops) => {
      setOperators(ops);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Escuchar catálogo de procesos estándar en tiempo real
  useEffect(() => {
    const unsubscribe = subscribeProcessTemplates((templates) => {
      setProcessTemplates(templates);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Escuchar reportes de bajas y desperdicios en tiempo real
  useEffect(() => {
    const unsubscribe = subscribeWasteReports((reports) => {
      setWasteReports(reports);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Manejo de Logout
  const handleLogout = async () => {
    setSelectedCompany(null);
    await logoutSession();
  };

  // Al seleccionar una empresa en la Zona Master
  const handleSelectCompany = (company) => {
    setSelectedCompany(company);
    setCurrentView('dashboard');
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-white">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide text-slate-300">Cargando DC Procesos...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar únicamente la pantalla de bienvenida limpia (sin navbar ni páginas de fondo)
  if (!currentUser) {
    return <WelcomeAuthModal />;
  }

  // Filtrar órdenes si se seleccionó una empresa específica (o mostrar todas si no hay filtro)
  const displayedOrders = selectedCompany
    ? (orders || []).filter(o => o && (!o.companyId || o.companyId === selectedCompany.id || o.companyName === selectedCompany.name))
    : (orders || []);

  // Filtrar insumos y tomas físicas por empresa si aplica
  const displayedInventoryItems = selectedCompany
    ? (inventoryItems || []).filter(i => i && (!i.companyId || i.companyId === selectedCompany.id || i.companyName === selectedCompany.name))
    : (inventoryItems || []);

  const displayedPhysicalInventories = selectedCompany
    ? (physicalInventories || []).filter(i => i && (!i.companyId || i.companyId === selectedCompany.id || i.companyName === selectedCompany.name))
    : (physicalInventories || []);

  // Filtrar operarios por empresa si aplica
  const displayedOperators = selectedCompany
    ? (operators || []).filter(o => o && (!o.companyId || o.companyId === selectedCompany.id || o.companyName === selectedCompany.name))
    : (operators || []);

  // Filtrar catálogo de procesos por empresa si aplica
  const displayedProcessTemplates = selectedCompany
    ? (processTemplates || []).filter(p => p && (!p.companyId || p.companyId === selectedCompany.id || p.companyName === selectedCompany.name))
    : (processTemplates || []);

  // Filtrar reportes de bajas por empresa si aplica
  const displayedWasteReports = selectedCompany
    ? (wasteReports || []).filter(w => w && (!w.companyId || w.companyId === selectedCompany.id || w.companyName === selectedCompany.name))
    : (wasteReports || []);

  return (
    <div className="min-h-screen bg-[#f0f7ff] text-slate-900 flex flex-col font-sans">
      
      {/* Barra de Navegación Superior */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenFirebaseConfig={() => setIsFirebaseConfigOpen(true)}
        selectedCompany={selectedCompany}
        onClearSelectedCompany={() => {
          setSelectedCompany(null);
          if (currentUser?.isMaster) setCurrentView('companies');
        }}
        onEditCompany={selectedCompany ? () => {
          setCompanyToEdit(selectedCompany);
          setIsNewCompanyModalOpen(true);
        } : null}
      />

      {/* Banner de Empresa Seleccionada para el Master */}
      {currentUser?.isMaster && selectedCompany && currentView !== 'companies' && (
        <div className="bg-blue-50/80 text-blue-900 px-4 py-2 text-xs flex items-center justify-between border-b border-blue-200 shadow-2xs">
          <div className="w-full max-w-[1920px] mx-auto flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Gestionando empresa: <strong className="text-blue-950 font-black">{selectedCompany.name}</strong> ({selectedCompany.city || 'Planta'})</span>
            </span>
            <button
              onClick={() => {
                setSelectedCompany(null);
                setCurrentView('companies');
              }}
              className="text-xs bg-white hover:bg-blue-100 text-blue-800 border border-blue-300 px-3 py-1 rounded-xl font-bold transition shadow-2xs"
            >
              ← Volver a Zona de Empresas
            </button>
          </div>
        </div>
      )}

      {/* Contenido Principal según Vista */}
      <main className="flex-1">
        {currentView === 'companies' && currentUser?.isMaster ? (
          <MasterCompaniesView
            companies={companies}
            onSelectCompany={handleSelectCompany}
            onOpenNewCompanyModal={() => {
              setCompanyToEdit(null);
              setIsNewCompanyModalOpen(true);
            }}
            onEditCompany={(comp) => {
              setCompanyToEdit(comp);
              setIsNewCompanyModalOpen(true);
            }}
            onGoToGlobalProcesses={() => {
              setSelectedCompany(null);
              setCurrentView('dashboard');
            }}
          />
        ) : currentView === 'mobile' ? (
          <div className="py-4">
            <MobileProcessView
              orders={displayedOrders}
              currentUser={currentUser}
              selectedCompany={selectedCompany}
              inventoryItems={displayedInventoryItems}
              wasteReports={displayedWasteReports}
              onOpenNewWasteReportModal={() => setIsNewWasteReportModalOpen(true)}
              onOrderCompleted={() => {
                // Al completar orden en móvil
              }}
              onInventorySaved={() => {
                // Al guardar toma de inventario en móvil
              }}
            />
          </div>
        ) : (
          <MainDashboardView
            orders={displayedOrders}
            selectedCompany={selectedCompany}
            inventoryItems={displayedInventoryItems}
            physicalInventories={displayedPhysicalInventories}
            operators={displayedOperators}
            processTemplates={displayedProcessTemplates}
            wasteReports={displayedWasteReports}
            onOpenNewWasteReportModal={() => setIsNewWasteReportModalOpen(true)}
            onOpenNewOrderModal={() => {
              setInitialOrderTemplate(null);
              setIsNewOrderModalOpen(true);
            }}
            onOpenNewInventoryItemModal={() => setIsNewInventoryItemModalOpen(true)}
            onOpenNewOperatorModal={() => setIsNewOperatorModalOpen(true)}
            onOpenNewProcessTemplateModal={() => {
              setTemplateToEdit(null);
              setIsNewProcessTemplateModalOpen(true);
            }}
            onEditProcessTemplate={(template) => {
              setTemplateToEdit(template);
              setIsNewProcessTemplateModalOpen(true);
            }}
            onStartOrderFromTemplate={(template) => {
              setInitialOrderTemplate(template);
              setIsNewOrderModalOpen(true);
            }}
            onOpenOrderDetails={(order) => setSelectedOrderDetails(order)}
            onBackToCompanies={() => {
              setSelectedCompany(null);
              setCurrentView('companies');
            }}
          />
        )}
      </main>

      {/* Modales */}
      <FirebaseConfigModal
        isOpen={isFirebaseConfigOpen}
        onClose={() => setIsFirebaseConfigOpen(false)}
      />

      <NewCompanyModal
        isOpen={isNewCompanyModalOpen}
        onClose={() => {
          setIsNewCompanyModalOpen(false);
          setCompanyToEdit(null);
        }}
        companyToEdit={companyToEdit}
        existingOperators={operators}
      />

      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => {
          setIsNewOrderModalOpen(false);
          setInitialOrderTemplate(null);
        }}
        selectedCompany={selectedCompany}
        operators={displayedOperators}
        processTemplates={displayedProcessTemplates}
        initialTemplate={initialOrderTemplate}
      />

      <NewOperatorModal
        isOpen={isNewOperatorModalOpen}
        onClose={() => setIsNewOperatorModalOpen(false)}
        selectedCompany={selectedCompany}
      />

      <NewProcessTemplateModal
        isOpen={isNewProcessTemplateModalOpen}
        onClose={() => {
          setIsNewProcessTemplateModalOpen(false);
          setTemplateToEdit(null);
        }}
        selectedCompany={selectedCompany}
        templateToEdit={templateToEdit}
        inventoryItems={displayedInventoryItems}
      />

      <NewInventoryItemModal
        isOpen={isNewInventoryItemModalOpen}
        onClose={() => setIsNewInventoryItemModalOpen(false)}
        selectedCompany={selectedCompany}
      />

      <OrderDetailsModal
        order={selectedOrderDetails}
        onClose={() => setSelectedOrderDetails(null)}
      />

      <NewWasteReportModal
        isOpen={isNewWasteReportModalOpen}
        onClose={() => setIsNewWasteReportModalOpen(false)}
        selectedCompany={selectedCompany}
        operators={displayedOperators}
        inventoryItems={displayedInventoryItems}
        currentUser={currentUser}
        onReportCreated={() => {
          // Callback al crear reporte
        }}
      />

      {/* Pie de Página */}
      <footer className="bg-white text-slate-600 text-xs py-4 border-t border-slate-200/90 text-center shadow-2xs mt-auto">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-slate-600">DC Procesos © {new Date().getFullYear()} - Sistema de Control y Rendimiento de Producción</span>
          <span className="text-[11px] text-blue-700 font-bold px-3 py-1 rounded-full bg-blue-50 border border-blue-200">DC Asesorías • Plataforma Productiva</span>
        </div>
      </footer>

    </div>
  );
}
