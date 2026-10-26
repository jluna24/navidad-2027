import { useState } from 'react';

interface Props {
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  className?: string;
}

// Fondo blanco explícito para que contraste también sobre el encabezado rojo,
// con botón propio para mostrar/ocultar en vez del ojo de cada navegador
export default function CampoPassword({ value, onChange, placeholder = 'Contraseña', autoFocus, autoComplete, className = '' }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        required
        className="w-full rounded border border-slate-300 bg-white py-1.5 pr-9 pl-2 text-slate-900 [color-scheme:light] placeholder:text-slate-400"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute inset-y-0 right-0 flex w-8 items-center justify-center rounded-r text-slate-600 hover:text-slate-900"
      >
        {visible ? <OjoTachado /> : <Ojo />}
      </button>
    </div>
  );
}

const Ojo = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const OjoTachado = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6A17.4 17.4 0 0 0 2 12s3.5 7 10 7a10.6 10.6 0 0 0 5.4-1.4" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    <path d="M3 3l18 18" />
  </svg>
);
