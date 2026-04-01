/**
 * Service SMS via AxiomText (Dakar)
 * Docs : https://api.axiomtext.com
 */

const AXIOMTEXT_URL = 'https://api.axiomtext.com/api/sms/message'

export async function sendSms(to: string, message: string): Promise<void> {
  const token = process.env.AXIOMTEXT_TOKEN
  if (!token) throw new Error('AXIOMTEXT_TOKEN manquant')

  const res = await fetch(AXIOMTEXT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to,
      message,
      signature: process.env.AXIOMTEXT_SIGNATURE ?? 'Kufinekk',
    }),
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
