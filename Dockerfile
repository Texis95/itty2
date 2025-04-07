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

# Crea un server Express semplificato
RUN echo "import express from 'express';" > simple-server.mjs
RUN echo "import session from 'express-session';" >> simple-server.mjs
RUN echo "import passport from 'passport';" >> simple-server.mjs
RUN echo "import { Strategy as LocalStrategy } from 'passport-local';" >> simple-server.mjs
RUN echo "import path from 'path';" >> simple-server.mjs
RUN echo "import { fileURLToPath } from 'url';" >> simple-server.mjs
RUN echo "import fs from 'fs';" >> simple-server.mjs
RUN echo "import crypto from 'crypto';" >> simple-server.mjs
RUN echo "import { drizzle } from 'drizzle-orm/postgres-js';" >> simple-server.mjs
RUN echo "import postgres from 'postgres';" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "// Configurazione di base" >> simple-server.mjs
RUN echo "const __filename = fileURLToPath(import.meta.url);" >> simple-server.mjs
RUN echo "const __dirname = path.dirname(__filename);" >> simple-server.mjs
RUN echo "const app = express();" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "// Middleware di base" >> simple-server.mjs
RUN echo "app.use(express.json());" >> simple-server.mjs
RUN echo "app.use(express.urlencoded({ extended: false }));" >> simple-server.mjs
RUN echo "app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "console.log('Starting simple server...');" >> simple-server.mjs
RUN echo "console.log('Database URL available:', !!process.env.DATABASE_URL);" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "// Configurazione sessione" >> simple-server.mjs
RUN echo "const sessionSettings = {" >> simple-server.mjs
RUN echo "  secret: process.env.SESSION_SECRET || 'keyboard cat'," >> simple-server.mjs
RUN echo "  resave: false," >> simple-server.mjs
RUN echo "  saveUninitialized: false," >> simple-server.mjs
RUN echo "  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }" >> simple-server.mjs
RUN echo "};" >> simple-server.mjs
RUN echo "app.use(session(sessionSettings));" >> simple-server.mjs
RUN echo "app.use(passport.initialize());" >> simple-server.mjs
RUN echo "app.use(passport.session());" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "// PostgreSQL client semplice" >> simple-server.mjs
RUN echo "const client = postgres(process.env.DATABASE_URL);" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "// Funzioni utente semplici senza drizzle" >> simple-server.mjs
RUN echo "async function getUserByUsername(username) {" >> simple-server.mjs
RUN echo "  const users = await client\`SELECT * FROM users WHERE username = \${username}\`;" >> simple-server.mjs
RUN echo "  return users[0];" >> simple-server.mjs
RUN echo "}" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "async function getUserById(id) {" >> simple-server.mjs
RUN echo "  const users = await client\`SELECT * FROM users WHERE id = \${id}\`;" >> simple-server.mjs
RUN echo "  return users[0];" >> simple-server.mjs
RUN echo "}" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "// Helper per password" >> simple-server.mjs
RUN echo "async function comparePasswords(supplied, stored) {" >> simple-server.mjs
RUN echo "  const [hashed, salt] = stored.split('.');" >> simple-server.mjs
RUN echo "  const suppliedHashedBuf = await new Promise((resolve, reject) => {" >> simple-server.mjs
RUN echo "    crypto.scrypt(supplied, salt, 64, (err, derivedKey) => {" >> simple-server.mjs
RUN echo "      if (err) reject(err);" >> simple-server.mjs
RUN echo "      resolve(derivedKey);" >> simple-server.mjs
RUN echo "    });" >> simple-server.mjs
RUN echo "  });" >> simple-server.mjs
RUN echo "  const suppliedHashedHex = suppliedHashedBuf.toString('hex');" >> simple-server.mjs
RUN echo "  return suppliedHashedHex === hashed;" >> simple-server.mjs
RUN echo "}" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "// Passport config" >> simple-server.mjs
RUN echo "passport.use(new LocalStrategy(async (username, password, done) => {" >> simple-server.mjs
RUN echo "  try {" >> simple-server.mjs
RUN echo "    const user = await getUserByUsername(username);" >> simple-server.mjs
RUN echo "    if (!user) return done(null, false);" >> simple-server.mjs
RUN echo "    const isValid = await comparePasswords(password, user.password);" >> simple-server.mjs
RUN echo "    if (!isValid) return done(null, false);" >> simple-server.mjs
RUN echo "    return done(null, user);" >> simple-server.mjs
RUN echo "  } catch (err) {" >> simple-server.mjs
RUN echo "    console.error('Auth error:', err);" >> simple-server.mjs
RUN echo "    return done(err);" >> simple-server.mjs
RUN echo "  }" >> simple-server.mjs
RUN echo "}));" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "passport.serializeUser((user, done) => done(null, user.id));" >> simple-server.mjs
RUN echo "passport.deserializeUser(async (id, done) => {" >> simple-server.mjs
RUN echo "  try {" >> simple-server.mjs
RUN echo "    const user = await getUserById(id);" >> simple-server.mjs
RUN echo "    done(null, user);" >> simple-server.mjs
RUN echo "  } catch (err) {" >> simple-server.mjs
RUN echo "    console.error('Deserialize error:', err);" >> simple-server.mjs
RUN echo "    done(err);" >> simple-server.mjs
RUN echo "  }" >> simple-server.mjs
RUN echo "});" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "// Middleware di autenticazione" >> simple-server.mjs
RUN echo "function ensureAuthenticated(req, res, next) {" >> simple-server.mjs
RUN echo "  if (req.isAuthenticated()) return next();" >> simple-server.mjs
RUN echo "  res.status(401).json({ message: 'Unauthorized' });" >> simple-server.mjs
RUN echo "}" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "// API di autenticazione" >> simple-server.mjs
RUN echo "app.post('/api/login', (req, res, next) => {" >> simple-server.mjs
RUN echo "  console.log('Login attempt:', req.body.username);" >> simple-server.mjs
RUN echo "  passport.authenticate('local', (err, user) => {" >> simple-server.mjs
RUN echo "    if (err) {" >> simple-server.mjs
RUN echo "      console.error('Login error:', err);" >> simple-server.mjs
RUN echo "      return next(err);" >> simple-server.mjs
RUN echo "    }" >> simple-server.mjs
RUN echo "    if (!user) {" >> simple-server.mjs
RUN echo "      console.log('Invalid credentials');" >> simple-server.mjs
RUN echo "      return res.status(401).json({ message: 'Invalid username or password' });" >> simple-server.mjs
RUN echo "    }" >> simple-server.mjs
RUN echo "    req.login(user, (err) => {" >> simple-server.mjs
RUN echo "      if (err) return next(err);" >> simple-server.mjs
RUN echo "      const { password, ...userWithoutPassword } = user;" >> simple-server.mjs
RUN echo "      console.log('Login successful');" >> simple-server.mjs
RUN echo "      res.json(userWithoutPassword);" >> simple-server.mjs
RUN echo "    });" >> simple-server.mjs
RUN echo "  })(req, res, next);" >> simple-server.mjs
RUN echo "});" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "app.post('/api/logout', (req, res, next) => {" >> simple-server.mjs
RUN echo "  req.logout((err) => {" >> simple-server.mjs
RUN echo "    if (err) return next(err);" >> simple-server.mjs
RUN echo "    res.sendStatus(200);" >> simple-server.mjs
RUN echo "  });" >> simple-server.mjs
RUN echo "});" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "app.get('/api/user', (req, res) => {" >> simple-server.mjs
RUN echo "  if (!req.isAuthenticated()) return res.sendStatus(401);" >> simple-server.mjs
RUN echo "  const { password, ...userWithoutPassword } = req.user;" >> simple-server.mjs
RUN echo "  res.json(userWithoutPassword);" >> simple-server.mjs
RUN echo "});" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "// Implementa API di base per post e commenti" >> simple-server.mjs
RUN echo "app.get('/api/posts', async (req, res) => {" >> simple-server.mjs
RUN echo "  try {" >> simple-server.mjs
RUN echo "    const posts = await client\`" >> simple-server.mjs
RUN echo "      SELECT p.*, u.username, u.displayName, u.profileImage," >> simple-server.mjs
RUN echo "             COUNT(DISTINCT l.id) AS \"likeCount\"," >> simple-server.mjs
RUN echo "             COUNT(DISTINCT c.id) AS \"commentCount\"" >> simple-server.mjs
RUN echo "      FROM posts p" >> simple-server.mjs
RUN echo "      JOIN users u ON p.userId = u.id" >> simple-server.mjs
RUN echo "      LEFT JOIN likes l ON p.id = l.postId" >> simple-server.mjs
RUN echo "      LEFT JOIN comments c ON p.id = c.postId" >> simple-server.mjs
RUN echo "      GROUP BY p.id, u.id" >> simple-server.mjs
RUN echo "      ORDER BY p.createdAt DESC" >> simple-server.mjs
RUN echo "    \`;" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "    // Trasforma i post per la risposta" >> simple-server.mjs
RUN echo "    const transformedPosts = posts.map(post => {" >> simple-server.mjs
RUN echo "      const { username, displayName, profileImage, ...postData } = post;" >> simple-server.mjs
RUN echo "      return {" >> simple-server.mjs
RUN echo "        ...postData," >> simple-server.mjs
RUN echo "        user: { id: post.userId, username, displayName, profileImage }" >> simple-server.mjs
RUN echo "      };" >> simple-server.mjs
RUN echo "    });" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "    res.json(transformedPosts);" >> simple-server.mjs
RUN echo "  } catch (error) {" >> simple-server.mjs
RUN echo "    console.error('Error fetching posts:', error);" >> simple-server.mjs
RUN echo "    res.status(500).json({ message: 'Failed to fetch posts' });" >> simple-server.mjs
RUN echo "  }" >> simple-server.mjs
RUN echo "});" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "// Servi i file statici" >> simple-server.mjs
RUN echo "app.use(express.static(path.join(process.cwd(), 'dist/public')));" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "// Route fallback per SPA" >> simple-server.mjs
RUN echo "app.get('*', (req, res) => {" >> simple-server.mjs
RUN echo "  res.sendFile(path.join(process.cwd(), 'dist/public/index.html'));" >> simple-server.mjs
RUN echo "});" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "// Gestione errori" >> simple-server.mjs
RUN echo "app.use((err, req, res, next) => {" >> simple-server.mjs
RUN echo "  console.error('Server error:', err);" >> simple-server.mjs
RUN echo "  res.status(500).json({ message: err.message || 'Internal Server Error' });" >> simple-server.mjs
RUN echo "});" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "// Avvia il server" >> simple-server.mjs
RUN echo "const PORT = process.env.PORT || 3000;" >> simple-server.mjs
RUN echo "app.listen(PORT, '0.0.0.0', () => {" >> simple-server.mjs
RUN echo "  console.log(`Server running on port ${PORT}`);" >> simple-server.mjs
RUN echo "});" >> simple-server.mjs

# Installa pacchetti necessari
RUN npm install express express-session passport passport-local postgres

# Imposta variabili d'ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Espone la porta
EXPOSE 3000

# Avvia il server semplificato
CMD ["node", "simple-server.mjs"]
