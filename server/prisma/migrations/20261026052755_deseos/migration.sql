-- CreateTable
CREATE TABLE "Deseo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    CONSTRAINT "Deseo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Deseo_usuarioId_idx" ON "Deseo"("usuarioId");
