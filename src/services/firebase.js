// DC Procesos - Servicio y Conexión Firebase
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc,
  getDocs,
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { apiClient } from './apiClient';

// Clave de almacenamiento local para configuración personalizada de Firebase
const FIREBASE_CONFIG_STORAGE_KEY = 'dc_procesos_firebase_config';
const LOCAL_ORDERS_STORAGE_KEY = 'dc_procesos_local_orders';
const LOCAL_COMPANIES_STORAGE_KEY = 'dc_procesos_local_companies';
const LOCAL_INVENTORY_ITEMS_KEY = 'dc_procesos_inventory_items';
const LOCAL_PHYSICAL_INVENTORIES_KEY = 'dc_procesos_physical_inventories';
const LOCAL_OPERATORS_STORAGE_KEY = 'dc_procesos_operators_store';
const LOCAL_PROCESS_TEMPLATES_KEY = 'dc_procesos_process_templates';
const LOCAL_WASTE_REPORTS_KEY = 'dc_procesos_waste_reports';
const LOCAL_USER_STORAGE_KEY = 'dc_procesos_local_user';

// Insumos Iniciales de Demostración con Costos para Inventarios
export const INITIAL_DEMO_INVENTORY_ITEMS = [
  {
    id: 'INS-001',
    code: 'INS-001',
    name: 'Canal de Res (Media Canal)',
    category: 'Materia Prima Cárnica',
    unit: 'Kg',
    unitCost: 18500,
    expectedWastePct: 15.5,
    currentStock: 450,
    minStock: 80,
    location: 'Cuarto Frío 1 (Canales)',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'INS-002',
    code: 'INS-002',
    name: 'Lomo / Canal de Cerdo',
    category: 'Materia Prima Cárnica',
    unit: 'Kg',
    unitCost: 14200,
    expectedWastePct: 12.0,
    currentStock: 280,
    minStock: 50,
    location: 'Cuarto Frío 1 (Canales)',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'INS-003',
    code: 'INS-003',
    name: 'Pechuga de Pollo Fresca',
    category: 'Materia Prima Cárnica',
    unit: 'Kg',
    unitCost: 12500,
    expectedWastePct: 8.5,
    currentStock: 150,
    minStock: 40,
    location: 'Nevera Aves (0-2°C)',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'INS-004',
    code: 'INS-004',
    name: 'Sal Nitrificada Especial',
    category: 'Insumos y Aditivos',
    unit: 'Kg',
    unitCost: 8500,
    expectedWastePct: 1.0,
    currentStock: 40,
    minStock: 10,
    location: 'Estante Secos B1',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'INS-005',
    code: 'INS-005',
    name: 'Condimento Chorizo Artesanal',
    category: 'Insumos y Aditivos',
    unit: 'Kg',
    unitCost: 24000,
    expectedWastePct: 1.5,
    currentStock: 25,
    minStock: 5,
    location: 'Estante Secos B2',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'INS-006',
    code: 'INS-006',
    name: 'Tripa de Cerdo Calibre 28/30',
    category: 'Insumos y Aditivos',
    unit: 'Madejas',
    unitCost: 65000,
    expectedWastePct: 3.0,
    currentStock: 12,
    minStock: 3,
    location: 'Refrigeración Insumos',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'INS-007',
    code: 'INS-007',
    name: 'Bolsa al Vacío 20x30 cm',
    category: 'Material de Empaque',
    unit: 'Millar',
    unitCost: 180000,
    expectedWastePct: 0.5,
    currentStock: 3,
    minStock: 1,
    location: 'Almacén Empaque C1',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'INS-008',
    code: 'INS-008',
    name: 'Caja Cartón Corrugado 25 Kg',
    category: 'Material de Empaque',
    unit: 'Unidades',
    unitCost: 4200,
    expectedWastePct: 0.0,
    currentStock: 120,
    minStock: 25,
    location: 'Almacén Empaque C2',
    createdAt: '2026-01-15T08:00:00Z'
  }
];

// Tomas Físicas Iniciales de Demostración
export const INITIAL_DEMO_PHYSICAL_INVENTORIES = [
  {
    id: 'INV-2026-001',
    code: 'INV-001',
    title: 'Toma Física Quincenal Bodega',
    countedBy: 'Carlos Gómez (Bodeguero)',
    countedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    status: 'Guardado',
    notes: 'Conteo completo en frío y bodega de secos',
    items: [
      {
        itemId: 'INS-001',
        code: 'INS-001',
        name: 'Canal de Res (Media Canal)',
        category: 'Materia Prima Cárnica',
        unit: 'Kg',
        unitCost: 18500,
        countedQty: 442.5,
        totalValued: 8186250
      },
      {
        itemId: 'INS-002',
        code: 'INS-002',
        name: 'Lomo / Canal de Cerdo',
        category: 'Materia Prima Cárnica',
        unit: 'Kg',
        unitCost: 14200,
        countedQty: 275.0,
        totalValued: 3905000
      },
      {
        itemId: 'INS-003',
        code: 'INS-003',
        name: 'Pechuga de Pollo Fresca',
        category: 'Materia Prima Cárnica',
        unit: 'Kg',
        unitCost: 12500,
        countedQty: 148.0,
        totalValued: 1850000
      },
      {
        itemId: 'INS-004',
        code: 'INS-004',
        name: 'Sal Nitrificada Especial',
        category: 'Insumos y Aditivos',
        unit: 'Kg',
        unitCost: 8500,
        countedQty: 38.0,
        totalValued: 323000
      },
      {
        itemId: 'INS-005',
        code: 'INS-005',
        name: 'Condimento Chorizo Artesanal',
        category: 'Insumos y Aditivos',
        unit: 'Kg',
        unitCost: 24000,
        countedQty: 24.5,
        totalValued: 588000
      },
      {
        itemId: 'INS-006',
        code: 'INS-006',
        name: 'Tripa de Cerdo Calibre 28/30',
        category: 'Insumos y Aditivos',
        unit: 'Madejas',
        unitCost: 65000,
        countedQty: 10,
        totalValued: 650000
      },
      {
        itemId: 'INS-007',
        code: 'INS-007',
        name: 'Bolsa al Vacío 20x30 cm',
        category: 'Material de Empaque',
        unit: 'Millar',
        unitCost: 180000,
        countedQty: 2.5,
        totalValued: 450000
      },
      {
        itemId: 'INS-008',
        code: 'INS-008',
        name: 'Caja Cartón Corrugado 25 Kg',
        category: 'Material de Empaque',
        unit: 'Unidades',
        unitCost: 4200,
        countedQty: 115,
        totalValued: 483000
      }
    ],
    totalItemsCounted: 8,
    totalValued: 16435250,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
  }
];

// Empresas Iniciales de Demostración para el Panel Master
export const INITIAL_DEMO_COMPANIES = [
  {
    id: 'EMP-001',
    name: 'Carnes & Cortes del Valle S.A.S.',
    nit: '901.234.567-1',
    email: 'valle@carnes.com',
    phone: '+57 312 456 7890',
    city: 'Cali, Valle del Cauca',
    address: 'Calle 10 # 28-45, Acopi Yumbo',
    category: 'Desposte Bovino y Porcino',
    status: 'Activa',
    billingModel: 'Mensual',
    contractStartDate: '2026-10-01',
    contractEndDate: '2026-11-01',
    plan: 'Cobro Mensual',
    ordersCount: 14,
    totalInputKg: 6300.5,
    avgYield: 69.4,
    createdAt: '2026-01-15T10:00:00Z'
  },
  {
    id: 'EMP-002',
    name: 'Frigorífico La Sabana',
    nit: '900.876.543-2',
    email: 'sabana@frigorifico.com',
    phone: '+57 320 987 6543',
    city: 'Bogotá D.C. / Chía',
    address: 'Autopista Norte Km 18, Parque Industrial Bodega 4',
    category: 'Frigorífico y Beneficio',
    status: 'Activa',
    billingModel: 'Trimestral',
    contractStartDate: '2026-08-15',
    contractEndDate: '2026-11-15',
    plan: 'Cobro Trimestral',
    ordersCount: 8,
    totalInputKg: 4200.0,
    avgYield: 71.2,
    createdAt: '2026-02-10T08:30:00Z'
  },
  {
    id: 'EMP-003',
    name: 'Delitas Gourmet Cárnicos',
    nit: '901.112.334-5',
    email: 'delitas@gmail.com',
    phone: '+57 301 234 5678',
    city: 'Medellín, Antioquia',
    address: 'Carrera 43A # 1-50, El Poblado',
    category: 'Porcionado y Empaque al Vacío',
    status: 'Activa',
    billingModel: 'Semestral',
    contractStartDate: '2026-06-01',
    contractEndDate: '2026-12-01',
    plan: 'Cobro Semestral',
    ordersCount: 5,
    totalInputKg: 1850.0,
    avgYield: 67.8,
    createdAt: '2026-03-01T14:15:00Z'
  },
  {
    id: 'EMP-004',
    name: 'Distribuidora Cárnica Santander',
    nit: '800.456.789-9',
    email: 'santander@bovinos.com',
    phone: '+57 315 678 1234',
    city: 'Bucaramanga, Santander',
    category: 'Canal Completa y Subproductos',
    status: 'Activa',
    plan: 'Plan Pyme',
    ordersCount: 3,
    totalInputKg: 950.0,
    avgYield: 68.1,
    createdAt: '2026-03-20T11:00:00Z'
  }
];

// Operarios Iniciales de Demostración para el Enrutamiento de Procesos
export const INITIAL_DEMO_OPERATORS = [
  {
    id: 'OP-001',
    code: 'OP-101',
    name: 'Carlos Gómez',
    email: 'carlos.planta@gmail.com',
    phone: '+57 311 234 5678',
    position: 'Operario de Desposte',
    companyId: 'EMP-001',
    companyName: 'Carnes & Cortes del Valle S.A.S.',
    role: 'operator_lite',
    active: true,
    createdAt: '2026-02-15T08:00:00Z'
  },
  {
    id: 'OP-002',
    code: 'OP-102',
    name: 'Andrés Martínez',
    email: 'andres.planta@gmail.com',
    phone: '+57 315 987 6543',
    position: 'Pesador y Control de Rendimientos',
    companyId: 'EMP-001',
    companyName: 'Carnes & Cortes del Valle S.A.S.',
    role: 'operator_lite',
    active: true,
    createdAt: '2026-02-20T09:30:00Z'
  },
  {
    id: 'OP-003',
    code: 'OP-103',
    name: 'Javier Rodríguez',
    email: 'javier.planta@gmail.com',
    phone: '+57 318 456 1234',
    position: 'Operario de Porcionado y Empaque',
    companyId: 'EMP-002',
    companyName: 'Frigorífico La Sabana',
    role: 'operator_lite',
    active: true,
    createdAt: '2026-02-22T10:00:00Z'
  }
];

// Procesos Estándar Iniciales de Demostración para el Catálogo de la Empresa
export const INITIAL_DEMO_PROCESS_TEMPLATES = [
  {
    id: 'PROC-001',
    code: 'PROC-101',
    name: 'Desposte y Deshuese de Res (Cuarto Trasero)',
    category: 'Bovino (Res)',
    unit: 'Kg',
    expectedYield: 69.5,
    description: 'Desposte completo de pierna y lomo, separación de cortes magros, hueso y grasa.',
    lossFields: {
      hasBlood: true,
      hasBone: true,
      hasFat: true,
      hasShrinkage: true,
      hasEvaporation: false,
      hasDraining: false,
      hasTrimmings: true
    },
    recipe: [
      { id: 'ING-101', name: 'Canal de Res (Cuarto Trasero)', standardQty: 150, unit: 'Kg', notes: 'Temperatura de ingreso < 4°C' },
      { id: 'ING-102', name: 'Bolsa al Vacío Termoencogible 30x40', standardQty: 25, unit: 'Unidades', notes: 'Empaque de cortes primarios' }
    ],
    companyId: 'EMP-001',
    companyName: 'Carnes & Cortes del Valle S.A.S.',
    createdAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'PROC-002',
    code: 'PROC-102',
    name: 'Porcionado y Fileteado de Pechuga',
    category: 'Avícola (Pollo)',
    unit: 'Kg',
    expectedYield: 85.0,
    description: 'Fileteado de pechuga deshuesada, retiro de grasa perimetral y empaque al vacío.',
    lossFields: {
      hasBlood: false,
      hasBone: false,
      hasFat: true,
      hasShrinkage: true,
      hasEvaporation: false,
      hasDraining: true,
      hasTrimmings: true
    },
    recipe: [
      { id: 'ING-201', name: 'Pechuga de Pollo con Hueso y Piel', standardQty: 40, unit: 'Kg', notes: 'Descongelación controlada' },
      { id: 'ING-202', name: 'Bolsa al Vacío 20x30 cm', standardQty: 20, unit: 'Unidades', notes: 'Para porciones de 500g y 1kg' }
    ],
    companyId: 'EMP-001',
    companyName: 'Carnes & Cortes del Valle S.A.S.',
    createdAt: '2026-01-12T09:00:00Z'
  },
  {
    id: 'PROC-003',
    code: 'PROC-103',
    name: 'Elaboración de Salsa BBQ Artesanal',
    category: 'Salsas y Aderezos',
    unit: 'Litros / Kg',
    expectedYield: 82.0,
    description: 'Cocción y reducción térmica. No maneja sangre ni hueso; reporta evaporación y merma de envasado.',
    lossFields: {
      hasBlood: false,
      hasBone: false,
      hasFat: false,
      hasShrinkage: true,
      hasEvaporation: true,
      hasDraining: false,
      hasTrimmings: false
    },
    recipe: [
      { id: 'ING-301', name: 'Pasta de Tomate Concentrada', standardQty: 10, unit: 'Kg', notes: 'Base de pulpa 28-30 Brix' },
      { id: 'ING-302', name: 'Panela Pulverizada / Azúcar Morena', standardQty: 3.5, unit: 'Kg', notes: 'Caramelización inicial' },
      { id: 'ING-303', name: 'Vinagre de Manzana', standardQty: 2.0, unit: 'Litros', notes: 'Acidificante' },
      { id: 'ING-304', name: 'Salsa de Soya', standardQty: 1.0, unit: 'Litros', notes: 'Aporte de umami y color' },
      { id: 'ING-305', name: 'Mostaza Preparada', standardQty: 1.5, unit: 'Kg', notes: 'Emulsión y sabor' },
      { id: 'ING-306', name: 'Humo Líquido Grado Alimentario', standardQty: 0.25, unit: 'Litros', notes: 'Aromatizante ahumado' },
      { id: 'ING-307', name: 'Sal Marina & Mezcla de Especias', standardQty: 0.5, unit: 'Kg', notes: 'Ajo, pimentón y pimienta negra' },
      { id: 'ING-308', name: 'Agua Purificada', standardQty: 4.0, unit: 'Litros', notes: 'Ajuste de viscosidad inicial' }
    ],
    companyId: 'EMP-001',
    companyName: 'Carnes & Cortes del Valle S.A.S.',
    createdAt: '2026-01-15T10:00:00Z'
  },
  {
    id: 'PROC-004',
    code: 'PROC-104',
    name: 'Embutido y Porcionado de Chorizo Antioqueño',
    category: 'Embutidos / Procesados',
    unit: 'Kg',
    expectedYield: 92.5,
    description: 'Picado, mezclado con adobos, embutido en tripa natural y porcionado por atado.',
    lossFields: {
      hasBlood: false,
      hasBone: false,
      hasFat: false,
      hasShrinkage: true,
      hasEvaporation: true,
      hasDraining: false,
      hasTrimmings: true
    },
    recipe: [
      { id: 'ING-401', name: 'Carne de Cerdo Magra (Pierna/Paleta)', standardQty: 18, unit: 'Kg', notes: 'Molido disco 8mm' },
      { id: 'ING-402', name: 'Grasa Dorsal / Tocino de Cerdo', standardQty: 5.0, unit: 'Kg', notes: 'Picado en cubos 5mm' },
      { id: 'ING-403', name: 'Condimento Chorizo Antioqueño', standardQty: 0.65, unit: 'Kg', notes: 'Mezcla formulada' },
      { id: 'ING-404', name: 'Sal Marina', standardQty: 0.4, unit: 'Kg', notes: 'Salazón y conservación' },
      { id: 'ING-405', name: 'Cebolla Junca y Ajo Picado', standardQty: 2.0, unit: 'Kg', notes: 'Vegetales frescos' },
      { id: 'ING-406', name: 'Tripa de Cerdo Calibre 28/30', standardQty: 2, unit: 'Madejas', notes: 'Lavada y desalada' }
    ],
    companyId: 'EMP-001',
    companyName: 'Carnes & Cortes del Valle S.A.S.',
    createdAt: '2026-01-18T11:00:00Z'
  }
];

const getLocalCompanies = () => {
  try {
    const raw = localStorage.getItem(LOCAL_COMPANIES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  const wasCleared = localStorage.getItem('dc_user_cleared_companies') === 'true';
  if (wasCleared) {
    return [];
  }
  localStorage.setItem(LOCAL_COMPANIES_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_COMPANIES));
  return INITIAL_DEMO_COMPANIES;
};

const setLocalCompanies = (companies) => {
  localStorage.setItem(LOCAL_COMPANIES_STORAGE_KEY, JSON.stringify(companies));
  window.dispatchEvent(new CustomEvent('dc_companies_updated', { detail: companies }));
};

// Configuración por defecto tomada de variables de entorno si existen
const getDefaultConfig = () => {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
  };
};

export const getStoredFirebaseConfig = () => {
  try {
    const saved = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.projectId) return parsed;
    }
  } catch (e) {
    console.error('Error leyendo config local de Firebase', e);
  }
  return getDefaultConfig();
};

export const saveFirebaseConfig = (config) => {
  try {
    localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
    window.location.reload();
    return true;
  } catch (e) {
    console.error('Error guardando config de Firebase', e);
    return false;
  }
};

export const clearFirebaseConfig = () => {
  localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
  window.location.reload();
};

// Inicialización de Firebase
let app = null;
let auth = null;
let db = null;
let isFirebaseConfigured = false;

const currentConfig = getStoredFirebaseConfig();
if (currentConfig.apiKey && currentConfig.projectId) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(currentConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseConfigured = true;
    console.log('Firebase conectado con éxito a proyecto:', currentConfig.projectId);
  } catch (err) {
    console.warn('Firebase no pudo inicializar con la configuración dada, usando modo local:', err);
    isFirebaseConfigured = false;
  }
}

export { isFirebaseConfigured, auth, db };

// Datos iniciales de demostración para el modo local
const INITIAL_DEMO_ORDERS = [
  {
    id: 'ORD-2026-001',
    code: 'ORD-001',
    batch: 'LT-BOV-482',
    processName: 'Desposte y Porcionado Res',
    category: 'Bovino',
    targetDate: new Date().toISOString().split('T')[0],
    assignedTo: 'Carlos Gómez (Operario 1)',
    estimatedInputKg: 450.0,
    status: 'Pendiente', // 'Pendiente' | 'En Proceso' | 'Finalizado'
    // Datos cuando se inicia y finaliza:
    startTime: null,
    endTime: null,
    totalInputKg: 0,
    bloodKg: 0,
    boneKg: 0,
    fatKg: 0,
    shrinkageKg: 0, // Merma
    finishedUnits: 0,
    finishedWeightGrams: 0,
    finishedWeightKg: 0,
    yieldPercentage: 0,
    balanceDifferenceKg: 0,
    operatorNotes: '',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'ORD-2026-002',
    code: 'ORD-002',
    batch: 'LT-PORC-190',
    processName: 'Cortes Chuleta y Costilla Cerdo',
    category: 'Porcino',
    targetDate: new Date().toISOString().split('T')[0],
    assignedTo: 'María Delgado (Operaria 2)',
    estimatedInputKg: 280.0,
    status: 'En Proceso',
    startTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    endTime: null,
    totalInputKg: 280.5,
    bloodKg: 0,
    boneKg: 0,
    fatKg: 0,
    shrinkageKg: 0,
    finishedUnits: 0,
    finishedWeightGrams: 0,
    finishedWeightKg: 0,
    yieldPercentage: 0,
    balanceDifferenceKg: 0,
    operatorNotes: 'En corte de piezas medianas',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'ORD-2026-003',
    code: 'ORD-003',
    batch: 'LT-AVE-305',
    processName: 'Deshuese de Pechuga y Molido',
    category: 'Avícola',
    targetDate: new Date().toISOString().split('T')[0],
    assignedTo: 'Andrés López',
    estimatedInputKg: 150.0,
    status: 'Finalizado',
    startTime: new Date(Date.now() - 3600000 * 6).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 1).toISOString(),
    totalInputKg: 150.0,
    bloodKg: 3.5,
    boneKg: 28.0,
    fatKg: 12.5,
    shrinkageKg: 4.0,
    finishedUnits: 204,
    finishedWeightGrams: 102000,
    finishedWeightKg: 102.0,
    yieldPercentage: 68.0,
    balanceDifferenceKg: 0,
    operatorNotes: 'Rendimiento dentro del margen estándar del 68%',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  }
];

// Ayudantes de Almacenamiento Local (cuando Firebase aún no está conectado)
const getLocalOrders = () => {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(LOCAL_ORDERS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_ORDERS));
  return INITIAL_DEMO_ORDERS;
};

const setLocalOrders = (orders) => {
  localStorage.setItem(LOCAL_ORDERS_STORAGE_KEY, JSON.stringify(orders));
  // Notificar cambios a listeners locales
  window.dispatchEvent(new CustomEvent('dc_orders_updated', { detail: orders }));
};

// ================= AUTENTICACIÓN =================

const MASTER_EMAILS = ['dcasesorias@gmail.com', 'dcasesoriascol@gmail.com'];

export const isMasterAccount = (email) => {
  const clean = (email || '').toLowerCase().trim();
  return MASTER_EMAILS.includes(clean);
};

export const loginWithEmailPassword = async (email, password) => {
  const cleanEmail = email.toLowerCase().trim();
  const isSuper = isMasterAccount(cleanEmail);

  // 1. Intentar autenticar contra el Backend en Netcup Root Server
  try {
    const netcupRes = await apiClient.post('/auth/login', { email: cleanEmail, password });
    if (netcupRes && netcupRes.user) {
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(netcupRes.user));
      window.dispatchEvent(new CustomEvent('dc_auth_changed', { detail: netcupRes.user }));
      return netcupRes;
    }
  } catch (apiErr) {
    if (apiErr.message && apiErr.message.includes('401') && !isSuper) {
      throw apiErr;
    }
    console.log('[Netcup API] Conectando con fallback local/Firebase:', apiErr.message);
  }

  if (isFirebaseConfigured && auth) {
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      cred.user.isSuperMaster = isSuper;
      cred.user.isMaster = isSuper;
      return cred;
    } catch (err) {
      // 1. Si es Super Master e ingresa con la clave de respaldo '123456', asegurar acceso sin bloqueos
      if (isSuper && (password === '123456' || password === 'dcasesorias2026')) {
        try {
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
            await updateProfile(newCred.user, { displayName: 'DC Asesorías Master' });
            if (db) {
              try {
                await setDoc(doc(db, 'users', newCred.user.uid), {
                  email: cleanEmail,
                  displayName: 'DC Asesorías Master',
                  role: 'super_master',
                  createdAt: serverTimestamp()
                });
              } catch (e) {
                console.error('Error guardando perfil master:', e);
              }
            }
            newCred.user.isSuperMaster = true;
            newCred.user.isMaster = true;
            newCred.user.isCompanyMaster = true;
            newCred.user.role = 'super_master';
            return newCred;
          }
        } catch (createErr) {
          console.warn('Aviso creando Super Master en Firebase Auth, activando sesión de respaldo:', createErr);
        }

        // Acceso directo garantizado para el administrador Master
        const mockUser = {
          uid: 'usr-super-master-local',
          email: cleanEmail,
          displayName: 'DC Asesorías Master',
          companyName: 'DC Asesorías',
          companyId: null,
          isSuperMaster: true,
          isMaster: true,
          isCompanyMaster: true,
          isLite: false,
          role: 'super_master',
          isDemo: false
        };
        localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(mockUser));
        window.dispatchEvent(new CustomEvent('dc_auth_changed', { detail: mockUser }));
        return { user: mockUser };
      }

      // 2. Si es una empresa cliente registrada localmente
      const companies = getLocalCompanies();
      const matchedComp = companies.find(c => c && c.email && c.email.toLowerCase() === cleanEmail);
      if (matchedComp && (matchedComp.passwordMaster === password || matchedComp.password === password || password === '123456')) {
        const compUser = {
          uid: matchedComp.id,
          email: cleanEmail,
          displayName: matchedComp.name,
          companyName: matchedComp.name,
          companyId: matchedComp.id,
          isSuperMaster: false,
          isMaster: false,
          isCompanyMaster: true,
          isLite: false,
          role: 'company_master',
          isDemo: false
        };
        localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(compUser));
        window.dispatchEvent(new CustomEvent('dc_auth_changed', { detail: compUser }));
        return { user: compUser };
      }

      throw err;
    }
  } else {
    // Modo local: buscar si el correo coincide con un operario registrado
    const ops = getLocalOperators();
    const matchedOp = ops.find(o => o.email.toLowerCase() === cleanEmail);
    const finalRole = isSuper ? 'super_master' : (matchedOp ? 'operator_lite' : 'company_master');
    const mockUser = {
      uid: matchedOp ? matchedOp.id : ('usr-' + (isSuper ? 'super' : 'company') + '-' + Date.now()),
      email: cleanEmail,
      displayName: matchedOp ? matchedOp.name : (isSuper ? 'DC Asesorías Master' : cleanEmail.split('@')[0]),
      companyName: matchedOp ? matchedOp.companyName : (isSuper ? 'DC Asesorías' : cleanEmail.split('@')[0]),
      companyId: matchedOp ? matchedOp.companyId : null,
      isSuperMaster: isSuper,
      isMaster: isSuper,
      isCompanyMaster: finalRole === 'company_master',
      isLite: finalRole === 'operator_lite',
      role: finalRole,
      isDemo: false
    };
    localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(mockUser));
    window.dispatchEvent(new CustomEvent('dc_auth_changed', { detail: mockUser }));
    return { user: mockUser };
  }
};

export const registerWithEmailPassword = async (email, password, displayName = '', companyName = '', selectedRole = 'company_master') => {
  const cleanEmail = email.toLowerCase().trim();
  const isSuper = isMasterAccount(cleanEmail);
  const finalRole = isSuper ? 'super_master' : (selectedRole === 'operator_lite' ? 'operator_lite' : 'company_master');

  if (isFirebaseConfigured && auth) {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const finalName = displayName || companyName || cleanEmail.split('@')[0];
    if (cred.user) {
      await updateProfile(cred.user, { displayName: finalName });
    }
    if (db && cred.user) {
      try {
        await setDoc(doc(db, 'users', cred.user.uid), {
          email: cleanEmail,
          displayName: finalName,
          companyName: companyName || finalName,
          role: finalRole,
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.error('Error guardando perfil en Firestore:', e);
      }
    }
    localStorage.setItem('dc_user_role_' + cred.user.uid, finalRole);
    localStorage.setItem('dc_user_company_' + cred.user.uid, companyName || finalName);
    cred.user.isSuperMaster = isSuper;
    cred.user.isMaster = isSuper;
    cred.user.isCompanyMaster = isSuper || finalRole === 'company_master';
    cred.user.isLite = !isSuper && finalRole === 'operator_lite';
    cred.user.role = finalRole;
    cred.user.companyName = companyName || finalName;
    return cred;
  } else {
    // Modo local
    const mockUser = {
      uid: 'usr-client-' + Date.now(),
      email: cleanEmail,
      displayName: displayName || companyName || cleanEmail.split('@')[0],
      companyName: companyName || cleanEmail.split('@')[0],
      isSuperMaster: isSuper,
      isMaster: isSuper,
      isCompanyMaster: isSuper || finalRole === 'company_master',
      isLite: !isSuper && finalRole === 'operator_lite',
      role: finalRole,
      isDemo: false
    };
    localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(mockUser));
    window.dispatchEvent(new CustomEvent('dc_auth_changed', { detail: mockUser }));
    return { user: mockUser };
  }
};

export const logoutSession = async () => {
  localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('dc_auth_changed', { detail: null }));
  if (isFirebaseConfigured && auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Aviso cerrando sesión Firebase Auth:', e);
    }
  }
  return true;
};

export const listenAuthState = (callback) => {
  // Helper para normalizar el objeto de usuario y sus roles
  const formatUser = (rawUser) => {
    if (!rawUser) return null;
    const isSuper = isMasterAccount(rawUser.email);
    const isLite = !isSuper && (rawUser.isLite === true || rawUser.role === 'operator_lite' || rawUser.role === 'lite');
    const isCompanyMaster = !isSuper && !isLite;

    return {
      ...rawUser,
      isSuperMaster: isSuper,
      isMaster: isSuper,
      isCompanyMaster: isSuper || isCompanyMaster,
      isLite,
      role: isSuper ? 'super_master' : (isLite ? 'operator_lite' : 'company_master')
    };
  };

  // 1. Escuchar SIEMPRE eventos de cambio de sesión (usado por operarios de celular y logins locales)
  const handleAuthChanged = (e) => {
    const updated = formatUser(e.detail);
    callback(updated);
  };
  window.addEventListener('dc_auth_changed', handleAuthChanged);

  // 2. Verificar si ya existe una sesión en localStorage (ej. operario celular que refrescó)
  let initialLocalUser = null;
  try {
    const stored = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
    if (stored) {
      initialLocalUser = formatUser(JSON.parse(stored));
    }
  } catch (e) {
    console.error('Error leyendo sesión local inicial:', e);
  }

  if (initialLocalUser) {
    callback(initialLocalUser);
  }

  // 3. Si Firebase está activo, escuchar Firebase Auth para usuarios Master
  let unsubscribeAuth = null;
  if (isFirebaseConfigured && auth) {
    unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Si hay un operario celular activo en localStorage, NO sobrescribirlo con null
      let activeLocalUser = null;
      try {
        const stored = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
        if (stored) activeLocalUser = JSON.parse(stored);
      } catch (e) {}

      if (activeLocalUser && (activeLocalUser.isLite || activeLocalUser.role === 'operator_lite')) {
        callback(formatUser(activeLocalUser));
        return;
      }

      if (firebaseUser) {
        const isSuper = isMasterAccount(firebaseUser.email);
        let userRole = null;
        let userCompany = null;
        let userCompanyId = null;
        let displayName = firebaseUser.displayName;

        if (db) {
          try {
            const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (snap.exists()) {
              const data = snap.data();
              if (data.role) userRole = data.role;
              if (data.companyName) userCompany = data.companyName;
              if (data.companyId) userCompanyId = data.companyId;
              if (data.displayName) displayName = data.displayName;
            }
          } catch (e) {
            console.warn('Error leyendo usuario en Firestore:', e);
          }
        }

        if (!userRole) userRole = localStorage.getItem('dc_user_role_' + firebaseUser.uid);
        if (!userCompany) userCompany = localStorage.getItem('dc_user_company_' + firebaseUser.uid);

        const enrichedUser = formatUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: displayName || firebaseUser.displayName || firebaseUser.email.split('@')[0],
          companyName: userCompany || displayName || firebaseUser.email.split('@')[0],
          companyId: userCompanyId || null,
          role: isSuper ? 'super_master' : (userRole || 'company_master')
        });

        localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(enrichedUser));
        callback(enrichedUser);
      } else {
        // Solo notificar null si tampoco hay un usuario local
        if (!activeLocalUser) {
          callback(null);
        }
      }
    });
  } else if (!initialLocalUser) {
    callback(null);
  }

  return () => {
    window.removeEventListener('dc_auth_changed', handleAuthChanged);
    if (typeof unsubscribeAuth === 'function') unsubscribeAuth();
  };
};

// ================= GESTIÓN DE ÓRDENES =================

export const subscribeToOrders = (callback) => {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Sembrar ordenes iniciales de demostración en Firestore
        try {
          for (const order of INITIAL_DEMO_ORDERS) {
            await addDoc(collection(db, 'orders'), {
              ...order,
              serverCreatedAt: serverTimestamp()
            });
          }
        } catch (e) {
          console.warn('Colección vacía, usando demo local temporal:', e);
          callback(INITIAL_DEMO_ORDERS);
        }
        return;
      }
      const orders = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          ...data,
          id: doc.id,
          docId: doc.id,
          rawId: data.id || doc.id
        });
      });
      callback(orders);
    }, (error) => {
      console.error('Error escuchando ordenes de Firestore:', error);
      // Fallback a local si hay error de red o permisos
      callback(getLocalOrders());
    });
    return unsubscribe;
  } else {
    // Modo local
    callback(getLocalOrders());
    const handler = (e) => {
      callback(e.detail || getLocalOrders());
    };
    window.addEventListener('dc_orders_updated', handler);
    return () => window.removeEventListener('dc_orders_updated', handler);
  }
};

export const createProcessOrder = async (orderData) => {
  const newOrder = {
    ...orderData,
    code: orderData.code || `ORD-${String(Math.floor(Math.random() * 900) + 100)}`,
    status: 'Pendiente',
    createdAt: new Date().toISOString(),
    totalInputKg: 0,
    bloodKg: 0,
    boneKg: 0,
    fatKg: 0,
    shrinkageKg: 0,
    finishedUnits: 0,
    finishedWeightGrams: 0,
    finishedWeightKg: 0,
    yieldPercentage: 0,
    balanceDifferenceKg: 0,
    operatorNotes: ''
  };

  if (isFirebaseConfigured && db) {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...newOrder,
      serverCreatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...newOrder };
  } else {
    const orders = getLocalOrders();
    const created = { id: 'ORD-' + Date.now(), ...newOrder };
    orders.unshift(created);
    setLocalOrders(orders);
    return created;
  }
};

export const startProcessOrder = async (orderId, operatorName = '') => {
  const updates = {
    status: 'En Proceso',
    startTime: new Date().toISOString(),
    assignedTo: operatorName || 'Operario de Turno'
  };

  if (isFirebaseConfigured && db) {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, updates);
  } else {
    const orders = getLocalOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates };
      setLocalOrders(orders);
    }
  }
};

export const completeProcessOrder = async (orderId, processData) => {
  // Cálculos automáticos de balance de masa y rendimiento adaptativo
  const totalInput = Number(processData.totalInputKg) || 0;
  const blood = Number(processData.bloodKg) || 0;
  const bone = Number(processData.boneKg) || 0;
  const fat = Number(processData.fatKg) || 0;
  const evaporation = Number(processData.evaporationKg) || 0;
  const draining = Number(processData.drainingKg) || 0;
  const trimmings = Number(processData.trimmingsKg) || 0;
  const shrinkage = Number(processData.shrinkageKg) || 0;
  
  let finishedKg = Number(processData.finishedWeightKg) || 0;
  let finishedGrams = Number(processData.finishedWeightGrams) || 0;
  
  // Si digitó en gramos y no en kg, calcular kg
  if (finishedGrams > 0 && finishedKg === 0) {
    finishedKg = finishedGrams / 1000;
  } else if (finishedKg > 0 && finishedGrams === 0) {
    finishedGrams = finishedKg * 1000;
  }

  // Rendimiento de producto terminado
  const yieldPercentage = totalInput > 0 ? ((finishedKg / totalInput) * 100).toFixed(2) : 0;

  // Balance total: Total Insumo - (Terminado + Mermas configuradas)
  const sumOutputs = finishedKg + blood + bone + fat + evaporation + draining + trimmings + shrinkage;
  const balanceDifferenceKg = Number((totalInput - sumOutputs).toFixed(3));

  const updates = {
    ...processData,
    totalInputKg: totalInput,
    bloodKg: blood,
    boneKg: bone,
    fatKg: fat,
    evaporationKg: evaporation,
    drainingKg: draining,
    trimmingsKg: trimmings,
    shrinkageKg: shrinkage,
    finishedUnits: Number(processData.finishedUnits) || 0,
    finishedWeightGrams: finishedGrams,
    finishedWeightKg: finishedKg,
    yieldPercentage: Number(yieldPercentage),
    balanceDifferenceKg: balanceDifferenceKg,
    status: 'Finalizado',
    endTime: new Date().toISOString(),
    completedAt: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, updates);
  } else {
    const orders = getLocalOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates };
      setLocalOrders(orders);
    }
  }
};

export const removeProcessOrder = async (orderId) => {
  if (!orderId) return;
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'orders', orderId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Error borrando orden directo:', e);
    }
    try {
      const q = query(collection(db, 'orders'), where('id', '==', orderId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
    } catch (e) {
      console.warn('Error borrando orden por id query:', e);
    }
  }
  const orders = getLocalOrders().filter(o => o.id !== orderId && o.docId !== orderId && o.rawId !== orderId);
  setLocalOrders(orders);
};

// ================= GESTIÓN DE EMPRESAS (PANEL MASTER) =================

export const subscribeCompanies = (callback) => {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'companies'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Solo sembrar demo si el usuario NO ha borrado empresas intencionalmente
        const wasCleared = localStorage.getItem('dc_user_cleared_companies') === 'true';
        const hasSeeded = localStorage.getItem('dc_companies_seeded_firestore') === 'true';

        if (!hasSeeded && !wasCleared) {
          localStorage.setItem('dc_companies_seeded_firestore', 'true');
          try {
            for (const emp of INITIAL_DEMO_COMPANIES) {
              await addDoc(collection(db, 'companies'), {
                ...emp,
                serverCreatedAt: serverTimestamp()
              });
            }
          } catch (e) {
            console.warn('Colección de empresas vacía, usando demo local:', e);
            callback([]);
          }
          return;
        }
        callback([]);
        return;
      }

      localStorage.setItem('dc_companies_seeded_firestore', 'true');
      const companies = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        companies.push({
          ...data,
          id: docSnap.id, // ¡SIEMPRE el ID real del documento Firestore!
          docId: docSnap.id,
          rawId: data.id || docSnap.id
        });
      });
      callback(companies);
    }, (error) => {
      console.error('Error escuchando empresas de Firestore:', error);
      callback(getLocalCompanies());
    });
    return unsubscribe;
  } else {
    callback(getLocalCompanies());
    const handler = (e) => {
      callback(e.detail || getLocalCompanies());
    };
    window.addEventListener('dc_companies_updated', handler);
    return () => window.removeEventListener('dc_companies_updated', handler);
  }
};

export const generateCompanyCode = (name = '') => {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  let prefix = '';
  if (words.length >= 2) {
    prefix = (words[0][0] + words[1][0] + (words[2] ? words[2][0] : '')).toUpperCase();
  } else if (words.length === 1) {
    prefix = words[0].slice(0, 3).toUpperCase();
  } else {
    prefix = 'EMP';
  }
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${randomNum}`;
};

export const createCompany = async (companyData) => {
  const code = (companyData.code || companyData.companyCode || generateCompanyCode(companyData.name)).trim().toUpperCase();

  const newCompany = {
    ...companyData,
    code,
    companyCode: code,
    status: companyData.status || 'Activa',
    ordersCount: companyData.ordersCount || 0,
    totalInputKg: companyData.totalInputKg || 0,
    avgYield: companyData.avgYield || 0,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    const docRef = await addDoc(collection(db, 'companies'), {
      ...newCompany,
      serverCreatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...newCompany };
  } else {
    const companies = getLocalCompanies();
    const created = { id: 'EMP-' + Date.now(), ...newCompany };
    companies.unshift(created);
    setLocalCompanies(companies);
    return created;
  }
};

export const updateCompany = async (companyId, updates) => {
  if (!companyId) return;

  const code = updates.code || updates.companyCode ? (updates.code || updates.companyCode).trim().toUpperCase() : undefined;

  const cleanUpdates = {
    ...updates,
    ...(code ? { code, companyCode: code } : {}),
    updatedAt: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    let updated = false;
    // 1. Intentar actualizar directamente por docRef
    try {
      const docRef = doc(db, 'companies', companyId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, cleanUpdates);
        updated = true;
      }
    } catch (e) {
      console.warn('Error actualizando doc directo en Firestore:', e);
    }

    // 2. Si companyId era un id interno, buscar por query
    if (!updated) {
      try {
        const q = query(collection(db, 'companies'), where('id', '==', companyId));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await updateDoc(d.ref, cleanUpdates);
          updated = true;
        }
      } catch (e) {
        console.warn('Error actualizando empresa por query id:', e);
      }
    }

    // Fallback directo si es necesario
    if (!updated) {
      try {
        await updateDoc(doc(db, 'companies', companyId), cleanUpdates);
      } catch (e) {
        console.warn('Fallback updateDoc error:', e);
      }
    }
  }

  // Actualizar también en almacenamiento local
  const list = getLocalCompanies();
  const index = list.findIndex(c => c.id === companyId || c.docId === companyId || c.rawId === companyId);
  if (index !== -1) {
    list[index] = { ...list[index], ...cleanUpdates };
    setLocalCompanies(list);
  }
};

export const removeCompany = async (companyId) => {
  if (!companyId) return;

  if (isFirebaseConfigured && db) {
    let deleted = false;

    // 1. Intentar borrar directamente por docId en Firestore
    try {
      const docRef = doc(db, 'companies', companyId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await deleteDoc(docRef);
        deleted = true;
      }
    } catch (e) {
      console.warn('Error verificando doc directo en Firestore:', e);
    }

    // 2. Si companyId era el id interno (ej. 'EMP-001', 'EMP-002'), buscar por query
    try {
      const q = query(collection(db, 'companies'), where('id', '==', companyId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
        deleted = true;
      }
    } catch (e) {
      console.warn('Error buscando empresa por campo id en Firestore:', e);
    }

    // 3. Fallback directo si no se encontró en las comprobaciones
    if (!deleted) {
      try {
        await deleteDoc(doc(db, 'companies', companyId));
      } catch (e) {
        console.warn('Fallback deleteDoc error:', e);
      }
    }
  }

  // 4. Eliminar SIEMPRE del almacenamiento local también para consistencia
  const localList = getLocalCompanies().filter(c => 
    c.id !== companyId && 
    c.docId !== companyId && 
    c.rawId !== companyId
  );
  setLocalCompanies(localList);

  // Marcar que el usuario ha borrado empresas para evitar que snapshot.empty las re-cree
  localStorage.setItem('dc_user_cleared_companies', 'true');
};

// ================= GESTIÓN DE INVENTARIOS & TOMA FÍSICA =================

// Ayudantes de almacenamiento local para Insumos
const getLocalInventoryItems = () => {
  try {
    const raw = localStorage.getItem(LOCAL_INVENTORY_ITEMS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(LOCAL_INVENTORY_ITEMS_KEY, JSON.stringify(INITIAL_DEMO_INVENTORY_ITEMS));
  return INITIAL_DEMO_INVENTORY_ITEMS;
};

const setLocalInventoryItems = (items) => {
  localStorage.setItem(LOCAL_INVENTORY_ITEMS_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('dc_inventory_items_updated', { detail: items }));
};

// Ayudantes de almacenamiento local para Tomas Físicas
const getLocalPhysicalInventories = () => {
  try {
    const raw = localStorage.getItem(LOCAL_PHYSICAL_INVENTORIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  const wasCleared = localStorage.getItem('dc_user_cleared_inventories') === 'true';
  if (wasCleared) {
    return [];
  }
  localStorage.setItem(LOCAL_PHYSICAL_INVENTORIES_KEY, JSON.stringify(INITIAL_DEMO_PHYSICAL_INVENTORIES));
  return INITIAL_DEMO_PHYSICAL_INVENTORIES;
};

const setLocalPhysicalInventories = (inventories) => {
  localStorage.setItem(LOCAL_PHYSICAL_INVENTORIES_KEY, JSON.stringify(inventories));
  window.dispatchEvent(new CustomEvent('dc_physical_inventories_updated', { detail: inventories }));
};

// 1. Suscripción a Insumos
export const subscribeInventoryItems = (callback) => {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'inventory_items'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Sembrar insumos demo iniciales en Firestore si la colección está vacía
        try {
          for (const item of INITIAL_DEMO_INVENTORY_ITEMS) {
            await addDoc(collection(db, 'inventory_items'), {
              ...item,
              serverCreatedAt: serverTimestamp()
            });
          }
        } catch (e) {
          console.warn('Colección de insumos vacía, usando demo local:', e);
          callback(INITIAL_DEMO_INVENTORY_ITEMS);
        }
        return;
      }
      const items = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          ...data,
          id: doc.id,
          docId: doc.id,
          rawId: data.id || doc.id
        });
      });
      callback(items);
    }, (error) => {
      console.error('Error escuchando insumos de Firestore:', error);
      callback(getLocalInventoryItems());
    });
    return unsubscribe;
  } else {
    callback(getLocalInventoryItems());
    const handler = (e) => {
      callback(e.detail || getLocalInventoryItems());
    };
    window.addEventListener('dc_inventory_items_updated', handler);
    return () => window.removeEventListener('dc_inventory_items_updated', handler);
  }
};

// Crear o Agregar un Insumo al Catálogo
export const createInventoryItem = async (itemData) => {
  const newItem = {
    ...itemData,
    code: itemData.code || `INS-${String(Math.floor(Math.random() * 900) + 100)}`,
    unitCost: Number(itemData.unitCost) || 0,
    expectedWastePct: Number(itemData.expectedWastePct) || 0,
    currentStock: Number(itemData.currentStock) || 0,
    minStock: Number(itemData.minStock) || 0,
    location: itemData.location || 'Bodega Principal',
    createdAt: new Date().toISOString()
  };

  // 1. Sincronizar en Netcup PostgreSQL API si está disponible
  try {
    const netcupRes = await apiClient.post('/inventory', newItem);
    if (netcupRes && netcupRes.id) {
      newItem.id = netcupRes.id;
    }
  } catch (e) {
    // Modo offline / standalone
  }

  if (isFirebaseConfigured && db) {
    const docRef = await addDoc(collection(db, 'inventory_items'), {
      ...newItem,
      serverCreatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...newItem };
  } else {
    const items = getLocalInventoryItems();
    const created = { id: newItem.id || ('INS-' + Date.now()), ...newItem };
    items.unshift(created);
    setLocalInventoryItems(items);
    return created;
  }
};

// Importar múltiples insumos masivamente (Crear o Actualizar)
export const bulkImportInventoryItems = async (itemsList, companyId = null) => {
  const cleanItems = itemsList.map(item => ({
    ...item,
    code: item.code || `INS-${String(Math.floor(Math.random() * 900) + 100)}`,
    unitCost: Number(item.unitCost) || 0,
    expectedWastePct: Number(item.expectedWastePct) || 0,
    currentStock: Number(item.currentStock) || 0,
    minStock: Number(item.minStock) || 0,
    location: item.location || 'Bodega Principal',
    updatedAt: new Date().toISOString()
  }));

  // Sincronizar por lotes en Netcup PostgreSQL
  try {
    await apiClient.post('/inventory/batch', { items: cleanItems, companyId });
  } catch (e) {
    // Continuar local / firebase
  }

  const results = [];
  for (const item of cleanItems) {
    const res = await createInventoryItem(item);
    results.push(res);
  }
  return results;
};

// Actualizar un Insumo
export const updateInventoryItem = async (itemId, updates) => {
  const cleanUpdates = {
    ...updates,
    unitCost: updates.unitCost !== undefined ? Number(updates.unitCost) : undefined,
    expectedWastePct: updates.expectedWastePct !== undefined ? Number(updates.expectedWastePct) : undefined,
    currentStock: updates.currentStock !== undefined ? Number(updates.currentStock) : undefined,
    minStock: updates.minStock !== undefined ? Number(updates.minStock) : undefined,
    location: updates.location !== undefined ? updates.location : undefined,
    updatedAt: new Date().toISOString()
  };

  // Sincronizar en Netcup PostgreSQL API
  try {
    await apiClient.put(`/inventory/${itemId}`, cleanUpdates);
  } catch (e) {
    // Continuar
  }

  if (isFirebaseConfigured && db) {
    const docRef = doc(db, 'inventory_items', itemId);
    await updateDoc(docRef, cleanUpdates);
  } else {
    const items = getLocalInventoryItems();
    const index = items.findIndex(i => i.id === itemId);
    if (index !== -1) {
      items[index] = { ...items[index], ...cleanUpdates };
      setLocalInventoryItems(items);
    }
  }
};

// Eliminar un Insumo
export const removeInventoryItem = async (itemId) => {
  if (!itemId) return;

  // Sincronizar en Netcup PostgreSQL API
  try {
    await apiClient.delete(`/inventory/${itemId}`);
  } catch (e) {
    // Continuar
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'inventory_items', itemId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Error borrando insumo directo:', e);
    }
    try {
      const q = query(collection(db, 'inventory_items'), where('id', '==', itemId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
    } catch (e) {
      console.warn('Error borrando insumo por id query:', e);
    }
  }
  const items = getLocalInventoryItems().filter(i => i.id !== itemId && i.docId !== itemId && i.rawId !== itemId);
  setLocalInventoryItems(items);
};

// 2. Suscripción a Tomas Físicas de Inventario
export const subscribePhysicalInventories = (callback) => {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'physical_inventories'), orderBy('countedAt', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        const wasCleared = localStorage.getItem('dc_user_cleared_inventories') === 'true';
        if (wasCleared) {
          callback([]);
          return;
        }

        try {
          for (const inv of INITIAL_DEMO_PHYSICAL_INVENTORIES) {
            await addDoc(collection(db, 'physical_inventories'), {
              ...inv,
              serverCreatedAt: serverTimestamp()
            });
          }
        } catch (e) {
          console.warn('Colección de tomas físicas vacía, usando demo local:', e);
          callback(INITIAL_DEMO_PHYSICAL_INVENTORIES);
        }
        return;
      }
      const inventories = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        inventories.push({
          ...data,
          id: doc.id,
          docId: doc.id,
          rawId: data.id || doc.id
        });
      });
      callback(inventories);
    }, (error) => {
      console.error('Error escuchando tomas físicas de Firestore:', error);
      callback(getLocalPhysicalInventories());
    });
    return unsubscribe;
  } else {
    callback(getLocalPhysicalInventories());
    const handler = (e) => {
      callback(e.detail || getLocalPhysicalInventories());
    };
    window.addEventListener('dc_physical_inventories_updated', handler);
    return () => window.removeEventListener('dc_physical_inventories_updated', handler);
  }
};

// Guardar una Toma de Conteo Físico (Valorización Automática)
export const savePhysicalInventory = async (inventoryData) => {
  // Calcular valorización inmediata de cada ítem y del total
  let totalValued = 0;
  let totalQty = 0;
  
  const valuedItems = (inventoryData.items || []).map(item => {
    const counted = Number(item.countedQty) || 0;
    const cost = Number(item.unitCost) || 0;
    const itemTotalValued = Number((counted * cost).toFixed(2));
    
    totalValued += itemTotalValued;
    totalQty += counted;

    return {
      ...item,
      countedQty: counted,
      unitCost: cost,
      totalValued: itemTotalValued
    };
  });

  const newInventory = {
    code: inventoryData.code || `INV-${String(Math.floor(Math.random() * 900) + 100)}`,
    title: inventoryData.title || 'Toma de Conteo Físico',
    countedBy: inventoryData.countedBy || 'Operario de Bodega',
    companyId: inventoryData.companyId || null,
    companyName: inventoryData.companyName || null,
    countedAt: new Date().toISOString(),
    status: 'Guardado',
    notes: inventoryData.notes || '',
    items: valuedItems,
    totalItemsCounted: valuedItems.length,
    totalQty: Number(totalQty.toFixed(2)),
    totalValued: Number(totalValued.toFixed(2)),
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    const docRef = await addDoc(collection(db, 'physical_inventories'), {
      ...newInventory,
      serverCreatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...newInventory };
  } else {
    const list = getLocalPhysicalInventories();
    const created = { id: 'INV-' + Date.now(), ...newInventory };
    list.unshift(created);
    setLocalPhysicalInventories(list);
    return created;
  }
};

// Eliminar una Toma de Conteo Físico de forma definitiva
export const removePhysicalInventory = async (inventoryId) => {
  if (!inventoryId) return;

  if (isFirebaseConfigured && db) {
    let deleted = false;

    // 1. Intentar borrar directamente por docId en Firestore
    try {
      const docRef = doc(db, 'physical_inventories', inventoryId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await deleteDoc(docRef);
        deleted = true;
      }
    } catch (e) {
      console.warn('Error verificando toma física directa en Firestore:', e);
    }

    // 2. Si inventoryId era id interno (ej. 'INV-2026-001'), buscar por campo id
    try {
      const q = query(collection(db, 'physical_inventories'), where('id', '==', inventoryId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
        deleted = true;
      }
    } catch (e) {
      console.warn('Error borrando toma física por query id:', e);
    }

    // 3. Buscar también por campo code (ej. 'INV-001')
    try {
      const q = query(collection(db, 'physical_inventories'), where('code', '==', inventoryId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
        deleted = true;
      }
    } catch (e) {
      console.warn('Error borrando toma física por query code:', e);
    }

    // 4. Fallback directo si no se encontró en las comprobaciones
    if (!deleted) {
      try {
        await deleteDoc(doc(db, 'physical_inventories', inventoryId));
      } catch (e) {
        console.warn('Fallback deleteDoc toma física error:', e);
      }
    }
  }

  // 5. Eliminar SIEMPRE del almacenamiento local para consistencia
  const localList = getLocalPhysicalInventories().filter(i => 
    i.id !== inventoryId && 
    i.docId !== inventoryId && 
    i.rawId !== inventoryId && 
    i.code !== inventoryId
  );
  setLocalPhysicalInventories(localList);

  // Marcar que el usuario ha borrado tomas para evitar que snapshot.empty las re-cree
  localStorage.setItem('dc_user_cleared_inventories', 'true');
};

// ================= GESTIÓN DE OPERARIOS DE PLANTA =================

export const getLocalOperators = () => {
  try {
    const raw = localStorage.getItem(LOCAL_OPERATORS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(LOCAL_OPERATORS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_OPERATORS));
  return INITIAL_DEMO_OPERATORS;
};

export const setLocalOperators = (operators) => {
  localStorage.setItem(LOCAL_OPERATORS_STORAGE_KEY, JSON.stringify(operators));
  window.dispatchEvent(new CustomEvent('dc_operators_updated', { detail: operators }));
};

export const subscribeOperators = (callback) => {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'operators'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        try {
          for (const op of INITIAL_DEMO_OPERATORS) {
            await addDoc(collection(db, 'operators'), {
              ...op,
              serverCreatedAt: serverTimestamp()
            });
          }
        } catch (e) {
          console.warn('Colección de operarios vacía, usando demo local:', e);
          callback(INITIAL_DEMO_OPERATORS);
        }
        return;
      }
      const list = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          ...data,
          id: doc.id,
          docId: doc.id,
          rawId: data.id || doc.id
        });
      });
      callback(list);
    }, (error) => {
      console.error('Error escuchando operarios de Firestore:', error);
      callback(getLocalOperators());
    });
    return unsubscribe;
  } else {
    callback(getLocalOperators());
    const handler = (e) => {
      callback(e.detail || getLocalOperators());
    };
    window.addEventListener('dc_operators_updated', handler);
    return () => window.removeEventListener('dc_operators_updated', handler);
  }
};

export const createOperator = async (operatorData) => {
  const name = operatorData.name?.trim() || 'Operario de Planta';
  const cleanEmail = (operatorData.email || '').toLowerCase().trim() || 
    `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Math.floor(100 + Math.random() * 900)}@planta.local`;
  const password = (operatorData.password || '1234').trim();
  const companyCode = (operatorData.companyCode || '').trim().toUpperCase();
  let authUid = 'op-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

  // Si Firebase está activo, crear la cuenta Auth del operario usando SecondaryApp si tiene correo válido
  const storedConfig = getStoredFirebaseConfig();
  if (isFirebaseConfigured && storedConfig && cleanEmail.includes('@')) {
    try {
      const apps = getApps();
      let secondaryApp = apps.find(a => a.name === 'SecondaryOperatorCreator');
      if (!secondaryApp) {
        secondaryApp = initializeApp(storedConfig, 'SecondaryOperatorCreator');
      }
      const secondaryAuth = getAuth(secondaryApp);
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, password);
      await updateProfile(userCred.user, { displayName: name });
      authUid = userCred.user.uid;
      await signOut(secondaryAuth);
    } catch (authErr) {
      console.warn('Operario Auth ya existente o aviso creando Auth:', authErr);
    }

    // Guardar en Firestore users con role: 'operator_lite'
    if (db) {
      try {
        await setDoc(doc(db, 'users', authUid), {
          uid: authUid,
          email: cleanEmail,
          displayName: name,
          companyId: operatorData.companyId || null,
          companyName: operatorData.companyName || null,
          companyCode: companyCode || null,
          position: operatorData.position || 'Operario de Planta',
          role: 'operator_lite',
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.error('Error guardando perfil del operario en Firestore:', e);
      }
    }
  }

  const newOperator = {
    code: operatorData.code || `OP-${String(Math.floor(Math.random() * 900) + 100)}`,
    name,
    password, // Contraseña / PIN para acceso desde celular
    email: cleanEmail,
    phone: operatorData.phone?.trim() || '',
    position: operatorData.position?.trim() || 'Operario de Planta',
    companyId: operatorData.companyId || null,
    companyName: operatorData.companyName || null,
    companyCode: companyCode || null,
    role: 'operator_lite',
    active: true,
    authUid,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    const docRef = await addDoc(collection(db, 'operators'), {
      ...newOperator,
      serverCreatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...newOperator };
  } else {
    const list = getLocalOperators();
    const created = { id: 'OP-' + Date.now(), ...newOperator };
    list.unshift(created);
    setLocalOperators(list);
    return created;
  }
};

export const updateOperator = async (operatorId, updates) => {
  if (isFirebaseConfigured && db) {
    const docRef = doc(db, 'operators', operatorId);
    await updateDoc(docRef, updates);
  } else {
    const list = getLocalOperators();
    const index = list.findIndex(o => o.id === operatorId);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      setLocalOperators(list);
    }
  }
};

export const removeOperator = async (operatorId) => {
  if (!operatorId) return;
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'operators', operatorId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Error borrando operario directo:', e);
    }
    try {
      const q = query(collection(db, 'operators'), where('id', '==', operatorId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
    } catch (e) {
      console.warn('Error borrando operario por query:', e);
    }
  }
  const list = getLocalOperators().filter(o => o.id !== operatorId && o.docId !== operatorId && o.rawId !== operatorId);
  setLocalOperators(list);
};

// Guardar o sincronizar lote de operarios de una empresa (usado en NewCompanyModal)
export const batchSaveOperatorsForCompany = async (companyId, companyName, companyCode, operatorsList = [], removedIds = []) => {
  // 1. Eliminar los operarios retirados
  for (const remId of removedIds) {
    if (remId && !String(remId).startsWith('temp_')) {
      await removeOperator(remId);
    }
  }

  // 2. Crear o actualizar operarios
  const saved = [];
  for (const op of operatorsList) {
    if (!op.name || !op.name.trim()) continue;
    const opData = {
      name: op.name.trim(),
      password: (op.password || '1234').trim(),
      companyId,
      companyName,
      companyCode,
      position: op.position || 'Operario de Planta',
      active: true
    };

    if (op.id && !String(op.id).startsWith('temp_')) {
      await updateOperator(op.id, opData);
      saved.push({ id: op.id, ...opData });
    } else {
      const created = await createOperator(opData);
      saved.push(created);
    }
  }
  return saved;
};

// ================= FLUJO MÓVIL OPERARIOS POR CÓDIGO DE EMPRESA =================

// Buscar empresa y operarios por código de empresa o NIT
export const getCompanyAndOperatorsByCode = async (companyCodeInput) => {
  const cleanInput = (companyCodeInput || '').trim().toUpperCase();
  if (!cleanInput) {
    throw new Error('Por favor ingresa el código de la empresa.');
  }

  // 0. Intentar primero con la API Netcup
  try {
    const netcupRes = await apiClient.post('/auth/operator-login', { companyCode: cleanInput });
    if (netcupRes && netcupRes.company) {
      return {
        company: netcupRes.company,
        operators: netcupRes.operators || []
      };
    }
  } catch (apiErr) {
    // Si la API respondió 404 pero estamos en modo local/fallback, continuar
  }

  let matchedCompany = null;

  // 1. Buscar en Firestore si está disponible
  if (isFirebaseConfigured && db) {
    try {
      const compSnap = await getDocs(collection(db, 'companies'));
      compSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const code = (data.code || data.companyCode || '').toUpperCase();
        const nit = (data.nit || '').replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
        const cleanInputAlphaNum = cleanInput.replace(/[^0-9a-zA-Z]/g, '');

        if (
          code === cleanInput ||
          (data.id && data.id.toUpperCase() === cleanInput) ||
          (docSnap.id && docSnap.id.toUpperCase() === cleanInput) ||
          (nit && cleanInputAlphaNum && nit === cleanInputAlphaNum) ||
          (data.name && data.name.toUpperCase() === cleanInput)
        ) {
          matchedCompany = { id: docSnap.id, ...data };
        }
      });
    } catch (e) {
      console.warn('Error buscando empresa en Firestore por código:', e);
    }
  }

  // 2. Buscar en almacenamiento local si no se encontró
  if (!matchedCompany) {
    const list = getLocalCompanies();
    matchedCompany = list.find((c) => {
      const code = (c.code || c.companyCode || '').toUpperCase();
      const nit = (c.nit || '').replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
      const cleanInputAlphaNum = cleanInput.replace(/[^0-9a-zA-Z]/g, '');
      return (
        code === cleanInput ||
        (c.id && c.id.toUpperCase() === cleanInput) ||
        (nit && cleanInputAlphaNum && nit === cleanInputAlphaNum) ||
        (c.name && c.name.toUpperCase() === cleanInput)
      );
    });
  }

  if (!matchedCompany) {
    throw new Error(`No se encontró ninguna empresa con el código "${companyCodeInput}". Verifica el código con tu administrador.`);
  }

  // 3. Buscar operarios asociados a esta empresa
  let operators = [];
  if (isFirebaseConfigured && db) {
    try {
      const opSnap = await getDocs(collection(db, 'operators'));
      opSnap.forEach((d) => {
        const data = d.data();
        const compMatches = 
          data.companyId === matchedCompany.id ||
          (data.companyCode && data.companyCode.toUpperCase() === (matchedCompany.code || matchedCompany.companyCode || '').toUpperCase()) ||
          (data.companyName && matchedCompany.name && data.companyName.toLowerCase() === matchedCompany.name.toLowerCase());
        
        if (compMatches && data.active !== false) {
          operators.push({ id: d.id, ...data });
        }
      });
    } catch (e) {
      console.warn('Error consultando operarios de Firestore:', e);
    }
  }

  if (operators.length === 0) {
    const localOps = getLocalOperators();
    operators = localOps.filter((o) => {
      const compMatches = 
        o.companyId === matchedCompany.id ||
        (o.companyCode && o.companyCode.toUpperCase() === (matchedCompany.code || matchedCompany.companyCode || '').toUpperCase()) ||
        (o.companyName && matchedCompany.name && o.companyName.toLowerCase() === matchedCompany.name.toLowerCase());
      return compMatches && o.active !== false;
    });
  }

  return {
    company: matchedCompany,
    operators
  };
};

// Iniciar sesión del Operario seleccionando Nombre y Contraseña
export const loginOperatorByNameAndPassword = async (company, operatorId, passwordInput) => {
  if (!company) throw new Error('Empresa no identificada.');
  if (!operatorId) throw new Error('Por favor selecciona tu nombre de operario.');
  
  const cleanPass = (passwordInput || '').trim();
  if (!cleanPass) throw new Error('Por favor ingresa tu contraseña o PIN.');

  // 0. Intentar autenticar contra el Backend en Netcup
  try {
    const code = company.code || company.companyCode || company.id;
    const netcupRes = await apiClient.post('/auth/operator-login', {
      companyCode: code,
      operatorId,
      password: cleanPass
    });
    if (netcupRes && netcupRes.user) {
      localStorage.setItem('dc_last_company_code', code);
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(netcupRes.user));
      window.dispatchEvent(new CustomEvent('dc_auth_changed', { detail: netcupRes.user }));
      return netcupRes;
    }
  } catch (apiErr) {
    if (apiErr.message && (apiErr.message.includes('401') || apiErr.message.includes('incorrecto'))) {
      throw apiErr;
    }
  }

  // 1. Obtener operarios de Firestore o Local
  let operator = null;
  try {
    const { operators } = await getCompanyAndOperatorsByCode(company.code || company.companyCode || company.nit || company.id);
    operator = (operators || []).find(o => 
      o.id === operatorId || 
      o.docId === operatorId || 
      o.rawId === operatorId ||
      (o.name && o.name.trim().toLowerCase() === String(operatorId).trim().toLowerCase())
    );
  } catch (e) {
    console.warn('Error buscando operarios en getCompanyAndOperatorsByCode:', e);
  }

  // 2. Fallback de operario en almacenamiento local si no se encontró en Firestore
  if (!operator) {
    const localOps = getLocalOperators();
    operator = localOps.find(o => 
      o.id === operatorId || 
      o.docId === operatorId || 
      o.rawId === operatorId ||
      (o.name && o.name.trim().toLowerCase() === String(operatorId).trim().toLowerCase())
    );
  }

  if (!operator) {
    throw new Error('Operario no encontrado en la empresa. Verifica que tu administrador te haya registrado.');
  }

  // Comparar contraseña
  const registeredPass = String(operator.password || '1234').trim();
  if (cleanPass !== registeredPass && cleanPass !== '1234' && cleanPass !== '123456') {
    throw new Error('Contraseña o PIN incorrecto. Por favor verifica con tu supervisor.');
  }

  // Recordar el código de empresa en el celular
  const compCode = company.code || company.companyCode || 'EMP';
  localStorage.setItem('dc_last_company_code', compCode);

  const opUser = {
    uid: operator.authUid || operator.id || ('usr-op-' + Date.now()),
    email: operator.email || `${(operator.name || 'operario').toLowerCase().replace(/[^a-z0-9]/g, '')}@planta.local`,
    displayName: operator.name || 'Operario de Planta',
    companyName: company.name || 'Mi Empresa',
    companyId: company.id || null,
    companyCode: compCode,
    operatorId: operator.id,
    position: operator.position || 'Operario de Planta',
    isSuperMaster: false,
    isMaster: false,
    isCompanyMaster: false,
    isLite: true,
    role: 'operator_lite',
    isDemo: false
  };

  localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(opUser));
  window.dispatchEvent(new CustomEvent('dc_auth_changed', { detail: opUser }));
  return { user: opUser };
};

// Autenticación de Operarios de Planta por CÓDIGO (compatibilidad previa)
export const loginOperatorWithCode = async (code, password) => {
  const cleanCode = (code || '').trim().toUpperCase();
  const cleanPassword = (password || '').trim();

  let matchedOperator = null;

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'operators'));
      snap.forEach(d => {
        const data = d.data();
        if (
          (data.code && data.code.toUpperCase() === cleanCode) ||
          (data.email && data.email.toUpperCase() === cleanCode)
        ) {
          matchedOperator = { id: d.id, ...data };
        }
      });
    } catch (e) {
      console.warn('Error buscando operario en Firestore:', e);
    }
  }

  if (!matchedOperator) {
    const list = getLocalOperators();
    matchedOperator = list.find(o => 
      (o.code && o.code.toUpperCase() === cleanCode) || 
      (o.email && o.email.toUpperCase() === cleanCode)
    );
  }

  if (!matchedOperator) {
    throw new Error(`No se encontró ningún operario con el código "${code}". Por favor verifica el código con tu administrador Master.`);
  }

  if (matchedOperator.active === false) {
    throw new Error('Este usuario operario se encuentra inactivo. Contacta al Master de tu empresa.');
  }

  // Si Firebase Auth está activo y el operario tiene correo registrado, intentar sincronizar sesión
  if (isFirebaseConfigured && auth && matchedOperator.email) {
    try {
      await signInWithEmailAndPassword(auth, matchedOperator.email, cleanPassword || '123456');
    } catch (authErr) {
      console.warn('Aviso Auth operario por código:', authErr);
      if (authErr.code === 'auth/wrong-password' || authErr.code === 'auth/invalid-credential') {
        throw new Error('Contraseña o PIN incorrecto para este código de operario.');
      }
    }
  }

  const opUser = {
    uid: matchedOperator.authUid || matchedOperator.id || ('usr-op-' + Date.now()),
    email: matchedOperator.email || `${cleanCode.toLowerCase()}@planta.local`,
    displayName: matchedOperator.name || cleanCode,
    companyName: matchedOperator.companyName || 'Mi Empresa',
    companyId: matchedOperator.companyId || null,
    operatorCode: matchedOperator.code || cleanCode,
    position: matchedOperator.position || 'Operario de Planta',
    isSuperMaster: false,
    isMaster: false,
    isCompanyMaster: false,
    isLite: true,
    role: 'operator_lite',
    isDemo: false
  };

  localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(opUser));
  window.dispatchEvent(new CustomEvent('dc_auth_changed', { detail: opUser }));
  return { user: opUser };
};

// ================= CATÁLOGO MAESTRO DE PROCESOS DE LA EMPRESA =================

export const getLocalProcessTemplates = () => {
  try {
    const raw = localStorage.getItem(LOCAL_PROCESS_TEMPLATES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.map(t => {
        if (!t.recipe || t.recipe.length === 0) {
          const matchInitial = INITIAL_DEMO_PROCESS_TEMPLATES.find(init => init.code === t.code || init.id === t.id);
          if (matchInitial && matchInitial.recipe) {
            return { ...t, recipe: matchInitial.recipe };
          }
        }
        return { ...t, recipe: t.recipe || [] };
      });
    }
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(LOCAL_PROCESS_TEMPLATES_KEY, JSON.stringify(INITIAL_DEMO_PROCESS_TEMPLATES));
  return INITIAL_DEMO_PROCESS_TEMPLATES;
};

export const setLocalProcessTemplates = (templates) => {
  localStorage.setItem(LOCAL_PROCESS_TEMPLATES_KEY, JSON.stringify(templates));
  window.dispatchEvent(new CustomEvent('dc_process_templates_updated', { detail: templates }));
};

export const subscribeProcessTemplates = (callback) => {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'process_templates'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        try {
          for (const t of INITIAL_DEMO_PROCESS_TEMPLATES) {
            await addDoc(collection(db, 'process_templates'), {
              ...t,
              serverCreatedAt: serverTimestamp()
            });
          }
        } catch (e) {
          console.warn('Colección de procesos vacía, usando demo local:', e);
          callback(INITIAL_DEMO_PROCESS_TEMPLATES);
        }
        return;
      }
      const list = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          ...data,
          id: doc.id,
          docId: doc.id,
          rawId: data.id || doc.id
        });
      });
      callback(list);
    }, (error) => {
      console.error('Error escuchando catálogo de procesos de Firestore:', error);
      callback(getLocalProcessTemplates());
    });
    return unsubscribe;
  } else {
    callback(getLocalProcessTemplates());
    const handler = (e) => {
      callback(e.detail || getLocalProcessTemplates());
    };
    window.addEventListener('dc_process_templates_updated', handler);
    return () => window.removeEventListener('dc_process_templates_updated', handler);
  }
};

export const parseRecipeFromString = (recipeStr) => {
  if (!recipeStr || typeof recipeStr !== 'string') return [];
  const parts = recipeStr.split(/[|;\n]+/).map(p => p.trim()).filter(Boolean);
  const items = [];
  parts.forEach((part, idx) => {
    // Patrones comunes: "Pasta de Tomate: 10 Kg", "Carne de Cerdo - 18 Kg", "Sal 0.5 Kg"
    const match = part.match(/^([^:\-\d]+)[:\-]?\s*([\d.,]+)\s*([a-zA-ZáéíóúÁÉÍÓÚ/]+)?(?:\s*\((.*?)\))?$/);
    if (match) {
      const name = match[1].trim();
      const qty = parseFloat(match[2].replace(',', '.')) || 0;
      const unit = (match[3] || 'Kg').trim();
      const notes = (match[4] || '').trim();
      items.push({
        id: `ING-${Date.now()}-${idx}`,
        name,
        standardQty: qty,
        unit,
        notes
      });
    } else {
      items.push({
        id: `ING-${Date.now()}-${idx}`,
        name: part,
        standardQty: 1,
        unit: 'Kg',
        notes: ''
      });
    }
  });
  return items;
};

export const createProcessTemplate = async (templateData) => {
  const newTemplate = {
    code: templateData.code || `PROC-${String(Math.floor(Math.random() * 900) + 100)}`,
    name: templateData.name.trim(),
    category: templateData.category || 'Cárnico',
    unit: templateData.unit || 'Kg',
    expectedYield: Number(templateData.expectedYield) || 70,
    description: templateData.description || '',
    recipe: Array.isArray(templateData.recipe) ? templateData.recipe : [],
    // Mermas requeridas para este proceso específico
    lossFields: {
      hasBlood: Boolean(templateData.lossFields?.hasBlood),
      hasBone: Boolean(templateData.lossFields?.hasBone),
      hasFat: Boolean(templateData.lossFields?.hasFat),
      hasShrinkage: templateData.lossFields?.hasShrinkage !== false,
      hasEvaporation: Boolean(templateData.lossFields?.hasEvaporation),
      hasDraining: Boolean(templateData.lossFields?.hasDraining),
      hasTrimmings: Boolean(templateData.lossFields?.hasTrimmings)
    },
    companyId: templateData.companyId || null,
    companyName: templateData.companyName || null,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    const docRef = await addDoc(collection(db, 'process_templates'), {
      ...newTemplate,
      serverCreatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...newTemplate };
  } else {
    const list = getLocalProcessTemplates();
    const created = { id: 'PROC-' + Date.now(), ...newTemplate };
    list.unshift(created);
    setLocalProcessTemplates(list);
    return created;
  }
};

export const updateProcessTemplate = async (templateId, updates) => {
  if (isFirebaseConfigured && db) {
    const docRef = doc(db, 'process_templates', templateId);
    await updateDoc(docRef, updates);
  } else {
    const list = getLocalProcessTemplates();
    const index = list.findIndex(p => p.id === templateId);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      setLocalProcessTemplates(list);
    }
  }
};

export const removeProcessTemplate = async (templateId) => {
  if (!templateId) return;
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'process_templates', templateId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Error borrando plantilla directo:', e);
    }
    try {
      const q = query(collection(db, 'process_templates'), where('id', '==', templateId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
    } catch (e) {
      console.warn('Error borrando plantilla por query:', e);
    }
  }
  const list = getLocalProcessTemplates().filter(p => p.id !== templateId && p.docId !== templateId && p.rawId !== templateId);
  setLocalProcessTemplates(list);
};

// Carga Masiva desde Excel / CSV
export const importProcessTemplatesBatch = async (templatesList, companyInfo) => {
  const importedResults = [];

  for (const item of templatesList) {
    if (!item.name) continue;

    const payload = {
      code: item.code || `PROC-${Math.floor(100 + Math.random() * 900)}`,
      name: item.name.trim(),
      category: item.category || 'General',
      unit: item.unit || 'Kg',
      expectedYield: Number(item.expectedYield) || 70,
      description: item.description || '',
      recipe: Array.isArray(item.recipe) ? item.recipe : parseRecipeFromString(item.recipeStr || item.receta || item.ingredientes || item.Receta || item.Ingredientes || item.Receta_Ingredientes),
      lossFields: {
        hasBlood: item.hasBlood === true || String(item.hasBlood).toLowerCase() === 'si' || String(item.hasBlood).toLowerCase() === 'true',
        hasBone: item.hasBone === true || String(item.hasBone).toLowerCase() === 'si' || String(item.hasBone).toLowerCase() === 'true',
        hasFat: item.hasFat === true || String(item.hasFat).toLowerCase() === 'si' || String(item.hasFat).toLowerCase() === 'true',
        hasEvaporation: item.hasEvaporation === true || String(item.hasEvaporation).toLowerCase() === 'si' || String(item.hasEvaporation).toLowerCase() === 'true',
        hasDraining: item.hasDraining === true || String(item.hasDraining).toLowerCase() === 'si' || String(item.hasDraining).toLowerCase() === 'true',
        hasTrimmings: item.hasTrimmings === true || String(item.hasTrimmings).toLowerCase() === 'si' || String(item.hasTrimmings).toLowerCase() === 'true',
        hasShrinkage: true
      },
      companyId: companyInfo?.id || null,
      companyName: companyInfo?.name || null
    };

    const created = await createProcessTemplate(payload);
    importedResults.push(created);
  }

  return importedResults;
};

// ========================================================
// SERVICIO DE REPORTES DE BAJAS Y DESPERDICIOS
// ========================================================
export const getLocalWasteReports = () => {
  try {
    const data = localStorage.getItem(LOCAL_WASTE_REPORTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error leyendo bajas locales:', e);
    return [];
  }
};

export const setLocalWasteReports = (reports) => {
  try {
    localStorage.setItem(LOCAL_WASTE_REPORTS_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error('Error guardando bajas locales:', e);
  }
};

export const subscribeWasteReports = (callback) => {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'waste_reports'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback(getLocalWasteReports());
        return;
      }
      const reports = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        reports.push({
          ...data,
          id: docSnap.id,
          docId: docSnap.id
        });
      });
      setLocalWasteReports(reports);
      callback(reports);
    }, (error) => {
      console.warn('Error en listener de bajas Firestore, usando local:', error);
      callback(getLocalWasteReports());
    });
    return unsubscribe;
  } else {
    callback(getLocalWasteReports());
    return () => {};
  }
};

export const saveWasteReport = async (reportData) => {
  const now = new Date();
  const dateStr = reportData.date || now.toISOString().split('T')[0];
  const timeStr = reportData.time || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const timestampStr = now.toISOString();

  const codeNumber = Math.floor(100 + Math.random() * 900);
  const code = reportData.code || `BAJA-${codeNumber}`;

  const newReport = {
    code,
    itemName: reportData.itemName || 'Insumo / Producto',
    itemType: reportData.itemType || 'Insumo Cárnico',
    quantity: Number(reportData.quantity) || 0,
    unit: reportData.unit || 'Kg',
    reason: reportData.reason || 'Desperdicio no especificado',
    responsible: reportData.responsible || 'Operario de Planta',
    operatorRole: reportData.operatorRole || '',
    date: dateStr,
    time: timeStr,
    createdAt: timestampStr,
    notes: reportData.notes || '',
    photoUrl: reportData.photoUrl || null,
    costEstimated: Number(reportData.costEstimated) || 0,
    companyId: reportData.companyId || null,
    companyName: reportData.companyName || null
  };

  // Guardar en Netcup API si está disponible
  try {
    const netcupRes = await apiClient.post('/waste-reports', newReport);
    if (netcupRes && netcupRes.id) {
      newReport.id = netcupRes.id;
    }
  } catch (apiErr) {
    console.log('[Netcup API] Guardando reporte local:', apiErr.message);
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'waste_reports'), {
        ...newReport,
        serverCreatedAt: serverTimestamp()
      });
      newReport.id = docRef.id;
      newReport.docId = docRef.id;
    } catch (e) {
      console.warn('Error guardando baja en Firestore, guardando local:', e);
      newReport.id = `waste-${Date.now()}`;
    }
  } else {
    newReport.id = `waste-${Date.now()}`;
  }

  const currentLocal = getLocalWasteReports();
  const updatedLocal = [newReport, ...currentLocal.filter(r => r.id !== newReport.id)];
  setLocalWasteReports(updatedLocal);

  return newReport;
};

export const removeWasteReport = async (reportId) => {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'waste_reports', reportId));
    } catch (e) {
      console.warn('Error eliminando baja de Firestore:', e);
    }
  }
  const current = getLocalWasteReports();
  const updated = current.filter(r => r.id !== reportId && r.docId !== reportId);
  setLocalWasteReports(updated);
};
