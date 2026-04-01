/**
 * Service Wave Payout API
 * Docs : https://docs.wave.com/payout
 */

const WAVE_API_URL = process.env.WAVE_API_URL ?? 'https://api.wave.com'

interface PayoutRecipient {
  telephone: string
  montantXof: number
  nom: string
  reference: string // cycleId ou contratId
}

interface PayoutBatchResult {
  batchId: string
  statut: string
}

export async function creerPayoutBatch(recipients: PayoutRecipient[]): Promise<PayoutBatchResult> {
  const token = process.env.WAVE_API_TOKEN
  if (!token) throw new Error('WAVE_API_TOKEN manquant')

  const res = await fetch(`${WAVE_API_URL}/v1/payout-batch`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payouts: recipients.map((r) => ({
        mobile: r.telephone,
        amount: r.montantXof,
        name: r.nom,
        client_reference: r.reference,
        currency: 'XOF',
      })),
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Wave Payout erreur ${res.status}: ${body}`)
  }

  const data = (await res.json()) as { id: string; status: string }
  return { batchId: data.id, statut: data.status }
}

export async function getStatutPayoutBatch(batchId: string) {
  const token = process.env.WAVE_API_TOKEN
  if (!token) throw new Error('WAVE_API_TOKEN manquant')

  const res = await fetch(`${WAVE_API_URL}/v1/payouts-batch/${batchId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Wave statut erreur ${res.status}: ${body}`)
  }

  return res.json()
}

export async function reverserPayout(payoutId: string) {
  const token = process.env.WAVE_API_TOKEN
  if (!token) throw new Error('WAVE_API_TOKEN manquant')

  const res = await fetch(`${WAVE_API_URL}/v1/payout/${payoutId}/reverse`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Wave reversal erreur ${res.status}: ${body}`)
  }

  return res.json()
}
