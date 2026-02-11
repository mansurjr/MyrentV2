import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import "./plugins/i18n"
import App from "./App.tsx"
import { TanstackProvider } from "./providers/TanstackProvider.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TanstackProvider>
      <App />
    </TanstackProvider>
  </StrictMode>
)
