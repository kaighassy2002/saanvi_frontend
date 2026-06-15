import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import { initSentry } from './monitoring/sentry'
import App from './App.jsx'
import { GOOGLE_CLIENT_ID } from './services/config'

initSentry()

const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

const root = GOOGLE_CLIENT_ID ? (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{app}</GoogleOAuthProvider>
) : (
  app
)

createRoot(document.getElementById('root')).render(root)
