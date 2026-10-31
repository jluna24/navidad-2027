import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import Lista from './pages/Lista';
import Detalle from './pages/Detalle';
import Sorteo from './pages/Sorteo';
import Ruleta from './pages/Ruleta';
import Resumen from './pages/Resumen';
import BotonSesion from './components/BotonSesion';
import Navegacion from './components/Navegacion';
import { SesionProvider } from './sesion';
import { ConfirmarProvider } from './confirmar';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SesionProvider>
      <ConfirmarProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 text-slate-800">
            <header className="bg-red-700 text-white">
              <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4">
                <Link to="/" className="flex items-center gap-3 text-xl font-bold">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white p-1 shadow">
                    <img src="/logo.png" alt="" className="h-full w-full object-contain" />
                  </span>
                  Ahorro Navideño
                </Link>
                <BotonSesion />
              </div>
            </header>
            <Navegacion />
            <main className="mx-auto max-w-5xl px-4 py-6">
              <Routes>
                <Route path="/" element={<Lista />} />
                <Route path="/usuarios/:id" element={<Detalle />} />
                <Route path="/resumen" element={<Resumen />} />
                <Route path="/sorteo" element={<Sorteo />} />
                <Route path="/ruleta/:codigo" element={<Ruleta />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </ConfirmarProvider>
    </SesionProvider>
  </StrictMode>,
);
