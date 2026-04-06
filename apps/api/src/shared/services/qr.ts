/**
 * Génération et stockage de QR codes sur Cloudflare R2
 * QR code = matricule KFN-XXXXX encodé en PNG
 * Retourne l'URL publique du QR code
 */

import QRCode from 'qrcode'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// ── Client R2 (S3-compatible) ────────────────────────────

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials manquantes (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)')
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
}

// ── Génération + Upload ──────────────────────────────────

export async function genererEtStockerQrCode(matricule: string): Promise<string> {
  const bucket = process.env.R2_BUCKET_NAME ?? 'kufinekk-assets'

  // 1. Générer le QR code en PNG (Buffer)
  const qrBuffer = await QRCode.toBuffer(matricule, {
    type: 'png',
    width: 400,
    margin: 2,
    color: { dark: '#1f1c0f', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })

  // 2. Upload sur Cloudflare R2
  const key = `qr/${matricule}.png`

  const client = getR2Client()
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: qrBuffer,
      ContentType: 'image/png',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  )

  // 3. Retourner l'URL publique R2
  // Cloudflare R2 custom domain ou r2.dev subdomain
  const publicBase = process.env.R2_PUBLIC_URL ?? `https://${bucket}.r2.dev`
  return `${publicBase}/${key}`
}
