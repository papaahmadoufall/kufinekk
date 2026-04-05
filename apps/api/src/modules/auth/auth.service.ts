import bcrypt from 'bcrypt'
import { prisma } from '../../shared/db'
import { sendSms } from '../../shared/services/axiomtext'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/codes'
import type { SendOtpInput, VerifyOtpInput, LoginInput } from './auth.schema'

const OTP_EXPIRY_MINUTES = 5
const BCRYPT_ROUNDS = 10

// ── OTP ────────────────────────────────────────────────────────────────────

function genererCodeOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function sendOtp(input: SendOtpInput): Promise<void> {
  const { telephone } = input

  // Vérifier que le numéro appartient à un agent connu
  const agent = await prisma.agent.findUnique({ where: { telephone } })
  if (!agent) {
    // Réponse neutre — ne pas révéler si le numéro existe ou non
    return
  }

  // Invalider les OTP précédents non utilisés
  await prisma.otpSession.updateMany({
    where: { telephone, utilise: false },
    data: { utilise: true },
  })

  const code = genererCodeOtp()
  const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS)
  const expireLe = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  await prisma.otpSession.create({
    data: { telephone, codeHash, expireLe },
  })

  await sendSms(telephone, `[Kufinekk] Votre code de connexion : ${code}. Valable ${OTP_EXPIRY_MINUTES} min.`)
}

// ── Verify OTP → JWT ───────────────────────────────────────────────────────

export async function verifyOtp(
  input: VerifyOtpInput,
  signJwt: (payload: object) => string,
): Promise<{ token: string; agent: { id: string; nom: string; prenom: string; matricule: string } }> {
  const { telephone, code } = input

  const otpSession = await prisma.otpSession.findFirst({
    where: {
      telephone,
      utilise: false,
      expireLe: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!otpSession) {
    throw new AppError(ERROR_CODES.OTP_EXPIRED, 'Code OTP invalide ou expiré', 401)
  }

  const valide = await bcrypt.compare(code, otpSession.codeHash)
  if (!valide) {
    throw new AppError(ERROR_CODES.OTP_INVALID, 'Code OTP incorrect', 401)
  }

  // Marquer l'OTP comme utilisé
  await prisma.otpSession.update({
    where: { id: otpSession.id },
    data: { utilise: true },
  })

  const agent = await prisma.agent.findUnique({ where: { telephone } })
  if (!agent) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Agent introuvable', 404)
  }

  // Récupérer le contrat actif pour l'entrepriseId
  const contratActif = await prisma.contrat.findFirst({
    where: {
      agentId: agent.id,
      statut: { in: ['ACTIF', 'PROVISOIRE'] },
    },
    orderBy: { createdAt: 'desc' },
  })

  const jwtPayload = {
    sub: agent.id,
    entrepriseId: contratActif?.entrepriseId ?? null,
    type: 'AGENT',
  }

  const token = signJwt(jwtPayload)
  const tokenHash = await bcrypt.hash(token, BCRYPT_ROUNDS)
  const expireLe = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7j

  await prisma.session.create({
    data: {
      userId: agent.id,
      userType: 'AGENT',
      tokenHash,
      expireLe,
    },
  })

  return {
    token,
    agent: {
      id: agent.id,
      nom: agent.nom,
      prenom: agent.prenom,
      matricule: agent.matricule,
    },
  }
}

// ── Login PIN (Utilisateurs) ────────────────────────────────────────────────

export async function login(
  input: LoginInput,
  signJwt: (payload: object) => string,
): Promise<{
  token: string
  utilisateur: { id: string; nom: string; role: string; entrepriseId: string }
}> {
  const { telephone, pin, motDePasse } = input

  const utilisateur = await prisma.utilisateur.findUnique({
    where: { telephone },
    include: { entreprise: { select: { actif: true } } },
  })

  if (!utilisateur || !utilisateur.actif) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Identifiants invalides', 401)
  }

  if (!utilisateur.entreprise.actif) {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'Compte entreprise désactivé', 403)
  }

  // Manager → motDePasse obligatoire / Pointeur → PIN obligatoire
  if (utilisateur.role === 'MANAGER' && !motDePasse) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Identifiants invalides', 401)
  }
  if (utilisateur.role === 'POINTEUR' && !pin) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Identifiants invalides', 401)
  }

  const credential = utilisateur.role === 'MANAGER' ? motDePasse! : pin!
  const pinValide = await bcrypt.compare(credential, utilisateur.pinHash)
  if (!pinValide) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Identifiants invalides', 401)
  }

  const jwtPayload = {
    sub: utilisateur.id,
    entrepriseId: utilisateur.entrepriseId,
    role: utilisateur.role,
    type: 'UTILISATEUR',
  }

  const token = signJwt(jwtPayload)
  const tokenHash = await bcrypt.hash(token, BCRYPT_ROUNDS)
  const expireLe = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7j

  await prisma.session.create({
    data: {
      userId: utilisateur.id,
      userType: 'UTILISATEUR',
      tokenHash,
      expireLe,
    },
  })

  return {
    token,
    utilisateur: {
      id: utilisateur.id,
      nom: utilisateur.nom,
      role: utilisateur.role,
      entrepriseId: utilisateur.entrepriseId,
    },
  }
}

// ── Logout ─────────────────────────────────────────────────────────────────

export async function logout(token: string): Promise<void> {
  // On cherche la session par tokenHash — bcrypt.compare sur toutes les sessions
  // serait trop lent. On stocke donc le token brut hashé à la création,
  // et on retire la session via le userId extrait du JWT (déjà vérifié par middleware).
  // On invalide toutes les sessions expirées en même temps.
  await prisma.session.deleteMany({
    where: { expireLe: { lt: new Date() } },
  })

  // Pour invalider la session précise, on la recherche par tokenHash
  const sessions = await prisma.session.findMany({
    where: { expireLe: { gt: new Date() } },
    select: { id: true, tokenHash: true },
  })

  for (const session of sessions) {
    const match = await bcrypt.compare(token, session.tokenHash)
    if (match) {
      await prisma.session.delete({ where: { id: session.id } })
      break
    }
  }
}
