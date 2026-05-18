import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import App from "./App.jsx";

// ── Advertencia Self-XSS ──────────────────────────────
console.log(
  "%c⚠️ ADVERTENCIA DE SEGURIDAD",
  "color:#ff0000; font-size:28px; font-weight:bold;"
);
console.log(
  "%cEsta es una función del navegador destinada a desarrolladores. " +
  "Si alguien te indicó que copiaras o pegaras algo aquí para activar " +
  "una función o acceder a la cuenta de otra persona, se trata de un " +
  "engaño conocido como Self-XSS y podría comprometer tu cuenta.",
  "color:#ff4444; font-size:14px;"
);
console.log(
  "%c🔒 Tasker nunca te pedirá que ejecutes código en esta consola.",
  "color:#10b981; font-size:14px; font-weight:bold;"
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
