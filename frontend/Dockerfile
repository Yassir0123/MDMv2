FROM node:20-alpine AS build

WORKDIR /app

# Installer les dépendances
COPY package*.json ./
COPY pnpm-lock.yaml* ./
RUN npm install

# Copier le reste du code et builder l'application Vite
COPY . .
RUN npm run build

# Étape de production avec nginx
FROM nginx:1.27-alpine

WORKDIR /usr/share/nginx/html

# Nginx servira les fichiers statiques et fera le reverse proxy vers le backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier le build Vite
COPY --from=build /app/dist ./

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

