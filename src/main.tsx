import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ReactTogether } from 'react-together'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReactTogether
      sessionParams={{
        appId: import.meta.env['VITE_APP_ID'],
        apiKey: import.meta.env['VITE_API_KEY'],

        // The options below will make every user immediately join session 'hello-world'
        name: 'hello-world',
        password: 'super-secret!!',
      }}
    >
      <App />
    </ReactTogether>
  </StrictMode>,
)
