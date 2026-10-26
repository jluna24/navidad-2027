import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';
// Si no hay SESSION_SECRET, las sesiones se invalidan cada vez que reinicia el servidor
const SECRET = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
const DURACION_MS = 30 * 24 * 60 * 60 * 1000;

if (!ADMIN_PASSWORD) {
  console.warn('⚠ ADMIN_PASSWORD no está definido en .env: nadie podrá iniciar sesión como admin');
}

const firmar = (exp: number) => createHmac('sha256', SECRET).update(`admin:${exp}`).digest('hex');

function iguales(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export const passwordCorrecta = (password: unknown) =>
  !!ADMIN_PASSWORD && typeof password === 'string' && iguales(password, ADMIN_PASSWORD);

export function login(password: unknown) {
  if (!passwordCorrecta(password)) return null;
  const exp = Date.now() + DURACION_MS;
  return `${exp}.${firmar(exp)}`;
}

export function esAdmin(req: Request) {
  const token = req.headers.authorization?.replace(/^Bearer /, '') ?? '';
  const [expStr, firma] = token.split('.');
  const exp = Number(expStr);
  return Number.isFinite(exp) && exp > Date.now() && !!firma && iguales(firma, firmar(exp));
}

export function soloAdmin(req: Request, res: Response, next: NextFunction) {
  if (esAdmin(req)) return next();
  res.status(401).json({ error: 'Solo el admin puede hacer cambios' });
}
