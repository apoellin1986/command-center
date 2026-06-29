import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { StoreProvider } from './storage/StoreContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* HashRouter keeps deep links working when installed as a PWA / opened from file. */}
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <StoreProvider>
        <App />
      </StoreProvider>
    </HashRouter>
  </StrictMode>,
)
