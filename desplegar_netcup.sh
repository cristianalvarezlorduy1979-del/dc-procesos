#!/bin/bash
# ==============================================================================
# SCRIPT OFICIAL DE DESPLIEGUE EN NETCUP ROOT SERVER - DC PROCESOS
# Dominio: procesos.dcasesoriaslatam.com
# ==============================================================================

set -e

echo "🚀 Iniciando despliegue de DC Procesos en Netcup Root Server..."

# 1. Verificar si Docker y Docker Compose están instalados
if ! command -v docker &> /dev/null; then
    echo "📦 Docker no detectado. Instalando Docker Engine oficial..."
    apt-get update
    apt-get install -y curl ca-certificates gnupg lsb-release ufw
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm -f get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo "✅ Docker instalado correctamente."
fi

# 2. Abrir puertos necesarios en el Firewall (UFW) si está activo
if command -v ufw &> /dev/null; then
    echo "🛡️ Configurando puertos de red en firewall..."
    ufw allow 22/tcp || true
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true
fi

# 3. Compilar e Iniciar los Contenedores (PostgreSQL + Backend API + Nginx Web)
echo "🐳 Construyendo y levantando contenedores Docker..."
docker compose down || true
docker compose up -d --build

echo "⏳ Esperando a que PostgreSQL y Backend inicien..."
sleep 6

# 4. Verificar salud de la API
if curl -s http://localhost:8000/api/health | grep -q "healthy"; then
    echo "✅ Backend API y PostgreSQL funcionando correctamente."
else
    echo "⚠️ El backend tardó un poco más en iniciar. Verificando logs..."
    docker logs dc_procesos_backend || true
fi

# 5. Configurar Certificado SSL Gratuito con Certbot (Let's Encrypt)
echo "🔒 ¿Deseas emitir el certificado SSL HTTPS gratuito para procesos.dcasesoriaslatam.com? (S/N)"
read -r RESPUESTA_SSL || RESPUESTA_SSL="S"

if [[ "$RESPUESTA_SSL" =~ ^[Ss]$ ]]; then
    echo "📜 Instalando Certbot..."
    apt-get update && apt-get install -y certbot

    echo "🔐 Solicitando certificado para procesos.dcasesoriaslatam.com..."
    # Detener temporalmente el contenedor web para enlazar el puerto 80 con certbot
    docker stop dc_procesos_web || true
    
    certbot certonly --standalone -d procesos.dcasesoriaslatam.com --non-interactive --agree-tos --register-unsafely-without-email || true

    # Si se generó el certificado, aplicar la configuración SSL en Nginx
    if [ -f "/etc/letsencrypt/live/procesos.dcasesoriaslatam.com/fullchain.pem" ]; then
        echo "✅ Certificado generado exitosamente. Activando HTTPS..."
        cp nginx/nginx-ssl.conf.template nginx/default.conf
        # Reiniciar contenedor web con volumen de certificados
        docker compose up -d web
    else
        echo "⚠️ No se pudo generar el SSL aún (comprueba que el registro DNS A ya apunte a la IP de este servidor)."
        docker compose up -d web
    fi
fi

echo "=============================================================================="
echo "🎉 ¡DESPLIEGUE FINALIZADO EXITOSAMENTE!"
echo "Acceso Web: http://procesos.dcasesoriaslatam.com (o https si activaste SSL)"
echo "API Backend: http://procesos.dcasesoriaslatam.com/api/health"
echo "Base de Datos: PostgreSQL 16 activa con persistencia de datos"
echo "=============================================================================="
