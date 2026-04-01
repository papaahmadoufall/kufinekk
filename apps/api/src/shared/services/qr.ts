/**
 * Génération et stockage de QR codes sur Cloudflare R2
 * QR code = matricule KFN-XXXXX encodé
 * Retourne l'URL publique du QR code
 */

// Note : qrcode est à installer au sprint d'implémentation
// npm install qrcode @aws-sdk/client-s3

export async function genererEtStockerQrCode(matricule: string): Promise<string> {
  // TODO Sprint 3 — implémentation complète
  // 1. Générer QR code PNG via `qrcode` lib
  // 2. Upload sur Cloudflare R2 via AWS SDK S3-compatible
  // 3. Retourner l'URL publique
  const baseUrl = process.env.API_BASE_URL ?? 'https://api.kufinekk.com'
  return `${baseUrl}/assets/qr/${matricule}.png`
}
