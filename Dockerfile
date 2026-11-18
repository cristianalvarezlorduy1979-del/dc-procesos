FROM nginx:alpine

# Copiar configuracion optimizada de Nginx
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copiar archivos compilados de produccion
COPY dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
