FROM node:18-alpine

WORKDIR /app

# Installa dipendenze
COPY package*.json ./
RUN npm ci

# Copia i file del progetto
COPY . .

# Installa tsx per eseguire TypeScript direttamente
RUN npm install -g tsx

# Imposta variabili d'ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Espone la porta
EXPOSE 3000

# Imposta variabile che finge l'esistenza di import.meta.dirname 
ENV NODE_OPTIONS="--experimental-vm-modules"

# Avvia l'applicazione con tsx (evitando il processo di build)
CMD ["tsx", "server/index.ts"]
