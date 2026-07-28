import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Providers } from './components/providers.component';
import { router } from './routes/router';
import './styles.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Client root element was not found.');
}

createRoot(root).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);
