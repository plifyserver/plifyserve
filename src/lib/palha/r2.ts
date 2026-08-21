import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { collectPalhaMediaUrls, type PalhaSiteSettings } from '@/lib/palha/site-settings-shared'

const DEFAULT_BUCKET = 'palha-media'

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(
      `R2 não configurado: falta ${name}. Crie o bucket no Cloudflare, gere o token da API e cole as chaves no .env.`,
    )
  }
  return value
}

export function getPalhaR2Config() {
  const accountId = requiredEnv('R2_ACCOUNT_ID')
  const accessKeyId = requiredEnv('R2_ACCESS_KEY_ID')
  const secretAccessKey = requiredEnv('R2_SECRET_ACCESS_KEY')
  const bucket = process.env.R2_BUCKET_NAME?.trim() || DEFAULT_BUCKET
  const publicBaseUrl = requiredEnv('R2_PUBLIC_BASE_URL').replace(/\/+$/, '')
  return { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl }
}

let client: S3Client | null = null
let ready: Promise<void> | null = null

function palhaR2Client() {
  if (client) return client
  const { accountId, accessKeyId, secretAccessKey } = getPalhaR2Config()
  client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })
  client.middlewareStack.add(
    (next) => async (args) => {
      const request = args.request as { headers?: Record<string, string> }
      if (request.headers) {
        for (const header of Object.keys(request.headers)) {
          const name = header.toLowerCase()
          if (name.startsWith('x-amz-checksum') || name === 'x-amz-sdk-checksum-algorithm') {
            delete request.headers[header]
          }
        }
      }
      return next(args)
    },
    { step: 'build', name: 'stripR2ChecksumHeaders' },
  )
  return client
}

function palhaR2PublicUrl(key: string) {
  const { publicBaseUrl } = getPalhaR2Config()
  return `${publicBaseUrl}/${key.split('/').map(encodeURIComponent).join('/')}`
}

function palhaR2ObjectKey(folder: string, filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+|\/+$/g, '')
  return `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
}

async function ensurePalhaR2Bucket() {
  if (ready) return ready
  ready = (async () => {
    const s3 = palhaR2Client()
    const { bucket } = getPalhaR2Config()
    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucket }))
    } catch {
      try {
        await s3.send(new CreateBucketCommand({ Bucket: bucket }))
      } catch {
        throw new Error(
          `Bucket R2 "${bucket}" não encontrado. Crie esse bucket no Cloudflare e confira R2_BUCKET_NAME no .env.`,
        )
      }
    }
    try {
      await s3.send(
        new PutBucketCorsCommand({
          Bucket: bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedOrigins: ['*'],
                AllowedMethods: ['GET', 'PUT', 'HEAD'],
                AllowedHeaders: ['*'],
                ExposeHeaders: ['ETag', 'Location'],
                MaxAgeSeconds: 3600,
              },
            ],
          },
        }),
      )
    } catch {
      // O CORS também pode ser colado no dashboard do bucket.
    }
  })().catch((err) => {
    ready = null
    throw err
  })
  return ready
}

export async function createPalhaR2SignedUpload(folder: string, filename: string, contentType?: string) {
  await ensurePalhaR2Bucket()
  const s3 = palhaR2Client()
  const { bucket } = getPalhaR2Config()
  const key = palhaR2ObjectKey(folder, filename)
  const type = contentType || 'application/octet-stream'
  const signedUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: type,
    }),
    { expiresIn: 60 * 30 },
  )
  return {
    path: key,
    token: signedUrl,
    signedUrl,
    publicUrl: palhaR2PublicUrl(key),
    contentType: type,
  }
}

export async function uploadPalhaR2Object(folder: string, file: File) {
  await ensurePalhaR2Bucket()
  const s3 = palhaR2Client()
  const { bucket } = getPalhaR2Config()
  const key = palhaR2ObjectKey(folder, file.name)
  const body = Buffer.from(await file.arrayBuffer())
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: file.type || 'application/octet-stream',
    }),
  )
  return palhaR2PublicUrl(key)
}

function palhaR2KeyFromPublicUrl(url: string) {
  try {
    const { publicBaseUrl } = getPalhaR2Config()
    const base = publicBaseUrl.endsWith('/') ? publicBaseUrl : `${publicBaseUrl}/`
    if (!url.startsWith(base)) return null
    const key = decodeURIComponent(url.slice(base.length)).replace(/^\/+/, '')
    if (!key || key.includes('..') || key.startsWith('/')) return null
    return key
  } catch {
    return null
  }
}

async function deletePalhaR2Key(key: string) {
  const s3 = palhaR2Client()
  const { bucket } = getPalhaR2Config()
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

export type PalhaR2ObjectUsage = {
  key: string
  size: number
}

export async function listPalhaR2Usage(prefix = '') {
  await ensurePalhaR2Bucket()
  const s3 = palhaR2Client()
  const { bucket } = getPalhaR2Config()
  const objects: PalhaR2ObjectUsage[] = []
  let token: string | undefined
  do {
    const listed = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix || undefined,
        ContinuationToken: token,
      }),
    )
    for (const object of listed.Contents || []) {
      if (object.Key) objects.push({ key: object.Key, size: Number(object.Size || 0) })
    }
    token = listed.IsTruncated ? listed.NextContinuationToken : undefined
  } while (token)
  return objects
}

async function listPalhaR2Keys(prefix: string) {
  return (await listPalhaR2Usage(prefix)).map((object) => object.key)
}

export function palhaR2KeyFromUrl(url: string) {
  return palhaR2KeyFromPublicUrl(url)
}

export async function purgeRemovedPalhaR2Media(_previous: PalhaSiteSettings, next: PalhaSiteSettings) {
  const kept = new Set(
    [...collectPalhaMediaUrls(next)].map(palhaR2KeyFromPublicUrl).filter((key): key is string => Boolean(key)),
  )
  const stored = [...(await listPalhaR2Keys('photos/')), ...(await listPalhaR2Keys('gallery/'))]
  for (const key of stored) {
    if (kept.has(key)) continue
    try {
      await deletePalhaR2Key(key)
    } catch {
      // O JSON já foi salvo; um arquivo órfão não deve reverter a exclusão.
    }
  }
}
