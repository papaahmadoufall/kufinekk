import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const BCRYPT_ROUNDS = 10

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Entreprise de test
  const entreprise = await prisma.entreprise.upsert({
    where: { telephone: '+221770000001' },
    update: {},
    create: {
      nom: 'BTP Sénégal Test',
      telephone: '+221770000001',
      adresse: 'Dakar, Plateau',
      plan: 'ESSENTIEL',
      actif: true,
    },
  })
  console.log(`✅ Entreprise: ${entreprise.nom} (${entreprise.id})`)

  // 2. Manager de test
  const managerHash = await bcrypt.hash('manager1', BCRYPT_ROUNDS)
  const manager = await prisma.utilisateur.upsert({
    where: { telephone: '+221770000010' },
    update: {},
    create: {
      entrepriseId: entreprise.id,
      nom: 'Amadou Diallo',
      telephone: '+221770000010',
      role: 'MANAGER',
      pinHash: managerHash,
      actif: true,
    },
  })
  console.log(`✅ Manager: ${manager.nom} — tel: +221770000010 / mdp: manager1`)

  // 3. Pointeur de test
  const pointeurHash = await bcrypt.hash('1234', BCRYPT_ROUNDS)
  const pointeur = await prisma.utilisateur.upsert({
    where: { telephone: '+221770000020' },
    update: {},
    create: {
      entrepriseId: entreprise.id,
      nom: 'Moussa Ndiaye',
      telephone: '+221770000020',
      role: 'POINTEUR',
      pinHash: pointeurHash,
      actif: true,
    },
  })
  console.log(`✅ Pointeur: ${pointeur.nom} — tel: +221770000020 / pin: 1234`)

  // 4. Chantier de test
  const chantier = await prisma.chantier.upsert({
    where: { id: manager.id }, // fallback — no unique on nom
    update: {},
    create: {
      entrepriseId: entreprise.id,
      nom: 'Immeuble Plateau',
      adresse: 'Avenue Léopold Sédar Senghor, Dakar',
      dateDebut: new Date('2026-03-01'),
      statut: 'ACTIF',
      heureDebutStd: '08:00',
      seuilHeuresNormales: 8.0,
    },
  })
  console.log(`✅ Chantier: ${chantier.nom}`)

  // 5. Agent de test
  const agentHash = await bcrypt.hash('5678', BCRYPT_ROUNDS)
  const agent = await prisma.agent.upsert({
    where: { telephone: '+221770000030' },
    update: {},
    create: {
      matricule: 'KFN-00001',
      telephone: '+221770000030',
      nom: 'Diop',
      prenom: 'Ibrahima',
      pinHash: agentHash,
      telephoneVerifie: true,
    },
  })
  console.log(`✅ Agent: ${agent.prenom} ${agent.nom} (${agent.matricule})`)

  // 6. Contrat actif pour l'agent
  const contratExistant = await prisma.contrat.findFirst({
    where: { agentId: agent.id, chantierId: chantier.id, statut: 'ACTIF' },
  })
  if (!contratExistant) {
    const contrat = await prisma.contrat.create({
      data: {
        agentId: agent.id,
        chantierId: chantier.id,
        entrepriseId: entreprise.id,
        poste: 'Maçon',
        typeContrat: 'NON_CONTRACTUEL',
        tauxJournalierXof: 5000,
        tauxHeureSuppXof: 800,
        dateDebut: new Date('2026-03-01'),
        statut: 'ACTIF',
      },
    })
    console.log(`✅ Contrat: ${contrat.poste} — ${contrat.tauxJournalierXof} XOF/jour`)
  }

  console.log('\n🎉 Seed terminé !\n')
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  COMPTES DE TEST                                ║')
  console.log('╠══════════════════════════════════════════════════╣')
  console.log('║  Manager:                                       ║')
  console.log('║    Tél: +221770000010                           ║')
  console.log('║    Mot de passe: manager1                       ║')
  console.log('║                                                  ║')
  console.log('║  Pointeur:                                      ║')
  console.log('║    Tél: +221770000020                           ║')
  console.log('║    PIN: 1234                                    ║')
  console.log('╚══════════════════════════════════════════════════╝')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
