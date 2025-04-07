FROM node:18-alpine

WORKDIR /app

# Installa dipendenze
COPY package*.json ./
RUN npm ci

# Copia i file del progetto
COPY . .

# Esegui il build del frontend con Vite
RUN npx vite build

# Crea un file di server semplice (scrivendo riga per riga per evitare problemi)
RUN echo "const express = require('express');" > simple.js
RUN echo "const path = require('path');" >> simple.js
RUN echo "const app = express();" >> simple.js
RUN echo "console.log('Starting simple static server');" >> simple.js
RUN echo "app.use(express.static('dist/public'));" >> simple.js
RUN echo "app.get('*', (req, res) => {" >> simple.js
RUN echo "  res.sendFile(path.join(process.cwd(), 'dist/public/index.html'));" >> simple.js
RUN echo "});" >> simple.js
RUN echo "const PORT = process.env.PORT || 3000;" >> simple.js
RUN echo "app.listen(PORT, '0.0.0.0', () => {" >> simple.js
RUN echo "  console.log(\`Server running on port \${PORT}\`);" >> simple.js
RUN echo "});" >> simple.js

# Installa express se non presente
RUN npm install express

# Imposta variabili d'ambiente
ENV PORT=3000

# Espone la porta
EXPOSE 3000

# Avvia il server semplice
CMD ["node", "simple.js"]
