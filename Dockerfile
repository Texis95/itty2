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

# Crea un server Express con script di inizializzazione DB
RUN echo "import express from 'express';" > simple-server.mjs
RUN echo "import session from 'express-session';" >> simple-server.mjs
RUN echo "import passport from 'passport';" >> simple-server.mjs
RUN echo "import { Strategy as LocalStrategy } from 'passport-local';" >> simple-server.mjs
RUN echo "import path from 'path';" >> simple-server.mjs
RUN echo "import { fileURLToPath } from 'url';" >> simple-server.mjs
RUN echo "import fs from 'fs';" >> simple-server.mjs
RUN echo "import crypto from 'crypto';" >> simple-server.mjs
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
RUN echo "// PostgreSQL client" >> simple-server.mjs
RUN echo "const client = postgres(process.env.DATABASE_URL);" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "// Inizializza il database" >> simple-server.mjs
RUN echo "async function initializeDatabase() {" >> simple-server.mjs
RUN echo "  try {" >> simple-server.mjs
RUN echo "    console.log('Checking database tables...');" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "    // Check if users table exists" >> simple-server.mjs
RUN echo "    const tablesExist = await client\`" >> simple-server.mjs
RUN echo "      SELECT EXISTS (" >> simple-server.mjs
RUN echo "        SELECT FROM information_schema.tables " >> simple-server.mjs
RUN echo "        WHERE table_schema = 'public' AND table_name = 'users'" >> simple-server.mjs
RUN echo "      );" >> simple-server.mjs
RUN echo "    \`;" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "    if (!tablesExist[0].exists) {" >> simple-server.mjs
RUN echo "      console.log('Creating database tables...');" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "      // Create users table" >> simple-server.mjs
RUN echo "      await client\`" >> simple-server.mjs
RUN echo "        CREATE TABLE users (" >> simple-server.mjs
RUN echo "          id SERIAL PRIMARY KEY," >> simple-server.mjs
RUN echo "          username VARCHAR(255) UNIQUE NOT NULL," >> simple-server.mjs
RUN echo "          email VARCHAR(255) UNIQUE NOT NULL," >> simple-server.mjs
RUN echo "          password VARCHAR(255) NOT NULL," >> simple-server.mjs
RUN echo "          displayName VARCHAR(255)," >> simple-server.mjs
RUN echo "          bio TEXT," >> simple-server.mjs
RUN echo "          profileImage VARCHAR(255)," >> simple-server.mjs
RUN echo "          isAdmin BOOLEAN DEFAULT FALSE," >> simple-server.mjs
RUN echo "          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP" >> simple-server.mjs
RUN echo "        );" >> simple-server.mjs
RUN echo "      \`;" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "      // Create posts table" >> simple-server.mjs
RUN echo "      await client\`" >> simple-server.mjs
RUN echo "        CREATE TABLE posts (" >> simple-server.mjs
RUN echo "          id SERIAL PRIMARY KEY," >> simple-server.mjs
RUN echo "          content TEXT NOT NULL," >> simple-server.mjs
RUN echo "          userId INTEGER NOT NULL REFERENCES users(id)," >> simple-server.mjs
RUN echo "          image VARCHAR(255)," >> simple-server.mjs
RUN echo "          originalPostId INTEGER REFERENCES posts(id)," >> simple-server.mjs
RUN echo "          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP" >> simple-server.mjs
RUN echo "        );" >> simple-server.mjs
RUN echo "      \`;" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "      // Create likes table" >> simple-server.mjs
RUN echo "      await client\`" >> simple-server.mjs
RUN echo "        CREATE TABLE likes (" >> simple-server.mjs
RUN echo "          id SERIAL PRIMARY KEY," >> simple-server.mjs
RUN echo "          userId INTEGER NOT NULL REFERENCES users(id)," >> simple-server.mjs
RUN echo "          postId INTEGER NOT NULL REFERENCES posts(id)," >> simple-server.mjs
RUN echo "          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP," >> simple-server.mjs
RUN echo "          UNIQUE(userId, postId)" >> simple-server.mjs
RUN echo "        );" >> simple-server.mjs
RUN echo "      \`;" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "      // Create comments table" >> simple-server.mjs
RUN echo "      await client\`" >> simple-server.mjs
RUN echo "        CREATE TABLE comments (" >> simple-server.mjs
RUN echo "          id SERIAL PRIMARY KEY," >> simple-server.mjs
RUN echo "          content TEXT NOT NULL," >> simple-server.mjs
RUN echo "          userId INTEGER NOT NULL REFERENCES users(id)," >> simple-server.mjs
RUN echo "          postId INTEGER NOT NULL REFERENCES posts(id)," >> simple-server.mjs
RUN echo "          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP" >> simple-server.mjs
RUN echo "        );" >> simple-server.mjs
RUN echo "      \`;" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "      // Create messages table" >> simple-server.mjs
RUN echo "      await client\`" >> simple-server.mjs
RUN echo "        CREATE TABLE messages (" >> simple-server.mjs
RUN echo "          id SERIAL PRIMARY KEY," >> simple-server.mjs
RUN echo "          content TEXT NOT NULL," >> simple-server.mjs
RUN echo "          senderId INTEGER NOT NULL REFERENCES users(id)," >> simple-server.mjs
RUN echo "          receiverId INTEGER NOT NULL REFERENCES users(id)," >> simple-server.mjs
RUN echo "          read BOOLEAN DEFAULT FALSE," >> simple-server.mjs
RUN echo "          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP" >> simple-server.mjs
RUN echo "        );" >> simple-server.mjs
RUN echo "      \`;" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "      // Create notifications table" >> simple-server.mjs
RUN echo "      await client\`" >> simple-server.mjs
RUN echo "        CREATE TABLE notifications (" >> simple-server.mjs
RUN echo "          id SERIAL PRIMARY KEY," >> simple-server.mjs
RUN echo "          type VARCHAR(50) NOT NULL," >> simple-server.mjs
RUN echo "          userId INTEGER NOT NULL REFERENCES users(id)," >> simple-server.mjs
RUN echo "          actorId INTEGER NOT NULL REFERENCES users(id)," >> simple-server.mjs
RUN echo "          postId INTEGER REFERENCES posts(id)," >> simple-server.mjs
RUN echo "          read BOOLEAN DEFAULT FALSE," >> simple-server.mjs
RUN echo "          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP" >> simple-server.mjs
RUN echo "        );" >> simple-server.mjs
RUN echo "      \`;" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "      // Create admin user" >> simple-server.mjs
RUN echo "      console.log('Creating admin user...');" >> simple-server.mjs
RUN echo "      const salt = crypto.randomBytes(16).toString('hex');" >> simple-server.mjs
RUN echo "      const hash = crypto.scryptSync('admin123', salt, 64).toString('hex');" >> simple-server.mjs
RUN echo "      const password = \`\${hash}.\${salt}\`;" >> simple-server.mjs
RUN echo "      await client\`" >> simple-server.mjs
RUN echo "        INSERT INTO users (username, email, password, displayName, isAdmin)" >> simple-server.mjs
RUN echo "        VALUES ('admin', 'admin@example.com', \${password}, 'Admin User', TRUE)" >> simple-server.mjs
RUN echo "      \`;" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "      // Create test user" >> simple-server.mjs
RUN echo "      const testSalt = crypto.randomBytes(16).toString('hex');" >> simple-server.mjs
RUN echo "      const testHash = crypto.scryptSync('password123', testSalt, 64).toString('hex');" >> simple-server.mjs
RUN echo "      const testPassword = \`\${testHash}.\${testSalt}\`;" >> simple-server.mjs
RUN echo "      await client\`" >> simple-server.mjs
RUN echo "        INSERT INTO users (username, email, password, displayName)" >> simple-server.mjs
RUN echo "        VALUES ('user', 'user@example.com', \${testPassword}, 'Regular User')" >> simple-server.mjs
RUN echo "      \`;" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "      console.log('Database initialization completed successfully!');" >> simple-server.mjs
RUN echo "    } else {" >> simple-server.mjs
RUN echo "      console.log('Database tables already exist');" >> simple-server.mjs
RUN echo "    }" >> simple-server.mjs
RUN echo "  } catch (error) {" >> simple-server.mjs
RUN echo "    console.error('Database initialization error:', error);" >> simple-server.mjs
RUN echo "  }" >> simple-server.mjs
RUN echo "}" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "// Funzioni helper per gli utenti" >> simple-server.mjs
RUN echo "async function getUserByUsername(username) {" >> simple-server.mjs
RUN echo "  try {" >> simple-server.mjs
RUN echo "    const users = await client\`SELECT * FROM users WHERE username = \${username}\`;" >> simple-server.mjs
RUN echo "    return users[0];" >> simple-server.mjs
RUN echo "  } catch (error) {" >> simple-server.mjs
RUN echo "    console.error('Error in getUserByUsername:', error);" >> simple-server.mjs
RUN echo "    throw error;" >> simple-server.mjs
RUN echo "  }" >> simple-server.mjs
RUN echo "}" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "async function getUserById(id) {" >> simple-server.mjs
RUN echo "  try {" >> simple-server.mjs
RUN echo "    const users = await client\`SELECT * FROM users WHERE id = \${id}\`;" >> simple-server.mjs
RUN echo "    return users[0];" >> simple-server.mjs
RUN echo "  } catch (error) {" >> simple-server.mjs
RUN echo "    console.error('Error in getUserById:', error);" >> simple-server.mjs
RUN echo "    throw error;" >> simple-server.mjs
RUN echo "  }" >> simple-server.mjs
RUN echo "}" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "// Helper per password" >> simple-server.mjs
RUN echo "async function comparePasswords(supplied, stored) {" >> simple-server.mjs
RUN echo "  try {" >> simple-server.mjs
RUN echo "    const [hashed, salt] = stored.split('.');" >> simple-server.mjs
RUN echo "    const suppliedHashedBuf = await new Promise((resolve, reject) => {" >> simple-server.mjs
RUN echo "      crypto.scrypt(supplied, salt, 64, (err, derivedKey) => {" >> simple-server.mjs
RUN echo "        if (err) reject(err);" >> simple-server.mjs
RUN echo "        resolve(derivedKey);" >> simple-server.mjs
RUN echo "      });" >> simple-server.mjs
RUN echo "    });" >> simple-server.mjs
RUN echo "    const suppliedHashedHex = suppliedHashedBuf.toString('hex');" >> simple-server.mjs
RUN echo "    return suppliedHashedHex === hashed;" >> simple-server.mjs
RUN echo "  } catch (error) {" >> simple-server.mjs
RUN echo "    console.error('Error in comparePasswords:', error);" >> simple-server.mjs
RUN echo "    return false;" >> simple-server.mjs
RUN echo "  }" >> simple-server.mjs
RUN echo "}" >> simple-server.mjs
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
RUN echo "// API routes" >> simple-server.mjs
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
RUN echo "// Serve static files" >> simple-server.mjs
RUN echo "app.use(express.static(path.join(process.cwd(), 'dist/public')));" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "// SPA fallback route" >> simple-server.mjs
RUN echo "app.get('*', (req, res) => {" >> simple-server.mjs
RUN echo "  res.sendFile(path.join(process.cwd(), 'dist/public/index.html'));" >> simple-server.mjs
RUN echo "});" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "// Error handling" >> simple-server.mjs
RUN echo "app.use((err, req, res, next) => {" >> simple-server.mjs
RUN echo "  console.error('Server error:', err);" >> simple-server.mjs
RUN echo "  res.status(500).json({ message: err.message || 'Internal Server Error' });" >> simple-server.mjs
RUN echo "});" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "// Start the server" >> simple-server.mjs
RUN echo "async function startServer() {" >> simple-server.mjs
RUN echo "  try {" >> simple-server.mjs
RUN echo "    await initializeDatabase();" >> simple-server.mjs
RUN echo "    const PORT = process.env.PORT || 3000;" >> simple-server.mjs
RUN echo "    app.listen(PORT, '0.0.0.0', () => {" >> simple-server.mjs
RUN echo "      console.log(`Server running on port ${PORT}`);" >> simple-server.mjs
RUN echo "    });" >> simple-server.mjs
RUN echo "  } catch (error) {" >> simple-server.mjs
RUN echo "    console.error('Failed to start server:', error);" >> simple-server.mjs
RUN echo "    process.exit(1);" >> simple-server.mjs
RUN echo "  }" >> simple-server.mjs
RUN echo "}" >> simple-server.mjs
RUN echo "" >> simple-server.mjs
RUN echo "startServer();" >> simple-server.mjs

# Installa pacchetti necessari
RUN npm install express express-session passport passport-local postgres

# Imposta variabili d'ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Espone la porta
EXPOSE 3000

# Avvia il server semplificato
CMD ["node", "simple-server.mjs"]
