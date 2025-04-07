FROM node:18-alpine

WORKDIR /app

# Installa dipendenze
COPY package*.json ./
RUN npm ci

# Copia i file del progetto 
COPY . .

# Crea la directory uploads
RUN mkdir -p uploads

# Installa tsx globalmente per eseguire TypeScript direttamente
RUN npm install -g tsx

# Imposta variabili d'ambiente
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=${DATABASE_URL}

# Espone la porta
EXPOSE 3000

# Avvia il server in modalità dev
CMD ["tsx", "server/index.ts"]
