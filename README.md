# DC Procesos 🥩📊

Aplicación web y móvil progresiva para el control de producción, rendimientos cárnicos y registro de órdenes de proceso del día en planta. Permite a los operarios tomar y completar órdenes directamente desde su teléfono móvil y sincronizar todos los datos en tiempo real con la pantalla principal y Google Firebase.

---

## 🚀 Características Principales

1. **Pantalla de Bienvenida y Autenticación:**
   - Inicio de sesión con **Correo Electrónico y Contraseña**.
   - Registro de nuevas cuentas para operarios y supervisores.
   - Acceso Rápido / Modo Demo para pruebas inmediatas sin configuración previa.

2. **Modo Celular / Operario (Planta):**
   - Diseñado y optimizado para pantallas táctiles móviles.
   - Listado de órdenes del día divididas por estado: **Pendientes**, **En Proceso** y **Finalizadas**.
   - Acción rápida: **"Tomar Orden"**.
   - Formulario ágil de cierre de proceso con los campos solicitados:
     * **Total Insumo Tomado** (Kg).
     * **Datos de Subproductos:**
       - Sangre (Kg).
       - Hueso (Kg).
       - Gordos / Grasa (Kg).
       - Merma (Kg) con cálculo automático por diferencia o manual.
     * **Proceso Terminado:**
       - Unidades terminadas (und).
       - Peso final en Gramos o Kilogramos (selector inteligente).
     * **Balance de Masa y Rendimiento en Vivo:** Visualización del % de rendimiento y cálculo de la diferencia de balance en tiempo real antes de guardar.
     * **Observaciones y notas de planta.**

3. **Página Web Principal (Tablero de Control):**
   - **Tarjetas KPI en Vivo:** Total insumo procesado, total terminado en Kg y unidades, rendimiento promedio global %, y total de órdenes.
   - **Panel de Subproductos Acumulados:** Totalización de Sangre, Hueso, Gordos y Merma.
   - **Tabla Dinámica en Tiempo Real:** Visualización detallada de todas las órdenes finalizadas y en curso.
   - **Filtros Avanzados:** Búsqueda por texto, lote, código, estado y fecha.
   - **Ficha Técnica y Balance:** Modal para inspeccionar e imprimir la hoja de balance de cada orden.
   - **Exportación:** Descarga de reportes en **Excel / CSV** con un solo clic.
   - **Programación:** Modal para crear y asignar nuevas órdenes de proceso del día.

4. **Integración con Firebase:**
   - Soporte para **Firebase Authentication** y **Cloud Firestore** en tiempo real.
   - Modal interactivo dentro de la app para conectar tu proyecto Firebase simplemente pegando las claves, sin necesidad de compilar de nuevo.
   - Modo seguro offline / local para seguir funcionando si no hay conexión.

---

## 🛠️ Cómo Iniciar el Proyecto

### 1. Iniciar el servidor local
```bash
npm run dev
```

### 2. Abrir desde un Celular en la misma red Wi-Fi:
Para abrir la aplicación desde tu teléfono mientras pruebas en tu computador, ejecuta:
```bash
npm run dev -- --host
```
Vite te mostrará una dirección de red local (ejemplo: `http://192.168.1.15:5173`). Escribe esa dirección en el navegador de tu celular (Chrome o Safari) y podrás tomar las órdenes directamente.

---

## 🔥 Cómo Crear y Conectar tu Proyecto en Firebase

1. Ingresa a [Firebase Console](https://console.firebase.google.com).
2. Haz clic en **"Agregar proyecto"** y dale el nombre: `DC Procesos`.
3. Una vez creado el proyecto:
   - **Authentication:** En el menú izquierdo ve a *Compilación > Authentication*, pulsa *Comenzar*, selecciona el proveedor **Correo electrónico / Contraseña** y actívalo.
   - **Firestore Database:** Ve a *Compilación > Firestore Database*, pulsa *Crear base de datos*, elige tu región y selecciona **Iniciar en modo de prueba**.
4. **Obtener las Claves de la App Web:**
   - Haz clic en el ícono de engranaje ⚙️ (Configuración del proyecto).
   - En la sección **Tus apps**, haz clic en el ícono Web `</>`.
   - Registra la app como `DC Procesos Web`.
   - Copia el objeto `firebaseConfig`.
5. **Conectar en la aplicación:**
   - Abre la aplicación en tu navegador.
   - Pulsa el botón **"Conectar Firebase"** en la esquina superior derecha o en la pantalla de bienvenida.
   - Pega el código copiado o llena los campos (Project ID, API Key, etc.) y pulsa **"Guardar y Conectar"**.
   - ¡Listo! A partir de ese momento, cada orden que tomes o finalices desde cualquier celular se guardará en tu base de datos Firebase y se actualizará en vivo en la página web principal.
