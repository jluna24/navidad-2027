import { Router, type Request, type Response, type NextFunction } from 'express';
import { PrismaClient, type Aportacion } from '@prisma/client';
import { METAS, TIPOS, FECHA_LIMITE, MIN_DESEOS, MAX_DESEOS, type Tipo } from './config.js';
import { esAdmin, login, passwordCorrecta, soloAdmin } from './auth.js';
import { claveFamilia, generarCodigo, sortear, SorteoError } from './sorteo.js';

const prisma = new PrismaClient();
export const router = Router();

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Express 4 no captura errores de handlers async
const h =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

function totales(aportaciones: Pick<Aportacion, 'tipo' | 'montoCentavos'>[]) {
  const t: Record<Tipo, number> = { intercambio: 0, ahorro: 0 };
  for (const a of aportaciones) t[a.tipo as Tipo] += a.montoCentavos;
  return t;
}

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'ID inválido');
  return id;
}

function parseUsuario(body: any) {
  const nombre = typeof body?.nombre === 'string' ? body.nombre.trim() : '';
  if (!nombre) throw new HttpError(400, 'El nombre es obligatorio');
  const familia = typeof body?.familia === 'string' ? body.familia.trim() : '';
  if (!familia) throw new HttpError(400, 'La familia es obligatoria');
  return { nombre, familia };
}

function parseDeseos(body: any) {
  if (!Array.isArray(body?.deseos)) throw new HttpError(400, 'Se esperaba una lista de deseos');
  const deseos = body.deseos
    .filter((d: unknown): d is string => typeof d === 'string')
    .map((d: string) => d.trim())
    .filter(Boolean);
  if (deseos.length < MIN_DESEOS) throw new HttpError(400, `Escribe al menos ${MIN_DESEOS} gustos o deseos`);
  if (deseos.length > MAX_DESEOS) throw new HttpError(400, `Máximo ${MAX_DESEOS} gustos o deseos`);
  if (deseos.some((d: string) => d.length > 200)) throw new HttpError(400, 'Cada deseo debe tener máximo 200 caracteres');
  return deseos as string[];
}

function parseAportacion(body: any) {
  const monto = Number(body?.monto);
  if (!Number.isFinite(monto) || monto <= 0) throw new HttpError(400, 'El monto debe ser mayor a 0');
  if (!TIPOS.includes(body?.tipo)) throw new HttpError(400, `El tipo debe ser: ${TIPOS.join(', ')}`);
  const fecha = new Date(body?.fecha);
  if (Number.isNaN(fecha.getTime())) throw new HttpError(400, 'Fecha inválida');
  const nota = typeof body?.nota === 'string' && body.nota.trim() ? body.nota.trim() : null;
  return { montoCentavos: Math.round(monto * 100), tipo: body.tipo as Tipo, fecha, nota };
}

router.post('/login', (req, res) => {
  const token = login(req.body?.password);
  if (!token) return res.status(401).json({ error: 'Contraseña incorrecta' });
  res.json({ token });
});

router.get('/sesion', (req, res) => {
  res.json({ admin: esAdmin(req) });
});

// Ruleta: el código de cada participante es la única llave (solo el admin los ve en su panel)
async function buscarAsignacion(codigo: string) {
  const asignacion = await prisma.asignacion.findUnique({
    where: { codigo },
    include: {
      da: { select: { nombre: true } },
      recibe: { select: { nombre: true, deseos: { orderBy: { orden: 'asc' }, select: { texto: true } } } },
    },
  });
  if (!asignacion) throw new HttpError(404, 'Este link no es válido o el sorteo se rehízo');
  return asignacion;
}

router.get(
  '/ruleta/:codigo',
  h(async (req, res) => {
    const a = await buscarAsignacion(req.params.codigo);
    const participantes = await prisma.asignacion.count();
    res.json({
      nombre: a.da.nombre,
      girado: a.giradoEn !== null,
      // Solo revelamos a quién le tocó después de girar
      recibe: a.giradoEn ? a.recibe.nombre : null,
      deseos: a.giradoEn ? a.recibe.deseos.map((d) => d.texto) : [],
      regalos: Math.min(12, Math.max(6, participantes - 1)),
    });
  }),
);

router.post(
  '/ruleta/:codigo/girar',
  h(async (req, res) => {
    const a = await buscarAsignacion(req.params.codigo);
    if (!a.giradoEn) await prisma.asignacion.update({ where: { id: a.id }, data: { giradoEn: new Date() } });
    res.json({ recibe: a.recibe.nombre, deseos: a.recibe.deseos.map((d) => d.texto) });
  }),
);

// Lectura pública; cualquier cambio requiere sesión de admin
router.use((req, res, next) => (req.method === 'GET' ? next() : soloAdmin(req, res, next)));

// Panel del sorteo para el admin: quién ya giró, pero nunca a quién le tocó
router.get(
  '/sorteo',
  soloAdmin,
  h(async (_req, res) => {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true,
        familia: true,
        regala: { select: { codigo: true, giradoEn: true, creadoEn: true } },
        recibe: { select: { id: true } },
        _count: { select: { deseos: true } },
      },
    });
    const hecho = usuarios.some((u) => u.regala);
    // ¿Alguna pareja actual quedó sin familia o dentro de la misma? (por ejemplo, si se
    // sorteó antes de capturar familias o se editaron después). Solo decimos si pasa, no quiénes.
    const parejas = await prisma.asignacion.findMany({
      select: { da: { select: { familia: true } }, recibe: { select: { familia: true } } },
    });
    const familiasEnConflicto = parejas.some(({ da, recibe }) => {
      const a = claveFamilia(da.familia);
      return !a || a === claveFamilia(recibe.familia);
    });
    res.json({
      hecho,
      // Si alguien se agregó o se borró después del sorteo, el círculo quedó roto
      completo: hecho && usuarios.every((u) => u.regala && u.recibe),
      familiasEnConflicto,
      fecha: usuarios.find((u) => u.regala)?.regala?.creadoEn ?? null,
      participantes: usuarios.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        familia: u.familia,
        codigo: u.regala?.codigo ?? null,
        giradoEn: u.regala?.giradoEn ?? null,
        deseos: u._count.deseos,
      })),
      minimoDeseos: MIN_DESEOS,
    });
  }),
);

router.post(
  '/sorteo',
  h(async (_req, res) => {
    const usuarios = await prisma.usuario.findMany({ select: { id: true, nombre: true, familia: true } });
    let circulo;
    try {
      circulo = sortear(usuarios);
    } catch (err) {
      if (err instanceof SorteoError) throw new HttpError(400, err.message);
      throw err;
    }
    await prisma.$transaction([
      prisma.asignacion.deleteMany(),
      prisma.asignacion.createMany({
        data: circulo.map((p, i) => ({
          daId: p.id,
          recibeId: circulo[(i + 1) % circulo.length].id,
          codigo: generarCodigo(),
        })),
      }),
    ]);
    res.status(201).json({ ok: true });
  }),
);

// Permite volver a girar (misma asignación). Pide la contraseña otra vez para que no baste
// con encontrar la sesión abierta.
router.post(
  '/sorteo/reiniciar-giro',
  h(async (req, res) => {
    if (!passwordCorrecta(req.body?.password)) throw new HttpError(403, 'Contraseña incorrecta');
    const todos = req.body?.usuarioId === 'todos';
    const { count } = await prisma.asignacion.updateMany({
      where: todos ? { giradoEn: { not: null } } : { daId: parseId(String(req.body?.usuarioId)), giradoEn: { not: null } },
      data: { giradoEn: null },
    });
    res.json({ reiniciados: count });
  }),
);

router.delete(
  '/sorteo',
  h(async (_req, res) => {
    await prisma.asignacion.deleteMany();
    res.status(204).end();
  }),
);

router.get('/config', (_req, res) => {
  res.json({ metas: METAS, fechaLimite: FECHA_LIMITE });
});

router.get(
  '/usuarios',
  h(async (_req, res) => {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { nombre: 'asc' },
      include: { aportaciones: { select: { tipo: true, montoCentavos: true, fecha: true } } },
    });
    res.json(
      usuarios.map(({ aportaciones, ...u }) => ({
        ...u,
        totales: totales(aportaciones),
        ultimaAportacion: aportaciones.reduce<Date | null>(
          (max, a) => (!max || a.fecha > max ? a.fecha : max),
          null,
        ),
      })),
    );
  }),
);

router.post(
  '/usuarios',
  h(async (req, res) => {
    const usuario = await prisma.usuario.create({ data: parseUsuario(req.body) });
    res.status(201).json(usuario);
  }),
);

router.get(
  '/usuarios/:id',
  h(async (req, res) => {
    const usuario = await prisma.usuario.findUnique({
      where: { id: parseId(req.params.id) },
      include: {
        aportaciones: { orderBy: { fecha: 'desc' } },
        deseos: { orderBy: { orden: 'asc' }, select: { texto: true } },
      },
    });
    if (!usuario) throw new HttpError(404, 'Usuario no encontrado');
    res.json({ ...usuario, deseos: usuario.deseos.map((d) => d.texto), totales: totales(usuario.aportaciones) });
  }),
);

// Resultado del sorteo de un participante; solo para el admin porque el detalle es público
router.get(
  '/usuarios/:id/intercambio',
  soloAdmin,
  h(async (req, res) => {
    const asignacion = await prisma.asignacion.findUnique({
      where: { daId: parseId(req.params.id) },
      select: { giradoEn: true, recibe: { select: { id: true, nombre: true } } },
    });
    res.json(asignacion ?? null);
  }),
);

// Reemplaza la lista completa de deseos
router.put(
  '/usuarios/:id/deseos',
  h(async (req, res) => {
    const usuarioId = parseId(req.params.id);
    const deseos = parseDeseos(req.body);
    await prisma.$transaction([
      prisma.deseo.deleteMany({ where: { usuarioId } }),
      prisma.deseo.createMany({ data: deseos.map((texto, orden) => ({ usuarioId, texto, orden })) }),
    ]);
    res.json({ deseos });
  }),
);

router.put(
  '/usuarios/:id',
  h(async (req, res) => {
    const usuario = await prisma.usuario.update({
      where: { id: parseId(req.params.id) },
      data: parseUsuario(req.body),
    });
    res.json(usuario);
  }),
);

router.delete(
  '/usuarios/:id',
  h(async (req, res) => {
    await prisma.usuario.delete({ where: { id: parseId(req.params.id) } });
    res.status(204).end();
  }),
);

router.post(
  '/usuarios/:id/aportaciones',
  h(async (req, res) => {
    const aportacion = await prisma.aportacion.create({
      data: { usuarioId: parseId(req.params.id), ...parseAportacion(req.body) },
    });
    res.status(201).json(aportacion);
  }),
);

router.put(
  '/aportaciones/:id',
  h(async (req, res) => {
    const aportacion = await prisma.aportacion.update({
      where: { id: parseId(req.params.id) },
      data: parseAportacion(req.body),
    });
    res.json(aportacion);
  }),
);

router.delete(
  '/aportaciones/:id',
  h(async (req, res) => {
    await prisma.aportacion.delete({ where: { id: parseId(req.params.id) } });
    res.status(204).end();
  }),
);

router.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  // P2025: registro no encontrado, P2003: llave foránea inválida
  if (err?.code === 'P2025' || err?.code === 'P2003') return res.status(404).json({ error: 'No encontrado' });
  console.error(err);
  res.status(500).json({ error: 'Error interno' });
});
