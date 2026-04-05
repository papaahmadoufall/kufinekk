-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MANAGER', 'POINTEUR');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('ESSENTIEL', 'PRO', 'ENTREPRISE');

-- CreateEnum
CREATE TYPE "TypeContrat" AS ENUM ('CONTRACTUEL', 'NON_CONTRACTUEL');

-- CreateEnum
CREATE TYPE "StatutContrat" AS ENUM ('PROVISOIRE', 'ACTIF', 'TERMINE');

-- CreateEnum
CREATE TYPE "StatutPointage" AS ENUM ('EN_COURS', 'VALIDE', 'CORRIGE', 'ABSENT');

-- CreateEnum
CREATE TYPE "StatutCycle" AS ENUM ('EN_COURS', 'VALIDE', 'PAYE', 'ECHOUE');

-- CreateTable
CREATE TABLE "Entreprise" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "adresse" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'ESSENTIEL',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entreprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" TEXT NOT NULL,
    "entrepriseId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "pinHash" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "telephoneVerifie" BOOLEAN NOT NULL DEFAULT false,
    "qrCodeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chantier" (
    "id" TEXT NOT NULL,
    "entrepriseId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFinPrevue" TIMESTAMP(3),
    "statut" TEXT NOT NULL DEFAULT 'ACTIF',
    "heureDebutStd" TEXT NOT NULL,
    "seuilHeuresNormales" DOUBLE PRECISION NOT NULL DEFAULT 8.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chantier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrat" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "chantierId" TEXT NOT NULL,
    "entrepriseId" TEXT NOT NULL,
    "poste" TEXT NOT NULL,
    "typeContrat" "TypeContrat" NOT NULL,
    "tauxJournalierXof" INTEGER NOT NULL,
    "tauxHeureSuppXof" INTEGER,
    "seuilHeuresNormales" DOUBLE PRECISION,
    "heureDebutStd" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "statut" "StatutContrat" NOT NULL DEFAULT 'PROVISOIRE',
    "valideParId" TEXT,
    "noteCloture" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contrat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pointage" (
    "id" TEXT NOT NULL,
    "contratId" TEXT NOT NULL,
    "pointeParId" TEXT NOT NULL,
    "dateJournee" TIMESTAMP(3) NOT NULL,
    "heureEntree" TIMESTAMP(3) NOT NULL,
    "heureSortie" TIMESTAMP(3),
    "totalJournalierXof" INTEGER,
    "statut" "StatutPointage" NOT NULL DEFAULT 'EN_COURS',
    "corrigeParId" TEXT,
    "corrigeLe" TIMESTAMP(3),
    "noteCorrection" TEXT,

    CONSTRAINT "Pointage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CyclePaie" (
    "id" TEXT NOT NULL,
    "contratId" TEXT NOT NULL,
    "semaineDebut" TIMESTAMP(3) NOT NULL,
    "semaineFin" TIMESTAMP(3) NOT NULL,
    "totalHebdoXof" INTEGER NOT NULL,
    "statut" "StatutCycle" NOT NULL DEFAULT 'EN_COURS',
    "valideParId" TEXT,
    "valideLe" TIMESTAMP(3),
    "waveBatchId" TEXT,
    "wavePayoutId" TEXT,
    "waveStatut" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CyclePaie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpSession" (
    "id" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "utilise" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Entreprise_telephone_key" ON "Entreprise"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_telephone_key" ON "Utilisateur"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_matricule_key" ON "Agent"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_telephone_key" ON "Agent"("telephone");

-- CreateIndex
CREATE INDEX "Pointage_contratId_dateJournee_idx" ON "Pointage"("contratId", "dateJournee");

-- CreateIndex
CREATE INDEX "OtpSession_telephone_expireLe_idx" ON "OtpSession"("telephone", "expireLe");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- AddForeignKey
ALTER TABLE "Utilisateur" ADD CONSTRAINT "Utilisateur_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chantier" ADD CONSTRAINT "Chantier_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrat" ADD CONSTRAINT "Contrat_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrat" ADD CONSTRAINT "Contrat_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrat" ADD CONSTRAINT "Contrat_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrat" ADD CONSTRAINT "Contrat_valideParId_fkey" FOREIGN KEY ("valideParId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pointage" ADD CONSTRAINT "Pointage_contratId_fkey" FOREIGN KEY ("contratId") REFERENCES "Contrat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pointage" ADD CONSTRAINT "Pointage_pointeParId_fkey" FOREIGN KEY ("pointeParId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pointage" ADD CONSTRAINT "Pointage_corrigeParId_fkey" FOREIGN KEY ("corrigeParId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyclePaie" ADD CONSTRAINT "CyclePaie_contratId_fkey" FOREIGN KEY ("contratId") REFERENCES "Contrat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyclePaie" ADD CONSTRAINT "CyclePaie_valideParId_fkey" FOREIGN KEY ("valideParId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_utilisateurId_fkey" FOREIGN KEY ("userId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

