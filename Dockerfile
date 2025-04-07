FROM node:18-alpine

WORKDIR /app

# Installa dipendenze
COPY package*.json ./
RUN npm ci

# Copia i file del progetto
COPY . .

# Patch vite.config.ts inline
RUN sed -i 's/import\.meta\.dirname/process.cwd()/g' vite.config.ts

# Esegui il build
RUN npm run build

# Imposta variabili d'ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Espone la porta
EXPOSE 3000

# Avvia l'applicazione
CMD ["node", "--experimental-specifier-resolution=node", "dist/index.js"]
