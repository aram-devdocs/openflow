import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/globals.css';

function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-zinc-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold">OpenFlow</h1>
        <p className="mt-2 text-zinc-400">AI Task Orchestration</p>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
