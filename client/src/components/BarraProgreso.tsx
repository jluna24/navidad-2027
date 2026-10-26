import { formatMonto } from '../format';

interface Props {
  actual: number;
  meta: number;
  color: 'red' | 'green';
}

const colores = {
  red: 'bg-red-600',
  green: 'bg-green-600',
};

export default function BarraProgreso({ actual, meta, color }: Props) {
  const pct = Math.min(100, Math.round((actual / meta) * 100));
  const cumplida = actual >= meta;

  return (
    <div className="min-w-40">
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium">
          {formatMonto(actual)} / {formatMonto(meta)}
        </span>
        <span className={cumplida ? 'font-semibold text-green-700' : 'text-slate-500'}>
          {cumplida ? '✓ Cumplida' : `${pct}%`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full ${colores[color]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
