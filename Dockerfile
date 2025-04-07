FROM node:18-alpine

WORKDIR /app

# Installa dipendenze
COPY package*.json ./
RUN npm ci

# Copia i file del progetto
COPY . .

# Esegui il build del frontend con Vite
RUN npx vite build

# Crea la cartella uploads
RUN mkdir -p dist/uploads

# Compila i file server
RUN npx esbuild server/*.ts shared/*.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Patch per il problema di path.resolve con undefined
RUN echo 'console.log("Patching dist/index.js for path.resolve issues...")' && \
    sed -i 's/path.resolve(import.meta.dirname/path.resolve(process.cwd()/g' dist/index.js && \
    sed -i 's/path.resolve(import.meta.url/path.resolve(process.cwd()/g' dist/index.js && \
    sed -i 's/path.resolve(undefined/path.resolve(process.cwd()/g' dist/index.js

# Imposta variabili d'ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Espone la porta
EXPOSE 3000

# Avvia l'applicazione
CMD ["node", "--experimental-specifier-resolution=node", "--no-warnings", "dist/index.js"]
