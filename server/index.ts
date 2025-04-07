console.log('Current directory:', process.cwd());
console.log('Directory structure:', require('fs').readdirSync(process.cwd()));
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { pgStorage } from "./database"; // Importiamo la nostra implementazione PostgreSQL

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve i file statici dalla cartella uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Inizializza il database
  try {
    console.log('Starting database initialization...');
    
    // Log delle variabili d'ambiente disponibili (mascherando i valori sensibili)
    console.log('Environment variables present:');
    if (process.env.DATABASE_URL) console.log('- DATABASE_URL: [MASKED]');
    if (process.env.SESSION_SECRET) console.log('- SESSION_SECRET: [MASKED]');
    if (process.env.NODE_ENV) console.log('- NODE_ENV:', process.env.NODE_ENV);
    if (process.env.PORT) console.log('- PORT:', process.env.PORT);
    
    await pgStorage.init();
    console.log('Database inizializzato con successo');
  } catch (error) {
    console.error('Errore durante l\'inizializzazione del database:', error);
    process.exit(1);
  }
  try {
    await pgStorage.init();
    console.log('Database inizializzato con successo');
  } catch (error) {
    console.error('Errore durante l\'inizializzazione del database:', error);
    process.exit(1);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
