import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Always render the app. Demo mode (no real Supabase credentials) is
// handled entirely inside App.tsx / AuthContext — the app renders fully
// and auto-signs in as a demo admin instead of redirecting to a static
// error page. See src/lib/supabase.ts (isSupabaseConfigured) and
// src/lib/demoAuth.ts.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
