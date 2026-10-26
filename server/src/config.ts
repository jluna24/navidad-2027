export const TIPOS = ['intercambio', 'ahorro'] as const;
export type Tipo = (typeof TIPOS)[number];

// Metas en centavos
export const METAS: Record<Tipo, number> = {
  intercambio: 600_00,
  ahorro: 1200_00,
};

export const FECHA_LIMITE = process.env.FECHA_LIMITE ?? '2026-12-20';
export const PORT = Number(process.env.PORT ?? 3001);

export const MIN_DESEOS = 3;
export const MAX_DESEOS = 10;
