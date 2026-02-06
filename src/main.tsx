import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import "./plugins/i18n"
import App from "./App.tsx"
import { TanstackProvider } from "./providers/TanstackProvider.tsx"

import { ThemeProvider } from "./components/theme-provider.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TanstackProvider>
        <App />
      </TanstackProvider>
    </ThemeProvider>
  </StrictMode>
)
