# navidad-2027

Registro de ahorro navideño. Cada participante tiene dos metas:

- **Intercambio:** $600
- **Ahorro propio:** $1,200

Se registra cada aportación con su fecha, monto y tipo, y la app muestra el progreso de cada quien y cuánto le sugiere aportar por semana para llegar a la fecha límite.

## Stack

- `client/`: React + Vite + TypeScript + Tailwind
- `server/`: Express + Prisma + SQLite (la base queda en `server/prisma/navidad.db`)

## Instalación

```bash
npm install
cp server/.env.example server/.env
npm run db:migrate
```

Luego edita `server/.env` y define `ADMIN_PASSWORD` y `SESSION_SECRET` (cualquier cadena aleatoria larga).

## Permisos

- **Cualquiera** puede ver la lista, el progreso y el historial de aportaciones.
- **Solo el admin** (con "Entrar como admin" en la esquina superior) puede agregar participantes y registrar, editar o borrar aportaciones. La sesión dura 30 días.

## Uso

**Desarrollo** (recarga automática): front en http://localhost:5173, API en :3001

```bash
npm run dev
```

**Uso diario** (todo en un solo puerto): http://localhost:3001

```bash
npm run build
npm start
```

Para entrar desde otro dispositivo de la misma red, usa la IP de esta máquina: `http://<ip>:3001`.

## Sorteo de intercambio

1. Captura la **Familia** (apellido) de cada participante. Es obligatoria: personas de la misma familia no pueden tocarse entre sí, y no se puede sortear mientras le falte a alguien.
2. En la página de cada participante captura sus **gustos y deseos** (mínimo 3).
3. Como admin, entra a **🎁 Sorteo** y presiona "Hacer sorteo". Se arma un solo círculo (A → B → C → … → A) en el que nadie se toca a sí mismo ni a su familia.
4. Pasa a cada persona a la computadora y presiona **🎡 Girar** junto a su nombre. Gira una ruleta de regalos y descubre a quién le toca, junto con sus gustos. Al presionar "Listo, ocultar" se regresa al panel.
5. El panel muestra quién ya giró y a quién le faltan deseos, pero no las parejas. "Volver a ver" pide confirmar antes de mostrar un resultado.
6. Como admin, en el detalle de cada participante (tarjeta de Intercambio) queda el registro de a quién le regala, oculto hasta presionar "Mostrar". Nadie más puede verlo.

Para que alguien pueda volver a girar (por ejemplo, después de una prueba), abre **⚙ Opciones avanzadas** al final del panel del sorteo, elige a la persona (o a todas) y confirma con tu contraseña de admin. Le sigue tocando la misma persona.

Si agregas o borras participantes después del sorteo, el panel avisa para rehacerlo. Los deseos se pueden completar después del sorteo: quien vuelva a ver su resultado verá la lista actualizada.

## Configuración

- Metas: `server/src/config.ts`
- Fecha límite (20 de diciembre de 2026), puerto y contraseña de admin: `server/.env`
- Ver o editar la base directamente: `npm run db:studio`

## Respaldo

Toda la información está en `server/prisma/navidad.db`. Copia ese archivo para respaldarla.
