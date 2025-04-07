import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Handler globale per gli errori non gestiti - catturerà gli errori di WebSocket di Vite
if (import.meta.env.DEV) {
  // Solo in ambiente di sviluppo
  window.addEventListener('unhandledrejection', function (event) {
    // Se l'errore è legato a WebSocket di Vite, lo ignoriamo silenziosamente
    if (event.reason && 
        (event.reason.message?.includes('Failed to construct \'WebSocket\'') || 
         event.reason.toString().includes('wss://localhost:undefined'))) {
      console.info('[DEV] Ignoring Vite HMR WebSocket error');
      event.preventDefault(); // Prevent error from being logged
      return true;
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
