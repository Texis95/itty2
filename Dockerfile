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

# Crea directory per gli upload
RUN mkdir -p uploads

# Installa express e altre dipendenze
RUN npm install express express-session passport passport-local drizzle-orm pg

# Crea un server Express che include API di base
RUN echo "import express from 'express';" > api-server.mjs
RUN echo "import session from 'express-session';" >> api-server.mjs
RUN echo "import passport from 'passport';" >> api-server.mjs
RUN echo "import { Strategy as LocalStrategy } from 'passport-local';" >> api-server.mjs
RUN echo "import path from 'path';" >> api-server.mjs
RUN echo "import { fileURLToPath } from 'url';" >> api-server.mjs
RUN echo "import fs from 'fs';" >> api-server.mjs
RUN echo "import crypto from 'crypto';" >> api-server.mjs
RUN echo "import { drizzle } from 'drizzle-orm/postgres-js';" >> api-server.mjs
RUN echo "import postgres from 'postgres';" >> api-server.mjs
RUN echo "" >> api-server.mjs
RUN echo "// Configurazione di base" >> api-server.mjs
RUN echo "const __filename = fileURLToPath(import.meta.url);" >> api-server.mjs
RUN echo "const __dirname = path.dirname(__filename);" >> api-server.mjs
RUN echo "const app = express();" >> api-server.mjs
RUN echo "" >> api-server.mjs
RUN echo "// Middleware di base" >> api-server.mjs
RUN echo "app.use(express.json());" >> api-server.mjs
RUN echo "app.use(express.urlencoded({ extended: false }));" >> api-server.mjs
RUN echo "app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));" >> api-server.mjs
RUN echo "" >> api-server.mjs
RUN echo "// Database setup" >> api-server.mjs
RUN echo "const client = postgres(process.env.DATABASE_URL);" >> api-server.mjs
RUN echo "const db = drizzle(client);" >> api-server.mjs
RUN echo "" >> api-server.mjs
RUN echo "console.log('Starting API server...');" >> api-server.mjs
RUN echo "console.log('Database URL available:', !!process.env.DATABASE_URL);" >> api-server.mjs
RUN echo "" >> api-server.mjs
RUN echo "// Helper per password" >> api-server.mjs
RUN echo "async function comparePasswords(supplied, stored) {" >> api-server.mjs
RUN echo "  const [hashed, salt] = stored.split('.');" >> api-server.mjs
RUN echo "  const suppliedHashedBuf = await new Promise((resolve, reject) => {" >> api-server.mjs
RUN echo "    crypto.scrypt(supplied, salt, 64, (err, derivedKey) => {" >> api-server.mjs
RUN echo "      if (err) reject(err);" >> api-server.mjs
RUN echo "      resolve(derivedKey);" >> api-server.mjs
RUN echo "    });" >> api-server.mjs
RUN echo "  });" >> api-server.mjs
RUN echo "  const suppliedHashedHex = suppliedHashedBuf.toString('hex');" >> api-server.mjs
RUN echo "  return suppliedHashedHex === hashed;" >> api-server.mjs
RUN echo "}" >> api-server.mjs
RUN echo "" >> api-server.mjs
RUN echo "// Configurazione sessione" >> api-server.mjs
RUN echo "const sessionSettings = {" >> api-server.mjs
RUN echo "  secret: process.env.SESSION_SECRET || 'keyboard cat'," >> api-server.mjs
RUN echo "  resave: false," >> api-server.mjs
RUN echo "  saveUninitialized: false," >> api-server.mjs
RUN echo "  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }" >> api-server.mjs
RUN echo "};" >> api-server.mjs
RUN echo "app.use(session(sessionSettings));" >> api-server.mjs
RUN echo "app.use(passport.initialize());" >> api-server.mjs
RUN echo "app.use(passport.session());" >> api-server.mjs
RUN echo "" >> api-server.mjs
RUN echo "// Passport config" >> api-server.mjs
RUN echo "passport.use(new LocalStrategy(async (username, password, done) => {" >> api-server.mjs
RUN echo "  try {" >> api-server.mjs
RUN echo "    const users = await db.query.users.findMany({" >> api-server.mjs
RUN echo "      where: (users, { eq }) => eq(users.username, username)" >> api-server.mjs
RUN echo "    });" >> api-server.mjs
RUN echo "    const user = users[0];" >> api-server.mjs
RUN echo "    if (!user) return done(null, false);" >> api-server.mjs
RUN echo "    const isValid = await comparePasswords(password, user.password);" >> api-server.mjs
RUN echo "    if (!isValid) return done(null, false);" >> api-server.mjs
RUN echo "    return done(null, user);" >> api-server.mjs
RUN echo "  } catch (err) {" >> api-server.mjs
RUN echo "    return done(err);" >> api-server.mjs
RUN echo "  }" >> api-server.mjs
RUN echo "}));" >> api-server.mjs
RUN echo "" >> api-server.mjs
RUN echo "passport.serializeUser((user, done) => done(null, user.id));" >> api-server.mjs
RUN echo "passport.deserializeUser(async (id, done) => {" >> api-server.mjs
RUN echo "  try {" >> api-server.mjs
RUN echo "    const users = await db.query.users.findMany({" >> api-server.mjs
RUN echo "      where: (users, { eq }) => eq(users.id, id)" >> api-server.mjs
RUN echo "    });" >> api-server.mjs
RUN echo "    done(null, users[0]);" >> api-server.mjs
RUN echo "  } catch (err) {" >> api-server.mjs
RUN echo "    done(err);" >> api-server.mjs
RUN echo "  }" >> api-server.mjs
RUN echo "});" >> api-server.mjs
RUN echo "" >> api-server.mjs
RUN echo "// Middleware di autenticazione" >> api-server.mjs
RUN echo "function ensureAuthenticated(req, res, next) {" >> api-server.mjs
RUN echo "  if (req.isAuthenticated()) return next();" >> api-server.mjs
RUN echo "  res.status(401).json({ message: 'Unauthorized' });" >> api-server.mjs
RUN echo "}" >> api-server.mjs
RUN echo "" >> api-server.mjs
RUN echo "// API di autenticazione" >> api-server.mjs
RUN echo "app.post('/api/login', (req, res, next) => {" >> api-server.mjs
RUN echo "  passport.authenticate('local', (err, user) => {" >> api-server.mjs
RUN echo "    if (err) return next(err);" >> api-server.mjs
RUN echo "    if (!user) return res.status(401).json({ message: 'Invalid username or password' });" >> api-server.mjs
RUN echo "    req.login(user, (err) => {" >> api-server.mjs
RUN echo "      if (err) return next(err);" >> api-server.mjs
RUN echo "      const { password, ...userWithoutPassword } = user;" >> api-server.mjs
RUN echo "      res.json(userWithoutPassword);" >> api-server.mjs
RUN echo "    });" >> api-server.mjs
RUN echo "  })(req, res, next);" >> api-server.mjs
RUN echo "});" >> api-server.mjs
RUN echo "" >> api-server.mjs
RUN echo "app.post('/api/logout', (req, res, next) => {" >> api-server.mjs
RUN echo "  req.logout((err) => {" >> api-server.mjs
RUN echo "    if (err) return next(err);" >> api-server.mjs
RUN echo "    res.sendStatus(200);" >> api-server.mjs
RUN echo "  });" >> api-server.mjs
RUN echo "});" >> api-server.mjs
RUN echo "" >> api-server.mjs
RUN echo "app.get('/api/user', (req, res) => {" >> api-server.mjs
RUN echo "  if (!req.isAuthenticated()) return res.sendStatus(401);" >> api-server.mjs
RUN echo "  const { password, ...userWithoutPassword } = req.user;" >> api-server.mjs
RUN echo "  res.json(userWithoutPassword);" >> api-server.mjs
RUN echo "});" >> api-server.mjs
RUN echo "" >> api-server.mjs
RUN echo "// Servi i file statici" >> api-server.mjs
RUN echo "app.use(express.static(path.join(process.cwd(), 'dist/public')));" >> api-server.mjs
RUN echo "" >> api-server.mjs
RUN echo "// Route fallback per SPA" >> api-server.mjs
RUN echo "app.get('*', (req, res) => {" >> api-server.mjs
RUN echo "  res.sendFile(path.join(process.cwd(), 'dist/public/index.html'));" >> api-server.mjs
RUN echo "});" >> api-server.mjs
RUN echo "" >> api-server.mjs
RUN echo "// Gestione errori" >> api-server.mjs
RUN echo "app.use((err, req, res, next) => {" >> api-server.mjs
RUN echo "  console.error('Server error:', err);" >> api-server.mjs
RUN echo "  res.status(500).json({ message: err.message || 'Internal Server Error' });" >> api-server.mjs
RUN echo "});" >> api-server.mjs
RUN echo "" >> api-server.mjs
RUN echo "// Avvia il server" >> api-server.mjs
RUN echo "const PORT = process.env.PORT || 3000;" >> api-server.mjs
RUN echo "app.listen(PORT, '0.0.0.0', () => {" >> api-server.mjs
RUN echo "  console.log(`API server running on port ${PORT}`);" >> api-server.mjs
RUN echo "});" >> api-server.mjs

# Imposta variabili d'ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Espone la porta
EXPOSE 3000

# Avvia il server con le API
CMD ["node", "api-server.mjs"]
