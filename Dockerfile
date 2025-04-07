FROM node:18-alpine

WORKDIR /app

# Installa dipendenze
COPY package*.json ./
RUN npm ci

# Copia i file del progetto
COPY . .

# Installa tsx globalmente
RUN npm install -g tsx

# Imposta variabili d'ambiente
ENV NODE_ENV=production

# Espone la porta
EXPOSE 3000

# Avvia il server direttamente in modalità dev (salta la build)
CMD ["tsx", "server/index.ts"]
