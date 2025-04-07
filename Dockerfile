FROM node:18-alpine

WORKDIR /app

# Installa dipendenze
COPY package*.json ./
RUN npm ci

# Copia i file del progetto
COPY . .

# Patch per il file vite.config.ts
RUN sed -i 's/import\.meta\.dirname/process.cwd()/g' vite.config.ts

# Esegui il build del frontend
RUN npm run build

# Crea un server Express semplice in ESM
RUN echo "import express from 'express';" > simple-server.mjs
RUN echo "import path from 'path';" >> simple-server.mjs
RUN echo "import { fileURLToPath } from 'url';" >> simple-server.mjs
RUN echo "const __filename = fileURLToPath(import.meta.url);" >> simple-server.mjs
RUN echo "const __dirname = path.dirname(__filename);" >> simple-server.mjs
RUN echo "const app = express();" >> simple-server.mjs
RUN echo "console.log('Starting simple ESM server...');" >> simple-server.mjs
RUN echo "console.log('Serving static files from:', path.join(process.cwd(), 'dist/public'));" >> simple-server.mjs
RUN echo "app.use(express.static(path.join(process.cwd(), 'dist/public')));" >> simple-server.mjs
RUN echo "app.get('*', (req, res) => {" >> simple-server.mjs
RUN echo "  res.sendFile(path.join(process.cwd(), 'dist/public/index.html'));" >> simple-server.mjs
RUN echo "});" >> simple-server.mjs
RUN echo "const PORT = process.env.PORT || 3000;" >> simple-server.mjs
RUN echo "app.listen(PORT, '0.0.0.0', () => {" >> simple-server.mjs
RUN echo "  console.log(`Server running on port ${PORT}`);" >> simple-server.mjs
RUN echo "});" >> simple-server.mjs

# Installa express se necessario
RUN npm install express

# Imposta variabili d'ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Espone la porta
EXPOSE 3000

# Avvia il server semplice in modalità ESM
CMD ["node", "simple-server.mjs"]
