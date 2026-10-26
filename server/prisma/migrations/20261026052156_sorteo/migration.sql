-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "familia" TEXT;

-- CreateTable
CREATE TABLE "Asignacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "daId" INTEGER NOT NULL,
    "recibeId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "giradoEn" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Asignacion_daId_fkey" FOREIGN KEY ("daId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Asignacion_recibeId_fkey" FOREIGN KEY ("recibeId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Asignacion_daId_key" ON "Asignacion"("daId");

-- CreateIndex
CREATE UNIQUE INDEX "Asignacion_recibeId_key" ON "Asignacion"("recibeId");

-- CreateIndex
CREATE UNIQUE INDEX "Asignacion_codigo_key" ON "Asignacion"("codigo");
