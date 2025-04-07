FROM node:18-alpine

WORKDIR /app

# Installa le dipendenze
COPY package*.json ./
RUN npm ci

# Copia i file del progetto
COPY . .

# Esegui il build del frontend con Vite
RUN npm run build || echo "Trying alternative build..."

# Se il build fallisce, prova un approccio manuale
RUN if [ ! -f dist/index.js ]; then \
      echo "Manual build process..." && \
      # Build frontend con Vite (senza errori di copy)
      npx vite build && \
      # Crea la directory uploads
      mkdir -p dist/uploads && \
      # Assicurati che la cartella dist esista
      mkdir -p dist && \
      # Converti i file server TS in JS usando esbuild
      npx esbuild server/index.ts server/routes.ts server/auth.ts server/database.ts server/storage.ts server/vite.ts server/websocket.ts server/seed.ts shared/schema.ts --platform=node --packages=external --bundle --format=esm --outdir=dist; \
    fi

# Imposta le variabili d'ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Espone la porta
EXPOSE 3000

# Script per avviare l'app
RUN echo '#!/bin/sh\necho "Starting application..."\nnode --experimental-specifier-resolution=node --no-warnings dist/index.js' > start.sh && chmod +x start.sh

# Avvia l'applicazione
CMD ["./start.sh"]
