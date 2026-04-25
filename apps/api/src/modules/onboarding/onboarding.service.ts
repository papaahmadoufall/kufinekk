import bcrypt from 'bcrypt'
import { prisma } from '../../shared/db'
import { sendSms } from '../../shared/services/axiomtext'
import { genererMatricule } from '../../shared/services/matricule'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/codes'
import type { RegisterInput, SendOtpPublicInput, VerifyOtpPublicInput } from './onboarding.schema'

const OTP_EXPIRY_MINUTES = 10
const BCRYPT_ROUNDS = 10

function genererCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/** OTP public : fonctionne pour tout numéro (pas seulement agents). */
export async function sendOtpPublic(input: SendOtpPublicInput): Promise<void> {
  const { telephone } = input

  // Invalider les OTP précédents
  await prisma.otpSession.updateMany({
    where: { telephone, utilise: false },
    data: { utilise: true },
  })

  const code = genererCode()
  const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS)
  const expireLe = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  await prisma.otpSession.create({
    data: { telephone, codeHash, expireLe },
  })

  // Si AxiomText absent (dev), log le code pour debug
  if (!process.env.AXIOMTEXT_TOKEN) {
    // eslint-disable-next-line no-console
    console.warn(`[onboarding] OTP pour ${telephone} : ${code} (AxiomText non configuré)`)
    return
  }

  await sendSms(
    telephone,
    `[Kufinekk] Votre code de vérification : ${code}. Valable ${OTP_EXPIRY_MINUTES} min.`,
  )
}

/**
 * Vérification non-destructive : valide l'OTP sans le marquer comme utilisé.
 * Utilisée à l'étape OTP du wizard pour feedback immédiat.
 * Le register final consommera le même OTP.
 */
export async function verifyOtpPublic(input: VerifyOtpPublicInput): Promise<void> {
  const { telephone, code } = input
  const otpSession = await prisma.otpSession.findFirst({
    where: { telephone, utilise: false, expireLe: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
  if (!otpSession) {
    throw new AppError(ERROR_CODES.OTP_EXPIRED, 'Code OTP expiré', 401)
  }
  const ok = await bcrypt.compare(code, otpSession.codeHash)
  if (!ok) {
    throw new AppError(ERROR_CODES.OTP_INVALID, 'Code OTP incorrect', 401)
  }
  // Pas d'update : on laisse l'OTP utilisable pour le register final
}

async function verifyOtpOrThrow(telephone: string, code: string): Promise<void> {
  const otpSession = await prisma.otpSession.findFirst({
    where: { telephone, utilise: false, expireLe: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
  if (!otpSession) {
    throw new AppError(ERROR_CODES.OTP_EXPIRED, 'Code OTP expiré', 401)
  }
  const ok = await bcrypt.compare(code, otpSession.codeHash)
  if (!ok) {
    throw new AppError(ERROR_CODES.OTP_INVALID, 'Code OTP incorrect', 401)
  }
  await prisma.otpSession.update({
    where: { id: otpSession.id },
    data: { utilise: true },
  })
}

/**
 * Inscription complète : entreprise + manager + chantier + pointeur + agents.
 * Une seule transaction Prisma.
 */
export async function register(
  input: RegisterInput,
  signJwt: (payload: object) => string,
): Promise<{
  token: string
  utilisateur: { id: string; nom: string; role: string; entrepriseId: string }
  entrepriseId: string
  chantierId: string
}> {
  const {
    prenom,
    nom,
    telephone,
    motDePasse,
    otpCode,
    raisonSociale,
    ninea,
    ville,
    taille,
    chantierNom,
    chantierAdresse,
    chantierDebut,
    chantierTauxJournalier,
    pointeur,
    agents,
  } = input

  // 1. Vérifier OTP du manager
  await verifyOtpOrThrow(telephone, otpCode)

  // 2. Garde-fous unicité téléphone (avant la transaction pour erreur claire)
  const tel = telephone.replace(/\s/g, '')
  const existing = await prisma.utilisateur.findUnique({ where: { telephone: tel } })
  if (existing) {
    throw new AppError(ERROR_CODES.CONFLICT, 'Ce numéro est déjà associé à un compte', 409)
  }
  if (pointeur) {
    const ptel = pointeur.telephone.replace(/\s/g, '')
    const existingP = await prisma.utilisateur.findUnique({ where: { telephone: ptel } })
    if (existingP) {
      throw new AppError(ERROR_CODES.CONFLICT, 'Le numéro du pointeur est déjà pris', 409)
    }
  }

  const motDePasseHash = await bcrypt.hash(motDePasse, BCRYPT_ROUNDS)
  const pointeurPinHash = pointeur ? await bcrypt.hash(pointeur.pin, BCRYPT_ROUNDS) : null

  // 3. Préparer matricules agents (hors transaction — findFirst)
  const agentData: Array<{
    prenom: string
    nom: string
    telephone: string
    poste: string
    tauxJournalierXof: number
    matricule: string
    pinPlain: string
    pinHash: string
  }> = []
  for (const a of agents ?? []) {
    const matricule = await genererMatricule('')
    const pinPlain = String(Math.floor(1000 + Math.random() * 9000))
    const pinHash = await bcrypt.hash(pinPlain, BCRYPT_ROUNDS)
    agentData.push({
      prenom: a.prenom,
      nom: a.nom,
      telephone: a.telephone?.replace(/\s/g, '') ?? `pending-${matricule}`,
      poste: a.poste,
      tauxJournalierXof: a.tauxJournalierXof,
      matricule,
      pinPlain,
      pinHash,
    })
  }

  // 4. Transaction atomique
  const result = await prisma.$transaction(async (tx) => {
    const entreprise = await tx.entreprise.create({
      data: {
        nom: raisonSociale,
        raisonSociale,
        telephone: tel,
        adresse: chantierAdresse,
        ville,
        ninea,
        taille,
      },
    })

    const manager = await tx.utilisateur.create({
      data: {
        entrepriseId: entreprise.id,
        nom: `${prenom} ${nom}`.trim(),
        telephone: tel,
        role: 'MANAGER',
        pinHash: motDePasseHash,
      },
    })

    const chantier = await tx.chantier.create({
      data: {
        entrepriseId: entreprise.id,
        nom: chantierNom,
        adresse: chantierAdresse,
        dateDebut: new Date(chantierDebut),
        heureDebutStd: '08:00',
        seuilHeuresNormales: 8,
      },
    })

    if (pointeur && pointeurPinHash) {
      await tx.utilisateur.create({
        data: {
          entrepriseId: entreprise.id,
          nom: `${pointeur.prenom} ${pointeur.nom}`.trim(),
          telephone: pointeur.telephone.replace(/\s/g, ''),
          role: 'POINTEUR',
          pinHash: pointeurPinHash,
        },
      })
    }

    for (const a of agentData) {
      const agent = await tx.agent.create({
        data: {
          matricule: a.matricule,
          telephone: a.telephone,
          nom: a.nom,
          prenom: a.prenom,
          pinHash: a.pinHash,
        },
      })
      await tx.contrat.create({
        data: {
          agentId: agent.id,
          chantierId: chantier.id,
          entrepriseId: entreprise.id,
          poste: a.poste,
          typeContrat: 'NON_CONTRACTUEL',
          tauxJournalierXof: a.tauxJournalierXof,
          dateDebut: new Date(chantierDebut),
          statut: 'PROVISOIRE',
        },
      })
    }

    return { entreprise, manager, chantier }
  })

  // 5. Signer un JWT Manager
  const jwtPayload = {
    sub: result.manager.id,
    entrepriseId: result.entreprise.id,
    role: 'MANAGER',
    type: 'UTILISATEUR',
  }
  const token = signJwt(jwtPayload)
  const tokenHash = await bcrypt.hash(token, BCRYPT_ROUNDS)
  await prisma.session.create({
    data: {
      userId: result.manager.id,
      userType: 'UTILISATEUR',
      tokenHash,
      expireLe: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  // 6. SMS best-effort (ne bloque pas si échoue)
  if (process.env.AXIOMTEXT_TOKEN) {
    if (pointeur) {
      sendSms(
        pointeur.telephone.replace(/\s/g, ''),
        `Bonjour ${pointeur.prenom}, vous êtes pointeur sur "${chantierNom}". PIN : ${pointeur.pin}`,
      ).catch(() => {})
    }
    for (const a of agentData) {
      if (!a.telephone.startsWith('pending-')) {
        sendSms(
          a.telephone,
          `Bonjour ${a.prenom}, vous êtes enregistré sur Kufinekk (${a.matricule}). PIN : ${a.pinPlain}`,
        ).catch(() => {})
      }
    }
  }

  return {
    token,
    utilisateur: {
      id: result.manager.id,
      nom: result.manager.nom,
      role: result.manager.role,
      entrepriseId: result.entreprise.id,
    },
    entrepriseId: result.entreprise.id,
    chantierId: result.chantier.id,
  }
}
