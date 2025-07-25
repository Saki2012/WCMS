// src/Features/Test/TestApiCall.tsx
import { createRoot } from 'react-dom/client'
import App from './App';
import { MessageProvider } from './SysCore/Components/Message/Dialog/Dialog_Comp';
import './style.css';

createRoot(document.getElementById('root')!).render(
  <MessageProvider>
    <App />
  </MessageProvider>
);