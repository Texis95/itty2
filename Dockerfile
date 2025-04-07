FROM node:18-alpine

WORKDIR /app

# Installa dipendenze
COPY package*.json ./
RUN npm ci

# Copia i file del progetto
COPY . .

# Crea una versione modificata di server/index.ts senza i problemi di require
RUN echo "import express from 'express';" > modified-server.js
RUN echo "import session from 'express-session';" >> modified-server.js
RUN echo "import path from 'path';" >> modified-server.js
RUN echo "import fs from 'fs';" >> modified-server.js
RUN echo "import { fileURLToPath } from 'url';" >> modified-server.js
RUN echo "import { pgStorage } from './server/database.js';" >> modified-server.js
RUN echo "import { setupAuth } from './server/auth.js';" >> modified-server.js
RUN echo "import { registerRoutes } from './server/routes.js';" >> modified-server.js
RUN echo "" >> modified-server.js
RUN echo "const __filename = fileURLToPath(import.meta.url);" >> modified-server.js
RUN echo "const __dirname = path.dirname(__filename);" >> modified-server.js
RUN echo "" >> modified-server.js
RUN echo "console.log('Starting application...');" >> modified-server.js
RUN echo "console.log('Current directory:', process.cwd());" >> modified-server.js
RUN echo "console.log('Directory structure:', fs.readdirSync(process.cwd()));" >> modified-server.js
RUN echo "" >> modified-server.js
RUN echo "// Configurazione Express" >> modified-server.js
RUN echo "const app = express();" >> modified-server.js
RUN echo "app.use(express.json());" >> modified-server.js
RUN echo "app.use(express.urlencoded({ extended: false }));" >> modified-server.js
RUN echo "" >> modified-server.js
RUN echo "// Configurazione della sessione" >> modified-server.js
RUN echo "const sessionSettings = {" >> modified-server.js
RUN echo "  secret: process.env.SESSION_SECRET || 'keyboard cat'," >> modified-server.js
RUN echo "  resave: false," >> modified-server.js
RUN echo "  saveUninitialized: false," >> modified-server.js
RUN echo "  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 }" >> modified-server.js
RUN echo "};" >> modified-server.js
RUN echo "" >> modified-server.js
RUN echo "// Configurazione Express" >> modified-server.js
RUN echo "app.use(session(sessionSettings));" >> modified-server.js
RUN echo "" >> modified-server.js
RUN echo "// Avvia il server" >> modified-server.js
RUN echo "async function startServer() {" >> modified-server.js
RUN echo "  try {" >> modified-server.js
RUN echo "    console.log('Connecting to database...');" >> modified-server.js
RUN echo "    if (!process.env.DATABASE_URL) {" >> modified-server.js
RUN echo "      console.error('DATABASE_URL environment variable is not set');" >> modified-server.js
RUN echo "    } else {" >> modified-server.js
RUN echo "      console.log('DATABASE_URL is set');" >> modified-server.js
RUN echo "    }" >> modified-server.js
RUN echo "    await pgStorage.init();" >> modified-server.js
RUN echo "    console.log('Database initialized successfully');" >> modified-server.js
RUN echo "" >> modified-server.js
RUN echo "    // Setup auth" >> modified-server.js
RUN echo "    setupAuth(app);" >> modified-server.js
RUN echo "" >> modified-server.js
RUN echo "    // Aggiungi le route API" >> modified-server.js
RUN echo "    await registerRoutes(app);" >> modified-server.js
RUN echo "" >> modified-server.js
RUN echo "    // Servi i file statici in production" >> modified-server.js
RUN echo "    if (process.env.NODE_ENV === 'production') {" >> modified-server.js
RUN echo "      console.log('Serving static files from:', path.join(process.cwd(), 'dist/public'));" >> modified-server.js
RUN echo "      app.use(express.static(path.join(process.cwd(), 'dist/public')));" >> modified-server.js
RUN echo "      app.get('*', (req, res) => {" >> modified-server.js
RUN echo "        res.sendFile(path.join(process.cwd(), 'dist/public/index.html'));" >> modified-server.js
RUN echo "      });" >> modified-server.js
RUN echo "    }" >> modified-server.js
RUN echo "" >> modified-server.js
RUN echo "    // Gestione errori" >> modified-server.js
RUN echo "    app.use((err, _req, res, _next) => {" >> modified-server.js
RUN echo "      console.error('Server error:', err);" >> modified-server.js
RUN echo "      res.status(500).json({ message: err.message || 'Internal Server Error' });" >> modified-server.js
RUN echo "    });" >> modified-server.js
RUN echo "" >> modified-server.js
RUN echo "    // Imposta la porta" >> modified-server.js
RUN echo "    const PORT = process.env.PORT || 3000;" >> modified-server.js
RUN echo "    app.listen(PORT, '0.0.0.0', () => {" >> modified-server.js
RUN echo "      console.log(`Server running on port ${PORT}`);" >> modified-server.js
RUN echo "    });" >> modified-server.js
RUN echo "  } catch (error) {" >> modified-server.js
RUN echo "    console.error('Startup error:', error);" >> modified-server.js
RUN echo "    process.exit(1);" >> modified-server.js
RUN echo "  }" >> modified-server.js
RUN echo "}" >> modified-server.js
RUN echo "" >> modified-server.js
RUN echo "startServer();" >> modified-server.js

# Patch per il file vite.config.ts
RUN sed -i 's/import\.meta\.dirname/process.cwd()/g' vite.config.ts

# Esegui il build del frontend
RUN npm run build

# Esponi il codice TypeScript compilato con esbuild
RUN npx esbuild server/*.ts shared/*.ts --platform=node --packages=external --format=esm --outdir=dist

# Crea directory per gli upload
RUN mkdir -p uploads

# Imposta variabili d'ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Espone la porta
EXPOSE 3000

# Avvia con il server modificato
CMD ["node", "modified-server.js"]
