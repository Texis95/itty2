FROM node:18-alpine

WORKDIR /app

# Installa dipendenze
COPY package*.json ./
RUN npm ci

# Copia i file del progetto
COPY . .

# Esegui il build del frontend con Vite
RUN echo "Building frontend with Vite..." && \
    npx vite build

# Crea la cartella uploads
RUN mkdir -p dist/uploads

# Compila i file server manualmente
RUN echo "Compiling server files..." && \
    npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js && \
    npx esbuild server/routes.ts server/auth.ts server/database.ts server/storage.ts server/vite.ts server/websocket.ts server/seed.ts shared/schema.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Debug: Verifica i file compilati
RUN echo "Compiled files:" && ls -la dist

# Imposta le variabili d'ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Espone la porta
EXPOSE 3000

# Avvia direttamente l'applicazione
CMD ["node", "--experimental-specifier-resolution=node", "--no-warnings", "dist/index.js"]
