/**
 * Service SMS via AxiomText (Dakar)
 * Docs : https://api.axiomtext.com
 */

const AXIOMTEXT_URL = 'https://api.axiomtext.com/api/sms/message'

/** Normalise un numéro sénégalais vers le format E.164 attendu par AxiomText : +221xxxxxxxxx */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/[\s\-().]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('00')) return '+' + digits.slice(2)
  if (digits.startsWith('221')) return '+' + digits
  // numéro local sénégalais (9 chiffres, commence par 7 ou 3)
  return '+221' + digits
}

export async function sendSms(to: string, message: string): Promise<void> {
  const token = process.env.AXIOMTEXT_TOKEN
  if (!token) throw new Error('AXIOMTEXT_TOKEN manquant')

  const signature = process.env.AXIOMTEXT_SIGNATURE
  if (!signature) {
    throw new Error(
      'AXIOMTEXT_SIGNATURE manquant — doit correspondre au nom de la compagnie utilisé lors de l\'inscription sur axiomtext.com',
    )
  }

  const body = {
    to: normalizePhone(to),
    message,
    signature,
  }

  const res = await fetch(AXIOMTEXT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`AxiomText erreur ${res.status}: ${body}`)
  }
}

// ── Messages prédéfinis ────────────────────────────────────────────────────

export function smsEnregistrementAgent(prenom: string, qrUrl: string, pin: string) {
  return `Bonjour ${prenom}, votre compte Kufinekk est actif.\nQR code : ${qrUrl}\nPIN : ${pin}\nGardez ce PIN confidentiel.`
}

export function smsPaiementWave(prenom: string, montantXof: number) {
  return `Bonjour ${prenom}, votre paiement de ${montantXof.toLocaleString('fr-SN')} XOF a été envoyé via Wave.`
}

export function smsTransfertChantier(prenom: string, nomChantier: string) {
  return `Bonjour ${prenom}, vous avez été transféré sur le chantier "${nomChantier}".`
}

export function smsWaveBatchEchoue(nomEntreprise: string, cycleId: string) {
  return `[Kufinekk] ERREUR PAIEMENT — Le batch Wave du cycle ${cycleId} a échoué pour ${nomEntreprise}. Vérifiez le dashboard immédiatement.`
}
