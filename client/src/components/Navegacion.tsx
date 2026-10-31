import { NavLink } from 'react-router-dom';
import { Calculator, Gift, House, type LucideIcon } from 'lucide-react';
import { useSesion } from '../sesion';

const paginas: { to: string; texto: string; Icono: LucideIcon }[] = [
  { to: '/', texto: 'Inicio', Icono: House },
  { to: '/resumen', texto: 'Resumen', Icono: Calculator },
  { to: '/sorteo', texto: 'Sorteo', Icono: Gift },
];

// Solo el admin tiene más de una página; a los demás no les sirve la barra
export default function Navegacion() {
  const { admin } = useSesion();
  if (!admin) return null;

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
        {paginas.map(({ to, texto, Icono }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `inline-flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-red-700 text-red-700'
                  : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`
            }
          >
            <Icono className="h-4 w-4" /> {texto}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
