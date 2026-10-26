import { useState, type KeyboardEvent } from 'react';

// Ignora acentos y mayúsculas, igual que el sorteo: "perez" y "Pérez" son la misma familia
const normalizar = (s: string) => s.trim().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

interface Props {
  value: string;
  onChange: (valor: string) => void;
  // Familias ya capturadas, con repetidos; se agrupan aquí
  existentes: (string | null)[];
  className?: string;
  inputClassName?: string;
}

export default function CampoFamilia({ value, onChange, existentes, className = '', inputClassName = '' }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);

  // Agrupamos variantes ("Pérez", "perez") bajo la primera forma escrita
  const familias = new Map<string, { nombre: string; miembros: number }>();
  for (const f of existentes) {
    if (!f?.trim()) continue;
    const clave = normalizar(f);
    const actual = familias.get(clave);
    familias.set(clave, { nombre: actual?.nombre ?? f.trim(), miembros: (actual?.miembros ?? 0) + 1 });
  }

  const texto = normalizar(value);
  const sugerencias = [...familias.entries()]
    .filter(([clave]) => clave.includes(texto) && clave !== texto)
    .map(([, f]) => f)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
    .slice(0, 6);
  const mostrar = abierto && sugerencias.length > 0;

  function elegir(nombre: string) {
    onChange(nombre);
    setAbierto(false);
  }

  function alTeclear(e: KeyboardEvent<HTMLInputElement>) {
    if (!mostrar) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActivo((activo + 1) % sugerencias.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((activo - 1 + sugerencias.length) % sugerencias.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      elegir(sugerencias[activo].nombre);
    } else if (e.key === 'Escape') {
      setAbierto(false);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setAbierto(true);
          setActivo(0);
        }}
        onFocus={() => setAbierto(true)}
        onBlur={() => setAbierto(false)}
        onKeyDown={alTeclear}
        placeholder="Familia (apellido)"
        required
        autoComplete="off"
        role="combobox"
        aria-expanded={mostrar}
        aria-autocomplete="list"
        className={`w-full rounded border border-slate-300 bg-white ${inputClassName}`}
      />
      {mostrar && (
        <ul
          role="listbox"
          className="absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          <li className="px-3 pt-1 pb-1.5 text-xs text-slate-400">Familias registradas</li>
          {sugerencias.map((f, i) => (
            <li
              key={f.nombre}
              role="option"
              aria-selected={i === activo}
              // mousedown en vez de click para elegir antes de que el input pierda el foco
              onMouseDown={(e) => {
                e.preventDefault();
                elegir(f.nombre);
              }}
              onMouseEnter={() => setActivo(i)}
              className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-sm ${
                i === activo ? 'bg-red-50 text-red-800' : 'text-slate-700'
              }`}
            >
              <span>{f.nombre}</span>
              <span className="text-xs text-slate-400">
                {f.miembros} {f.miembros === 1 ? 'miembro' : 'miembros'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
