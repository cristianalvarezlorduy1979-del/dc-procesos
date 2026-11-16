FROM node:20-alpine

WORKDIR /app

# Instalar dependencias de producción
COPY package*.json ./
RUN npm install --omit=dev

# Copiar el código del backend
COPY . .

# Exponer el puerto de la API
EXPOSE 8000

# Iniciar servidor
CMD ["node", "server.js"]
