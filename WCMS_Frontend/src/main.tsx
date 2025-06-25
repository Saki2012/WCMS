import 'bootstrap/dist/css/bootstrap.min.css'; // 引入 CSS
import 'bootstrap'; // 自動載入 JS（含 Carousel）
import { Carousel } from 'bootstrap';
(window as any).bootstrap = { Carousel };

console.log('Bootstrap Carousel loaded:', typeof Carousel === 'function');

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
