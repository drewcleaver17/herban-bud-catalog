import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import QuoteView from './components/QuoteView.jsx'
import sourceProducts from './data/products.json'
import { readRFQFromURL } from './lib/rfq'
import './index.css'

// Routing decision happens once at mount, not reactively. If someone opens a
// share link on their phone, they get the read-only QuoteView. If they open
// it on desktop, they get the full catalog with the RFQ drawer auto-opened
// (existing behavior). No reactive switching on resize — that would be
// jarring mid-scroll.
//
// Three render paths:
//   1. Mobile + ?rfq=  → QuoteView (read-only, mobile-optimized)
//   2. Desktop + ?rfq= → App (drawer auto-opens with cart)
//   3. Anyone, no rfq  → App (catalog browse)
const MOBILE_BREAKPOINT = 768

function shouldRouteToQuoteView() {
  if (typeof window === 'undefined') return false
  const isMobile = window.innerWidth < MOBILE_BREAKPOINT
  if (!isMobile) return false
  const sharedRFQ = readRFQFromURL()
  return !!sharedRFQ
}

function Root() {
  if (shouldRouteToQuoteView()) {
    const rfq = readRFQFromURL()
    return <QuoteView products={sourceProducts} rfq={rfq} />
  }
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
