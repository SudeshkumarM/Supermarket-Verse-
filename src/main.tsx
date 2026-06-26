import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { checkServerConnectionAndInit } from './clientDb';

async function initAndRender() {
  await checkServerConnectionAndInit();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

initAndRender();
