# 🚀 Guía de Despliegue en Netcup Root Server - DC Procesos

### **Dominio:** `procesos.dcasesoriaslatam.com`
### **Arquitectura:** Docker Compose + PostgreSQL 16 + Node.js REST API + Nginx + Let's Encrypt SSL

---

## 📋 1. Configuración Previa de DNS (2 minutos)
En el panel donde administras el dominio `dcasesoriaslatam.com` (ej: Cloudflare, Netcup CCP o tu registrador de dominio):

1. Ve a la zona DNS de **`dcasesoriaslatam.com`**.
2. Agrega un nuevo registro **Tipo A**:
   * **Tipo:** `A`
   * **Nombre / Host:** `procesos`
   * **Dirección IPv4:** `[La IP pública de tu Root Server Netcup]`
   * **TTL:** Automático o 300 segundos.

---

## 📦 2. Subir el Proyecto al Servidor Netcup

Puedes subir la carpeta del proyecto a tu servidor mediante **SCP**, **Git** o **SFTP** (FileZilla):

### Opción A: Usando SCP desde tu terminal de Windows / PowerShell
```bash
scp -r D:\Proyectos\Produccion root@TU_IP_NETCUP:/opt/dc-procesos
```

### Opción B: Si usas Git en el servidor
Clona tu repositorio en `/opt/dc-procesos`.

---

## ⚡ 3. Ejecutar el Despliegue Automatizado en el Servidor

Conéctate por SSH a tu servidor Netcup:
```bash
ssh root@TU_IP_NETCUP
```

Navega a la carpeta del proyecto y ejecuta el script:
```bash
cd /opt/dc-procesos
chmod +x desplegar_netcup.sh
./desplegar_netcup.sh
```

El script se encargará automáticamente de:
1. Verificar e instalar **Docker** y **Docker Compose** si no están presentes.
2. Levantar la base de datos **PostgreSQL 16** con volumen persistente.
3. Construir e iniciar el **Backend API** en Node.js/Express.
4. Iniciar **Nginx** sirviendo la aplicación web y móvil.
5. Preguntarte si deseas emitir el certificado **SSL HTTPS Gratuito (Let's Encrypt)** para `procesos.dcasesoriaslatam.com`.

---

## 🔍 4. Verificación y Monitoreo

* **Frontend Web:** [https://procesos.dcasesoriaslatam.com](https://procesos.dcasesoriaslatam.com)
* **Diagnóstico de Salud API:** [https://procesos.dcasesoriaslatam.com/api/health](https://procesos.dcasesoriaslatam.com/api/health)

### Comandos útiles en el servidor:
* Ver estado de los contenedores:
  ```bash
  docker compose ps
  ```
* Ver logs en tiempo real:
  ```bash
  docker compose logs -f backend
  ```
* Reiniciar la plataforma:
  ```bash
  docker compose restart
  ```
