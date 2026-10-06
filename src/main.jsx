import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import SiteFerme from './screens/SiteFerme.jsx'
import { estAppliNative } from './lib/cameraNative.js'
import './styles.css'

// Pour l'instant, Malow ne s'utilise que dans l'appli : le site affiche « bientôt ».
const SITE_OUVERT = estAppliNative() || import.meta.env.DEV

createRoot(document.getElementById('root')).render(
  <React.StrictMode>{SITE_OUVERT ? <App /> : <SiteFerme />}</React.StrictMode>,
)
