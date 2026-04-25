/**
 * Service SMS via AxiomText (Dakar)
 * Docs : https://api.axiomtext.com
 */

const AXIOMTEXT_URL = 'https://api.axiomtext.com/api/sms/message'

export async function sendSms(to: string, message: string): Promise<void> {
  const token = process.env.AXIOMTEXT_TOKEN
  if (!token) throw new Error('AXIOMTEXT_TOKEN manquant')

  const signature = process.env.AXIOMTEXT_SIGNATURE
  const body: Record<string, string> = { to, message }
  // Ne pas envoyer de signature personnalisée si non configurée
  // (AxiomText utilisera la signature par défaut du compte)
  if (signature && signature.length > 0) {
    body.signature = signature
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
